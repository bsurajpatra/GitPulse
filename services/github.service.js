import { Octokit } from "@octokit/rest";

class GitHubService {
  constructor(token) {
    this.octokit = new Octokit({
      auth: token,
    });
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
}

export default GitHubService;
