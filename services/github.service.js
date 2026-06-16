import { Octokit } from "@octokit/rest";

class GitHubService {
  constructor(token = null) {
    this.octokit = new Octokit(token ? { auth: token } : {});
  }

  async getUserProfile() {
    const { data } = await this.octokit.rest.users.getAuthenticated();
    return data;
  }

  async getUserRepositories() {
    const repos = await this.octokit.paginate(this.octokit.rest.repos.listForAuthenticatedUser, {
      per_page: 100,
      sort: "updated",
    });
    return repos;
  }

  async getUserByUsername(username) {
    try {
      const { data } = await this.octokit.rest.users.getByUsername({ username });
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch user profile for "${username}": ${error.message}`);
    }
  }

  async getRepositoriesByUsername(username) {
    try {
      const repos = await this.octokit.paginate(this.octokit.rest.repos.listForUser, {
        username,
        per_page: 100,
        type: "owner",
      });
      return repos;
    } catch (error) {
      throw new Error(`Failed to fetch repositories for "${username}": ${error.message}`);
    }
  }

  // Advanced Stats Fetching
  async getRepoLanguages(owner, repo) {
    try {
      const { data } = await this.octokit.rest.repos.listLanguages({ owner, repo });
      return data;
    } catch (error) {
      console.warn(`Could not fetch languages for ${repo}:`, error.message);
      return {};
    }
  }

  async getCommitActivity(owner, repo) {
    try {
      const response = await this.octokit.rest.repos.getCommitActivityStats({ owner, repo });
      if (response.status === 202) {
        // GitHub is computing stats, skip for this run to avoid blocking
        return [];
      }
      return response.data || [];
    } catch (error) {
      return [];
    }
  }

  async getCodeFrequency(owner, repo) {
    try {
      const response = await this.octokit.rest.repos.getCodeFrequencyStats({ owner, repo });
      if (response.status === 202) return [];
      return response.data || [];
    } catch (error) {
      return [];
    }
  }

  async getRecentCommits(owner, repo) {
    try {
      const { data } = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        per_page: 50
      });
      return data.map(c => c.commit.author.date);
    } catch (error) {
      return [];
    }
  }

  async getRepoDetailsAdvanced(owner, repo) {
    try {
      const [commits, languages, freq, recent] = await Promise.all([
        this.getCommitActivity(owner, repo),
        this.getRepoLanguages(owner, repo),
        this.getCodeFrequency(owner, repo),
        this.getRecentCommits(owner, repo)
      ]);
      return { commits, languages, freq, recent };
    } catch (error) {
      return { commits: [], languages: {}, freq: [], recent: [] };
    }
  }

  async getUserContributionCalendar(username) {
    const query = `
      query($userName:String!) {
        user(login: $userName){
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  contributionCount
                  date
                }
              }
            }
          }
        }
      }
    `;
    try {
      const response = await this.octokit.graphql(query, { userName: username });
      return response.user.contributionsCollection.contributionCalendar;
    } catch (error) {
      console.warn("GraphQL error:", error.message);
      return null;
    }
  }

  async getRepoContents(owner, repo, path = "") {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return [];
    }
  }

  async getRepoRootContents(owner, repo) {
    return this.getRepoContents(owner, repo, "");
  }

  async getFileContents(owner, repo, path) {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });
      if (data && data.content && data.encoding === 'base64') {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async getProfileReadme(username) {
    try {
      // 1. Try owner/owner repository README (standard GitHub profile README)
      const { data } = await this.octokit.rest.repos.getReadme({
        owner: username,
        repo: username
      });
      if (data && data.content && data.encoding === 'base64') {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
    } catch (error) {
      // Fallback
    }

    try {
      // 2. Try owner/.github repository README (alternative fallback)
      const { data } = await this.octokit.rest.repos.getReadme({
        owner: username,
        repo: '.github'
      });
      if (data && data.content && data.encoding === 'base64') {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }
    } catch (error) {
      // ignore
    }
    return null;
  }
}

export default GitHubService;
