import React from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import MatchedSkills from '../components/MatchedSkills';
import MissingSkills from '../components/MissingSkills';
import StrengthsCard from '../components/StrengthsCard';
import WeaknessesCard from '../components/WeaknessesCard';

function getScoreColor(score) {
  if (score >= 80) return 'var(--success-text)';
  if (score >= 60) return 'var(--info-text)';
  if (score >= 40) return 'var(--warning-text)';
  return 'var(--danger-text)';
}

function getScoreTier(score) {
  if (score >= 80) return 'Strong Match';
  if (score >= 60) return 'Good Match';
  if (score >= 40) return 'Fair Match';
  return 'Low Match';
}

const Results = ({ data, onBack, backLabel = '← New Analysis' }) => {
  React.useEffect(() => {
    const mainContent = document.querySelector('.app-main-content');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [data]);

  if (!data) return null;

  const {
    overallScore = 0,
    weightedMatchScore = null,
    flatScore = null,
    skillBreakdown = [],
    explanations = [],
    matchedSkills = [],
    missingSkills = [],
    strengths = [],
    weaknesses = [],
    profileSkills = [],
    jdSkills = [],
    profile,
    evidenceMap = {},
    quality = null
  } = data;

  const role = data.role || 'Job Role';
  const experience = data.experience || 'Not Specified';

  // Score components
  const jobFitScore = weightedMatchScore !== null ? weightedMatchScore : overallScore;
  const qualityScore = quality?.qualityScore ?? 0;
  const finalScore = data.finalScore ?? Math.round(0.7 * jobFitScore + 0.3 * qualityScore);

  // Colors
  const finalColor = getScoreColor(finalScore);
  const jobFitColor = getScoreColor(jobFitScore);
  const qualityColor = getScoreColor(qualityScore);

  // Merged Insights lists
  const combinedStrengths = [
    ...strengths,
    ...(quality?.strengths || [])
  ].filter(Boolean);

  const combinedWeaknesses = [
    ...weaknesses,
    ...(quality?.weaknesses || [])
  ].filter(Boolean);

  return (
    <div className="results-page">
      <div className="results-wrapper">
        {/* Top bar */}
        <div className="results-top-bar">
          <h2>Analysis Results</h2>
          <button className="btn-new-analysis" onClick={onBack} id="btn-new-analysis">
            {backLabel}
          </button>
        </div>

        {/* Candidate Profile Banner */}
        {profile && (
          <div className="candidate-profile-banner" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            background: 'var(--bg-dark-2)',
            border: '1px solid var(--border-dark-strong)',
            padding: '1.25rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            animation: 'fadeInUp 0.35s ease-out'
          }}>
            {profile.avatar_url && (
              <img
                src={profile.avatar_url}
                alt={profile.name || profile.login}
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: '2px solid var(--border-dark-strong)',
                  background: 'var(--bg-dark)'
                }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-on-dark)' }}>
                  {profile.name || profile.login}
                </h1>
                {profile.login && (
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted-on-dark)' }}>
                    (@{profile.login})
                  </span>
                )}
              </div>
              {profile.bio && (
                <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'var(--text-light)', opacity: 0.9 }}>
                  {profile.bio}
                </p>
              )}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.6rem', fontSize: '0.75rem', color: 'var(--text-muted-on-dark)' }}>
                <span><strong>{profile.public_repos ?? 0}</strong> Repositories</span>
                <span><strong>{profile.followers ?? 0}</strong> Followers</span>
                <span><strong>{profile.following ?? 0}</strong> Following</span>
              </div>
            </div>
            {profile.login && (
              <button
                onClick={() => window.open(`https://github.com/${profile.login}`, '_blank')}
                style={{
                  background: 'var(--bg-dark)',
                  border: '1px solid var(--border-dark-strong)',
                  color: 'var(--text-on-dark)',
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'var(--trans)'
                }}
                type="button"
                className="btn-github-link"
              >
                GitHub Profile ↗
              </button>
            )}
          </div>
        )}

        {/* 3-Column Score Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          {/* Card 1: Final Score */}
          <div className="score-card score-excellent" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-dark-2)', border: '1px solid var(--border-dark-strong)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div className="score-big-number" style={{ color: finalColor, fontSize: '3rem', fontWeight: 900, lineHeight: 1 }}>
              {finalScore}<span style={{ fontSize: '1.5rem', fontWeight: 700 }}>%</span>
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-on-dark)', marginTop: '0.5rem' }}>Final Score</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted-on-dark)', marginTop: '0.25rem', marginBottom: '0.5rem', lineHeight: '1.4' }}>
              Overall evaluation (70% Job Fit + 30% Engineering Quality)
            </div>
            <div className="score-bar-wrap" style={{ marginTop: '0.25rem', width: '120px', height: '6px', background: 'var(--border-dark)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ width: `${finalScore}%`, height: '100%', background: finalColor }} />
            </div>
          </div>

          {/* Card 2: Job Fit Score */}
          <div className="score-card score-good" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-dark-2)', border: '1px solid var(--border-dark-strong)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div className="score-big-number" style={{ color: jobFitColor, fontSize: '3.0rem', fontWeight: 900, lineHeight: 1 }}>
              {jobFitScore}<span style={{ fontSize: '1.5rem', fontWeight: 700 }}>%</span>
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-on-dark)', marginTop: '0.5rem' }}>Job Fit Score</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted-on-dark)', marginTop: '0.25rem', marginBottom: '0.5rem', lineHeight: '1.4' }}>
              Role compatibility: {role} ({experience !== 'Not Specified' ? experience : 'any exp'})
            </div>
            <div className="score-bar-wrap" style={{ marginTop: '0.25rem', width: '120px', height: '6px', background: 'var(--border-dark)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ width: `${jobFitScore}%`, height: '100%', background: jobFitColor }} />
            </div>
          </div>

          {/* Card 3: Quality Score */}
          <div className="score-card score-good" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-dark-2)', border: '1px solid var(--border-dark-strong)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div className="score-big-number" style={{ color: qualityColor, fontSize: '3.0rem', fontWeight: 900, lineHeight: 1 }}>
              {qualityScore}<span style={{ fontSize: '1.5rem', fontWeight: 700 }}>%</span>
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-on-dark)', marginTop: '0.5rem' }}>Engineering Quality</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted-on-dark)', marginTop: '0.25rem', marginBottom: '0.5rem', lineHeight: '1.4' }}>
              Hygiene index: documentation, testing, CI/CD, structure, and complexity
            </div>
            <div className="score-bar-wrap" style={{ marginTop: '0.25rem', width: '120px', height: '6px', background: 'var(--border-dark)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ width: `${qualityScore}%`, height: '100%', background: qualityColor }} />
            </div>
          </div>
        </div>

        {/* 2-Column Explanations & Quality Breakdown */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          {/* Left: Score Justification */}
          {explanations && explanations.length > 0 && (
            <div className="result-card explanations-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
              <div className="result-card-header" style={{ marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-dark)' }}>
                <span className="result-card-title" style={{ fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--purple-text)' }}>
                  Score Justification
                </span>
              </div>
              <div className="explanations-list" style={{ flex: 1 }}>
                {explanations.map((exp, idx) => (
                  <div key={idx} className="explanation-item" style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.6rem',
                    fontSize: '0.85rem',
                    color: 'var(--text-on-dark)',
                    lineHeight: '1.5',
                    padding: '0.45rem 0',
                    borderBottom: idx < explanations.length - 1 ? '1px solid var(--border-dark)' : 'none'
                  }}>
                    <span className="explanation-bullet" style={{ color: 'var(--purple-text)', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '-0.15rem' }}>•</span>
                    <span>{exp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Right: Quality Breakdown */}
          {quality && quality.breakdown && (
            <div className="result-card quality-breakdown-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
              <div className="result-card-header" style={{ marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-dark)' }}>
                <span className="result-card-title" style={{ fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--success-text)' }}>
                  Engineering Quality Breakdown
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1, justifyContent: 'center' }}>
                {Object.entries(quality.breakdown).map(([key, val]) => {
                  const color = getScoreColor(val);
                  let displayKey = key;
                  if (key === 'cicd') displayKey = 'CI/CD & Deployment';

                  return (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-on-dark)' }}>
                        <span style={{ textTransform: 'capitalize' }}>{displayKey}</span>
                        <span style={{ color }}>{val}%</span>
                      </div>
                      <div style={{ width: '100%', height: '5px', background: 'var(--border-dark)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                        <div style={{ width: `${val}%`, height: '100%', background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Skills Grid */}
        <div className="results-grid">
          <MatchedSkills skills={matchedSkills} evidenceMap={evidenceMap} skillBreakdown={skillBreakdown} />
          <MissingSkills skills={missingSkills} skillBreakdown={skillBreakdown} />
        </div>

        {/* Insights Grid */}
        <div className="results-grid">
          <StrengthsCard strengths={combinedStrengths} />
          <WeaknessesCard weaknesses={combinedWeaknesses} />
        </div>
      </div>
    </div>
  );
};

export default Results;
