import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import LoadingState from './components/LoadingState';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Results from './pages/Results';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import BulkScreening from './pages/BulkScreening';
import GitHubService from '../../services/github.service.js';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Auth state
  const [token, setToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Single-analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [apiError, setApiError] = useState(null);

  // Reports state
  const [reports, setReports] = useState({ bulk: [], single: [] });

  // Initialize auth & load reports
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = await window.electronAPI.getToken();
        if (storedToken) {
          setToken(storedToken);
          await fetchProfile(storedToken);
        }
      } catch (err) {
        console.warn('Auth init failed:', err.message);
      } finally {
        setAuthLoading(false);
      }
    };

    initAuth();

    // Load and apply theme preference
    window.electronAPI.getPreferences().then(prefs => {
      if (prefs?.theme) {
        document.documentElement.setAttribute('data-theme', prefs.theme);
      }
    });

    window.electronAPI.onAuthSuccess((newToken) => {
      setToken(newToken);
      fetchProfile(newToken);
    });

    window.electronAPI.onAuthLogout(() => {
      setToken(null);
      setUserData(null);
      setAuthLoading(false);
      setAnalysisResult(null);
      setApiError(null);
      setReports({ bulk: [], single: [] });
      navigate('/');
    });
  }, []);

  // Fetch reports on authentication
  useEffect(() => {
    if (token) {
      const loadReports = async () => {
        try {
          const data = await window.electronAPI.getReports();
          if (data) {
            setReports(data);
          }
        } catch (err) {
          console.warn('Failed to load reports:', err);
        }
      };
      loadReports();
    }
  }, [token]);

  const fetchProfile = async (authToken) => {
    try {
      const service = new GitHubService(authToken);
      const profile = await service.getUserProfile();
      setUserData(profile);
    } catch (err) {
      console.warn('Profile fetch failed:', err.message);
    }
  };

  // Single-candidate analysis
  const handleAnalyze = async (username, jobDescription) => {
    setAnalyzing(true);
    setApiError(null);
    setAnalysisResult(null);
    navigate('/candidate');

    try {
      const response = await window.electronAPI.analyzeJobFit(username, jobDescription);
      if (response.success) {
        setAnalysisResult(response.data);
        setAnalyzing(false);

        // Save report to store
        const newReport = {
          id: `single_${Date.now()}`,
          username,
          date: new Date().toISOString(),
          result: response.data
        };
        await handleSaveReport('single', newReport);

        navigate('/results');
      } else {
        setApiError(friendlyError(response.error || 'Analysis failed.'));
        setAnalyzing(false);
      }
    } catch (err) {
      setApiError(friendlyError(err.message));
      setAnalyzing(false);
    }
  };

  const handleSaveReport = async (type, report) => {
    try {
      const res = await window.electronAPI.saveReport(type, report);
      if (res.success) {
        setReports(prev => ({
          ...prev,
          [type]: res.reports
        }));
      }
    } catch (err) {
      console.warn('Failed to save report:', err);
    }
  };

  const handleDeleteReport = async (id, type) => {
    try {
      const res = await window.electronAPI.deleteReport(type, id);
      if (res.success) {
        setReports(prev => ({
          ...prev,
          [type]: res.reports
        }));
      }
    } catch (err) {
      console.warn('Failed to delete report:', err);
    }
  };

  const handleBulkReopen = (report) => {
    navigate('/bulk', { state: { reopenedReport: report } });
  };

  const handleSingleReopen = (report) => {
    navigate('/results', {
      state: {
        candidateData: report.result,
        backToReports: true
      }
    });
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setApiError(null);
    navigate('/candidate');
  };

  const handleLogout = () => {
    window.electronAPI.logout();
  };

  // Auth loading
  if (authLoading) {
    return (
      <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-container" style={{ paddingTop: '40vh' }}>
          <div className="loading-spinner" />
          <p style={{ color: 'var(--text-muted-on-dark)', fontSize: '0.85rem' }}>
            Loading GitMatch…
          </p>
        </div>
      </div>
    );
  }

  // Login screen
  if (!token) {
    return <Login onLogin={() => window.electronAPI.login()} error={apiError} />;
  }

  // Common Home props
  const homeProps = {
    defaultUsername: '',
    userData,
    onAnalyze: handleAnalyze,
    loading: analyzing,
    apiError,
  };

  return (
    <div className="app-shell-sidebar-layout">
      {/* Sidebar nav on the left */}
      <Sidebar userData={userData} onLogout={handleLogout} />

      {/* Main content area on the right */}
      <div className="app-main-content">
        {analyzing ? (
          <div className="app-content-loading-wrap">
            <LoadingState />
          </div>
        ) : (
          <Routes>
            {/* Dashboard (landing screen) */}
            <Route
              path="/"
              element={
                <Dashboard
                  userData={userData}
                  reports={reports}
                  onBulkReopen={handleBulkReopen}
                  onSingleReopen={handleSingleReopen}
                />
              }
            />

            {/* Single Candidate Form */}
            <Route path="/candidate" element={<Home {...homeProps} />} />

            {/* Results Page */}
            <Route
              path="/results"
              element={(() => {
                const bulkCandidate = location.state?.candidateData;
                const backToReports = location.state?.backToReports;
                const bulkBackState = location.state?.bulkBackState;

                if (bulkCandidate) {
                  return (
                    <Results
                      data={bulkCandidate}
                      backLabel={backToReports ? "← Back to Reports" : "← Back to Screening List"}
                      onBack={() => {
                        if (backToReports) {
                          navigate('/reports');
                        } else if (bulkBackState) {
                          navigate('/bulk', { state: { reopenedReport: bulkBackState } });
                        } else {
                          navigate('/bulk');
                        }
                      }}
                    />
                  );
                }
                if (analysisResult) {
                  return <Results data={analysisResult} onBack={handleReset} />;
                }
                return <Home {...homeProps} />;
              })()}
            />

            {/* Bulk Screening Form / Results */}
            <Route
              path="/bulk"
              element={
                <BulkScreening
                  onSaveReport={(report) => handleSaveReport('bulk', report)}
                />
              }
            />

            {/* Reports History */}
            <Route
              path="/reports"
              element={
                <Reports
                  reports={reports}
                  deleteReport={handleDeleteReport}
                  onBulkReopen={handleBulkReopen}
                  onSingleReopen={handleSingleReopen}
                />
              }
            />

            {/* Settings */}
            <Route
              path="/settings"
              element={
                <Settings
                  userData={userData}
                  onLogout={handleLogout}
                />
              }
            />
          </Routes>
        )}
      </div>
    </div>
  );
}

function friendlyError(msg) {
  if (!msg) return 'An unexpected error occurred. Please try again.';
  const lower = msg.toLowerCase();
  if (lower.includes('not found') || lower.includes('404'))
    return 'GitHub user not found. Please check the username and try again.';
  if (lower.includes('rate limit') || lower.includes('403'))
    return 'GitHub API rate limit exceeded. Please wait a few minutes and try again.';
  if (lower.includes('network') || lower.includes('enotfound') || lower.includes('econnrefused'))
    return 'Network error. Please check your internet connection.';
  if (lower.includes('username is required'))
    return 'Please enter a valid GitHub username.';
  if (lower.includes('job description is required'))
    return 'Please paste a job description to analyze against.';
  return msg;
}

export default App;
