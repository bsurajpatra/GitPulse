const computeContributionStats = (reposWithStats) => {
  const heatmapData = Array(52 * 7).fill(null).map(() => ({ count: 0 }));
  let totalCommits = 0;
  let activeMonthsSet = new Set();

  reposWithStats.forEach(({ commits }) => {
    if (!commits || !Array.isArray(commits)) return;

    commits.forEach((week, wIndex) => {
      if (wIndex >= 52) return;
      if (!week.days) return;

      const weekTotal = week.days.reduce((a, b) => a + b, 0);
      totalCommits += weekTotal;

      if (weekTotal > 0) {
        const monthIndex = new Date(week.start * 1000).getMonth();
        activeMonthsSet.add(monthIndex);
      }

      week.days.forEach((count, dIndex) => {
        const globalIndex = (wIndex * 7) + dIndex;
        if (globalIndex < heatmapData.length) {
          heatmapData[globalIndex].count += count;
        }
      });
    });
  });

  // Calculate streaks in a single linear pass over the aggregated daily data
  let currentStreak = 0;
  let longestStreak = 0;

  heatmapData.forEach(day => {
    if (day.count > 0) {
      currentStreak++;
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }
  });

  return {
    totalCommits,
    longestStreak,
    activeMonths: activeMonthsSet.size,
    heatmapData,
  };
};

export default computeContributionStats;
