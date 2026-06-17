import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users, Upload, BarChart2, CheckCircle2, XCircle,
  AlertCircle, ChevronRight, Trophy, TrendingUp,
  Target, AlertTriangle,
} from 'lucide-react';

// ─── Inline CSV parser (no external dependency) ────────────────────────────
function parseCSV(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return [];

  const headerLine = lines[0].toLowerCase();
  const hasHeader =
    headerLine.includes('github') ||
    headerLine.includes('username') ||
    headerLine.includes('name');

  if (hasHeader) {
    const cols = lines[0].split(',').map(c => c.trim().toLowerCase());
    const idx = cols.findIndex(
      c => c === 'github' || c === 'username' || c === 'github_username'
    );
    const colIdx = idx !== -1 ? idx : 1; // default to 2nd col
    return lines
      .slice(1)
      .map(line => line.split(',')[colIdx]?.trim())
      .filter(Boolean);
  }

  // Plain list or single-column CSV
  return lines.map(line => line.split(',')[0].trim()).filter(Boolean);
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const getScoreColor = (score) => {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#60a5fa';
  if (score >= 40) return '#fbbf24';
  return '#f87171';
};

const getScoreTier = (score) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Low';
};

// ─── Stat Card ──────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color, icon: Icon }) => (
  <div className="bulk-stat-card">
    <div className="bulk-stat-icon" style={{ color }}>
      <Icon size={20} />
    </div>
    <div className="bulk-stat-value" style={{ color }}>{value}</div>
    <div className="bulk-stat-label">{label}</div>
  </div>
);

