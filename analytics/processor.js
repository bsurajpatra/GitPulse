import { parseJobDescription } from './jdParser.js';
import { extractSkillsFromProfile } from './profileSkillExtractor.js';
import { calculateMatchScore } from './matchEngine.js';

/**
 * Orchestrates the full Job Fit analysis workflow.
 *
 * Receives enriched repos (with deepSkills) and optional profile-level
 * signals (bio, readmeText) passed via the extra field on repos[0].__extra__.
 *
 * @param {Array<Object>} repos          - Enriched GitHub repositories list.
 * @param {string}        jobDescription - Raw Job Description text.
 * @returns {Object} Complete analysis results including weightMap.
 */
const processJobFit = (repos, jobDescription) => {
  // Pull profile-level signals injected by analysis.service before handing off to worker
  const extra = repos[0]?.__extra__ || {};

  // 1. Parse Job Description
  const parsedJd = parseJobDescription(jobDescription);

  // 2. Extract Skills + weight map from profile
  const { skills: profileSkills, weightMap, evidenceMap } = extractSkillsFromProfile(repos, extra);

  // 3. Weighted match against JD requirements
  const matchResult = calculateMatchScore(parsedJd.skills, profileSkills, weightMap);

  return {
    role:         parsedJd.role,
    experience:   parsedJd.experience,
    jdSkills:     parsedJd.skills,
    profileSkills,
    weightMap,
    evidenceMap,
    match:        matchResult
  };
};

export default processJobFit;
