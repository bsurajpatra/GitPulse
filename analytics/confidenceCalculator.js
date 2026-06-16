/**
 * @file confidenceCalculator.js
 * @description Computes a percentage confidence score for a detected skill based on the strength
 *              and variety of matching evidence signals across candidate repositories.
 * @module analytics/confidenceCalculator
 */

const BASE_WEIGHTS = {
  dependency: 35,
  topic: 25,
  readme: 20,
  language: 15,
  repo_name: 10,
  repo_description: 10,
  bio: 10,
};

/**
 * Calculates a confidence percentage (10 - 100) for a detected skill.
 *
 * @param {string} skill - The normalized skill name.
 * @param {Array<Object>} evidenceList - List of evidence items collected for this skill.
 * @returns {number} Confidence percentage score.
 */
export function calculateConfidence(skill, evidenceList) {
  if (!Array.isArray(evidenceList) || evidenceList.length === 0) {
    return 10; // Default baseline minimum
  }

  // Deduplicate points per repository + type to prevent local spamming (e.g. 10 dependencies in 1 repo)
  const seenTypesPerRepo = new Set();
  const uniqueRepos = new Set();
  let totalScore = 0;

  evidenceList.forEach((ev) => {
    const repoName = ev.repo || '__profile__';
    const typeKey = `${repoName}:${ev.type}`;

    if (repoName !== '__profile__') {
      uniqueRepos.add(repoName);
    }

    if (!seenTypesPerRepo.has(typeKey)) {
      seenTypesPerRepo.add(typeKey);
      totalScore += BASE_WEIGHTS[ev.type] || 10;
    }
  });

  // Repository volume multiplier (reward skills active in multiple repos)
  let repoMultiplier = 1.0;
  if (uniqueRepos.size > 1) {
    // +10% boost per additional repository, capped at a maximum of +30% (1.3x)
    repoMultiplier = Math.min(1.3, 1.0 + (uniqueRepos.size - 1) * 0.1);
  }

  const finalConfidence = Math.min(100, Math.round(totalScore * repoMultiplier));

  // Ensure minimum baseline of 10%
  return Math.max(10, finalConfidence);
}
