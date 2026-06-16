/**
 * @file analysis.service.js
 * @description Core service coordinating user profile fetching, background worker thread analysis, and formatting.
 *              Includes optimizations: parallel fetching, repository dependency caching, and final result caching.
 * @module services/analysis.service
 */

import GitHubService from './github.service.js';
import { Worker } from 'worker_threads';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { formatAnalysisResult } from '../analytics/resultFormatter.js';
import { getCachedData, setCachedData } from '../store/cacheStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Dependency → Skill mapping
// Maps package/module names from popular package managers to normalized skills
// ============================================================================
const DEP_TO_SKILL = {
  // React ecosystem
  "react": "React",
  "react-dom": "React",
  "react-router": "React",
  "react-router-dom": "React",
  "react-scripts": "React",
  "create-react-app": "React",
  "@testing-library/react": "React",
  "react-query": "React",
  "react-hook-form": "React",
  "react-redux": "Redux",
  "@reduxjs/toolkit": "Redux",
  "redux": "Redux",
  "redux-saga": "Redux",
  "redux-thunk": "Redux",

  // Next.js
  "next": "Next.js",

  // Vue ecosystem
  "vue": "Vue.js",
  "@vue/cli": "Vue.js",
  "nuxt": "Vue.js",

  // Angular ecosystem
  "@angular/core": "Angular",
  "@angular/cli": "Angular",

  // Svelte
  "svelte": "Svelte",
  "@sveltejs/kit": "Svelte",

  // Styling
  "sass": "Sass",
  "node-sass": "Sass",
  "tailwindcss": "Tailwind CSS",
  "@tailwindcss/forms": "Tailwind CSS",

  // Build tools
  "webpack": "Webpack",
  "webpack-cli": "Webpack",
  "vite": "Vite",
  "@vitejs/plugin-react": "Vite",

  // Backend - Node.js
  "express": "Express",
  "express-validator": "Express",
  "koa": "Node.js",
  "fastify": "Node.js",
  "hapi": "Node.js",
  "@nestjs/core": "NestJS",
  "@nestjs/common": "NestJS",
  "nest": "NestJS",

  // GraphQL
  "graphql": "GraphQL",
  "apollo-server": "GraphQL",
  "@apollo/server": "GraphQL",
  "@apollo/client": "GraphQL",
  "graphql-yoga": "GraphQL",
  "type-graphql": "GraphQL",

  // TypeScript
  "typescript": "TypeScript",
  "ts-node": "TypeScript",
  "ts-jest": "TypeScript",
  "@types/node": "TypeScript",

  // Databases - MongoDB
  "mongoose": "MongoDB",
  "mongodb": "MongoDB",

  // Databases - SQL / PostgreSQL
  "pg": "PostgreSQL",
  "pg-hstore": "PostgreSQL",
  "sequelize": "PostgreSQL",
  "typeorm": "PostgreSQL",
  "knex": "PostgreSQL",
  "prisma": "PostgreSQL",
  "@prisma/client": "PostgreSQL",

  // MySQL
  "mysql": "MySQL",
  "mysql2": "MySQL",

  // Redis
  "redis": "Redis",
  "ioredis": "Redis",

  // SQLite
  "better-sqlite3": "SQLite",
  "sqlite3": "SQLite",

  // Cloud / DevOps
  "@aws-sdk/client-s3": "AWS",
  "@aws-sdk/client-dynamodb": "AWS",
  "aws-sdk": "AWS",
  "@google-cloud/storage": "Google Cloud",

  // Testing
  "jest": "JavaScript",
  "mocha": "JavaScript",
  "chai": "JavaScript",

  // HTTP / REST
  "axios": "REST API",
  "node-fetch": "REST API",
  "supertest": "REST API",
  "got": "REST API",

  // Python packages → skills
  "django": "Django",
  "flask": "Flask",
  "fastapi": "FastAPI",
  "sqlalchemy": "PostgreSQL",
  "psycopg2": "PostgreSQL",
  "pymongo": "MongoDB",
  "redis-py": "Redis",
  "boto3": "AWS",
  "tensorflow": "Python",
  "torch": "Python",
  "numpy": "Python",
  "pandas": "Python",
  "scikit-learn": "Python",

  // Ruby
  "rails": "Ruby on Rails",
  "sinatra": "Ruby",
  "activerecord": "Ruby on Rails",

  // Go modules (detected by module name patterns)
  "gin": "Go",
  "fiber": "Go",
  "echo": "Go",
  "gorm": "Go",

  // PHP
  "laravel": "Laravel",
  "symfony": "PHP",
};

