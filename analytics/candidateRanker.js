/**
 * @file candidateRanker.js
 * @description Ranks bulk candidates by Job Fit Score.
 *              Designed for multi-signal scoring in future iterations (quality, recruiter, AI).
 * @module analytics/candidateRanker
 */

/**
 * Ranks candidates by Final Candidate Score descending and adds a `rank` field.
 * Formula: 70% Job Fit Score, 30% Quality Score.
 *
 * @param {Array<Object>} results - Candidate analysis results from bulkCandidateAnalysis.service
 * @returns {Array<Object>} Ranked candidates with `rank` (1-indexed)
 */
export function rankCandidates(results) {
  return [...results]
    .map(c => {
      const jobFitScore = c.weightedMatchScore ?? c.overallScore ?? 0;
      const qualityScore = c.quality?.qualityScore ?? 0;
      const finalScore = Math.round(0.7 * jobFitScore + 0.3 * qualityScore);
      return {
        ...c,
        finalScore
      };
    })
    .sort((a, b) => {
      const scoreA = a.finalScore ?? 0;
      const scoreB = b.finalScore ?? 0;
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
  const scores = rankings.map(r => r.finalScore ?? 0);
  const shortlisted = rankings.filter(r => (r.finalScore ?? 0) >= minimumScore);

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
