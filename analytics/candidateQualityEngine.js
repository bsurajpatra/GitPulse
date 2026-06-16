/**
 * @file candidateQualityEngine.js
 * @description Evaluates overall engineering quality, practices, and project complexity of a candidate's GitHub profile.
 *              Runs deterministically and locally (no external APIs).
 * @module analytics/candidateQualityEngine
 */

const DEFAULT_WEIGHTS = {
  documentation: 0.15,
  testing: 0.15,
  cicd: 0.10,
  architecture: 0.20,
  activity: 0.15,
  complexity: 0.25
};

/**
 * Main entry point for evaluating candidate engineering quality.
 *
 * @param {Array<Object>} repos      - Top owner repositories (fully enriched).
 * @param {Array<Object>} allRepos   - The full list of all user repositories (both owner & forks).
 * @param {Object}        [weights]  - Optional customizable weights mapping.
 * @returns {Object} { qualityScore, breakdown, strengths, weaknesses }
 */
export function evaluateCandidateQuality(repos = [], allRepos = [], weights = DEFAULT_WEIGHTS) {
  // Filter for owner repositories to analyze developer's original works
  const ownerRepos = repos.filter(r => !r.fork);
  const activeOwnerRepos = ownerRepos.length > 0 ? ownerRepos : repos; // Fallback to all if user has no original owner repos in top list

  // 1. Calculate Individual Scores
  const documentation = calculateDocumentationScore(activeOwnerRepos);
  const testing = calculateTestingScore(activeOwnerRepos);
  const cicd = calculateCicdScore(activeOwnerRepos);
  const architecture = calculateArchitectureScore(activeOwnerRepos);
  const activity = calculateActivityScore(allRepos);
  const complexity = calculateComplexityScore(activeOwnerRepos);

  const breakdown = {
    documentation,
    testing,
    cicd,
    architecture,
    activity,
    complexity
  };

  // 2. Compute Overall Weighted Score
  const docWeight = weights.documentation ?? DEFAULT_WEIGHTS.documentation;
  const testWeight = weights.testing ?? DEFAULT_WEIGHTS.testing;
  const cicdWeight = weights.cicd ?? DEFAULT_WEIGHTS.cicd;
  const archWeight = weights.architecture ?? DEFAULT_WEIGHTS.architecture;
  const actWeight = weights.activity ?? DEFAULT_WEIGHTS.activity;
  const compWeight = weights.complexity ?? DEFAULT_WEIGHTS.complexity;

  const rawQualityScore = (
    documentation * docWeight +
    testing * testWeight +
    cicd * cicdWeight +
    architecture * archWeight +
    activity * actWeight +
    complexity * compWeight
  );

  const qualityScore = Math.max(0, Math.min(100, Math.round(rawQualityScore)));

  // 3. Detect Strengths and Weaknesses
  const strengths = detectStrengths(breakdown);
  const weaknesses = detectWeaknesses(breakdown);

  return {
    qualityScore,
    breakdown,
    strengths,
    weaknesses
  };
}

/**
 * Evaluates README files for length, structure, and presence of installation/usage instructions.
 */
