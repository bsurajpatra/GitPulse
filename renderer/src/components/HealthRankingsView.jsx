import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, CheckCircle, TrendingUp, Shield, Activity, Users, Star, 
  HelpCircle, SlidersHorizontal, ArrowUpDown, ChevronRight
} from 'lucide-react';

const HealthRankingsView = ({ data = [] }) => {
  const navigate = useNavigate();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('score-desc'); // score-desc, score-asc, maint-desc, activity-desc, community-desc
  const [filterType, setFilterType] = useState('all'); // all, growing, healthy (score > 70), warning (40-70), critical (< 40)

  // Handle back action
  const handleBackClick = () => {
    navigate('/');
  };

  // Filter and Sort Data
  const processedData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => r.name.toLowerCase().includes(query));
    }

    // Status filter
    if (filterType === 'growing') {
      result = result.filter(r => r.details?.isGrowing);
    } else if (filterType === 'healthy') {
      result = result.filter(r => r.score >= 70);
    } else if (filterType === 'warning') {
      result = result.filter(r => r.score >= 40 && r.score < 70);
    } else if (filterType === 'critical') {
      result = result.filter(r => r.score < 40);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'score-desc':
          return b.score - a.score;
        case 'score-asc':
          return a.score - b.score;
        case 'maint-desc':
          return (b.details?.maintenanceScore || 0) - (a.details?.maintenanceScore || 0);
        case 'activity-desc':
          return (b.details?.activityScore || 0) - (a.details?.activityScore || 0);
        case 'community-desc':
          return (b.details?.communityScore || 0) - (a.details?.communityScore || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [data, searchQuery, sortBy, filterType]);

  // Color helper based on score
  const getScoreColor = (score) => {
    if (score >= 70) return '#3fb950'; // GitHub green
    if (score >= 40) return '#d29922'; // GitHub yellow
    return '#f85149'; // GitHub red
  };

  const getScoreClass = (score) => {
    if (score >= 70) return 'text-github-green bg-github-green/10 border-github-green/20';
    if (score >= 40) return 'text-github-yellow bg-github-yellow/10 border-github-yellow/20';
    return 'text-github-red bg-github-red/10 border-github-red/20';
  };

  return (
    <div className="detail-view-container fade-in">
      {/* Header */}
      <header className="glass p-6 rounded-2xl flex items-center justify-between gap-6 flex-wrap w-full">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBackClick} 
            className="p-2.5 rounded-xl bg-github-bg-secondary hover:bg-github-bg-tertiary border border-github-border transition-all flex items-center justify-center text-white"
            title="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <CheckCircle size={24} className="text-github-green" /> Deep Repo Health Rankings
            </h1>
            <p className="text-github-secondary text-sm mt-1">Comprehensive maintenance, activity, and community health insights</p>
          </div>
        </div>

        {/* Stats Summary Bubble */}
        <div className="detail-view-summary-list">
          <div className="detail-view-summary-card">
            <span style={{ fontSize: '10px', color: 'var(--github-text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>TOTAL REPOS</span>
            <span className="text-xl font-bold text-white">{data.length}</span>
          </div>
          <div className="detail-view-summary-card healthy">
            <span style={{ fontSize: '10px', color: 'inherit', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>HEALTHY</span>
            <span className="text-xl font-bold" style={{ color: 'inherit' }}>{data.filter(r => r.score >= 70).length}</span>
          </div>
          <div className="detail-view-summary-card warning">
            <span style={{ fontSize: '10px', color: 'inherit', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>WARNING</span>
            <span className="text-xl font-bold" style={{ color: 'inherit' }}>{data.filter(r => r.score >= 40 && r.score < 70).length}</span>
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
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="detail-view-search-input"
          />
        </div>

        {/* Action Group */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Filter selector */}
          <div className="detail-view-select-wrapper">
            <SlidersHorizontal size={14} style={{ color: 'var(--github-text-secondary)' }} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="detail-view-select-dropdown"
            >
              <option value="all">All Repos</option>
              <option value="growing">Growing Only</option>
              <option value="healthy">Healthy (70+)</option>
              <option value="warning">Warning (40-69)</option>
              <option value="critical">Critical (&lt;40)</option>
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
              <option value="score-desc">Overall: High to Low</option>
              <option value="score-asc">Overall: Low to High</option>
              <option value="maint-desc">Maintenance Score</option>
              <option value="activity-desc">Activity Score</option>
              <option value="community-desc">Community Score</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      {processedData.length > 0 ? (
        <div className="detail-view-cards-grid">
          {processedData.map((r, i) => {
            const scoreStatus = r.score >= 70 ? 'healthy' : r.score >= 40 ? 'warning' : 'critical';
            return (
              <div 
                key={r.repo_id} 
                className="detail-view-card"
              >
                <div>
                  {/* Header */}
                  <div className="detail-view-card-header">
                    <div className="flex-1" style={{ overflow: 'hidden', paddingRight: '8px' }}>
                      <h3 className="health-repo-name text-lg font-bold text-white truncate mb-1" title={r.name}>
                        {r.name}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        {r.details?.isGrowing && (
                          <span className="badge" style={{ backgroundColor: 'rgba(88, 166, 255, 0.15)', color: 'var(--github-blue)', fontSize: '8px', padding: '2px 6px', border: '1px solid rgba(88, 166, 255, 0.25)', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                            GROWING
                          </span>
                        )}
                        <span style={{ fontSize: '10px', color: 'var(--github-text-secondary)' }}>Rank #{i + 1}</span>
                      </div>
                    </div>
                    
                    {/* Overall Score Badge */}
                    <div className={`health-score-badge ${scoreStatus}`}>
                      <span style={{ fontSize: '8px', opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Health</span>
                      <span style={{ fontSize: '1.25rem', marginTop: '-2px', fontWeight: 'bold' }}>{r.score}</span>
                    </div>
                  </div>

                  {/* Sub-Scores detailed breakdown */}
                  <div className="health-metrics-list">
                    {/* Maintenance Score */}
                    <div className="health-metric-row">
                      <div className="health-metric-header">
                        <span className="flex items-center gap-2">
                          <Shield size={12} style={{ color: 'var(--github-blue)' }} /> Maintenance
                        </span>
                        <span className="font-bold text-white">{r.details?.maintenanceScore}%</span>
                      </div>
                      <div className="health-progress-bg">
                        <div 
                          className="health-progress-bar" 
                          style={{ width: `${r.details?.maintenanceScore || 0}%`, backgroundColor: 'var(--github-blue)' }}
                        />
                      </div>
                    </div>

                    {/* Activity Score */}
                    <div className="health-metric-row">
                      <div className="health-metric-header">
                        <span className="flex items-center gap-2">
                          <Activity size={12} style={{ color: 'var(--github-green)' }} /> Activity
                        </span>
                        <span className="font-bold text-white">{r.details?.activityScore}%</span>
                      </div>
                      <div className="health-progress-bg">
                        <div 
                          className="health-progress-bar" 
                          style={{ width: `${r.details?.activityScore || 0}%`, backgroundColor: 'var(--github-green)' }}
                        />
                      </div>
                    </div>

                    {/* Community Score */}
                    <div className="health-metric-row">
                      <div className="health-metric-header">
                        <span className="flex items-center gap-2">
                          <Users size={12} style={{ color: 'var(--github-yellow)' }} /> Community Engagement
                        </span>
                        <span className="font-bold text-white">{r.details?.communityScore}%</span>
                      </div>
                      <div className="health-progress-bg">
                        <div 
                          className="health-progress-bar" 
                          style={{ width: `${r.details?.communityScore || 0}%`, backgroundColor: 'var(--github-yellow)' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer detail status */}
                <div className="detail-view-card-footer">
                  <div className="detail-view-status-indicator">
                    <div 
                      className="detail-view-status-dot" 
                      style={{ backgroundColor: r.score >= 70 ? '#3fb950' : r.score >= 40 ? '#d29922' : '#f85149' }}
                    />
                    <span>
                      {r.score >= 70 ? 'Optimal Condition' : r.score >= 40 ? 'Needs Attention' : 'Critical Warning'}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-github-blue font-bold">
                    Stats details <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center p-12 flex flex-col items-center justify-center gap-4">
          <HelpCircle size={48} className="text-github-secondary animate-pulse" />
          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-lg text-white">No repositories match your criteria</h3>
            <p className="text-github-secondary text-sm">Try adjusting your filters or search keywords.</p>
          </div>
          <button 
            onClick={() => { setSearchQuery(''); setFilterType('all'); setSortBy('score-desc'); }}
            className="btn-primary text-sm mt-2"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default HealthRankingsView;