// Files we scan in each repo root
const DEPENDENCY_FILES = [
  'package.json',
  'requirements.txt',
  'Pipfile',
  'Gemfile',
  'go.mod',
  'pom.xml',
  'composer.json',
  'cargo.toml',
];

class AnalysisService {
  /**
   * Orchestrates the Job Fit Analysis pipeline:
   * 1. Checks Cache for prior matches of this user & JD combination.
   * 2. Fetches public user profile and repositories.
   * 3. Deep-scans dependency files for framework/library signals in parallel.
   * 4. Extracts README and bio text signals.
   * 5. Delegates CPU-bound skill extraction and matching to a background Worker Thread.
   * 6. Formats raw engine metrics into strengths, weaknesses, and match scores.
   *
   * @param {string} username - Target GitHub username to analyze.
   * @param {string} jobDescription - Raw Job Description text.
   * @param {string|null} [token=null] - Optional GitHub OAuth token to raise API limits.
   * @returns {Promise<Object>} Final structured analysis and candidate profile.
   */
  async analyzeJobFit(username, jobDescription, token = null) {
    if (!username || typeof username !== 'string' || username.trim() === '') {
      throw new Error("GitHub username is required and cannot be empty.");
    }
    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim() === '') {
      throw new Error("Job Description is required and cannot be empty.");
    }

    const cleanedUsername = username.trim().toLowerCase();
    const jdHash = crypto.createHash('md5').update(jobDescription).digest('hex');
    const finalCacheKey = `final_analysis_${cleanedUsername}_${jdHash}`;

    // Optimization: Check for cached final analysis result
    const cachedResult = getCachedData(finalCacheKey);
    if (cachedResult) {
      console.log(`[Cache Hit] Returning cached analysis for ${username}`);
      return cachedResult;
    }

    const githubService = new GitHubService(token);

    // 1. Fetch public profile, public repositories, and profile README in parallel
    const [profile, repos, profileReadme] = await Promise.all([
      githubService.getUserByUsername(username),
      githubService.getRepositoriesByUsername(username),
      githubService.getProfileReadme(username)
    ]);

    // Optimization: Smarter Repo Selection
    // - Filter out empty/archived/disabled repos
    // - Prioritize owner-created (non-forked) repositories
    // - Sort by pushed_at date (more relevant content signal than updated_at)
    const sortedRepos = [...repos]
      .filter(repo => !repo.disabled && repo.size > 0)
      .sort((a, b) => {
        // Prioritize non-forks
        if (a.fork !== b.fork) {
          return a.fork ? 1 : -1;
        }
        // Then by last pushed_at date
        return new Date(b.pushed_at) - new Date(a.pushed_at);
      });

    // Deep scan top 12 repositories (increased from 10)
    const topRepos = sortedRepos.slice(0, 12);

    // Optimization: Run enrichment in parallel
    const enrichedRepos = await Promise.all(
      topRepos.map(repo => this.enrichRepoWithDependencies(githubService, repo))
    );

    // Combine enriched top repos with the rest (unenriched)
    const remainingRepos = repos.filter(r => !topRepos.find(t => t.id === r.id));
    const allRepos = [...enrichedRepos, ...remainingRepos];

    // Inject profile README and profile Bio to first repo under __extra__
    if (allRepos.length > 0) {
      allRepos[0].__extra__ = {
        bio: profile.bio || null,
        readmeText: profileReadme || null
      };
    }

    // 2. Offload CPU-bound calculations to Worker Thread
    const rawMatchResult = await this.runWorkerAnalysis(allRepos, jobDescription);

    // 3. Format result
    const formattedResult = formatAnalysisResult(rawMatchResult.match);

