import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Star, GitFork, AlertTriangle, Eye, Calendar, 
  ExternalLink, SlidersHorizontal, ArrowUpDown, Folders, HelpCircle
} from 'lucide-react';

const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#dea584',
  PHP: '#4f5d95',
  Ruby: '#701516',
  Swift: '#ffac45',
  Kotlin: '#F18E33'
};

const AllReposView = ({ data = [] }) => {
  const navigate = useNavigate();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [sortBy, setSortBy] = useState('stars-desc'); // stars-desc, forks-desc, issues-desc, name-asc, updated-desc

  // Extract all unique languages
  const languages = useMemo(() => {
    const langs = new Set();
    data.forEach(repo => {
      if (repo.language) langs.add(repo.language);
    });
    return ['all', ...Array.from(langs).sort()];
  }, [data]);

  // Filter and Sort Data
  const processedData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.name.toLowerCase().includes(query) || 
        (r.description && r.description.toLowerCase().includes(query))
      );
    }

    // Language filter
    if (selectedLanguage !== 'all') {
      result = result.filter(r => r.language === selectedLanguage);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'stars-desc':
          return (b.stargazers_count || 0) - (a.stargazers_count || 0);
        case 'forks-desc':
          return (b.forks_count || 0) - (a.forks_count || 0);
        case 'issues-desc':
          return (b.open_issues_count || 0) - (a.open_issues_count || 0);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'updated-desc':
          return new Date(b.updated_at) - new Date(a.updated_at);
        default:
          return 0;
      }
    });

    return result;
  }, [data, searchQuery, selectedLanguage, sortBy]);

  const getLanguageColor = (lang) => {
    return LANGUAGE_COLORS[lang] || '#8b949e';
  };

  return (
    <div className="detail-view-container fade-in">
      {/* Header */}
      <header className="glass p-6 rounded-2xl flex items-center justify-between gap-6 flex-wrap w-full">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="p-2.5 rounded-xl bg-github-bg-secondary hover:bg-github-bg-tertiary border border-github-border transition-all flex items-center justify-center text-white"
            title="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Folders size={24} className="text-github-blue" /> All Repositories
            </h1>
            <p className="text-github-secondary text-sm mt-1">Comprehensive repository stats, languages, and metadata</p>
          </div>
        </div>

        <div className="detail-view-summary-list">
          <div className="detail-view-summary-card">
            <span style={{ fontSize: '10px', color: 'var(--github-text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>TOTAL REPOS</span>
            <span className="text-xl font-bold text-white">{data.length}</span>
          </div>
          <div className="detail-view-summary-card" style={{ color: 'var(--github-yellow)', borderColor: 'rgba(210, 153, 34, 0.2)', backgroundColor: 'rgba(210, 153, 34, 0.05)' }}>
            <span style={{ fontSize: '10px', color: 'inherit', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>TOTAL STARS</span>
            <span className="text-xl font-bold" style={{ color: 'inherit' }}>{data.reduce((acc, curr) => acc + (curr.stargazers_count || 0), 0)}</span>
          </div>
          <div className="detail-view-summary-card" style={{ color: 'var(--github-blue)', borderColor: 'rgba(88, 166, 255, 0.2)', backgroundColor: 'rgba(88, 166, 255, 0.05)' }}>
            <span style={{ fontSize: '10px', color: 'inherit', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>TOTAL FORKS</span>
            <span className="text-xl font-bold" style={{ color: 'inherit' }}>{data.reduce((acc, curr) => acc + (curr.forks_count || 0), 0)}</span>
          </div>
        </div>
      </header>

      {/* Filters and Controls */}
      <div className="detail-view-controls-bar">
        {/* Search Bar */}
        <div className="detail-view-search-wrapper">
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--github-text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search repos or descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="detail-view-search-input"
          />
        </div>

        {/* Action Group */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Language selector */}
          <div className="detail-view-select-wrapper">
            <SlidersHorizontal size={14} style={{ color: 'var(--github-text-secondary)' }} />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="detail-view-select-dropdown"
            >
              <option value="all">All Languages</option>
              {languages.filter(l => l !== 'all').map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          {/* Sort selector */}
          <div className="detail-view-select-wrapper">
            <ArrowUpDown size={14} style={{ color: 'var(--github-text-secondary)' }} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="detail-view-select-dropdown"
            >
              <option value="stars-desc">Sort by Stars</option>
              <option value="forks-desc">Sort by Forks</option>
              <option value="issues-desc">Sort by Issues</option>
              <option value="name-asc">Sort by Name</option>
              <option value="updated-desc">Sort by Last Updated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      {processedData.length > 0 ? (
        <div className="detail-view-cards-grid">
          {processedData.map((repo) => (
            <div 
              key={repo.id} 
              className="detail-view-card"
            >
              <div className="flex flex-col gap-2">
                {/* Header */}
                <div className="flex justify-between items-start gap-2">
                  <h3 className="repo-card-title" title={repo.name}>
                    {repo.name}
                  </h3>
                  <a 
                    href={repo.html_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="repo-external-link"
                    title="Open on GitHub"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>

                {/* Description */}
                <p className="repo-card-desc">
                  {repo.description || 'No description available for this repository.'}
                </p>

                {/* Language Pill */}
                {repo.language && (
                  <div className="flex items-center gap-2 mt-1">
                    <span 
                      className="repo-lang-dot" 
                      style={{ backgroundColor: getLanguageColor(repo.language) }}
                    />
                    <span className="repo-lang-text">{repo.language}</span>
                  </div>
                )}
              </div>

              {/* Footer info & Stats */}
              <div className="detail-view-card-footer">
                <div className="repo-stats-row">
                  <span className="repo-stat-item" title="Stars">
                    <Star size={12} className="text-github-yellow" /> {repo.stargazers_count || 0}
                  </span>
                  <span className="repo-stat-item" title="Forks">
                    <GitFork size={12} className="text-github-blue" /> {repo.forks_count || 0}
                  </span>
                  <span className="repo-stat-item" title="Open Issues">
                    <AlertTriangle size={12} className="text-github-red" /> {repo.open_issues_count || 0}
                  </span>
                  {repo.watchers_count !== undefined && (
                    <span className="repo-stat-item" title="Watchers">
                      <Eye size={12} style={{ color: 'var(--github-purple)' }} /> {repo.watchers_count}
                    </span>
                  )}
                </div>

                <div className="repo-updated-time">
                  <Calendar size={10} style={{ marginRight: '4px' }} />
                  {new Date(repo.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center p-12 flex flex-col items-center justify-center gap-4">
          <HelpCircle size={48} className="text-github-secondary animate-pulse" />
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-lg text-white">No repositories found</h3>
            <p className="text-github-secondary text-sm">Try clearing filters or checking spelling.</p>
          </div>
          <button 
            onClick={() => { setSearchQuery(''); setSelectedLanguage('all'); setSortBy('stars-desc'); }}
            className="btn-primary text-sm mt-2"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default AllReposView;
