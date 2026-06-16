/**
 * @file resultFormatter.js
 * @description Formats raw matching engine metrics into structured strengths, weaknesses, and scores.
 * @module analytics/resultFormatter
 */

/**
 * Formats match engine results into user-friendly strengths, weaknesses, and overall score structure.
 * 
 * @param {Object} matchResult - Raw match result output from matchEngine.
 * @returns {Object} Structured analysis results containing overallScore, matchedSkills, missingSkills, strengths, and weaknesses.
 */
export function formatAnalysisResult(matchResult) {
  if (!matchResult) {
    return {
      overallScore: 0,
      matchedSkills: [],
      missingSkills: [],
      strengths: ["No profile skills found to analyze."],
      weaknesses: ["No job description requirements provided."]
    };
  }

  const { score, matched = [], missing = [] } = matchResult;
  const strengths = [];
  const weaknesses = [];

  // Generate dynamic Strengths
  if (score >= 80) {
    strengths.push("Excellent overall compatibility with the requested technical stack.");
  } else if (score >= 50) {
    strengths.push("Good core capability matching the job requirements.");
  }

  if (matched.length > 0) {
    const keyMatched = matched.slice(0, 3).join(", ");
    strengths.push(`Demonstrated hands-on experience with key required skills: ${keyMatched}.`);
  } else {
    strengths.push("Demonstrated proficiency in general software engineering concepts.");
  }

  if (matched.length > 5) {
    strengths.push("Broad technical skill coverage aligned with the team's needs.");
  }

  // Generate dynamic Weaknesses
  if (missing.length > 0) {
    const keyMissing = missing.slice(0, 3).join(", ");
    weaknesses.push(`Lacks visible repository projects or topics matching: ${keyMissing}.`);
  } else {
    weaknesses.push("No significant technical skill gaps identified relative to the job description.");
  }

  if (score < 50) {
    weaknesses.push("Job fit compatibility is low; recommendation to focus on the core stack defined in the JD.");
  }

  return {
    overallScore: score,
    weightedMatchScore: matchResult.weightedMatchScore ?? score,
    flatScore: matchResult.flatScore ?? score,
    skillBreakdown: matchResult.skillBreakdown || [],
    explanations: matchResult.explanations || [],
    matchedSkills: matched,
    missingSkills: missing,
    strengths,
    weaknesses
  };
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================
/*
const mockMatchResult = {
  score: 50,
  matched: ["React", "Node.js"],
  missing: ["AWS", "Docker"],
  profileOnly: ["MongoDB"]
};

const finalOutput = formatAnalysisResult(mockMatchResult);
console.log(finalOutput);
// Output:
// {
//   overallScore: 50,
//   matchedSkills: [ 'React', 'Node.js' ],
//   missingSkills: [ 'AWS', 'Docker' ],
//   strengths: [
//     'Good core capability matching the job requirements.',
//     'Demonstrated hands-on experience with key required skills: React, Node.js.'
//   ],
//   weaknesses: [ 'Lacks visible repository projects or topics matching: AWS, Docker.' ]
// }
*/
