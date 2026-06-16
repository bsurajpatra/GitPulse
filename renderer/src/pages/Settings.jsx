import React, { useState, useEffect } from 'react';
import { Github, Trash2, LogOut, Info, Shield, Database, Sun, Moon } from 'lucide-react';

export default function Settings({ userData, onLogout }) {
  const [cacheSize, setCacheSize] = useState('0 KB');
  const [clearing, setClearing] = useState(false);
  const [theme, setTheme] = useState('dark');

  const fetchCacheSize = async () => {
    try {
      const res = await window.electronAPI.getCacheInfo();
      const bytes = res?.sizeBytes || 0;
      if (bytes === 0) {
        setCacheSize('0 KB');
      } else if (bytes < 1024) {
        setCacheSize(`${bytes} B`);
      } else if (bytes < 1024 * 1024) {
        setCacheSize(`${(bytes / 1024).toFixed(1)} KB`);
      } else {
        setCacheSize(`${(bytes / (1024 * 1024)).toFixed(1)} MB`);
      }
    } catch (err) {
      console.warn('Failed to get cache size:', err);
    }
  };

  useEffect(() => {
    fetchCacheSize();
    window.electronAPI.getPreferences().then(prefs => {
      if (prefs?.theme) {
        setTheme(prefs.theme);
        document.documentElement.setAttribute('data-theme', prefs.theme);
      }
    });
  }, []);

  const handleClearCache = async () => {
    setClearing(true);
    try {
      await window.electronAPI.clearCache();
      await fetchCacheSize();
    } catch (err) {
      console.error('Failed to clear cache:', err);
    } finally {
      setClearing(false);
    }
  };

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    try {
      await window.electronAPI.setPreferences({ theme: newTheme });
    } catch (err) {
      console.error('Failed to save theme:', err);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        {/* Header */}
        <div className="settings-header">
          <h1 className="settings-title">Settings</h1>
          <p className="settings-sub">Configure and manage your GitMatch preferences.</p>
        </div>

        <div className="settings-sections">
          {/* Section: GitHub Integration */}
          <div className="settings-section">
            <h2 className="settings-section-title">
              <Github size={16} /> GitHub Integration
            </h2>
            <div className="settings-section-card">
              {userData ? (
                <div className="settings-github-connected">
                  <img
                    src={userData.avatar_url}
                    alt={userData.login}
                    className="settings-github-avatar"
                  />
                  <div className="settings-github-info">
                    <div className="settings-github-user">Connected as @{userData.login}</div>
                    <div className="settings-github-details">
                      <Shield size={12} />
                      Scope: repo:read, user:read
                    </div>
                  </div>
                  <button className="btn-settings-disconnect" onClick={onLogout} id="btn-settings-logout">
                    <LogOut size={13} /> Disconnect
                  </button>
                </div>
              ) : (
                <p className="settings-text-muted">Not connected to GitHub.</p>
              )}
            </div>
          </div>

          {/* Section: Cache Management */}
          <div className="settings-section">
            <h2 className="settings-section-title">
              <Database size={16} /> Cache Management
            </h2>
            <div className="settings-section-card">
              <div className="settings-cache-row">
                <div className="settings-cache-info">
                  <div className="settings-cache-label">Repository & Profile Cache</div>
                  <div className="settings-cache-desc">
                    Repository data is cached locally to speed up re-analysis.
                  </div>
                </div>
                <div className="settings-cache-actions">
                  <span className="settings-cache-size">{cacheSize}</span>
                  <button
                    className="btn-settings-clear"
                    onClick={handleClearCache}
                    disabled={clearing}
                    id="btn-clear-cache"
                  >
                    <Trash2 size={13} /> {clearing ? 'Clearing…' : 'Clear Cache'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Appearance */}
          <div className="settings-section">
            <h2 className="settings-section-title">
              <Sun size={16} /> Appearance
            </h2>
            <div className="settings-section-card">
              <div className="settings-theme-row">
                <div className="settings-theme-info">
                  <div className="settings-theme-label">Interface Theme</div>
                  <div className="settings-theme-desc">Select how GitMatch looks on your screen.</div>
                </div>
                <div className="settings-theme-toggle">
                  <button
                    className={`btn-theme-option ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <Moon size={13} /> Dark (Default)
                  </button>
                  <button
                    className={`btn-theme-option ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('light')}
                  >
                    <Sun size={13} /> Light
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Application Info */}
          <div className="settings-section">
            <h2 className="settings-section-title">
              <Info size={16} /> Application Info
            </h2>
            <div className="settings-section-card">
              <div className="settings-app-info">
                <div className="settings-app-logo-row">
                  <img src="./logo.png" alt="GitMatch" className="settings-app-logo" />
                  <div>
                    <div className="settings-app-name">GitMatch Desktop</div>
                    <div className="settings-app-version">v1.1.0</div>
                  </div>
                </div>
                <div className="settings-app-desc">
                  A GitHub-Based Candidate Screening & Ranking Platform designed for modern recruiting teams.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
