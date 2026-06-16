/**
 * @file evidenceEngine.js
 * @description Extracts supporting evidence and aggregates matching signals for all detected skills
 *              across candidate repositories, topic tags, and profiles.
 * @module analytics/evidenceEngine
 */

import { SKILL_DICTIONARY } from './jdParser.js';
import { calculateConfidence } from './confidenceCalculator.js';

function normalizeSkill(rawSkill) {
  if (!rawSkill || typeof rawSkill !== 'string') return null;
  const key = rawSkill.trim().toLowerCase();
  return SKILL_DICTIONARY[key] || null;
}

function extractSkillsWithAlias(text) {
  const found = [];
  if (!text) return found;

  for (const [alias, normalizedName] of Object.entries(SKILL_DICTIONARY)) {
    const escapedKey = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = `(?:^|[^a-zA-Z0-9_])(${escapedKey})(?:$|[^a-zA-Z0-9_+#])`;
    if (new RegExp(pattern, 'i').test(text)) {
      found.push({ skill: normalizedName, alias });
    }
  }
  return found;
}

/**
 * Gathers explainable evidence and confidence scores for all skills detected on a profile.
 *
 * @param {Array<Object>} repos - Enriched candidate repositories.
 * @param {Object} extra - Profile details (bio, readmeText).
 * @returns {Array<Object>} List of skills with confidence and supporting evidence.
 */
export function gatherEvidence(repos, extra = {}) {
  const skillToEvidence = {};

  const addEvidence = (skill, repo, type, source) => {
    if (!skillToEvidence[skill]) {
      skillToEvidence[skill] = [];
    }
    // Prevent duplicate exact evidence logs (e.g. same type, repo and source value)
    const exists = skillToEvidence[skill].some(
      (ev) => ev.repo === repo && ev.type === type && ev.source === source
    );
    if (!exists) {
      skillToEvidence[skill].push({ repo, type, source });
    }
  };

  if (Array.isArray(repos)) {
    repos.forEach((repo) => {
      const repoName = repo.name || 'Unknown Repository';

      // 1. Language signal (Weight 1)
      if (repo.language) {
        const s = normalizeSkill(repo.language);
        if (s) {
          addEvidence(s, repoName, 'language', repo.language);
        }
      }

      // 2. Topics signal (Weight 2)
      if (Array.isArray(repo.topics)) {
        repo.topics.forEach((topic) => {
          const s = normalizeSkill(topic);
          if (s) {
            addEvidence(s, repoName, 'topic', topic);
          }
        });
      }

      // 3. Name signal (Weight 1)
      if (repo.name) {
        const cleanName = repo.name.replace(/[_\-]/g, ' ');
        extractSkillsWithAlias(cleanName).forEach(({ skill, alias }) => {
          addEvidence(skill, repoName, 'repo_name', alias);
        });
      }

      // 4. Description signal (Weight 1)
      if (repo.description) {
        extractSkillsWithAlias(repo.description).forEach(({ skill, alias }) => {
          addEvidence(skill, repoName, 'repo_description', alias);
        });
      }

      // 5. Deep dependency logs (Weight 3)
      if (Array.isArray(repo.deepSkillsRaw)) {
        repo.deepSkillsRaw.forEach((item) => {
          addEvidence(
            item.skill,
            repoName,
            'dependency',
            `${item.file} -> ${item.source}`
          );
        });
      }
    });
  }

  // 6. Profile Bio signal (Weight 1)
  if (extra?.bio) {
    extractSkillsWithAlias(extra.bio).forEach(({ skill, alias }) => {
      addEvidence(skill, '__profile__', 'bio', alias);
    });
  }

  // 7. Profile README signal (Weight 2)
  if (extra?.readmeText) {
    extractSkillsWithAlias(extra.readmeText).forEach(({ skill, alias }) => {
      addEvidence(skill, '__profile__', 'readme', alias);
    });
  }

  // Compile confidence scores & return formatted list
  return Object.entries(skillToEvidence).map(([skill, evidence]) => ({
    skill,
    confidence: calculateConfidence(skill, evidence),
    evidence,
  }));
}
