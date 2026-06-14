const computeProductivityPatterns = (reposStats) => {
  const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCounts = Array(7).fill(0);
  const hourCounts = Array(24).fill(0);
  let totalCommits = 0;
  let burstScore = 0;
  let nightCommits = 0;

  reposStats.forEach(({ commits, recent }) => {
    // Priority 1: Summary Stats (Weekly)
    if (commits && Array.isArray(commits) && commits.length > 0) {
      commits.forEach(week => {
        if (!week.days) return;
        week.days.forEach((count, dayIndex) => {
          dayCounts[dayIndex] += count;
          totalCommits += count;
        });
      });
    }

    // Priority 2: Fallback to Recent Individual Commits
    if (recent && Array.isArray(recent)) {
      recent.forEach((dateStr, i) => {
        const date = new Date(dateStr);
        
        // Stats
        const dayIndex = date.getUTCDay();
        const hour = date.getUTCHours();
        
        // If we didn't use weekly summary, add to dayCounts
        if (!commits || commits.length === 0) {
          dayCounts[dayIndex] += 1;
          totalCommits += 1;
        }

        // Always add to hourCounts
        hourCounts[hour] += 1;
        if (hour >= 22 || hour <= 4) nightCommits++;

        // Burst Detection (Commits within 30 mins)
        if (i > 0) {
          const prev = new Date(recent[i-1]);
          const diffMin = (prev - date) / (1000 * 60);
          if (diffMin < 30) burstScore += 5;
        }
      });
    }
  });

  if (totalCommits === 0) return { dayStats: [], bestDay: 'N/A', weekendRatio: 0, bestHour: 'N/A' };

  const dayStats = dayCounts.map((count, index) => ({
    day: dayLabels[index],
    count,
  }));

  const bestDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
  const bestDay = dayLabels[bestDayIndex];
  const bestHour = hourCounts.indexOf(Math.max(...hourCounts)) + ":00";

  const weekendCount = dayCounts[0] + dayCounts[6];
  const weekdayCount = dayCounts.reduce((a, b) => a + b, 0) - weekendCount;
  const weekendRatio = parseFloat((weekendCount / (weekdayCount || 1)).toFixed(2));

  return {
    dayStats,
    hourStats: hourCounts.map((count, h) => ({ hour: h + ":00", count })),
    bestDay,
    bestHour,
    weekendRatio,
    burstScore: Math.min(100, burstScore),
    isNightCoder: nightCommits > (totalCommits * 0.3)
  };
};

export default computeProductivityPatterns;
