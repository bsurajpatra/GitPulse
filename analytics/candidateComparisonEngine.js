/**
 * @file candidateComparisonEngine.js
 * @description Compares two or more candidates against a job description, analyzing skills,
 *              evidence confidence, and engineering quality signals to determine the best match.
 * @module analytics/candidateComparisonEngine
 */

/**
 * Compares candidates and outputs a recruiter-friendly, explainable report.
 *
 * @param {Object} params
 * @param {string} params.jobDescription - Raw Job Description text.
 * @param {Array<Object>} params.candidates - Array of candidate analysis results.
 * @returns {Object} Structured comparison report.
 */
export function compareCandidates({ jobDescription = '', candidates = [] }) {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new Error('At least one candidate is required for comparison.');
  }

  // 1. Calculate and ensure final scores exist for each candidate
  const enrichedCandidates = candidates.map(c => {
    const username = c.profile?.login || c.username || 'unknown';
    const jobFit = c.weightedMatchScore ?? c.overallScore ?? 0;
    const quality = c.quality?.qualityScore ?? 0;
    const finalScore = c.finalScore ?? Math.round(0.7 * jobFit + 0.3 * quality);
    return {
      ...c,
      username,
      jobFit,
      qualityScore: quality,
      finalScore
    };
  });

  // 2. Determine Overall Winner
  const sortedByFinal = [...enrichedCandidates].sort((a, b) => {
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    if (b.jobFit !== a.jobFit) return b.jobFit - a.jobFit;
    return b.qualityScore - a.qualityScore;
  });

  const topCandidate = sortedByFinal[0];
  const secondCandidate = sortedByFinal[1];
  let overallWinner = topCandidate.username;
  let isStrictTie = false;

  if (secondCandidate && 
      topCandidate.finalScore === secondCandidate.finalScore && 
      topCandidate.jobFit === secondCandidate.jobFit && 
      topCandidate.qualityScore === secondCandidate.qualityScore) {
    isStrictTie = true;
    overallWinner = 'Tied';
  }

  // 3. Category Score Comparisons
  const scoreCategories = {
    finalScore: compareNumericField(enrichedCandidates, 'finalScore'),
    jobFit: compareNumericField(enrichedCandidates, 'jobFit'),
    quality: compareNumericField(enrichedCandidates, 'qualityScore')
  };

  // 4. Quality Breakdown Metric Comparisons
  const qualityBreakdownCategories = {
    documentation: compareNestedNumericField(enrichedCandidates, 'quality', 'breakdown', 'documentation'),
    testing: compareNestedNumericField(enrichedCandidates, 'quality', 'breakdown', 'testing'),
    cicd: compareNestedNumericField(enrichedCandidates, 'quality', 'breakdown', 'cicd'),
    architecture: compareNestedNumericField(enrichedCandidates, 'quality', 'breakdown', 'architecture'),
    activity: compareNestedNumericField(enrichedCandidates, 'quality', 'breakdown', 'activity'),
    complexity: compareNestedNumericField(enrichedCandidates, 'quality', 'breakdown', 'complexity')
  };

  // 5. Skill Comparison Logic
  const skillComparison = compareSkills(enrichedCandidates);

  // 6. Recruiter Insights Generation
  const insights = {};
  enrichedCandidates.forEach(c => {
    insights[c.username] = generateInsightsForCandidate(c, enrichedCandidates);
  });

  // 7. Final Recommendation & Reasoning Bullets
  const reasoning = generateReasoning(enrichedCandidates, overallWinner, isStrictTie, scoreCategories, qualityBreakdownCategories, skillComparison);
  const recommendationText = generateRecommendationText(enrichedCandidates, overallWinner, isStrictTie, topCandidate, reasoning);

  return {
    winner: overallWinner,
    winnerProfile: overallWinner !== 'Tied' ? topCandidate.profile : null,
    comparisonSummary: reasoning,
    categories: {
      scores: scoreCategories,
      skills: skillComparison,
      qualityBreakdown: qualityBreakdownCategories
    },
    insights,
    finalRecommendation: recommendationText
  };
}

/**
 * Compares a single numeric field across all candidates.
 */
function compareNumericField(candidates, field) {
  const scores = {};
  let maxScore = -1;
  let winner = 'Tied';
  let isTie = false;

  candidates.forEach(c => {
    const val = c[field] ?? 0;
    scores[c.username] = val;
    if (val > maxScore) {
      maxScore = val;
      winner = c.username;
      isTie = false;
    } else if (val === maxScore) {
      isTie = true;
    }
  });

  return {
    scores,
    winner: isTie ? 'Tied' : winner,
    maxScore
  };
}

