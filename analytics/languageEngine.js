const computeLanguageIntelligence = (reposStats) => {
  const languageTotals = {};
  let totalUsage = 0;

  reposStats.forEach(({ languages }) => {
    if (!languages) return;

    Object.entries(languages).forEach(([lang, bytes]) => {
      languageTotals[lang] = (languageTotals[lang] || 0) + bytes;
      totalUsage += bytes;
    });
  });

  if (totalUsage === 0) return { distribution: [], diversity: 0 };

  const distribution = Object.entries(languageTotals)
    .map(([name, bytes]) => ({
      name,
      value: parseFloat(((bytes / totalUsage) * 100).toFixed(2)),
      bytes
    }))
    .sort((a, b) => b.value - a.value);

  // Diversity Index (Simpsons Diversity Index)
  const sumSquaredValues = distribution.reduce((acc, { value }) => acc + (value / 100) ** 2, 0);
  const diversity = parseFloat((1 - sumSquaredValues).toFixed(2));

  return {
    distribution,
    diversity, // 0-1
    polyglotScore: Math.round(diversity * 100), // 0-100
    totalUsage
  };
};

export default computeLanguageIntelligence;
