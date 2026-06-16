import React from 'react';

const getScoreTier = (score) => {
  if (score >= 80) return { tier: 'excellent', label: 'Strong Match' };
  if (score >= 60) return { tier: 'good',      label: 'Good Match' };
  if (score >= 40) return { tier: 'fair',      label: 'Fair Match' };
  return                   { tier: 'low',       label: 'Low Match' };
};

const tierBarColors = {
  excellent: '#22c55e',
  good:      '#60a5fa',
  fair:      '#fbbf24',
  low:       '#c8401a',
};

const tierTextColors = {
  excellent: '#22c55e',
  good:      '#60a5fa',
  fair:      '#fbbf24',
  low:       '#c8401a',
};

const MatchScoreCard = ({ score, flatScore, role, experience, matchedCount, missingCount, totalJdSkills }) => {
  const { tier, label } = getScoreTier(score);
  const barColor = tierBarColors[tier];
  const textColor = tierTextColors[tier];

  return (
    <div className={`score-card score-${tier}`}>
      <div className="score-card-inner">
        {/* Left — Score number */}
        <div className="score-panel-left">
          <div className="score-big-number" style={{ color: textColor }}>
            {score}<span className="score-pct" style={{ color: textColor }}>%</span>
          </div>
          <div className="score-sublabel">Match Score</div>
          {flatScore !== undefined && flatScore !== null && flatScore !== score && (
            <div className="score-sublabel-flat" style={{ fontSize: '0.73rem', color: 'var(--text-muted-on-dark)', opacity: 0.85, marginTop: '0.25rem', fontWeight: 600 }}>
              Flat Coverage: {flatScore}%
            </div>
          )}

          {/* Progress bar */}
          <div className="score-bar-wrap" style={{ marginTop: '0.75rem', width: '100px' }}>
            <div
              className="score-bar-fill"
              style={{
                width: `${score}%`,
                background: barColor,
              }}
            />
          </div>
        </div>

        {/* Right — Info */}
        <div className="score-panel-right">
          <div className={`score-tier-badge tier-${tier}`}>
            <span style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'currentColor',
              marginRight: '2px',
            }} />
            {label}
          </div>

          <div className="score-info-role">{role || 'Job Role'}</div>
          <div className="score-info-experience">
            {experience && experience !== 'Not Specified'
              ? `Experience: ${experience}`
              : 'Experience not specified'}
          </div>

          <div className="score-stats-row">
            <div className="score-stat">
              <span className="score-stat-value" style={{ color: '#22c55e' }}>{matchedCount}</span>
              <span className="score-stat-label">Matched</span>
            </div>
            <div className="score-stat">
              <span className="score-stat-value" style={{ color: '#f87171' }}>{missingCount}</span>
              <span className="score-stat-label">Missing</span>
            </div>
            <div className="score-stat">
              <span className="score-stat-value" style={{ color: '#60a5fa' }}>{totalJdSkills}</span>
              <span className="score-stat-label">Required</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchScoreCard;
