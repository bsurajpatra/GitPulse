import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Trophy, CheckCircle2, AlertTriangle,
  TrendingUp, Sparkles, Code, FileText, Settings,
  Activity, Cpu, Shield, AlertCircle
} from 'lucide-react';

function getScoreColor(score) {
  if (score >= 80) return 'var(--success-text)';
  if (score >= 60) return 'var(--info-text)';
  if (score >= 40) return 'var(--warning-text)';
  return 'var(--danger-text)';
}

function getScoreTier(score) {
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Low';
}

export default function CandidateComparison() {
  const location = useLocation();
  const navigate = useNavigate();

  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { candidates = [], jobDescription = '', bulkBackState = null, backToReports = false } = location.state || {};

  useEffect(() => {
    // Scroll to top immediately
    const mainContent = document.querySelector('.app-main-content');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, behavior: 'instant' });

    if (candidates.length < 2) {
      setError('Please select at least 2 candidates to perform a comparison.');
      setLoading(false);
      return;
    }

    const runComparison = async () => {
      try {
        const res = await window.electronAPI.compareCandidates({
          jobDescription,
          candidates
        });

        if (res.success) {
          setComparison(res.data);
        } else {
          setError(res.error || 'Failed to compare candidates.');
        }
      } catch (err) {
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    runComparison();
  }, [candidates, jobDescription]);

  const handleBack = () => {
    if (backToReports) {
      navigate('/reports');
    } else if (bulkBackState) {
      navigate('/bulk', { state: { reopenedReport: bulkBackState } });
    } else {
      navigate('/bulk');
    }
  };

  if (loading) {
    return (
      <div className="loading-page" style={{ height: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div className="loading-spinner" />
        <h2 className="loading-title">Generating Comparison Report…</h2>
        <p style={{ color: 'var(--text-muted-on-dark)', fontSize: '0.85rem' }}>
          Comparing profiles, extracting common skills, and ranking evidence signals
        </p>
      </div>
    );
  }

  if (error || !comparison) {
    return (
      <div style={{ padding: '3rem 2rem', maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <div style={{ color: 'var(--danger-text)', marginBottom: '1.5rem' }}>
          <AlertCircle size={48} style={{ margin: '0 auto' }} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>
          Comparison Failed
        </h2>
        <p style={{ color: 'var(--text-muted-on-dark)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          {error || 'No comparison report could be generated.'}
        </p>
        <button
          onClick={handleBack}
          style={{
            background: 'var(--accent)',
            color: '#fff',
            padding: '0.6rem 1.5rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.78rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Return to Screening
        </button>
      </div>
    );
  }

  const { winner, winnerProfile, comparisonSummary = [], categories = {}, insights = {}, finalRecommendation = '' } = comparison;

  return (
    <div className="fade-in">
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* ── Page Header ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-dark)' }}>
          <div>
            <button
              onClick={handleBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--text-muted-on-dark)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={13} /> {backToReports ? 'Back to Reports' : 'Back to Screening'}
            </button>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-on-dark)' }}>
              Candidate Comparison
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted-on-dark)', marginTop: '0.25rem' }}>
              Side-by-side engineering evaluation for {candidates.length} profiles
            </p>
          </div>
        </div>

        {/* ── Recommendation Hero Banner ────────────────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(200, 64, 26, 0.1) 0%, rgba(20, 20, 20, 0) 100%)',
          border: '1px solid var(--border-dark-strong)',
          borderRadius: 'var(--radius-md)',
          padding: '1.75rem 2rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <Trophy size={18} style={{ color: 'var(--warning-text)' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--warning-text)' }}>
              GitMatch Recommendation
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.95rem', color: 'var(--text-on-dark)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {finalRecommendation}
            </div>
          </div>
        </div>

        {/* ── Profiles Side-by-Side Cards ────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${candidates.length}, 1fr)`,
          gap: '1.25rem',
          marginBottom: '2rem'
        }}>
          {candidates.map((c) => {
            const isWinner = winner === c.username;
            const finalScore = c.finalScore ?? Math.round(0.7 * (c.weightedMatchScore ?? c.overallScore ?? 0) + 0.3 * (c.quality?.qualityScore ?? 0));
            const scoreColor = getScoreColor(finalScore);

            return (
              <div
                key={c.username}
                style={{
                  background: 'var(--bg-dark-2)',
                  border: isWinner ? '1px solid var(--accent)' : '1px solid var(--border-dark-strong)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem',
                  position: 'relative',
                  transition: 'var(--trans)',
                  boxShadow: isWinner ? '0 0 15px rgba(200, 64, 26, 0.12)' : 'none'
                }}
              >
                {isWinner && (
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontSize: '0.58rem',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    Winner
                  </span>
                )}

                {/* Candidate identity */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  {c.profile?.avatar_url ? (
                    <img
                      src={c.profile.avatar_url}
                      alt={c.username}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid var(--border-dark)' }}
                    />
                  ) : (
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-dark-3)', border: '1px solid var(--border-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Code size={18} />
                    </div>
                  )}
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-on-dark)', margin: 0 }}>
                      {c.profile?.name || c.username}
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted-on-dark)' }}>
                      @{c.username}
                    </span>
                  </div>
                </div>

                {/* Score meters grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  
                  {/* Final Score */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-dark)' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted-on-dark)' }}>Final Score</span>
                    <span style={{ fontSize: '1.35rem', fontWeight: 900, color: scoreColor }}>
                      {finalScore}%
                    </span>
                  </div>

                  {/* Job Fit */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.2rem 0' }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted-on-dark)' }}>Job Fit Compatibility</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: getScoreColor(c.jobFit) }}>
                      {c.jobFit}%
                    </span>
                  </div>

                  {/* Engineering Quality */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.2rem 0' }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted-on-dark)' }}>Engineering Quality</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: getScoreColor(c.qualityScore) }}>
                      {c.qualityScore}%
                    </span>
                  </div>

                </div>

                {/* Strengths Insights */}
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-dark)', paddingTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--info-text)', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Sparkles size={11} /> Recruiter Insights
                  </h4>
                  <ul style={{ paddingLeft: '0', margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(insights[c.username] || []).map((ins, idx) => (
                      <li key={idx} style={{ fontSize: '0.78rem', color: 'var(--text-on-dark)', lineHeight: '1.4', paddingLeft: '0.75rem', position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 0, color: 'var(--info-text)' }}>•</span>
                        {ins}
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            );
          })}
        </div>

        {/* ── Skill Matrix Comparison ────────────────────────────────── */}
        <div style={{ background: 'var(--bg-dark-2)', border: '1px solid var(--border-dark-strong)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-dark)', paddingBottom: '0.75rem' }}>
            <Code size={16} style={{ color: 'var(--purple-text)' }} />
            <h2 style={{ fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-on-dark)', margin: 0 }}>
              Technical Skill Matrix
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Common Skills */}
            <div>
              <h3 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted-on-dark)', marginBottom: '0.6rem' }}>
                Shared Core Skills ({categories.skills?.commonSkills?.length ?? 0})
              </h3>
              {categories.skills?.commonSkills?.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {categories.skills.commonSkills.map(skill => (
                    <span key={skill} className="skill-pill skill-pill-matched">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted-on-dark)', fontStyle: 'italic' }}>
                  No shared skills found in candidate profiles.
                </span>
              )}
            </div>

            {/* Exclusive Skills Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${candidates.length}, 1fr)`, gap: '1.25rem' }}>
              {candidates.map(c => {
                const unique = categories.skills?.uniqueSkills?.[c.username] || [];
                return (
                  <div key={c.username}>
                    <h3 style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted-on-dark)', marginBottom: '0.6rem' }}>
                      @{c.username} Unique Skills ({unique.length})
                    </h3>
                    {unique.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {unique.map(skill => (
                          <span key={skill} className="skill-pill skill-pill-extra">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted-on-dark)', fontStyle: 'italic' }}>
                        No exclusive skills detected.
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* ── Evidence Confidence Matrix ──────────────────────────────── */}
        {categories.skills?.strongerEvidence?.length > 0 && (
          <div style={{ background: 'var(--bg-dark-2)', border: '1px solid var(--border-dark-strong)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-dark)', paddingBottom: '0.75rem' }}>
              <FileText size={16} style={{ color: 'var(--info-text)' }} />
              <h2 style={{ fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-on-dark)', margin: 0 }}>
                Evidence Confidence & Signal Strength
              </h2>
            </div>

            <div className="bulk-table-wrap" style={{ border: 'none', padding: 0 }}>
              <table className="bulk-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Core Skill</th>
                    <th>Evidence Winner</th>
                    {candidates.map(c => (
                      <th key={c.username} style={{ textAlign: 'center' }}>
                        @{c.username} confidence
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categories.skills.strongerEvidence.map(ev => {
                    const winColor = ev.winner !== 'Tied' ? 'var(--success-text)' : 'var(--text-muted-on-dark)';
                    return (
                      <tr key={ev.skill}>
                        <td style={{ fontWeight: 600, color: 'var(--text-on-dark)' }}>{ev.skill}</td>
                        <td>
                          {ev.winner !== 'Tied' ? (
                            <span style={{ color: 'var(--success-text)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CheckCircle2 size={12} /> @{ev.winner}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted-on-dark)' }}>Tied / Equal</span>
                          )}
                        </td>
                        {candidates.map(c => {
                          const candDetails = ev.details[c.username] || { confidence: 0, count: 0 };
                          const isLead = ev.winner === c.username;
                          return (
                            <td key={c.username} style={{ textAlign: 'center', background: isLead ? 'rgba(34, 197, 94, 0.03)' : 'transparent' }}>
                              <span style={{
                                fontWeight: isLead ? 700 : 'normal',
                                color: isLead ? 'var(--success-text)' : 'var(--text-on-dark)'
                              }}>
                                {candDetails.confidence}%
                              </span>
                              <span style={{
                                display: 'block',
                                fontSize: '0.67rem',
                                color: 'var(--text-muted-on-dark)',
                                marginTop: '0.1rem'
                              }}>
                                {candDetails.count} file signal{candDetails.count !== 1 ? 's' : ''}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Engineering Quality Matrix ──────────────────────────────── */}
        <div style={{ background: 'var(--bg-dark-2)', border: '1px solid var(--border-dark-strong)', borderRadius: 'var(--radius-md)', padding: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-dark)', paddingBottom: '0.75rem' }}>
            <Settings size={16} style={{ color: 'var(--success-text)' }} />
            <h2 style={{ fontSize: '0.88rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-on-dark)', margin: 0 }}>
              Engineering Quality Breakdown
            </h2>
          </div>

          <div className="bulk-table-wrap" style={{ border: 'none', padding: 0 }}>
            <table className="bulk-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Engineering Hygiene</th>
                  <th>Practice Winner</th>
                  {candidates.map(c => (
                    <th key={c.username} style={{ textAlign: 'center' }}>
                      @{c.username} index
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* 1. Documentation */}
                <tr>
                  <td style={{ fontWeight: 600, color: 'var(--text-on-dark)' }}>Documentation Quality</td>
                  <td>
                    {categories.qualityBreakdown?.documentation?.winner !== 'Tied' ? (
                      <span style={{ color: 'var(--success-text)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle2 size={12} /> @{categories.qualityBreakdown.documentation.winner}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted-on-dark)' }}>Tied</span>
                    )}
                  </td>
                  {candidates.map(c => {
                    const score = categories.qualityBreakdown?.documentation?.scores[c.username] ?? 0;
                    return (
                      <td key={c.username} style={{ textAlign: 'center', fontWeight: categories.qualityBreakdown?.documentation?.winner === c.username ? 700 : 'normal' }}>
                        <span style={{ color: getScoreColor(score) }}>{score}%</span>
                      </td>
                    );
                  })}
                </tr>

                {/* 2. Testing Practices */}
                <tr>
                  <td style={{ fontWeight: 600, color: 'var(--text-on-dark)' }}>Testing Practices</td>
                  <td>
                    {categories.qualityBreakdown?.testing?.winner !== 'Tied' ? (
                      <span style={{ color: 'var(--success-text)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle2 size={12} /> @{categories.qualityBreakdown.testing.winner}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted-on-dark)' }}>Tied</span>
                    )}
                  </td>
                  {candidates.map(c => {
                    const score = categories.qualityBreakdown?.testing?.scores[c.username] ?? 0;
                    return (
                      <td key={c.username} style={{ textAlign: 'center', fontWeight: categories.qualityBreakdown?.testing?.winner === c.username ? 700 : 'normal' }}>
                        <span style={{ color: getScoreColor(score) }}>{score}%</span>
                      </td>
                    );
                  })}
                </tr>

                {/* 3. CI/CD Adoption */}
                <tr>
                  <td style={{ fontWeight: 600, color: 'var(--text-on-dark)' }}>CI/CD Pipelines</td>
                  <td>
                    {categories.qualityBreakdown?.cicd?.winner !== 'Tied' ? (
                      <span style={{ color: 'var(--success-text)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle2 size={12} /> @{categories.qualityBreakdown.cicd.winner}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted-on-dark)' }}>Tied</span>
                    )}
                  </td>
                  {candidates.map(c => {
                    const score = categories.qualityBreakdown?.cicd?.scores[c.username] ?? 0;
                    return (
                      <td key={c.username} style={{ textAlign: 'center', fontWeight: categories.qualityBreakdown?.cicd?.winner === c.username ? 700 : 'normal' }}>
                        <span style={{ color: getScoreColor(score) }}>{score}%</span>
                      </td>
                    );
                  })}
                </tr>

                {/* 4. Repository Structure (Architecture) */}
                <tr>
                  <td style={{ fontWeight: 600, color: 'var(--text-on-dark)' }}>Modular Architecture</td>
                  <td>
                    {categories.qualityBreakdown?.architecture?.winner !== 'Tied' ? (
                      <span style={{ color: 'var(--success-text)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle2 size={12} /> @{categories.qualityBreakdown.architecture.winner}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted-on-dark)' }}>Tied</span>
                    )}
                  </td>
                  {candidates.map(c => {
                    const score = categories.qualityBreakdown?.architecture?.scores[c.username] ?? 0;
                    return (
                      <td key={c.username} style={{ textAlign: 'center', fontWeight: categories.qualityBreakdown?.architecture?.winner === c.username ? 700 : 'normal' }}>
                        <span style={{ color: getScoreColor(score) }}>{score}%</span>
                      </td>
                    );
                  })}
                </tr>

                {/* 5. Update Recency (Activity) */}
                <tr>
                  <td style={{ fontWeight: 600, color: 'var(--text-on-dark)' }}>Development Cadence</td>
                  <td>
                    {categories.qualityBreakdown?.activity?.winner !== 'Tied' ? (
                      <span style={{ color: 'var(--success-text)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle2 size={12} /> @{categories.qualityBreakdown.activity.winner}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted-on-dark)' }}>Tied</span>
                    )}
                  </td>
                  {candidates.map(c => {
                    const score = categories.qualityBreakdown?.activity?.scores[c.username] ?? 0;
                    return (
                      <td key={c.username} style={{ textAlign: 'center', fontWeight: categories.qualityBreakdown?.activity?.winner === c.username ? 700 : 'normal' }}>
                        <span style={{ color: getScoreColor(score) }}>{score}%</span>
                      </td>
                    );
                  })}
                </tr>

                {/* 6. Technical Depth (Complexity) */}
                <tr>
                  <td style={{ fontWeight: 600, color: 'var(--text-on-dark)' }}>Codebase Complexity</td>
                  <td>
                    {categories.qualityBreakdown?.complexity?.winner !== 'Tied' ? (
                      <span style={{ color: 'var(--success-text)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CheckCircle2 size={12} /> @{categories.qualityBreakdown.complexity.winner}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted-on-dark)' }}>Tied</span>
                    )}
                  </td>
                  {candidates.map(c => {
                    const score = categories.qualityBreakdown?.complexity?.scores[c.username] ?? 0;
                    return (
                      <td key={c.username} style={{ textAlign: 'center', fontWeight: categories.qualityBreakdown?.complexity?.winner === c.username ? 700 : 'normal' }}>
                        <span style={{ color: getScoreColor(score) }}>{score}%</span>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
