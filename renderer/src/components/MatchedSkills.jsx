import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Database } from 'lucide-react';

const MatchedSkills = ({ skills = [], evidenceMap = {}, skillBreakdown = [] }) => {
  const [expandedSkill, setExpandedSkill] = useState(null);

  const toggleExpand = (skill) => {
    if (expandedSkill === skill) {
      setExpandedSkill(null);
    } else {
      setExpandedSkill(skill);
    }
  };

  const getConfidenceColor = (conf) => {
    if (conf >= 80) return 'var(--success-text)';
    if (conf >= 60) return 'var(--info-text)';
    if (conf >= 40) return 'var(--warning-text)';
    return 'var(--danger-text)';
  };

  const getWeightTier = (weight) => {
    if (weight >= 15) return { label: 'High', color: '#ef4444' };
    if (weight >= 10) return { label: 'Med', color: '#fbbf24' };
    return { label: 'Low', color: '#94a3b8' };
  };

  // Compile matched skills with breakdown info
  const matchedList = skillBreakdown.length > 0
    ? skillBreakdown.filter(item => item.status === 'matched')
    : skills.map(skill => {
        const skillData = evidenceMap?.[skill] || { confidence: 0, evidence: [] };
        return {
          skill,
          weight: null,
          confidence: skillData.confidence,
          contribution: null
        };
      });

  return (
    <div className="result-card">
      <div className="result-card-header">
        <CheckCircle2 size={16} style={{ color: 'var(--success-text)' }} />
        <span className="result-card-title">Matched Skills</span>
        <span className="result-card-count">{matchedList.length}</span>
      </div>
      {matchedList.length > 0 ? (
        <div className="skills-evidence-list">
          {matchedList.map((item, i) => {
            const skill = item.skill;
            const skillData = evidenceMap?.[skill] || { confidence: item.confidence || 0, evidence: [] };
            const isExpanded = expandedSkill === skill;
            const hasEvidence = skillData.evidence && skillData.evidence.length > 0;
            const weightInfo = item.weight !== null ? getWeightTier(item.weight) : null;

            return (
              <div key={i} className="skill-evidence-item">
                <button
                  className={`skill-evidence-trigger ${isExpanded ? 'active' : ''}`}
                  onClick={() => toggleExpand(skill)}
                  title="Click to view evidence"
                  type="button"
                >
                  <div className="skill-trigger-left" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <span className="skill-pill-icon-matched">✓</span>
                    <span className="skill-trigger-name" style={{ fontWeight: 600 }}>{skill}</span>
                    {weightInfo && (
                      <span className="skill-weight-badge" style={{
                        borderColor: weightInfo.color,
                        color: weightInfo.color,
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}>
                        {weightInfo.label}
                      </span>
                    )}
                  </div>
                  <div className="skill-trigger-right" style={{ display: 'flex', alignItems: 'center' }}>
                    {item.contribution !== null && (
                      <span className="skill-contribution-badge" style={{
                        background: 'rgba(34, 197, 94, 0.15)',
                        color: 'var(--success-text)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        marginRight: '0.5rem'
                      }}>
                        +{item.contribution}% fit
                      </span>
                    )}
                    {skillData.confidence > 0 && (
                      <span
                        className="skill-confidence-badge"
                        style={{ color: getConfidenceColor(skillData.confidence), marginRight: '0.5rem' }}
                      >
                        {skillData.confidence}% Conf.
                      </span>
                    )}
                    {hasEvidence && (
                      isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                    )}
                  </div>
                </button>

                {isExpanded && hasEvidence && (
                  <div className="skill-evidence-details fade-in-up">
                    <div className="evidence-title">
                      <Database size={11} /> Supporting Evidence
                    </div>
                    <div className="evidence-rows">
                      {skillData.evidence.map((ev, idx) => (
                        <div key={idx} className="evidence-row">
                          <span className="evidence-repo">
                            {ev.repo === '__profile__' ? 'Profile Bio/README' : ev.repo}
                          </span>
                          <span className="evidence-type">{ev.type}</span>
                          <span className="evidence-source" title={ev.source}>
                            {ev.source}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="skills-empty">No matching skills found</p>
      )}
    </div>
  );
};

export default MatchedSkills;
