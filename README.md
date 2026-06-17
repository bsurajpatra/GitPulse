# GitMatch

**GitMatch** is a production-ready Electron desktop application that analyzes candidate GitHub profiles against job descriptions. It calculates a unified **Final Candidate Score** powered by a **Weighted Job Fit Engine** and an independent **Engineering Quality Engine**. The app features concurrent bulk candidate screening, deep-scan subdirectory parsing (supporting MERN/monorepos), local caching, and a responsive background worker thread pipeline.

> Built for recruiters, hiring managers, and engineering leaders who want an instant, data-driven assessment of candidate capability and stack alignment.

---

## ✨ Features

- **GitHub OAuth Login** — Secure authentication via GitHub's official OAuth 2.0 flow.
- **Weighted Job Fit Engine** — Parses Job Descriptions (JDs) to normalize critical skill requirements (summing to 100) and calculates compatibility scaled by project confidence.
- **Candidate Quality Engine** — Evaluates candidate engineering hygiene independently from job fit. It grades the profile across 6 key dimensions:
  1. **Documentation** (README length, headings structure, installation setup, usage examples).
  2. **Testing Practices** (Presence of tools like Jest/Pytest and folders like `tests/` or `spec/` at any depth).
  3. **CI/CD & Deployment** (GitHub Actions workflows and Docker containerization/deployment configs).
  4. **Architecture Signals** (Modular layouts, separation of concerns directories, monorepos).
  5. **Activity Signals** (Commit cadence, repository counts, language diversity).
  6. **Complexity & Tech Depth** (Maturity index for databases, web APIs, auth, cloud SDK integrations).
- **Final Candidate Score** — Combines Job Fit (70%) and Engineering Quality (30%) into a unified rating:
  $$\text{Final Score} = 0.7 \times \text{Job Fit Score} + 0.3 \times \text{Quality Score}$$
- **Score Justification & Explanations** — Compiles detailed fit and gap explanations (e.g. *Strong React evidence (+23% fit contribution)* or *Missing critical skill: AWS*).
- **Subdirectory Scanning (MERN & Monorepos)** — Recursively scans directories (like `client`, `server`, `frontend`, `packages`) for packages, Dockerfiles, and test setups, making evaluation accurate for complex production-grade projects.
- **Bulk Candidate Screening** — Screen lists of GitHub profiles in parallel, displaying a sortable comparison table containing Rank, Candidate, Job Fit, Quality, and Final Score metrics.
- **Candidate Comparison Engine** — Select candidates from screening runs for interactive side-by-side comparison, analyzing shared core skills, candidate-specific unique skills, confidence signal strengths, and engineering hygiene grids.
- **Offline PDF Report Exports** — Export professional, recruiter-ready evaluation sheets completely offline:
  - **Candidate Report**: Full profile compatible metrics, missing gap signals, and recruiter recommendations.
  - **Screening Summary**: Detailed ranks list, overall pool stats, and recommendations highlight card.
  - **Comparison Sheet**: Dynamic side-by-side comparative matrices.
- **High-Density Scaling** — Fluid screen grids that auto-wrap card rows and simplify headers for clean, overflow-free comparison dashboards (supporting up to 29+ profiles simultaneously) with custom-styled horizontal scrollbars.
- **Reports History Directory** — Persists local reports with search filters, reopening, and secure double-confirmation delete modals.
- **Onboarding Welcome Dashboard** — Premium welcome hero panel guiding new users through screening options.
- **Dual Themes (Dark & Light Mode)** — Seamless toggle between the premium High-Contrast Dark UI and a soft cream Light Mode.
- **Isolated Worker Thread** — CPU-intensive extraction, scoring, and evaluation logic run inside a background Worker thread to keep the main UI fluid and responsive.

---

## 🔬 How It Works

