/**
 * @file profileSkillExtractor.js
 * @description Extracts and normalizes technical skills from GitHub repository data.
 * Returns both a flat skill list and a weight map indicating signal strength.
 *
 * Weight tiers:
 *   3 — dep-file evidence (package.json, requirements.txt, etc.)
 *   2 — repo topic tag
 *   1 — language, name, description, bio text
 *
 * @module analytics/profileSkillExtractor
 */

import { SKILL_DICTIONARY } from './jdParser.js';
import { gatherEvidence } from './evidenceEngine.js';

// ── helpers ──────────────────────────────────────────────────────────────────


function normalizeSkill(rawSkill) {
  if (!rawSkill || typeof rawSkill !== 'string') return null;
  const key = rawSkill.trim().toLowerCase();
  return SKILL_DICTIONARY[key] || null;
}

function extractSkillsFromText(text) {
  const found = new Set();
  if (!text) return [];

  for (const [alias, normalizedName] of Object.entries(SKILL_DICTIONARY)) {
    const escapedKey = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = `(?:^|[^a-zA-Z0-9_])(${escapedKey})(?:$|[^a-zA-Z0-9_+#])`;
    if (new RegExp(pattern, 'i').test(text)) {
      found.add(normalizedName);
    }
  }
  return Array.from(found);
}

// Weight merge helper — keeps the highest observed weight per skill
function mergeWeight(map, skill, weight) {
  map[skill] = Math.max(map[skill] ?? 0, weight);
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Extracts technical skills from an enriched repo list + optional profile signals.
 *
 * @param {Array<Object>} repos        - GitHub repositories (may include deepSkills).
 * @param {Object}        [extra={}]   - Extra text signals: { bio, readmeText }
 * @returns {{ skills: string[], weightMap: Object }}
 */
export function extractSkillsFromProfile(repos, extra = {}) {
  if (!repos || !Array.isArray(repos)) return { skills: [], weightMap: {} };

  const skillSet  = new Set();
  const weightMap = {};           // skill → highest weight seen

  // ── 1. Per-repo signals ──────────────────────────────────────────────────
  repos.forEach(repo => {

    // 1a. Primary language  (weight 1)
    if (repo.language) {
      const s = normalizeSkill(repo.language);
      if (s) { skillSet.add(s); mergeWeight(weightMap, s, 1); }
    }

    // 1b. Topics  (weight 2)
    if (Array.isArray(repo.topics)) {
      repo.topics.forEach(topic => {
        const s = normalizeSkill(topic);
        if (s) { skillSet.add(s); mergeWeight(weightMap, s, 2); }
      });
    }

    // 1c. Name + description  (weight 1)
    const nameText = repo.name ? repo.name.replace(/[_\-]/g, ' ') : '';
    const descText = repo.description || '';
    extractSkillsFromText(`${nameText} ${descText}`).forEach(s => {
      skillSet.add(s); mergeWeight(weightMap, s, 1);
    });

    // 1d. Deep-scanned dep-file skills  (weight 3)
    if (Array.isArray(repo.deepSkills)) {
      repo.deepSkills.forEach(s => {
        skillSet.add(s); mergeWeight(weightMap, s, 3);
      });
    }
  });

  // ── 2. Profile-level signals ─────────────────────────────────────────────

  // 2a. Bio  (weight 1)
  if (extra.bio) {
    extractSkillsFromText(extra.bio).forEach(s => {
      skillSet.add(s); mergeWeight(weightMap, s, 1);
    });
  }

  // 2b. Profile README  (weight 2 — user curated)
  if (extra.readmeText) {
    extractSkillsFromText(extra.readmeText).forEach(s => {
      skillSet.add(s); mergeWeight(weightMap, s, 2);
    });
  }

  const skills = Array.from(skillSet).sort();

  const evidenceList = gatherEvidence(repos, extra);
  const evidenceMap = {};
  evidenceList.forEach((item) => {
    evidenceMap[item.skill] = {
      confidence: item.confidence,
      evidence: item.evidence,
    };
  });

  return { skills, weightMap, evidenceMap };
}
