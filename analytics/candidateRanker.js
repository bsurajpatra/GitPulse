/**
 * @file candidateRanker.js
 * @description Ranks bulk candidates by Job Fit Score.
 *              Designed for multi-signal scoring in future iterations (quality, recruiter, AI).
 * @module analytics/candidateRanker
 */

/**
 * Ranks candidates by Job Fit Score descending and adds a `rank` field.
 * @param {Array<Object>} results - Candidate analysis results from bulkCandidateAnalysis.service
 * @returns {Array<Object>} Ranked candidates with `rank` (1-indexed)
 */
export function rankCandidates(results) {
  return [...results]
    .sort((a, b) => {
      const scoreA = a.weightedMatchScore ?? a.overallScore ?? 0;
      const scoreB = b.weightedMatchScore ?? b.overallScore ?? 0;
      return scoreB - scoreA;
    })
    .map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
    }));
}

/**
 * Generates screening statistics from ranked results and failures.
 * @param {Array<Object>} rankings  - Full ranked candidate list (before score filter)
 * @param {Array<Object>} failures  - Failed analysis entries
 * @param {number}        minimumScore - Score threshold for shortlisting
 * @returns {Object} Statistics summary object
 */
export function generateStatistics(rankings, failures, minimumScore = 0) {
  const scores = rankings.map(r => r.weightedMatchScore ?? r.overallScore ?? 0);
  const shortlisted = rankings.filter(r => (r.weightedMatchScore ?? r.overallScore ?? 0) >= minimumScore);

  return {
    totalCandidates:      rankings.length + failures.length,
    successfulAnalyses:   rankings.length,
    failedAnalyses:       failures.length,
    averageScore:         scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0,
    highestScore:         scores.length ? Math.max(...scores) : 0,
    lowestScore:          scores.length ? Math.min(...scores) : 0,
    shortlistedCandidates: shortlisted.length,
  };
}
