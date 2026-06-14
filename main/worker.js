import { parentPort, workerData } from 'worker_threads';
import computeContributionStats from '../analytics/contributionEngine.js';
import getHealthReport from '../analytics/repoHealthEngine.js';
import computeLanguageIntelligence from '../analytics/languageEngine.js';
import computeProductivityPatterns from '../analytics/productivityEngine.js';

// Heavy analytics processing
const processAnalytics = (allRepos, allStats, userCalendar) => {
  try {
    let contribution;
    if (userCalendar && userCalendar.weeks) {
      let longestStreak = 0;
      let currentStreak = 0;
      let activeMonthsSet = new Set();
      const heatmapData = [];
      
      userCalendar.weeks.forEach(week => {
        week.contributionDays.forEach(day => {
          heatmapData.push({ count: day.contributionCount, date: day.date });
          if (day.contributionCount > 0) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
            activeMonthsSet.add(new Date(day.date).getMonth());
          } else {
            currentStreak = 0;
          }
        });
      });
      
      contribution = {
        heatmapData,
        totalCommits: userCalendar.totalContributions,
        longestStreak,
        activeMonths: activeMonthsSet.size,
      };
    } else {
      contribution = computeContributionStats(Object.values(allStats));
    }

    const health = getHealthReport(allRepos, allStats);
    const languages = computeLanguageIntelligence(Object.values(allStats));
    const productivity = computeProductivityPatterns(Object.values(allStats));

    // Natural Insights Generator
    const insights = [];
    if (productivity.bestDay) insights.push(`Your peak coding day is ${productivity.bestDay}.`);
    if (contribution.longestStreak > 7) insights.push(`You maintain a strong coding streak of ${contribution.longestStreak} days!`);
    if (languages.distribution[0]) insights.push(`${languages.distribution[0].name} dominance detected in your codebase.`);
    if (health[0] && health[0].score > 80) insights.push(`Repo ${health[0].name} is exceptionally healthy and active.`);

    return { contribution, health, languages, productivity, insights };
  } catch (error) {
    console.error('Worker Processing Error:', error);
    throw error;
  }
};

const result = processAnalytics(workerData.repos, workerData.stats, workerData.userCalendar);
parentPort.postMessage(result);