/**
 * Compares a nested numeric field across all candidates.
 */
function compareNestedNumericField(candidates, parentField, subField, leafField) {
  const scores = {};
  let maxScore = -1;
  let winner = 'Tied';
  let isTie = false;

  candidates.forEach(c => {
    const val = c[parentField]?.[subField]?.[leafField] ?? 0;
    scores[c.username] = val;
    if (val > maxScore) {
      maxScore = val;
      winner = c.username;
      isTie = false;
    } else if (val === maxScore) {
      isTie = true;
    }
  });

  return {
    scores,
    winner: isTie ? 'Tied' : winner,
    maxScore
  };
}

/**
 * Compares skills profile lists and evidence mapping across all candidates.
 */
function compareSkills(candidates) {
  const matchedLists = candidates.map(c => c.matchedSkills || []);
  const allMatchedSkillsSet = new Set(matchedLists.flat());
  const commonSkills = [];
  const uniqueSkills = {};

  candidates.forEach(c => {
    uniqueSkills[c.username] = [];
  });

  allMatchedSkillsSet.forEach(skill => {
    let presentInCount = 0;
    let singlePresentCandidate = null;

    candidates.forEach(c => {
      const hasSkill = (c.matchedSkills || []).some(s => s.toLowerCase() === skill.toLowerCase());
      if (hasSkill) {
        presentInCount++;
        singlePresentCandidate = c.username;
      }
    });

    if (presentInCount === candidates.length) {
      commonSkills.push(skill);
    } else if (presentInCount === 1 && singlePresentCandidate) {
      uniqueSkills[singlePresentCandidate].push(skill);
    }
  });

  // Compare evidence strength for common skills
  const strongerEvidence = [];
  commonSkills.forEach(skill => {
    let maxConfidence = -1;
    let maxEvidenceCount = -1;
    let winner = 'Tied';
    let isTie = false;
    const details = {};

    candidates.forEach(c => {
      // Find matching key case-insensitively
      const evidenceKey = Object.keys(c.evidenceMap || {}).find(
        k => k.toLowerCase() === skill.toLowerCase()
      );
      const entry = c.evidenceMap?.[evidenceKey || skill] || { confidence: 0, evidence: [] };
      const confidence = entry.confidence ?? 0;
      const count = Array.isArray(entry.evidence) ? entry.evidence.length : 0;

      details[c.username] = { confidence, count };

      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        maxEvidenceCount = count;
        winner = c.username;
        isTie = false;
      } else if (confidence === maxConfidence) {
        if (count > maxEvidenceCount) {
          maxEvidenceCount = count;
          winner = c.username;
          isTie = false;
        } else if (count === maxEvidenceCount) {
          isTie = true;
        }
      }
    });

    strongerEvidence.push({
      skill,
      winner: isTie ? 'Tied' : winner,
      details
    });
  });

  return {
    commonSkills: commonSkills.sort(),
    uniqueSkills,
    strongerEvidence
  };
}

/**
 * Generates deterministic recruiter strengths insights for a candidate.
 */
function generateInsightsForCandidate(candidate, allCandidates) {
  const strengths = [];

  // 1. Overall scoring
  if (candidate.finalScore >= 80) {
    strengths.push(`Exceptional match profile with a Final Score of ${candidate.finalScore}%.`);
  } else if (candidate.finalScore >= 60) {
    strengths.push(`Strong overall alignment with a Final Score of ${candidate.finalScore}%.`);
  }

  // 2. High evidence confidence
  const highConfSkills = Object.entries(candidate.evidenceMap || {})
    .filter(([_, entry]) => (entry.confidence || 0) >= 85)
    .map(([skill, _]) => skill);
  if (highConfSkills.length > 0) {
    const list = highConfSkills.slice(0, 3).join(', ');
    strengths.push(`Deep developer confidence and high-frequency code evidence for: ${list}.`);
  }

  // 3. Unique skills contribution
  const otherCandidates = allCandidates.filter(c => c.username !== candidate.username);
  const uniqueMatched = (candidate.matchedSkills || []).filter(skill => 
    !otherCandidates.some(other => (other.matchedSkills || []).some(s => s.toLowerCase() === skill.toLowerCase()))
  );
  if (uniqueMatched.length > 0) {
    const list = uniqueMatched.slice(0, 3).join(', ');
    strengths.push(`Brings unique specialized stack expertise not visible in other candidate profiles: ${list}.`);
  }

  // 4. Quality breakdown strengths
  const breakdown = candidate.quality?.breakdown || {};
  if ((breakdown.complexity || 0) >= 80) {
    strengths.push(`Demonstrates experience building high-complexity, production-grade architectures.`);
  }
  if ((breakdown.testing || 0) >= 75) {
    strengths.push(`Strong engineering practices with automated testing configs.`);
  }
  if ((breakdown.cicd || 0) >= 75) {
    strengths.push(`Production-ready development lifecycle with mature CI/CD pipeline adoption.`);
  }
  if ((breakdown.documentation || 0) >= 75) {
    strengths.push(`Maintains clean repository layouts with comprehensive README structures.`);
  }

  if (strengths.length === 0) {
    strengths.push('Solid core backend/frontend engineering competency.');
    strengths.push('Active public repositories on GitHub representing clean source code.');
  }

  return strengths.slice(0, 3); // Return top 3 strengths
}

