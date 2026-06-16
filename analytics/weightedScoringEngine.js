/**
 * @file weightedScoringEngine.js
 * @description Analyzes JD context and positional priority to assign normalized weights to skills,
 *              calculating an explainable, weighted compatibility score.
 * @module analytics/weightedScoringEngine
 */

/**
 * Calculates normalized weights (summing to 100) for required JD skills.
 *
 * @param {string} jdText - The raw Job Description text.
 * @param {string[]} jdSkills - List of extracted technical skills from the JD.
 * @returns {Object.<string, number>} Map of skill name -> normalized weight.
 */
export function calculateWeights(jdText, jdSkills) {
  if (!Array.isArray(jdSkills) || jdSkills.length === 0) {
    return {};
  }

  const jdLower = (jdText || '').toLowerCase();
  const rawWeights = {};

  jdSkills.forEach((skill) => {
    const skillLower = skill.toLowerCase();
    let rawWeight = 10; // baseline

    let idx = jdLower.indexOf(skillLower);
    let count = 0;
    let firstIdx = -1;

    // Proximity context analysis in a 120-character window around the match
    while (idx !== -1) {
      if (firstIdx === -1) firstIdx = idx;
      count++;

      const start = Math.max(0, idx - 60);
      const end = Math.min(jdLower.length, idx + skillLower.length + 60);
      const windowText = jdLower.substring(start, end);

      // Requirement indicators (+5)
      if (/(required|must|essential|core|expert|strong|critical|experience\s+in)/i.test(windowText)) {
        rawWeight += 5;
      }
      // Optional indicators (-3)
      if (/(preferred|optional|plus|nice\s+to\s+have|desirable|bonus|familiarity)/i.test(windowText)) {
        rawWeight -= 3;
      }

      idx = jdLower.indexOf(skillLower, idx + 1);
    }

    // Positional modifier (skills listed earlier in JDs are usually higher priority)
    if (firstIdx !== -1 && jdLower.length > 0) {
      const positionPct = firstIdx / jdLower.length;
      if (positionPct <= 0.25) {
        rawWeight += 5; // Top 25% of JD
      } else if (positionPct <= 0.50) {
        rawWeight += 2; // Top 50% of JD
      }
    }

    // Frequency modifier
    if (count > 2) {
      rawWeight += 3;
    } else if (count > 5) {
      rawWeight += 5;
    }

    // Lower bound safeguard
    rawWeights[skill] = Math.max(5, rawWeight);
  });

  // Normalize weights to sum exactly to 100
  const sumRaw = Object.values(rawWeights).reduce((a, b) => a + b, 0);
  const normalized = {};
  
  if (sumRaw === 0) {
    const defaultWeight = Math.round(100 / jdSkills.length);
    jdSkills.forEach(s => { normalized[s] = defaultWeight; });
    return normalized;
  }

  jdSkills.forEach((skill) => {
    normalized[skill] = Math.round((rawWeights[skill] / sumRaw) * 100);
  });

  // Adjust rounding differences to ensure total is exactly 100
  const sumNorm = Object.values(normalized).reduce((a, b) => a + b, 0);
  if (sumNorm !== 100) {
    const diff = 100 - sumNorm;
    // Find skill with highest weight to absorb the rounding diff
    const highestSkill = jdSkills.reduce((a, b) => (normalized[a] > normalized[b] ? a : b));
    normalized[highestSkill] += diff;
  }

  return normalized;
}

/**
 * Calculates a weighted match score, contribution details, and explanatory bullets.
 *
 * @param {string} jdText - The raw Job Description text.
 * @param {string[]} jdSkills - List of required skills.
 * @param {string[]} profileSkills - Candidate profile skills.
 * @param {Object} evidenceMap - Map of skill name -> { confidence, evidence } from the Evidence Engine.
 * @returns {Object} Weighted match result structure.
 */
export function calculateWeightedScore(jdText, jdSkills, profileSkills, evidenceMap = {}) {
  const cleanJdSkills = Array.isArray(jdSkills) ? jdSkills : [];
  const cleanProfile = Array.isArray(profileSkills) ? profileSkills : [];
  const profileSet = new Set(cleanProfile.map((s) => s.toLowerCase()));

  if (cleanJdSkills.length === 0) {
    return {
      weightedScore: 0,
      skillBreakdown: [],
      explanations: ['No job description skills provided.'],
    };
  }

  const weights = calculateWeights(jdText, cleanJdSkills);
  let totalScore = 0;
  const skillBreakdown = [];
  const missingSkills = [];

  cleanJdSkills.forEach((skill) => {
    const isMatched = profileSet.has(skill.toLowerCase());
    const weight = weights[skill] || 0;
    
    let confidence = 0;
    if (isMatched) {
      // Lookup confidence from the evidence engine mapping
      const keyMatch = Object.keys(evidenceMap || {}).find(
        k => k.toLowerCase() === skill.toLowerCase()
      );
      confidence = evidenceMap[keyMatch || skill]?.confidence ?? 50; // default to 50 if missing
    }

    const contribution = isMatched ? Math.round(weight * (confidence / 100)) : 0;
    totalScore += contribution;

    const breakdownItem = {
      skill,
      weight,
      confidence,
      contribution,
      status: isMatched ? 'matched' : 'missing',
    };

    skillBreakdown.push(breakdownItem);
    if (!isMatched) {
      missingSkills.push(breakdownItem);
    }
  });

  const weightedScore = Math.min(100, Math.max(0, Math.round(totalScore)));

  // Generate explainable bullets
  const explanations = generateExplanations(weightedScore, skillBreakdown, missingSkills);

  return {
    weightedScore,
    skillBreakdown: skillBreakdown.sort((a, b) => b.weight - a.weight),
    explanations,
  };
}

function generateExplanations(score, breakdown, missing) {
  const bullets = [];

  if (score >= 80) {
    bullets.push('Excellent fit aligning closely with core stack requirements.');
  } else if (score >= 50) {
    bullets.push('Moderate alignment with the team stack; some core skills are missing.');
  } else {
    bullets.push('Low overall compatibility. Major core requirements are not met.');
  }

  // List top matched contributions
  const topMatches = [...breakdown]
    .filter(item => item.status === 'matched')
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3);

  topMatches.forEach((item) => {
    let tier = 'Light';
    if (item.confidence >= 80) tier = 'Strong';
    else if (item.confidence >= 50) tier = 'Moderate';

    bullets.push(`${tier} ${item.skill} evidence (+${item.contribution}% fit contribution).`);
  });

  // List top missing gaps (by weight)
  const topGaps = [...missing]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);

  topGaps.forEach((item) => {
    bullets.push(`Missing critical skill: ${item.skill} (worth ${item.weight}% weight).`);
  });

  return bullets;
}