function calculateDocumentationScore(repos) {
  if (repos.length === 0) return 20;

  const repoScores = repos.map(repo => {
    const readmeText = repo.readmeText || '';
    if (!readmeText) return 0;

    let score = 40; // Base score for README presence

    // Length modifier
    if (readmeText.length > 1500) {
      score += 20;
    } else if (readmeText.length > 500) {
      score += 10;
    }

    // Structure (headings `#`)
    const headingMatches = readmeText.match(/^#+\s+.+/gm) || [];
    if (headingMatches.length >= 4) {
      score += 15;
    } else if (headingMatches.length >= 2) {
      score += 7;
    }

    // Installation commands check
    const hasInstall = /npm\s+install|yarn\s+add|pip\s+install|bundle\s+install|go\s+get|cargo\s+build|install|setup|run\s+build/i.test(readmeText);
    if (hasInstall) {
      score += 15;
    }

    // Code blocks / usage examples
    const codeBlockCount = (readmeText.match(/```/g) || []).length;
    if (codeBlockCount >= 2) {
      score += 10;
    }

    return Math.min(100, score);
  });

  return Math.round(repoScores.reduce((sum, val) => sum + val, 0) / repoScores.length);
}

/**
 * Detects automated testing practices (test files, directories, dependencies).
 */
function calculateTestingScore(repos) {
  if (repos.length === 0) return 20;

  const testFrameworks = [
    'jest', 'vitest', 'mocha', 'cypress', 'playwright', 'pytest', 'unittest',
    'junit', 'testng', 'phpunit', 'rspec', 'minitest', 'ava', 'jasmine'
  ];

  const repoScores = repos.map(repo => {
    const rootFiles = (repo.rootContents || []).map(f => f.name.toLowerCase());
    const isDir = (name) => (repo.rootContents || []).some(f => {
      const lower = f.name.toLowerCase();
      return (lower === name || lower.endsWith('/' + name)) && f.type === 'dir';
    });

    // 1. Check folder presence
    const hasTestFolder = isDir('test') || isDir('tests') || isDir('__tests__') || isDir('spec') || isDir('specs') || isDir('e2e');

    // 2. Check config files (includes matches client/jest.config.js)
    const hasTestConfig = rootFiles.some(f =>
      f.includes('jest.config') ||
      f.includes('playwright.config') ||
      f.includes('cypress.config') ||
      f.includes('pytest.ini') ||
      f.includes('vitest.config')
    );

    // 3. Check dependencies
    const hasTestDeps = (repo.deepSkills || []).some(skill =>
      testFrameworks.includes(skill.toLowerCase())
    ) || (repo.deepSkillsRaw || []).some(raw =>
      testFrameworks.some(f => raw.skill?.toLowerCase().includes(f) || raw.source?.toLowerCase().includes(f))
    );

    if (hasTestFolder || hasTestDeps) {
      return 100;
    } else if (hasTestConfig) {
      return 80;
    }
    return 0;
  });

  return Math.round(repoScores.reduce((sum, val) => sum + val, 0) / repoScores.length);
}

/**
 * Detects CI/CD automation pipelines and Docker containerization/deployment.
 */
function calculateCicdScore(repos) {
  if (repos.length === 0) return 20;

  const repoScores = repos.map(repo => {
    const rootFiles = (repo.rootContents || []).map(f => f.name.toLowerCase());
    const isDir = (name) => (repo.rootContents || []).some(f => {
      const lower = f.name.toLowerCase();
      return (lower === name || lower.endsWith('/' + name)) && f.type === 'dir';
    });

    // CI/CD pipelines (60% weight)
    const hasCi = isDir('.github') ||
      rootFiles.some(f => {
        const base = f.split('/').pop();
        return base === '.travis.yml' ||
          base === 'circle.yml' ||
          base === 'gitlab-ci.yml' ||
          base === 'azure-pipelines.yml';
      });
    const ciScore = hasCi ? 100 : 0;

    // Containerization & Deployment (40% weight)
    const hasDeploy = rootFiles.some(f => {
      const base = f.split('/').pop();
      return base === 'dockerfile' ||
        base === 'docker-compose.yml' ||
        base === 'docker-compose.yaml' ||
        base === 'procfile' ||
        base === 'vercel.json' ||
        base === 'netlify.toml' ||
        base === 'fly.toml';
    }) || isDir('k8s') || isDir('kubernetes');
    const deployScore = hasDeploy ? 100 : 0;

    return Math.round(0.6 * ciScore + 0.4 * deployScore);
  });

  return Math.round(repoScores.reduce((sum, val) => sum + val, 0) / repoScores.length);
}

/**
 * Measures repository organization, modular structures, and separation of concerns.
 */
function calculateArchitectureScore(repos) {
  if (repos.length === 0) return 20;

  const archFolders = [
    'src', 'lib', 'app', 'components', 'services', 'controllers', 'models',
    'routes', 'utils', 'views', 'helpers', 'handlers', 'modules', 'core'
  ];

  const repoScores = repos.map(repo => {
    const isDir = (name) => (repo.rootContents || []).some(f => {
      const lower = f.name.toLowerCase();
      return (lower === name || lower.endsWith('/' + name)) && f.type === 'dir';
    });

    // Count present standard architectural folders
    const presentFolders = archFolders.filter(f => isDir(f));
    const count = presentFolders.length;

    let score = 20;
    if (count >= 5) {
      score = 100;
    } else if (count >= 3) {
      score = 80;
    } else if (count >= 1) {
      score = 50;
    } else if (isDir('src')) {
      score = 40;
    }

    // Monorepo detection
    const isMonorepo = isDir('packages') || isDir('apps');
    if (isMonorepo) {
      score = Math.min(100, score + 20);
    }

    return score;
  });

  return Math.round(repoScores.reduce((sum, val) => sum + val, 0) / repoScores.length);
}

/**
 * Evaluates development cadence, total repos, and stack diversity.
 */
function calculateActivityScore(allRepos) {
  if (allRepos.length === 0) return 0;

  // 1. Repo size score
  const totalCount = allRepos.length;
  let sizeScore = 40;
  if (totalCount >= 20) sizeScore = 100;
  else if (totalCount >= 10) sizeScore = 80;
  else if (totalCount >= 5) sizeScore = 60;
  else if (totalCount === 0) sizeScore = 0;

  // 2. Language diversity score
  const languages = new Set(allRepos.map(r => r.language).filter(Boolean));
  let diversityScore = 50;
  if (languages.size >= 4) diversityScore = 100;
  else if (languages.size === 3) diversityScore = 85;
  else if (languages.size === 2) diversityScore = 70;
  else if (languages.size === 0) diversityScore = 0;

  // 3. Update recency score
  let recent30 = 0;
  let recent90 = 0;
  let recent180 = 0;

  const now = new Date();
  allRepos.forEach(repo => {
    if (!repo.pushed_at) return;
    const diffMs = now - new Date(repo.pushed_at);
    const diffDays = diffMs / (1000 * 3600 * 24);

    if (diffDays <= 30) {
      recent30++;
    } else if (diffDays <= 90) {
      recent90++;
    } else if (diffDays <= 180) {
      recent180++;
    }
  });

  const updateScore = Math.min(100, recent30 * 30 + recent90 * 15 + recent180 * 10);

  return Math.round(0.3 * sizeScore + 0.3 * diversityScore + 0.4 * updateScore);
}

/**
 * Evaluates project database, API, auth, cloud service integration, and multi-service complexity.
 */
function calculateComplexityScore(repos) {
  if (repos.length === 0) return 20;

  const dbKeywords = ['mongodb', 'mongoose', 'pg', 'postgres', 'mysql', 'sqlite', 'redis', 'prisma', 'sequelize', 'sqlalchemy', 'gorm'];
  const apiKeywords = ['express', 'koa', 'fastify', 'graphql', 'apollo', 'nest', 'django', 'flask', 'fastapi', 'rails', 'gin', 'fiber', 'laravel', 'symfony'];
  const authKeywords = ['passport', 'jsonwebtoken', 'auth0', 'oauth', 'bcrypt', 'next-auth'];
  const cloudKeywords = ['aws-sdk', 'boto3', 'google-cloud', 'firebase', 'stripe', 'sendgrid', 'twilio'];

  const repoScores = repos.map(repo => {
    const rootFiles = (repo.rootContents || []).map(f => f.name.toLowerCase());
    const skills = (repo.deepSkills || []).map(s => s.toLowerCase());

    const hasDb = skills.some(s => dbKeywords.includes(s)) ||
      (repo.deepSkillsRaw || []).some(raw => dbKeywords.some(kw => raw.skill?.toLowerCase().includes(kw) || raw.source?.toLowerCase().includes(kw)));

    const hasApi = skills.some(s => apiKeywords.includes(s)) ||
      (repo.deepSkillsRaw || []).some(raw => apiKeywords.some(kw => raw.skill?.toLowerCase().includes(kw) || raw.source?.toLowerCase().includes(kw)));

    const hasAuth = skills.some(s => authKeywords.includes(s)) ||
      (repo.deepSkillsRaw || []).some(raw => authKeywords.some(kw => raw.skill?.toLowerCase().includes(kw) || raw.source?.toLowerCase().includes(kw)));

    const hasCloud = skills.some(s => cloudKeywords.includes(s)) ||
      (repo.deepSkillsRaw || []).some(raw => cloudKeywords.some(kw => raw.skill?.toLowerCase().includes(kw) || raw.source?.toLowerCase().includes(kw)));

    // Multi-service setup
    const hasDockerCompose = rootFiles.some(f => {
      const base = f.split('/').pop();
      return base === 'docker-compose.yml' || base === 'docker-compose.yaml';
    });
    const hasMultiLanguage = (repo.language && (repo.languages ? Object.keys(repo.languages).length > 1 : false));
    const hasMultiDeps = rootFiles.filter(f => {
      const base = f.split('/').pop();
      return base === 'package.json' || base === 'requirements.txt' || base === 'go.mod';
    }).length > 1;
    const hasMulti = hasDockerCompose || hasMultiLanguage || hasMultiDeps;

    return (hasDb ? 25 : 0) + (hasApi ? 25 : 0) + (hasAuth ? 20 : 0) + (hasCloud ? 20 : 0) + (hasMulti ? 10 : 0);
  });

  const peakComplexity = Math.max(...repoScores);
  const averageComplexity = repoScores.reduce((sum, val) => sum + val, 0) / repoScores.length;

  return Math.round(0.7 * peakComplexity + 0.3 * averageComplexity);
}

/**
 * Generates structured, recruiter-friendly strength texts based on quality dimension breakdowns.
 */
function detectStrengths(breakdown) {
  const strengths = [];

  if (breakdown.documentation >= 75) {
    strengths.push("Strong repository documentation with clear project setup instructions.");
  }
  if (breakdown.testing >= 70) {
    strengths.push("Demonstrated adoption of automated testing practices (e.g. Jest, Pytest).");
  }
  if (breakdown.cicd >= 70) {
    strengths.push("Consistent CI/CD pipeline automation and deployment configs.");
  }
  if (breakdown.architecture >= 75) {
    strengths.push("Highly organized codebases with clear separation of concerns.");
  }
  if (breakdown.activity >= 75) {
    strengths.push("Diverse project portfolio with consistent development updates.");
  }
  if (breakdown.complexity >= 75) {
    strengths.push("Capable of building production-grade complex architectures (databases, APIs, authentication).");
  }

  // Fallback if no specific strengths detected
  if (strengths.length === 0) {
    strengths.push("Demonstrated foundational understanding of general software development practices.");
  }

  return strengths;
}

/**
 * Generates structured, recruiter-friendly weakness texts based on quality dimension breakdowns.
 */
function detectWeaknesses(breakdown) {
  const weaknesses = [];

  if (breakdown.documentation < 50) {
    weaknesses.push("Repositories lack structured README files or installation instructions.");
  }
  if (breakdown.testing < 40) {
    weaknesses.push("Limited evidence of automated testing setup in key repositories.");
  }
  if (breakdown.cicd < 40) {
    weaknesses.push("Few or no CI/CD automation pipelines or container configs identified.");
  }
  if (breakdown.architecture < 50) {
    weaknesses.push("Flat repository layouts with minimal directory organization.");
  }
  if (breakdown.activity < 50) {
    weaknesses.push("Low recent code updates or project updates in the past 6 months.");
  }
  if (breakdown.complexity < 50) {
    weaknesses.push("Portfolio projects focus on single-file setups or low-complexity utilities.");
  }

  // Fallback if no specific weaknesses detected
  if (weaknesses.length === 0) {
    weaknesses.push("No major technical or documentation hygiene issues identified.");
  }

  return weaknesses;
}