/**
 * Compiles the comparison summary bullets.
 */
function generateReasoning(candidates, winner, isStrictTie, scoreCats, qualityCats, skillComp) {
  const reasoning = [];
  if (isStrictTie || candidates.length < 2) {
    reasoning.push('The candidates are matched extremely closely, with identical overall scores.');
    return reasoning;
  }

  const sorted = [...candidates].sort((a, b) => b.finalScore - a.finalScore);
  const lead = sorted[0];
  const runnerUp = sorted[1];
  const scoreDiff = lead.finalScore - runnerUp.finalScore;

  if (scoreDiff > 0) {
    reasoning.push(`@${lead.username} leads overall with a Final Score of ${lead.finalScore}% vs @${runnerUp.username}'s ${runnerUp.finalScore}% (+${scoreDiff}% lead).`);
  }

  // Job Fit comparison
  const fitDiff = lead.jobFit - runnerUp.jobFit;
  if (fitDiff > 0) {
    reasoning.push(`@${lead.username} has a better job requirements alignment (+${fitDiff}% Job Fit score lead).`);
  } else if (fitDiff < 0) {
    reasoning.push(`@${runnerUp.username} displays slightly closer job skill compatibility (+${Math.abs(fitDiff)}% Job Fit score lead).`);
  }

  // Quality comparison
  const qualDiff = lead.qualityScore - runnerUp.qualityScore;
  if (qualDiff > 0) {
    reasoning.push(`@${lead.username} shows stronger codebase hygiene and engineering quality practices (+${qualDiff}% Quality score lead).`);
  } else if (qualDiff < 0) {
    reasoning.push(`@${runnerUp.username} demonstrates superior code hygiene and structural practices (+${Math.abs(qualDiff)}% Quality score lead).`);
  }

  // Skill comparisons
  const uniqueLead = skillComp.uniqueSkills[lead.username] || [];
  if (uniqueLead.length > 0) {
    reasoning.push(`@${lead.username} brings exclusive skills matching the JD: ${uniqueLead.slice(0, 3).join(', ')}.`);
  }

  const uniqueRunner = skillComp.uniqueSkills[runnerUp.username] || [];
  if (uniqueRunner.length > 0) {
    reasoning.push(`@${runnerUp.username} brings exclusive skills matching the JD: ${uniqueRunner.slice(0, 3).join(', ')}.`);
  }

  // Evidence comparison
  const leadWins = skillComp.strongerEvidence.filter(e => e.winner === lead.username);
  if (leadWins.length > 0) {
    reasoning.push(`@${lead.username} shows stronger repository evidence confidence in shared core skills: ${leadWins.slice(0, 2).map(e => e.skill).join(', ')}.`);
  }

  // Complexity comparison
  const leadComp = lead.quality?.breakdown?.complexity ?? 0;
  const runnerComp = runnerUp.quality?.breakdown?.complexity ?? 0;
  if (leadComp > runnerComp) {
    reasoning.push(`@${lead.username} has worked on higher-complexity codebases (${leadComp}% vs ${runnerComp}% complexity).`);
  }

  return reasoning.slice(0, 5); // Return top 5 reasoning points
}

/**
 * Compiles a structured textual summary recommendation.
 */
function generateRecommendationText(candidates, winner, isStrictTie, topCandidate, reasoning) {
  if (isStrictTie) {
    const names = candidates.map(c => `@${c.username}`).join(' and ');
    return `Both ${names} demonstrate highly competent engineering skills with identical score profiles. Recommendation is to proceed with interviews for both profiles to assess cultural fit.`;
  }

  const name = topCandidate.profile?.name || topCandidate.username;
  const reasons = reasoning.map(r => `• ${r}`).join('\n');
  return `Based on GitHub code scanning, we recommend prioritizing candidate **${name}** (@${topCandidate.username}) for this role.

Key deciding factors:
${reasons}

Both candidates can be reviewed in detail in the side-by-side tables below.`;
}
