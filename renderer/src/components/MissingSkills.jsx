import React from 'react';
import { XCircle } from 'lucide-react';

const MissingSkills = ({ skills = [], skillBreakdown = [] }) => {
  const getWeightTier = (weight) => {
    if (weight >= 15) return { label: 'High', color: '#ef4444' };
    if (weight >= 10) return { label: 'Med', color: '#fbbf24' };
    return { label: 'Low', color: '#94a3b8' };
  };

  const missingList = skillBreakdown.length > 0
    ? skillBreakdown.filter(item => item.status === 'missing')
    : skills.map(skill => ({ skill, weight: null }));

  return (
    <div className="result-card">
      <div className="result-card-header">
        <XCircle size={16} style={{ color: 'var(--gp-danger)' }} />
        <span className="result-card-title">Missing Skills</span>
        <span className="result-card-count">{missingList.length}</span>
      </div>
      {missingList.length > 0 ? (
        <div className="skills-badge-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {missingList.map((item, i) => {
            const weightInfo = item.weight !== null ? getWeightTier(item.weight) : null;
            return (
              <span key={i} className="skill-pill skill-pill-missing" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '4px 8px' }}>
                <span className="skill-pill-icon">✗</span>
                <span style={{ fontWeight: 600 }}>{item.skill}</span>
                {weightInfo && (
                  <span className="skill-weight-badge-missing" style={{
                    borderColor: 'rgba(239, 68, 68, 0.4)',
                    color: 'rgba(239, 68, 68, 0.8)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    padding: '0 4px',
                    borderRadius: '2px',
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}>
                    {weightInfo.label} ({item.weight}%)
                  </span>
                )}
              </span>
            );
          })}
        </div>
      ) : (
        <p className="skills-empty">No skill gaps — great coverage!</p>
      )}
    </div>
  );
};

export default MissingSkills;
