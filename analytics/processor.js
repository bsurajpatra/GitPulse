const computeAnalytics = (repos) => {
  if (!repos || repos.length === 0) {
    return {
      totalStars: 0,
      mostStarredRepo: null,
      mostUsedLanguage: "N/A",
      recentlyUpdated: null,
      repoCount: 0,
      languageDistribution: [],
      starsStats: []
    };
  }

  // Basic stats
  const totalStars = repos.reduce((acc, repo) => acc + (repo.stargazers_count || 0), 0);
  const repoCount = repos.length;
  
  // Sorting for most starred and recently updated
  const sortedByStars = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count);
  const mostStarredRepo = sortedByStars[0];
  
  const sortedByUpdate = [...repos].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  const recentlyUpdated = sortedByUpdate[0];

  // Language distribution
  const languageMap = {};
  repos.forEach(repo => {
    if (repo.language) {
      languageMap[repo.language] = (languageMap[repo.language] || 0) + 1;
    }
  });

  const languageDistribution = Object.entries(languageMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const mostUsedLanguage = languageDistribution[0]?.name || "N/A";

  // Stars stats for top 10 repos (for bar chart)
  const starsStats = sortedByStars.slice(0, 10).map(repo => ({
    name: repo.name,
    stars: repo.stargazers_count
  }));

  return {
    totalStars,
    mostStarredRepo,
    mostUsedLanguage,
    recentlyUpdated,
    repoCount,
    languageDistribution,
    starsStats
  };
};

export default computeAnalytics;