// ─── BulkScreening ──────────────────────────────────────────────────────────
const BulkScreening = ({ onSaveReport }) => {
  const [screeningName, setScreeningName] = useState('');
  const [usernamesText, setUsernamesText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [minimumScore, setMinimumScore] = useState(70);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [selectedUsernames, setSelectedUsernames] = useState([]);

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Register bulk-progress listener once
  useEffect(() => {
    window.electronAPI.onBulkProgress((data) => setProgress(data));
  }, []);

  // Handle reopened report state
  useEffect(() => {
    const reopened = location.state?.reopenedReport;
    if (reopened) {
      setResults({
        statistics: reopened.stats,
        allRankings: reopened.allRankings,
        failures: reopened.failures,
      });
      setJobDescription(reopened.jobDescription || '');
      setMinimumScore(reopened.minimumScore || 70);
      setScreeningName(reopened.name || '');

      const userList = [
        ...reopened.allRankings.map(r => r.username),
        ...reopened.failures.map(f => f.username),
      ];
      setUsernamesText(userList.join('\n'));
    }
  }, [location.state]);

  const getCleanUsernames = () =>
    usernamesText
      .split('\n')
      .map(u => u.trim().replace(/^@/, ''))
      .filter(Boolean);

  const validate = () => {
    const newErrors = {};
    if (getCleanUsernames().length === 0)
      newErrors.usernames = 'Add at least one GitHub username.';
    if (!jobDescription.trim())
      newErrors.jd = 'Job description is required.';
    else if (jobDescription.trim().length < 20)
      newErrors.jd = 'Job description is too short.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const extracted = parseCSV(evt.target.result);
      const existing = getCleanUsernames();
      const merged = [...new Set([...existing, ...extracted])];
      setUsernamesText(merged.join('\n'));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAnalyze = async () => {
    if (!validate()) return;
    const usernames = getCleanUsernames();

    setApiError(null);
    setResults(null);
    setProgress({ total: usernames.length, completed: 0, percentage: 0 });
    setAnalyzing(true);

    try {
      const response = await window.electronAPI.evaluateCandidatesBulk({
        usernames,
        jobDescription: jobDescription.trim(),
        minimumScore: Number(minimumScore),
      });

      if (response.success) {
        setResults(response.data);

        // Compile and save bulk report
        const date = new Date().toISOString();
        const defaultName = `Screening · ${new Date().toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}`;
        const finalName = screeningName.trim() || defaultName;

        const bulkReport = {
          id: `bulk_${Date.now()}`,
          name: finalName,
          date,
          stats: response.data.statistics,
          allRankings: response.data.allRankings,
          failures: response.data.failures,
          jobDescription: jobDescription.trim(),
          minimumScore: Number(minimumScore),
        };

        if (onSaveReport) {
          await onSaveReport(bulkReport);
        }
      } else {
        setApiError(response.error || 'Bulk analysis failed.');
      }
    } catch (err) {
      setApiError(err.message || 'An unexpected error occurred.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleViewReport = (candidate) => {
    navigate('/results', {
      state: {
        candidateData: candidate,
        bulkBackState: results ? {
          stats: results.statistics,
          allRankings: results.allRankings,
          failures: results.failures,
          jobDescription,
          minimumScore,
          name: screeningName,
        } : null,
      },
    });
  };

  const handleNewScreening = () => {
    setResults(null);
    setProgress(null);
    setApiError(null);
    setScreeningName('');
    setUsernamesText('');
    setJobDescription('');
    setMinimumScore(70);
    setSelectedUsernames([]);
    // Clear router state to prevent loop reopening
    navigate('/bulk', { replace: true, state: {} });
  };

  const handleCompare = () => {
    const selectedCandidates = results.allRankings.filter(c =>
      selectedUsernames.includes(c.username)
    );
    navigate('/compare', {
      state: {
        candidates: selectedCandidates,
        jobDescription: jobDescription,
        bulkBackState: results ? {
          stats: results.statistics,
          allRankings: results.allRankings,
          failures: results.failures,
          jobDescription,
          minimumScore,
          name: screeningName,
        } : null
      }
    });
  };

  const usernameCount = getCleanUsernames().length;

  return (
    <div className="bulk-page">
      <div className="bulk-container">

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="bulk-page-header">
          <div className="bulk-page-tag">
            <Users size={12} />
            Bulk Candidate Screening
          </div>
          <h1 className="bulk-page-title">Rank Multiple Candidates</h1>
          <p className="bulk-page-desc">
            Evaluate up to 200 GitHub profiles against a single job description.
            Candidates are automatically ranked by Job Fit Score.
          </p>
        </div>

        {/* ── Input Form (hidden once results arrive) ──────────────────── */}
        {!results && (
          <div className="bulk-form">
            {/* Screening Name (Optional) */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="screening-name" className="form-label" style={{ display: 'flex', alignItems: 'center' }}>
                Screening Name 
                <span style={{ fontSize: '0.7rem', opacity: 0.6, fontWeight: 'normal', marginLeft: '0.25rem' }}>
                  (optional)
                </span>
              </label>
              <input
                id="screening-name"
                type="text"
                className="form-input"
                placeholder={`e.g. React Developer Screening — ${new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`}
                value={screeningName}
                onChange={(e) => setScreeningName(e.target.value)}
                autoComplete="off"
                spellCheck="false"
              />
            </div>

            {/* 2-col grid: usernames | JD */}
            <div className="bulk-form-grid">

              {/* Usernames col */}
              <div className="bulk-form-col">
                <div className="bulk-col-header">
                  <span className="form-label" style={{ margin: 0 }}>
                    GitHub Usernames
                    {usernameCount > 0 && (
                      <span className="bulk-count-badge">{usernameCount}</span>
                    )}
                  </span>
                  <button
                    type="button"
                    className="btn-csv-upload"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={12} />
                    Import CSV
                  </button>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    ref={fileInputRef}
                    onChange={handleCSVUpload}
                    style={{ display: 'none' }}
                  />
                </div>
                <textarea
                  className={`form-input bulk-textarea ${errors.usernames ? 'form-input-error' : ''}`}
                  placeholder={
                    'One username per line:\n\nalice-dev\nbob-engineer\ncharlie-ml\ndave-backend'
                  }
                  value={usernamesText}
                  onChange={(e) => setUsernamesText(e.target.value)}
                  spellCheck="false"
                />
                {errors.usernames ? (
                  <p className="form-error-text">
                    <AlertCircle size={12} />{errors.usernames}
                  </p>
                ) : (
                  <p className="form-hint">
                    One per line · CSV: <code style={{ fontSize: '0.68rem', opacity: 0.7 }}>name,github</code> · Max 200
                  </p>
                )}
              </div>

              {/* Job Description col */}
              <div className="bulk-form-col">
                <span className="form-label" style={{ margin: 0, marginBottom: '0.5rem', display: 'flex' }}>
                  Job Description
                </span>
                <textarea
                  className={`form-input bulk-textarea ${errors.jd ? 'form-input-error' : ''}`}
                  placeholder={
                    'Paste the full job description here...\n\nRole: Senior Full Stack Developer\n\nRequired:\n• React, TypeScript, Node.js\n• PostgreSQL, Docker, AWS\n\nExperience: 4+ years'
                  }
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  spellCheck="false"
                />
                {errors.jd && (
                  <p className="form-error-text">
                    <AlertCircle size={12} />{errors.jd}
                  </p>
                )}
              </div>
            </div>

            {/* Controls: min score + submit */}
            <div className="bulk-controls">
              <div className="bulk-min-score-group">
                <label className="form-label" htmlFor="min-score" style={{ margin: 0, marginBottom: '0.4rem' }}>
                  <Target size={12} className="form-label-icon" />
                  Minimum Score
                </label>
                <div className="bulk-score-input-wrap">
                  <input
                    id="min-score"
                    type="number"
                    className="form-input bulk-score-input"
                    value={minimumScore}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setMinimumScore('');
                      } else {
                        const num = Number(val);
                        if (!isNaN(num)) {
                          setMinimumScore(Math.max(0, Math.min(100, num)));
                        }
                      }
                    }}
                    min="0"
                    max="100"
                  />
                  <span className="bulk-score-pct">%</span>
                </div>
                <p className="form-hint">Shortlisting threshold</p>
              </div>

              <div className="bulk-submit-col">
                {apiError && (
                  <div className="form-api-error" style={{ marginBottom: '0.75rem' }}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{apiError}</span>
                  </div>
                )}
                <button
                  className="btn-bulk-analyze"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  id="btn-evaluate-candidates"
                >
                  {analyzing ? (
                    <>
                      <div className="btn-analyze-loading" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <Users size={15} />
                      Evaluate{usernameCount > 0 ? ` ${usernameCount}` : ''} Candidates
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Progress Modal Overlay ─────────────────────────────────────── */}
        {analyzing && progress && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(5px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.25s ease'
          }}>
            <div style={{
              background: 'var(--bg-dark-2)',
              border: '1px solid var(--border-dark-strong)',
              padding: '2.5rem',
              borderRadius: 'var(--radius-md)',
              width: '90%',
              maxWidth: '460px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              textAlign: 'center'
            }}>
              {/* Spinner */}
              <div className="loading-spinner" style={{ margin: '0 auto 1.5rem', width: '38px', height: '38px' }} />
              
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.4rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                color: 'var(--text-on-dark)',
                marginBottom: '0.5rem'
              }}>
                Screening in Progress
              </h2>
              
              <p style={{
                fontSize: '0.82rem',
                color: 'var(--text-muted-on-dark)',
                marginBottom: '1.75rem'
              }}>
                Please keep this application open while we analyze repository signals
              </p>

              <div style={{
                background: 'var(--bg-dark)',
                border: '1px solid var(--border-dark-strong)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.25rem',
                textAlign: 'left'
              }}>
                <div className="bulk-progress-header" style={{ marginBottom: '0.6rem' }}>
                  <span className="bulk-progress-label" style={{ fontSize: '0.78rem' }}>Analyzing candidates…</span>
                  <span className="bulk-progress-count" style={{ fontSize: '0.9rem' }}>
                    {progress.completed} / {progress.total}
                  </span>
                </div>
                <div className="bulk-progress-track">
                  <div
                    className="bulk-progress-fill"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <div className="bulk-progress-pct" style={{ marginTop: '0.4rem', fontSize: '0.72rem' }}>
                  {progress.percentage}% Completed
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Results Dashboard ─────────────────────────────────────────── */}
        {results && !analyzing && (
          <>
            {/* Results header */}
            <div className="bulk-results-bar">
              <div>
                <h2 className="bulk-results-title">
                  {screeningName || 'Screening Complete'}
                </h2>
                <p className="bulk-results-sub">
                  {results.statistics.successfulAnalyses} candidates analyzed · ranked by Final Score
                </p>
              </div>
              <button className="btn-new-screening" onClick={handleNewScreening}>
                ← New Screening
              </button>
            </div>

            {/* Stats Cards */}
            <div className="bulk-stats-grid">
              <StatCard
                label="Candidates Analyzed"
                value={results.statistics.successfulAnalyses}
                color="var(--info-text)"
                icon={Users}
              />
              <StatCard
                label="Average Score"
                value={`${results.statistics.averageScore}%`}
                color="var(--purple-text)"
                icon={BarChart2}
              />
              <StatCard
                label="Highest Score"
                value={`${results.statistics.highestScore}%`}
                color="var(--success-text)"
                icon={TrendingUp}
              />
              <StatCard
                label="Shortlisted"
                value={results.statistics.shortlistedCandidates}
                color="var(--warning-text)"
                icon={Trophy}
              />
              <StatCard
                label="Failed Analyses"
                value={results.statistics.failedAnalyses}
                color={results.statistics.failedAnalyses > 0 ? 'var(--danger-text)' : 'var(--text-muted-on-dark)'}
                icon={AlertTriangle}
              />
            </div>

            {/* Ranked Table */}
            {results.allRankings.length > 0 && (
              <div className="bulk-table-wrap">
                <div className="bulk-table-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="bulk-table-title">Ranked Candidates</span>
                    <span className="bulk-table-count">({results.allRankings.length} total)</span>
                    <span style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-muted-on-dark)',
                      marginLeft: '0.5rem',
                      fontWeight: 'normal',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      verticalAlign: 'middle'
                    }}>
                      <Users size={12} style={{ color: 'var(--accent)' }} />
                      Select checkboxes to compare profiles side-by-side
                    </span>
                  </div>
                  {selectedUsernames.length >= 2 && (
                    <button
                      className="btn-compare-action"
                      onClick={handleCompare}
                      style={{
                        background: 'var(--accent)',
                        color: '#fff',
                        padding: '0.45rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'var(--trans)',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                      id="btn-compare-selected"
                    >
                      <Users size={12} /> Compare {selectedUsernames.length} Candidates
                    </button>
                  )}
                </div>
                <table className="bulk-table bulk-screening-table">
                  <thead>
                    <tr>
                      <th>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', verticalAlign: 'middle' }}>
                          <input
                            type="checkbox"
                            checked={selectedUsernames.length === results.allRankings.length && results.allRankings.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsernames(results.allRankings.map(c => c.username));
                              } else {
                                setSelectedUsernames([]);
                              }
                            }}
                            style={{ cursor: 'pointer', margin: 0, padding: 0 }}
                            title="Select all for comparison"
                          />
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted-on-dark)' }}>Compare</span>
                        </div>
                      </th>
                      <th>Rank</th>
                      <th>Candidate</th>
                      <th>Job Fit</th>
                      <th>Quality</th>
                      <th>Final Score</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.allRankings.map((candidate) => {
                      const jobFitScore = candidate.weightedMatchScore ?? candidate.overallScore ?? 0;
                      const qualityScore = candidate.quality?.qualityScore ?? 0;
                      const finalScore = candidate.finalScore ?? Math.round(0.7 * jobFitScore + 0.3 * qualityScore);
                      const isShortlisted = finalScore >= Number(minimumScore || 0);
                      const finalColor = getScoreColor(finalScore);
                      const jobFitColor = getScoreColor(jobFitScore);
                      const qualityColor = getScoreColor(qualityScore);
                      const isSelected = selectedUsernames.includes(candidate.username);

                      return (
                        <tr
                          key={candidate.username}
                          className={`${isShortlisted ? '' : 'row-below-threshold'}`}
                          style={{
                            background: isSelected ? 'rgba(200, 64, 26, 0.05)' : undefined,
                            borderLeft: isSelected ? '3px solid var(--accent)' : undefined,
                            transition: 'background 0.2s, border-left 0.2s'
                          }}
                        >
                          {/* Checkbox */}
                          <td>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedUsernames(prev =>
                                  prev.includes(candidate.username)
                                    ? prev.filter(u => u !== candidate.username)
                                    : [...prev, candidate.username]
                                );
                              }}
                              style={{ cursor: 'pointer', verticalAlign: 'middle' }}
                              title={`Select @${candidate.username} to compare`}
                            />
                          </td>

                          {/* Rank */}
                          <td>
                            <span className={`rank-badge rank-${candidate.rank <= 3 ? candidate.rank : 'other'}`}>
                              #{candidate.rank}
                            </span>
                          </td>

                          {/* Candidate */}
                          <td>
                            <div className="candidate-cell">
                              {candidate.profile?.avatar_url && (
                                <img
                                  src={candidate.profile.avatar_url}
                                  alt={candidate.username}
                                  className="candidate-avatar"
                                />
                              )}
                              <div className="candidate-info">
                                <div className="candidate-name">
                                  {candidate.profile?.name || candidate.username}
                                </div>
                                <div className="candidate-login">@{candidate.username}</div>
                              </div>
                            </div>
                          </td>

                          {/* Job Fit */}
                          <td>
                            <span style={{ color: jobFitColor, fontWeight: 700, fontSize: '0.88rem' }}>
                              {jobFitScore}%
                            </span>
                          </td>

                          {/* Quality */}
                          <td>
                            <span style={{ color: qualityColor, fontWeight: 700, fontSize: '0.88rem' }}>
                              {qualityScore}%
                            </span>
                          </td>

                          {/* Final Score */}
                          <td>
                            <div className="score-cell">
                              <span className="score-cell-value" style={{ color: finalColor }}>
                                {finalScore}%
                              </span>
                              <div className="score-cell-bar-row">
                                <div className="score-cell-track">
                                  <div
                                    className="score-cell-fill"
                                    style={{ width: `${finalScore}%`, background: finalColor }}
                                  />
                                </div>
                                <span className="score-cell-tier" style={{ color: finalColor }}>
                                  {getScoreTier(finalScore)}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td>
                            {isShortlisted ? (
                              <span className="status-badge status-shortlisted">
                                <CheckCircle2 size={11} /> Shortlisted
                              </span>
                            ) : (
                              <span className="status-badge status-below">
                                Below threshold
                              </span>
                            )}
                          </td>

                          {/* Action */}
                          <td>
                            <button
                              className="btn-view-report"
                              onClick={() => handleViewReport(candidate)}
                              id={`btn-view-${candidate.username}`}
                            >
                              View Report <ChevronRight size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Failures */}
            {results.failures.length > 0 && (
              <div className="bulk-failures-wrap">
                <div className="bulk-failures-title">
                  <XCircle size={14} style={{ color: 'var(--danger-text)' }} />
                  Failed Analyses ({results.failures.length})
                </div>
                <div className="bulk-failures-list">
                  {results.failures.map((f, i) => (
                    <div key={i} className="bulk-failure-row">
                      <span className="failure-username">@{f.username}</span>
                      <span className="failure-reason">{f.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BulkScreening;
