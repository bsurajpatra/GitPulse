const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  login: () => {
    ipcRenderer.send('login');
  },
  logout: () => {
    ipcRenderer.send('logout');
  },
  getToken: async () => {
    const token = await ipcRenderer.invoke('get-token');
    return token;
  },
  onAuthSuccess: (callback) => {
    ipcRenderer.on('auth-success', (event, token) => {
      callback(token);
    });
  },
  onAuthLogout: (callback) => {
    ipcRenderer.on('auth-logout', () => {
      callback();
    });
  },
  fetchAdvancedAnalytics: async (token, repos, username) => {
    return await ipcRenderer.invoke('fetch-advanced-analytics', token, repos, username);
  },
  analyzeJobFit: async (username, jobDescription) => {
    return await ipcRenderer.invoke('analyze-job-fit', username, jobDescription);
  },
  onLoadingProgress: (callback) => {
    ipcRenderer.on('loading-progress', (event, data) => {
      callback(data);
    });
  },

  // ─── Phase 5: Bulk Candidate Screening ──────────────────────────────────────
  evaluateCandidatesBulk: async (payload) => {
    return await ipcRenderer.invoke('evaluate-candidates-bulk', payload);
  },
  onBulkProgress: (callback) => {
    // Remove any previous listener before adding a new one to prevent duplicates
    ipcRenderer.removeAllListeners('bulk-progress');
    ipcRenderer.on('bulk-progress', (event, data) => {
      callback(data);
    });
  },

  // ─── Phase 5: Reports History, Cache and Preferences ────────────────────────
  getReports: async () => {
    return await ipcRenderer.invoke('get-reports');
  },
  saveReport: async (type, report) => {
    return await ipcRenderer.invoke('save-report', { type, report });
  },
  deleteReport: async (type, id) => {
    return await ipcRenderer.invoke('delete-report', { type, id });
  },
  getCacheInfo: async () => {
    return await ipcRenderer.invoke('get-cache-info');
  },
  clearCache: async () => {
    return await ipcRenderer.invoke('clear-cache');
  },
  getPreferences: async () => {
    return await ipcRenderer.invoke('get-preferences');
  },
  setPreferences: async (prefs) => {
    return await ipcRenderer.invoke('set-preferences', prefs);
  },
  compareCandidates: async (payload) => {
    return await ipcRenderer.invoke('compare-candidates', payload);
  },
});
