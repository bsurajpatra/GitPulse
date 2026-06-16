import React, { useState } from 'react';
import { AlertCircle, AtSign, Zap, FileText } from 'lucide-react';

const Home = ({ defaultUsername, userData, onAnalyze, loading, apiError }) => {
  const [username, setUsername] = useState(defaultUsername || '');
  const [jobDescription, setJobDescription] = useState('');
  const [errors, setErrors] = useState({});

  const validate = (overrideUsername) => {
    const newErrors = {};
    const trimmedUser = (overrideUsername ?? username).trim();
    const trimmedJd = jobDescription.trim();

    if (!trimmedUser) {
      newErrors.username = 'GitHub username is required.';
    } else if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(trimmedUser)) {
      newErrors.username = 'Invalid GitHub username format.';
    }

    if (!trimmedJd) {
      newErrors.jd = 'Job description is required.';
    } else if (trimmedJd.length < 20) {
      newErrors.jd = 'Job description is too short. Add more detail.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onAnalyze(username.trim(), jobDescription.trim());
    }
  };

  const handleUseMyAccount = () => {
    const myLogin = userData?.login || '';
    if (myLogin) setUsername(myLogin);
  };

  return (
    <div className="bulk-page">
      <div className="bulk-container">

        {/* Page Header */}
        <div className="bulk-page-header">
          <div className="bulk-page-tag" style={{ textTransform: 'uppercase' }}>
            <AtSign size={12} />
            Single Candidate
          </div>
          <h1 className="bulk-page-title">Evaluate Candidate Profile</h1>
          <p className="bulk-page-desc">
            Analyze a public GitHub profile against required job skills. Calculate precise weighted fit scores and explainable alignment reports.
          </p>
        </div>

        {/* Input Form */}
        <div className="bulk-form">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {apiError && (
              <div className="form-api-error">
                <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{apiError}</span>
              </div>
            )}

            <div className="bulk-form-grid">
              {/* Left Column: Username */}
              <div className="bulk-form-col">
                <div className="bulk-col-header" style={{ marginBottom: '0.5rem' }}>
                  <label htmlFor="github-username" className="form-label" style={{ margin: 0 }}>
                    <AtSign size={13} className="form-label-icon" />
                    GitHub Username
                  </label>
                  {userData?.login && (
                    <button
                      type="button"
                      className="btn-use-mine"
                      onClick={handleUseMyAccount}
                      title={`Fill with @${userData.login}`}
                      id="btn-use-my-account"
                      style={{ marginLeft: 'auto' }}
                    >
                      <Zap size={11} />
                      Use @{userData.login}
                    </button>
                  )}
                </div>
                <input
                  id="github-username"
                  type="text"
                  className={`form-input ${errors.username ? 'form-input-error' : ''}`}
                  placeholder="e.g. octocat"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="off"
                  spellCheck="false"
                  style={{ padding: '0.85rem' }}
                />
                {errors.username ? (
                  <p className="form-error-text" style={{ marginTop: '0.5rem' }}>
                    <AlertCircle size={12} />
                    {errors.username}
                  </p>
                ) : (
                  <p className="form-hint" style={{ marginTop: '0.5rem' }}>
                    We'll deep-scan repository dependencies, topics, languages, bio, and readme.
                  </p>
                )}
              </div>

              {/* Right Column: Job Description */}
              <div className="bulk-form-col">
                <label htmlFor="job-description" className="form-label" style={{ marginBottom: '0.5rem', display: 'flex' }}>
                  <FileText size={13} className="form-label-icon" />
                  Job Description
                </label>
                <textarea
                  id="job-description"
                  className={`form-input bulk-textarea ${errors.jd ? 'form-input-error' : ''}`}
                  placeholder={"Paste the full job description here...\n\nExample:\nSenior Full Stack Developer\n\nRequired Skills:\n• React, Node.js, TypeScript\n• MongoDB, Docker, AWS\n\nExperience: 3+ years"}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  spellCheck="false"
                />
                {errors.jd && (
                  <p className="form-error-text" style={{ marginTop: '0.5rem' }}>
                    <AlertCircle size={12} />
                    {errors.jd}
                  </p>
                )}
              </div>
            </div>

            <div className="form-divider" style={{ margin: '0.5rem 0' }} />

            <div className="bulk-controls" style={{ justifyContent: 'flex-end', padding: 0 }}>
              <div className="bulk-submit-col" style={{ maxWidth: '300px' }}>
                <button
                  type="submit"
                  className="btn-analyze"
                  disabled={loading}
                  id="btn-start-analysis"
                  style={{ width: '100%', height: '48px', fontSize: '0.85rem' }}
                >
                  {loading ? (
                    <>
                      <div className="btn-analyze-loading" />
                      Analyzing Profile…
                    </>
                  ) : (
                    <>
                      <Zap size={14} />
                      Analyze Job Fit
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Home;
