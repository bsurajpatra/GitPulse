import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import isDev from 'electron-is-dev';
import dotenv from 'dotenv';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
import store from '../store/index.js';
import oauthServer from '../server/index.js';
import GitHubService from '../services/github.service.js';
import AnalysisService from '../services/analysis.service.js';
import BulkCandidateAnalysisService from '../services/bulkCandidateAnalysis.service.js';
import { compareCandidates } from '../analytics/candidateComparisonEngine.js';
import { Worker } from 'worker_threads';
import { getCachedData, setCachedData, clearExpiredCache, clearAllCache } from '../store/cacheStore.js';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "GitMatch",
    icon: isDev
      ? path.join(__dirname, '../renderer/public/logo.png')
      : path.join(__dirname, '../renderer/dist/logo.png'),
    backgroundColor: '#0d1117',
    show: false,
  });

  const url = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../renderer/dist/index.html')}`;

  mainWindow.loadURL(url);
  mainWindow.once('ready-to-show', () => mainWindow.show());
}

// Start OAuth Server
const startAuthServer = () => {
  const port = parseInt(process.env.PORT, 10);
  oauthServer.start(port);
  oauthServer.on('token_received', (token) => {
    store.set('github_token', token);
    if (mainWindow) mainWindow.webContents.send('auth-success', token);
  });
};

app.whenReady().then(() => {
  createWindow();
  startAuthServer();
  clearExpiredCache();
});

// Advanced Data Fetching with Worker
ipcMain.handle('fetch-advanced-analytics', async (event, token, repos, username) => {
  const service = new GitHubService(token);
  const repoStats = {};
  const newlyFetchedRepos = [];

  const userCalendarPromise = service.getUserContributionCalendar(username);

  // 1. Fetch Stats in Parallel with Caching
  const reposInChunks = chunkArray(repos, 10); // 10 at a time to avoid rate limits
  
  for (const chunk of reposInChunks) {
    await Promise.all(chunk.map(async (repo) => {
      const cacheKey = `repo_stats_${repo.id}`;
      const cached = getCachedData(cacheKey);
      
      if (cached) {
        repoStats[repo.id] = cached;
      } else {
        const stats = await service.getRepoDetailsAdvanced(repo.owner.login, repo.name);
        setCachedData(cacheKey, stats);
        repoStats[repo.id] = stats;
        newlyFetchedRepos.push(repo.id);
      }
    }));
    
    // Notify renderer for progressive loading
    if (mainWindow) {
      mainWindow.webContents.send('loading-progress', {
        count: Object.keys(repoStats).length,
        total: repos.length
      });
    }
  }

  const userCalendar = await userCalendarPromise;

  // 2. Offload Analytics to Background Worker
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, 'worker.js'), {
      workerData: { repos, stats: repoStats, userCalendar }
    });

    worker.on('message', (result) => resolve(result));
    worker.on('error', (err) => reject(err));
    worker.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
});

const chunkArray = (array, size) => {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};

// IPC Handlers
ipcMain.on('login', () => shell.openExternal(`http://localhost:${process.env.PORT}/login`));
ipcMain.on('logout', () => {
  store.delete('github_token');
  if (mainWindow) mainWindow.webContents.send('auth-logout');
});
ipcMain.handle('get-token', () => store.get('github_token'));

// Job Fit Analysis Handler
ipcMain.handle('analyze-job-fit', async (event, username, jobDescription) => {
  try {
    const token = store.get('github_token') || null;
    const result = await AnalysisService.analyzeJobFit(username, jobDescription, token);
    return { success: true, data: result };
  } catch (error) {
    console.error('Analysis Error:', error);
    return { success: false, error: error.message };
  }
});

// Bulk Candidate Screening Handler
ipcMain.handle('evaluate-candidates-bulk', async (event, { usernames, jobDescription, minimumScore }) => {
  try {
    const token = store.get('github_token') || null;
    const result = await BulkCandidateAnalysisService.analyze({
      usernames,
      jobDescription,
      minimumScore: Number(minimumScore) || 0,
      token,
      onProgress: (progress) => {
        if (mainWindow) mainWindow.webContents.send('bulk-progress', progress);
      },
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('Bulk Analysis Error:', error);
    return { success: false, error: error.message };
  }
});

// Candidate Comparison Handler
ipcMain.handle('compare-candidates', async (event, { jobDescription, candidates }) => {
  try {
    const result = compareCandidates({ jobDescription, candidates });
    return { success: true, data: result };
  } catch (error) {
    console.error('Comparison Error:', error);
    return { success: false, error: error.message };
  }
});

// Reports History & Preferences Handlers
ipcMain.handle('get-reports', () => {
  return {
    bulk: store.get('reports_bulk') || [],
    single: store.get('reports_single') || []
  };
});

ipcMain.handle('save-report', (event, { type, report }) => {
  const key = type === 'bulk' ? 'reports_bulk' : 'reports_single';
  const maxItems = type === 'bulk' ? 50 : 100;
  const reports = store.get(key) || [];
  
  const index = reports.findIndex(r => r.id === report.id);
  if (index !== -1) {
    reports[index] = report;
  } else {
    reports.unshift(report);
  }
  
  if (reports.length > maxItems) {
    reports.length = maxItems;
  }
  
  store.set(key, reports);
  return { success: true, reports };
});

ipcMain.handle('delete-report', (event, { type, id }) => {
  const key = type === 'bulk' ? 'reports_bulk' : 'reports_single';
  const reports = store.get(key) || [];
  const filtered = reports.filter(r => r.id !== id);
  store.set(key, filtered);
  return { success: true, reports: filtered };
});

ipcMain.handle('get-cache-info', () => {
  try {
    const filePath = path.join(app.getPath('userData'), 'github_analytics_cache.json');
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      return { sizeBytes: stats.size };
    }
  } catch (error) {
    console.error('Error getting cache info:', error);
  }
  return { sizeBytes: 0 };
});

ipcMain.handle('clear-cache', () => {
  clearAllCache();
  return { success: true };
});

ipcMain.handle('get-preferences', () => {
  return store.get('user_preferences') || { theme: 'dark' };
});

ipcMain.handle('set-preferences', (event, prefs) => {
  store.set('user_preferences', prefs);
  return { success: true };
});


