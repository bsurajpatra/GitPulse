import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import dotenv from 'dotenv';

dotenv.config();
import store from '../store/index.js';
import { fileURLToPath } from 'url';
import oauthServer from '../server/index.js';
import GitHubService from '../services/github.service.js';
import { Worker } from 'worker_threads';
import { getCachedData, setCachedData, clearExpiredCache } from '../store/cacheStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    title: "GitHub Advanced Analytics",
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
  oauthServer.start(process.env.PORT || 3000);
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
ipcMain.on('login', () => shell.openExternal(`http://localhost:${process.env.PORT || 3000}/login`));
ipcMain.on('logout', () => {
  store.delete('github_token');
  if (mainWindow) mainWindow.webContents.send('auth-logout');
});
ipcMain.handle('get-token', () => store.get('github_token'));



