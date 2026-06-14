const calculateRepoHealth = (repo, stats) => {
  // 1. Maintenance Score (40%) - Focus on Recency
  let maintenanceScore = 0;
  const lastUpdate = new Date(repo.updated_at);
  const now = new Date();
  const diffDays = Math.ceil((now - lastUpdate) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 7) maintenanceScore = 100;
  else if (diffDays <= 30) maintenanceScore = 80;
  else if (diffDays <= 90) maintenanceScore = 50;
  else if (diffDays <= 180) maintenanceScore = 20;

  // 2. Activity Score (30%) - Focus on Volume
  const weekStats = stats.commits || [];
  const recentCommits = weekStats.slice(-4).reduce((acc, w) => acc + (w.total || 0), 0);
  let activityScore = Math.min(100, recentCommits * 10); // 10 commits/month is healthy

  // 3. Community Score (30%) - Focus on Engagement
  const stars = repo.stargazers_count || 0;
  const forks = repo.forks_count || 0;
  const watchers = repo.watchers_count || 0;
  let communityScore = Math.min(100, (stars * 2) + (forks * 5) + (watchers * 2));

  // 4. Trend (Growth)
  const isGrowing = forks > (stars * 0.2); // Just an indicator

  const finalScore = Math.round(
    (maintenanceScore * 0.4) + 
    (activityScore * 0.3) + 
    (communityScore * 0.3)
  );

  return { 
    finalScore, 
    maintenanceScore, 
    activityScore, 
    communityScore,
    isGrowing
  };
};

const getHealthReport = (repos, allStats) => {
  return repos.map(repo => {
    const stats = allStats[repo.id] || {};
    const health = calculateRepoHealth(repo, stats);
    return {
      repo_id: repo.id,
      name: repo.name,
      score: health.finalScore,
      details: health
    };
  }).sort((a, b) => b.score - a.score);
};

export default getHealthReport;
