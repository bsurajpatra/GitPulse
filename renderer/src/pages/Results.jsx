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
          score={overallScore}
          role={role}
          experience={experience}
          matchedCount={matchedSkills.length}
          missingCount={missingSkills.length}
          totalJdSkills={jdSkills.length}
        />

        {/* Skills Grid */}
        <div className="results-grid">
          <MatchedSkills skills={matchedSkills} evidenceMap={evidenceMap} />
          <MissingSkills skills={missingSkills} />
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
