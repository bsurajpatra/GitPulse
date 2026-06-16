/**
 * @file matchEngine.js
 * @description Compares extracted job description skills against profile skills and calculates
 * a weighted compatibility score based on the confidence level of each skill signal source.
 * @module analytics/matchEngine
 *
 * Weight tiers:
 *   3 — skill found in dependency files (actual usage evidence)
 *   2 — skill found in repo topic (intentionally tagged)
 *   1 — skill found in repo name / description / language (weaker signal)
 */

import { calculateWeightedScore } from './weightedScoringEngine.js';

/**
 * Calculates the job compatibility metrics based on job requirements and profile skills.
 *
 * @param {string[]} jdSkills          - Normalized skills required by the job.
 * @param {string[]} profileSkills     - All normalized skills found in the profile (any source).
 * @param {Object}  [weightMap={}]     - Map of skill → weight (3/2/1). Built by profileSkillExtractor.
 * @param {string}  [jdText='']        - Optional raw job description text.
 * @param {Object}  [evidenceMap={}]   - Optional evidence mapping from the Evidence Engine.
 * @returns {Object} score, matched, missing, profileOnly, weightedMatchScore, skillBreakdown, explanations
 */
export function calculateMatchScore(jdSkills, profileSkills, weightMap = {}, jdText = '', evidenceMap = {}) {
  const cleanJdSkills   = Array.isArray(jdSkills)      ? jdSkills      : [];
  const cleanProfile    = Array.isArray(profileSkills)  ? profileSkills : [];

  if (cleanJdSkills.length === 0) {
    return {
      score: 0,
      matched: [],
      missing: [],
      profileOnly: [...cleanProfile].sort()
    };
  }

  // Case-insensitive lookup sets
  const profileSet = new Set(cleanProfile.map(s => s.toLowerCase()));
  const jdSet      = new Set(cleanJdSkills.map(s => s.toLowerCase()));

  const matched     = cleanJdSkills.filter(s =>  profileSet.has(s.toLowerCase()));
  const missing     = cleanJdSkills.filter(s => !profileSet.has(s.toLowerCase()));
  const profileOnly = cleanProfile.filter(s =>  !jdSet.has(s.toLowerCase()));

  // ── Flat score (simple coverage %) ──────────────────────────────────────
  const flatScore = Math.round((matched.length / cleanJdSkills.length) * 100);

  // ── Weighted score ───────────────────────────────────────────────────────
  const MAX_WEIGHT = 3;
  let totalWeightEarned = 0;
  let totalWeightPossible = cleanJdSkills.length * MAX_WEIGHT;

  for (const skill of matched) {
    const w = weightMap[skill] ?? weightMap[skill.toLowerCase()] ?? 1;
    totalWeightEarned += Math.min(w, MAX_WEIGHT);
  }

  const weightedScore = totalWeightPossible > 0
    ? Math.round((totalWeightEarned / totalWeightPossible) * 100)
    : 0;

  const score = Math.round(weightedScore * 0.6 + flatScore * 0.4);

  const baseResult = {
    score,
    flatScore,
    weightedScore,
    matched: matched.sort(),
    missing: missing.sort(),
    profileOnly: profileOnly.sort()
  };

  if (jdText) {
    const weightedEngineResult = calculateWeightedScore(jdText, cleanJdSkills, cleanProfile, evidenceMap);
    return {
      ...baseResult,
      weightedMatchScore: weightedEngineResult.weightedScore,
      skillBreakdown: weightedEngineResult.skillBreakdown,
      explanations: weightedEngineResult.explanations
    };
  }

  return baseResult;
}
