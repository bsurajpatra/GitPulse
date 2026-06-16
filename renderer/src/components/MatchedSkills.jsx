import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Database } from 'lucide-react';

const MatchedSkills = ({ skills, evidenceMap = {} }) => {
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

  return (
    <div className="result-card">
      <div className="result-card-header">
        <CheckCircle2 size={16} style={{ color: 'var(--success-text)' }} />
        <span className="result-card-title">Matched Skills</span>
        <span className="result-card-count">{skills?.length || 0}</span>
      </div>
      {skills && skills.length > 0 ? (
        <div className="skills-evidence-list">
          {skills.map((skill, i) => {
            const skillData = evidenceMap?.[skill] || { confidence: 0, evidence: [] };
            const isExpanded = expandedSkill === skill;
            const hasEvidence = skillData.evidence && skillData.evidence.length > 0;

            return (
              <div key={i} className="skill-evidence-item">
                <button
                  className={`skill-evidence-trigger ${isExpanded ? 'active' : ''}`}
                  onClick={() => toggleExpand(skill)}
                  title="Click to view evidence"
                  type="button"
                >
                  <div className="skill-trigger-left">
                    <span className="skill-pill-icon-matched">✓</span>
                    <span className="skill-trigger-name">{skill}</span>
                  </div>
                  <div className="skill-trigger-right">
                    {skillData.confidence > 0 && (
                      <span
                        className="skill-confidence-badge"
                        style={{ color: getConfidenceColor(skillData.confidence) }}
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
