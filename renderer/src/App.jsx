import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { DashboardSkeleton } from './components/Skeleton';
import GitHubService from '../../services/github.service.js';
import HealthRankingsView from './components/HealthRankingsView';
import AllReposView from './components/AllReposView';

function App() {
  const [token, setToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [repos, setRepos] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [advancedAnalytics, setAdvancedAnalytics] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState("Initializing...");
  const [progress, setProgress] = useState({ count: 0, total: 0 });
  const [error, setError] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = await window.electronAPI.getToken();
        if (storedToken) {
          setToken(storedToken);
          await startFullFetch(storedToken);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setLoading(false);
      }
    };

    initAuth();

    window.electronAPI.onAuthSuccess((newToken) => {
      setToken(newToken);
      startFullFetch(newToken);
    });

    window.electronAPI.onLoadingProgress((data) => {
      setProgress(data);
    });

    window.electronAPI.onAuthLogout(() => {
      setToken(null);
      setUserData(null);
      setRepos([]);
      setAnalytics(null);
      setAdvancedAnalytics(null);
      setLoading(false);
    });
  }, []);

  const startFullFetch = async (token) => {
    setLoading(true);
    setError(null);
    setLoadingMsg("Fetching basic profile...");
    
    try {
      const service = new GitHubService(token);
      const [profile, allRepos] = await Promise.all([
        service.getUserProfile(),
        service.getUserRepositories()
      ]);

      setUserData(profile);
      setRepos(allRepos);
      
      setLoadingMsg(`Analyzing ${allRepos.length} repositories...`);
      const advanced = await window.electronAPI.fetchAdvancedAnalytics(token, allRepos, profile.login);
      setAdvancedAnalytics(advanced);
      
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to fetch advanced analytics.");
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="bg-[#0d1117] min-h-screen">
        <div className="p-8 pb-0 text-center text-[#58a6ff]">
          <p className="fade-in">{loadingMsg}</p>
          {progress.total > 0 && (
            <div className="mt-4 w-64 mx-auto bg-[#161b22] rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-[#58a6ff] h-full transition-all duration-300" 
                style={{ width: `${(progress.count / progress.total) * 100}%` }}
              ></div>
            </div>
          )}
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  if (!token) return <Login onLogin={() => window.electronAPI.login()} error={error} />;

  if (error && !userData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-[#c9d1d9] bg-[#0d1117]">
        <div className="card max-w-md p-8 glass text-center">
          <p className="text-[#f85149] mb-4">{error}</p>
          <button onClick={() => startFullFetch(token)} className="btn-primary w-full">Retry Connection</button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <Dashboard 
            user={userData} 
            repos={repos} 
            advanced={advancedAnalytics} 
            onLogout={() => window.electronAPI.logout()} 
            onRefresh={() => startFullFetch(token)}
          />
        } 
      />
      <Route 
        path="/health-rankings" 
        element={
          <HealthRankingsView data={advancedAnalytics?.health || []} />
        } 
      />
      <Route 
        path="/all-repos" 
        element={
          <AllReposView data={repos} />
        } 
      />
    </Routes>
  );
}

export default App;