```
GitHub Username(s) + Job Description
         ↓
  1. Fetch public profile & repo metadata (GitHub API)
         ↓
  2. Deep scan top 12 repos (and common subfolders) for file listings,
     README contents, and dependency files (package.json, requirements.txt ...)
         ↓
  3. Worker Thread Pipeline:
     ├─ Parse JD for required roles, experience, and skill priorities (weights)
     ├─ Extract candidate skills & project confidence mappings
     ├─ Calculate Weighted Match Score (Job Fit) & Engineering Quality (Hygiene)
     └─ Combine scores into Final Candidate Score (70% Fit + 30% Quality)
         ↓
  4. Generate recruiter-friendly score justifications, strengths, and weaknesses
         ↓
       Results Page / Bulk Screening Table
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Desktop Shell** | Electron 29, Context Isolation Preload Bridge |
| **Frontend UI** | React 18, React Router DOM, Vite |
| **Styling** | Vanilla CSS, HSL Theming, Light/Dark Modes, Google Fonts (Inter, Barlow) |
| **Icons** | Lucide React |
| **Backend API** | Node.js, Express (OAuth server) |
| **GitHub Client** | @octokit/rest (REST endpoints + GraphQL calendar queries) |
| **Concurrency** | Worker Threads (CPU offloading), `p-limit` (parallel API throttling) |
| **Storage & Cache** | electron-store (local JSON store), local memory TTL cache |
| **PDF Generation** | PDFKit (offline vector layout engine) |

---

## 📦 Setup Instructions

### 1. Prerequisites
- **Node.js** v18 or higher
- **Git**
- A **GitHub developer account**

### 2. GitHub OAuth App Configuration
1. Navigate to [GitHub Settings → Developer Settings → OAuth Apps](https://github.com/settings/developers).
2. Click **New OAuth App** and register:
   - **Application Name**: `GitMatch`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization Callback URL**: `http://localhost:3000/callback`
3. Generate a **Client Secret** and copy it.

### 3. Environment Variables
Create a `.env` file in the project root:
```env
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
PORT=3000
GITHUB_REDIRECT_URI=http://localhost:3000/callback
```

### 4. Installation
```bash
npm install
```
This automatically triggers the post-install setup for the Vite renderer workspace.

### 5. Running in Development
```bash
npm run dev
```
Launches the Vite dev server (host: `localhost:5173`) and spins up the Electron desktop wrapper concurrently.

### 6. Packaging for Production
```bash
npm run build
```
Compiles assets and packages the app into a distributable installer executable inside `/dist`.

---

## 📂 Project Structure

```
GitMatch/
├── main/
│   ├── main.js                  # Electron main process & IPC endpoints
│   ├── preload.js               # Context bridge API definitions
│   └── worker.js                # Background thread orchestrating analysis
├── renderer/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # Hero dashboard onboarding
│   │   │   ├── Home.jsx         # Single Candidate form (aligned layout)
│   │   │   ├── BulkScreening.jsx# Multi-profile list screening
│   │   │   ├── CandidateComparison.jsx # Side-by-side candidate comparison dashboard
│   │   │   ├── Reports.jsx      # Historical reports list & delete modal
│   │   │   ├── Results.jsx      # Three-column scorecard & quality breakdown
│   │   │   └── Settings.jsx     # Config, token storage, and theme switcher
│   │   ├── components/
│   │   │   ├── Sidebar.jsx      # Navigation sidebar (highlight synchronization)
│   │   │   ├── MatchedSkills.jsx# Evidence-backed matched skill pills
│   │   │   ├── MissingSkills.jsx# Prioritized missing requirement tags
│   │   │   └── ...
│   │   ├── App.jsx              # Main routing and store sync shell
│   │   └── index.css            # Soft cream Light / High-contrast Dark theme system
│   └── index.html
├── analytics/
│   ├── jdParser.js              # JD parser (roles, experience, skills)
│   ├── profileSkillExtractor.js # Multi-signal project scan extractor
│   ├── matchEngine.js           # Flat and weighted skill coverage calculator
│   ├── weightedScoringEngine.js # Normalizes required weights based on context
│   ├── candidateQualityEngine.js# Evaluates candidate quality across 6 key metrics
│   ├── confidenceCalculator.js  # Calculates project signal source strengths
│   ├── evidenceEngine.js        # Compiles structured evidence matching paths
│   ├── candidateRanker.js       # Ranks candidates by Final Score (70/30)
│   └── processor.js             # CPU worker entry: triggers fit & quality analysis
├── services/
│   ├── github.service.js        # Octokit API client wrapper (REST & GraphQL)
│   ├── analysis.service.js      # Fetching, subdirectory scanning & cache coordination
│   ├── bulkCandidateAnalysis.js # Concurrency-controlled bulk analysis orchestrator
│   └── pdfReportService.js      # Offline-ready PDF document coordinator and streamer
├── utils/
│   └── pdfTemplates/
│       ├── candidateReport.js   # Single Candidate Evaluation PDF template
│       ├── screeningReport.js   # Bulk Candidate Screening Report PDF template
│       └── comparisonReport.js  # Candidate Comparison Report PDF template
├── server/
│   └── index.js                 # Express OAuth token server
└── store/
    ├── index.js                 # electron-store schema persistence
    └── cacheStore.js            # Memory TTL cache mapping
```

---

## 🔒 Security

- **No Frontend Secrets** — OAuth swaps are restricted to the Node.js main process.
- **Context Isolation** — The renderer process has no direct Node.js API access, bridged exclusively via context-restricted preload channels.
- **Preload Isolation** — Inter-process channels are strictly whitelisted and validated.

---

## 📄 License

MIT