    const finalResult = {
      profile: {
        login: profile.login,
        name: profile.name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        public_repos: profile.public_repos,
        followers: profile.followers,
        following: profile.following
      },
      role: rawMatchResult.role,
      experience: rawMatchResult.experience,
      jdSkills: rawMatchResult.jdSkills,
      profileSkills: rawMatchResult.profileSkills,
      evidenceMap: rawMatchResult.evidenceMap,
      ...formattedResult,
      quality: rawMatchResult.quality || null
    };

    // Cache the final structured result
    setCachedData(finalCacheKey, finalResult);

    return finalResult;
  }

  /**
   * Fetches dependency files from a repo root and subfolders, and maps known packages to skills.
   * Uses repository ID and pushed_at date for precise dependency resolution caching.
   */
  async enrichRepoWithDependencies(githubService, repo) {
    const owner = repo.owner?.login || repo.full_name?.split('/')[0];
    if (!owner) return repo;

    const cacheKey = `repo_deps_${repo.id}_${repo.pushed_at}`;
    const cachedDeps = getCachedData(cacheKey);

    if (cachedDeps && !Array.isArray(cachedDeps) && cachedDeps.rootContents && cachedDeps.readmeText !== undefined) {
      return {
        ...repo,
        deepSkills: cachedDeps.deepSkills || [],
        deepSkillsRaw: cachedDeps.deepSkillsRaw || [],
        rootContents: cachedDeps.rootContents || [],
        readmeText: cachedDeps.readmeText || null
      };
    }

    const deepSkills = new Set();
    const deepSkillsRaw = [];

    // Try to get root contents listing
    const rootContents = await githubService.getRepoRootContents(owner, repo.name);
    const rootFileNames = rootContents.map(f => f.name.toLowerCase());

    // Extract directory listing metadata for quality analysis
    const files = rootContents.map(f => ({
      name: f.name,
      type: f.type // "file" or "dir"
    }));

    // Common subdirectories to scan in depth for production layouts
    const SUBFOLDERS_TO_SCAN = ['client', 'server', 'frontend', 'backend', 'packages', 'apps', 'api', 'app', 'src'];
    const subdirs = rootContents.filter(f => f.type === 'dir' && SUBFOLDERS_TO_SCAN.includes(f.name.toLowerCase()));

    // Fetch subfolder listings in parallel to avoid API blocks
    const subdirContentsList = await Promise.all(
      subdirs.map(async (dir) => {
        const contents = await githubService.getRepoContents(owner, repo.name, dir.path);
        return { dir, contents };
      })
    );

    // Track present dependency files (root + subfolders)
    const presentFiles = [];
    
    // Add root dependency files
    DEPENDENCY_FILES.forEach(depFile => {
      if (rootFileNames.includes(depFile.toLowerCase())) {
        presentFiles.push(depFile);
      }
    });

    // Add subfolder files and merge folder metadata
    subdirContentsList.forEach(({ dir, contents }) => {
      contents.forEach(f => {
        const relativePath = `${dir.name}/${f.name}`;
        files.push({
          name: relativePath,
          type: f.type
        });

        if (DEPENDENCY_FILES.includes(f.name.toLowerCase())) {
          presentFiles.push(relativePath);
        }
      });
    });

    // Find and fetch README content if present in root
    const readmeFile = rootContents.find(f => f.type === 'file' && f.name.toLowerCase().startsWith('readme'));
    let readmeText = null;
    if (readmeFile) {
      readmeText = await githubService.getFileContents(owner, repo.name, readmeFile.name);
    }

    // Fetch all present dependency files in parallel
    const fetchedFiles = await Promise.all(
      presentFiles.map(async (depFile) => {
        const content = await githubService.getFileContents(owner, repo.name, depFile);
        return { depFile, content };
      })
    );

    for (const { depFile, content } of fetchedFiles) {
      if (!content) continue;
      const filename = depFile.split('/').pop();
      const parsedItems = this.parseDepFile(filename, content);
      parsedItems.forEach(item => {
        deepSkills.add(item.skill);
        deepSkillsRaw.push({
          skill: item.skill,
          file: depFile,
          source: item.source
        });
      });
    }

    const deepSkillsArray = Array.from(deepSkills);
    
    // Save to Cache
    setCachedData(cacheKey, {
      deepSkills: deepSkillsArray,
      deepSkillsRaw,
      rootContents: files,
      readmeText
    });

    return {
      ...repo,
      deepSkills: deepSkillsArray,
      deepSkillsRaw,
      rootContents: files,
      readmeText
    };
  }

  /**
   * Parses a dependency file and extracts known skill signals.
   * Returns array of { skill, source } matches.
   */
  parseDepFile(filename, content) {
    const matches = [];

    try {
      const lowerFile = filename.toLowerCase();
      if (lowerFile === 'package.json') {
        const json = JSON.parse(content);
        const allDeps = {
          ...json.dependencies,
          ...json.devDependencies,
          ...json.peerDependencies,
        };
        for (const pkg of Object.keys(allDeps)) {
          const skill = DEP_TO_SKILL[pkg.toLowerCase()];
          if (skill) {
            matches.push({ skill, source: pkg });
          }
        }

        // Also check scripts for framework signals
        const scripts = JSON.stringify(json.scripts || '').toLowerCase();
        if (scripts.includes('react-scripts') || scripts.includes('react-app')) {
          matches.push({ skill: 'React', source: 'npm script: react-scripts' });
        }
        if (scripts.includes('next')) {
          matches.push({ skill: 'Next.js', source: 'npm script: next' });
        }
        if (scripts.includes('vue-cli') || scripts.includes('nuxt')) {
          matches.push({ skill: 'Vue.js', source: 'npm script: vue/nuxt' });
        }
        if (scripts.includes('ng ')) {
          matches.push({ skill: 'Angular', source: 'npm script: ng' });
        }

      } else if (lowerFile === 'requirements.txt' || lowerFile === 'pipfile') {
        const lines = content.split('\n');
        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine || cleanLine.startsWith('#')) continue;
          const pkg = cleanLine.split('==')[0].split('>=')[0].split('<=')[0].trim().toLowerCase();
          const skill = DEP_TO_SKILL[pkg];
          if (skill) {
            matches.push({ skill, source: pkg });
          }
        }
        matches.push({ skill: 'Python', source: 'python environment' });

      } else if (lowerFile === 'gemfile') {
        const gemMatches = content.match(/gem\s+['"]([^'"]+)['"]/gi) || [];
        for (const match of gemMatches) {
          const gemName = match.replace(/gem\s+['"]/i, '').replace(/['"]/, '').trim().toLowerCase();
          const skill = DEP_TO_SKILL[gemName];
          if (skill) {
            matches.push({ skill, source: gemName });
          }
        }
        matches.push({ skill: 'Ruby', source: 'ruby environment' });

      } else if (lowerFile === 'go.mod') {
        matches.push({ skill: 'Go', source: 'go environment' });
        const requireMatches = content.match(/require\s+([^\s]+)/g) || [];
        for (const match of requireMatches) {
          const mod = match.replace('require ', '').split('/').pop().toLowerCase();
          const skill = DEP_TO_SKILL[mod];
          if (skill) {
            matches.push({ skill, source: mod });
          }
        }

      } else if (lowerFile === 'pom.xml') {
        matches.push({ skill: 'Java', source: 'maven project' });
        if (content.includes('spring-boot')) {
          matches.push({ skill: 'Spring Boot', source: 'dependency: spring-boot' });
        }
        if (content.includes('hibernate')) {
          matches.push({ skill: 'PostgreSQL', source: 'dependency: hibernate' });
        }

      } else if (lowerFile === 'composer.json') {
        matches.push({ skill: 'PHP', source: 'composer project' });
        if (content.includes('laravel')) {
          matches.push({ skill: 'Laravel', source: 'dependency: laravel' });
        }

      } else if (lowerFile === 'cargo.toml') {
        matches.push({ skill: 'Rust', source: 'cargo project' });
      }
    } catch (e) {
      // Silently skip malformed files
    }

    return matches;
  }

  /**
   * Instantiates the worker thread to execute parsing and matching logic in the background.
   */
  runWorkerAnalysis(repos, jobDescription) {
    return new Promise((resolve, reject) => {
      const workerPath = path.join(__dirname, '../main/worker.js');
      const worker = new Worker(workerPath, {
        workerData: { repos, jobDescription }
      });

      worker.on('message', (result) => resolve(result));
      worker.on('error', (err) => reject(err));
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker thread exited with code ${code}`));
        }
      });
    });
  }
}

export default new AnalysisService();
