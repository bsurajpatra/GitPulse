/**
 * @file bulkCandidateAnalysis.service.js
 * @description Bulk candidate screening service.
 *              Reuses the existing analysis pipeline with p-limit concurrency control.
 *              Emits real-time progress updates via callback.
 * @module services/bulkCandidateAnalysis.service
 */

import pLimit from 'p-limit';
import AnalysisService from './analysis.service.js';
import { rankCandidates, generateStatistics } from '../analytics/candidateRanker.js';

/** Maximum simultaneous GitHub analyses to prevent API rate-limit saturation */
const MAX_CONCURRENCY = 5;

class BulkCandidateAnalysisService {
  /**
   * Analyzes multiple GitHub candidates against a single job description.
   *
   * @param {Object}   params
   * @param {string[]} params.usernames       - GitHub usernames (raw, may include @)
   * @param {string}   params.jobDescription  - Job description text
   * @param {number}  [params.minimumScore=0] - Score threshold for shortlisting (0 = no filter)
   * @param {string|null} [params.token=null] - GitHub OAuth token
   * @param {Function} [params.onProgress]   - Called with { total, completed, percentage }
   *
   * @returns {Promise<{
   *   rankings:    Array,   // candidates scoring >= minimumScore, ranked
   *   allRankings: Array,   // all successful candidates, ranked (no filter)
   *   statistics:  Object,  // summary stats
   *   failures:    Array    // { username, status, reason }
   * }>}
   */
  async analyze({ usernames, jobDescription, minimumScore = 0, token = null, onProgress }) {
    if (!Array.isArray(usernames) || usernames.length === 0) {
      throw new Error('At least one username is required.');
    }
    if (!jobDescription || typeof jobDescription !== 'string' || !jobDescription.trim()) {
      throw new Error('Job description is required.');
    }

    const limit = pLimit(MAX_CONCURRENCY);

    // Normalise usernames: strip @, whitespace, empty
    const cleanedUsernames = [...new Set(
      usernames
        .map(u => String(u).trim().replace(/^@/, ''))
        .filter(Boolean)
    )];

    const total = cleanedUsernames.length;
    let completed = 0;

    const successResults = [];
    const failures = [];

    const emitProgress = () => {
      if (typeof onProgress === 'function') {
        onProgress({
          total,
          completed,
          percentage: Math.round((completed / total) * 100),
        });
      }
    };

    // Process all candidates with concurrency cap
    const tasks = cleanedUsernames.map(username =>
      limit(async () => {
        try {
          const result = await AnalysisService.analyzeJobFit(username, jobDescription, token);
          successResults.push({ username, ...result });
        } catch (err) {
          failures.push({
            username,
            status: 'failed',
            reason: err.message || 'Unknown error',
          });
        } finally {
          completed++;
          emitProgress();
        }
      })
    );

    await Promise.all(tasks);

    // Rank all successful results
    const allRankings = rankCandidates(successResults);

    // Generate statistics from unfiltered rankings
    const statistics = generateStatistics(allRankings, failures, minimumScore);

    // Apply minimum score filter for primary rankings list
    const rankings = minimumScore > 0
      ? allRankings.filter(r => (r.finalScore ?? 0) >= minimumScore)
      : allRankings;

    return { rankings, allRankings, statistics, failures };
  }
}

export default new BulkCandidateAnalysisService();
