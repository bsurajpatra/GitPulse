import React from 'react';
import { ArrowLeft } from 'lucide-react';
import MatchScoreCard from '../components/MatchScoreCard';
import MatchedSkills from '../components/MatchedSkills';
import MissingSkills from '../components/MissingSkills';
import StrengthsCard from '../components/StrengthsCard';
import WeaknessesCard from '../components/WeaknessesCard';

const Results = ({ data, onBack }) => {
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
  } = data;

  const role = data.role || 'Job Role';
  const experience = data.experience || 'Not Specified';
  const displayScore = weightedMatchScore !== null ? weightedMatchScore : overallScore;

  return (
    <div className="results-page">
      <div className="results-wrapper">
        {/* Top bar */}
        <div className="results-top-bar">
          <h2>Analysis Results</h2>
          <button className="btn-new-analysis" onClick={onBack} id="btn-new-analysis">
            ← New Analysis
          </button>
        </div>

        {/* Score Card */}
        <MatchScoreCard
          score={displayScore}
          flatScore={flatScore}
          role={role}
          experience={experience}
          matchedCount={matchedSkills.length}
          missingCount={missingSkills.length}
          totalJdSkills={jdSkills.length}
        />

        {/* Score Justification / Explanations list */}
        {explanations && explanations.length > 0 && (
          <div className="result-card explanations-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
            <div className="result-card-header" style={{ marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-dark)' }}>
              <span className="result-card-title" style={{ fontSize: '0.95rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--purple-text)' }}>
                Score Justification
              </span>
            </div>
            <div className="explanations-list">
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

        {/* Skills Grid */}
        <div className="results-grid">
          <MatchedSkills skills={matchedSkills} evidenceMap={evidenceMap} skillBreakdown={skillBreakdown} />
          <MissingSkills skills={missingSkills} skillBreakdown={skillBreakdown} />
        </div>

        {/* Insights Grid */}
        <div className="results-grid">
          <StrengthsCard strengths={strengths} />
          <WeaknessesCard weaknesses={weaknesses} />
        </div>
      </div>
    </div>
  );
};

export default Results;
