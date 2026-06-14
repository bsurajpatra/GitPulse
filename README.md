# GitHub Analytics Desktop Application

A production-ready desktop application built with Electron, React, and Express to provide deep insights into your GitHub presence.

## 🚀 Features

- **GitHub OAuth Login**: Secure authentication via GitHub's official OAuth flow.
- **Dynamic Dashboard**: Real-time analytics of your repositories, stars, and languages.
- **Interactive Visualizations**: Beautiful charts powered by Recharts.
- **Local Persistence**: Securely stores your access token locally using `electron-store`.
- **Production Ready**: Optimized Electron main and renderer processes.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Recharts, Lucide Icons, Vanilla CSS (Premium Custom Styles).
- **Desktop Strategy**: Electron, Preload Scripts (Context Isolation & Security).
- **Backend (Local)**: Node.js, Express (OAuth Server).
- **API**: @octokit/rest (GitHub REST API).

## 📦 Setup Instructions

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- Git
- A GitHub account

### 2. GitHub OAuth App Configuration
1. Go to your [GitHub Settings > Developer Settings > OAuth Apps](https://github.com/settings/developers).
2. Click **New OAuth App**.
3. Fill in the details:
   - **Application Name**: `GitHub Analytics Desktop`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/callback`
4. Register the application.
5. Generate a **Client Secret**.

### 3. Environment Variables
Create a `.env` file in the root directory (one is provided as a template) and fill in your credentials:

```env
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
PORT=3000
GITHUB_REDIRECT_URI=http://localhost:3000/callback
```

### 4. Installation
```bash
# Install dependencies for both root and renderer
npm install
```

### 5. Running the Application
```bash
# Run in development mode
npm run dev
```

### 6. Building for Production
To generate a Windows `.exe`:
```bash
npm run build
```
The output will be in the `/dist` directory.

## 📂 Architecture

- `/main`: Electron main process and window management.
- `/renderer`: React application source and assets.
- `/server`: Express server for handling OAuth callbacks.
- `/services`: Interface with GitHub's REST API.
- `/analytics`: Data processing and stats calculation logic.
- `/store`: Local storage configuration for tokens.

## 🔒 Security
- **No Client Secrets in Frontend**: All sensitive exchanges happen in the secure Node.js environment.
- **Context Isolation**: Enabled in Electron to prevent renderer hijacking.
- **Environment Variables**: Used for all sensitive configuration.

---
Created by Antigravity AI
