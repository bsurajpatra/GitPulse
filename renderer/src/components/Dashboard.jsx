import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import {
  Github, GitFork, Star, LogOut, RefreshCcw, LayoutDashboard,
  Code, History, Trophy, Terminal, Users, UserPlus, Folders,
  Calendar, CheckCircle, AlertTriangle, TrendingUp, Zap, PieChart as PieChartIcon, Activity
} from 'lucide-react';
import computeAnalytics from 'analytics/processor.js';

const COLORS = ['#58a6ff', '#3fb950', '#f85149', '#d29922', '#bc8cff', '#1f6feb'];

const Dashboard = ({ user, repos, advanced, onLogout, onRefresh }) => {
  const navigate = useNavigate();
  const { contribution, health, languages, productivity, insights } = advanced || {};
  const [activeTab, setActiveTab] = useState('Overview');

  const basicInsights = React.useMemo(() => computeAnalytics(repos), [repos]);

  const timelineData = contribution?.heatmapData ? Array.from({ length: 52 }, (_, i) => {
    const weekSlice = contribution.heatmapData.slice(i * 7, (i + 1) * 7);
    return { week: `W${i + 1}`, commits: weekSlice.reduce((a, b) => a + b.count, 0) };
  }) : [];

  return (
    <div className="min-h-screen p-8 lg:p-12 space-y-8 fade-in flex flex-col">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-6">
          <img src={user.avatar_url} alt={user.name} className="w-16 h-16 rounded-full border-2 border-github-blue" />
          <div>
            <h1 className="text-2xl font-bold">Welcome, {user.name || user.login}</h1>
            <p className="text-github-secondary">@{user.login}</p>
          </div>
        </div>

        <div className="flex items-center ml-auto gap-4">
          <button onClick={onRefresh} className="p-2 text-white bg-transparent border-transparent hover:text-github-blue transition-colors outline-none" title="Sync Data">
            <RefreshCcw size={20} />
          </button>
          <button onClick={onLogout} className="btn-danger flex items-center gap-2 outline-none">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-4 border-b border-github-bg pb-4 overflow-x-auto custom-scrollbar">
        {[
          { id: 'Overview', icon: <LayoutDashboard size={18} /> },
          { id: 'Repositories', icon: <Folders size={18} /> },
          { id: 'Productivity', icon: <Activity size={18} /> },
          { id: 'Languages', icon: <Code size={18} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center shrink-0 gap-2 px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap tab-btn ${activeTab === tab.id ? 'tab-btn-active' : 'tab-btn-inactive'}`}
          >
            {tab.icon} {tab.id}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <div className="flex-1 space-y-10">

        {/* ===================== OVERVIEW TAB ===================== */}
        {activeTab === 'Overview' && (
          <div className="space-y-10 fade-in">
            {/* User Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard icon={<Users />} label="Followers" value={user.followers} color="var(--github-blue)" />
              <StatCard icon={<UserPlus />} label="Following" value={user.following} color="var(--github-green)" />
              <StatCard icon={<Folders />} label="Public Repos" value={user.public_repos} color="var(--github-yellow)" />
              <StatCard icon={<Calendar />} label="Joined" value={new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })} color="var(--github-purple)" />
            </div>

            {/* Basic Insights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <StatCard icon={<Star />} label="Total Stars" value={basicInsights.totalStars} color="var(--github-yellow)" />
              <StatCard icon={<Code />} label="Most Used Language" value={basicInsights.mostUsedLanguage} color="var(--github-blue)" />
              <StatCard icon={<Trophy />} label="Most Starred Repo" value={basicInsights.mostStarredRepo?.name || "N/A"} color="var(--github-purple)" />
              <StatCard icon={<History />} label="Recently Active Repo" value={basicInsights.recentlyUpdated?.name || "N/A"} color="var(--github-green)" />
            </div>

            {/* Natural Insights */}
            {insights && insights.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {insights.map((text, i) => (
                  <div key={i} className="card bg-github-blue/10 border-github-blue/30 flex items-start gap-3 p-4">
                    <Zap size={18} className="text-github-blue mt-1 flex-shrink-0" />
                    <p className="text-sm">{text}</p>
                  </div>
                ))}
                {productivity?.bestHour && (
                  <div className="card bg-github-green/10 border-github-green/30 flex items-start gap-3 p-4">
                    <Zap size={18} className="text-github-green mt-1 flex-shrink-0" />
                    <p className="text-sm">Your peak coding hour is usually {productivity.bestHour}.</p>
                  </div>
                )}
                {productivity?.burstScore > 50 && (
                  <div className="card bg-github-purple/10 border-github-purple/30 flex items-start gap-3 p-4">
                    <Zap size={18} className="text-github-purple mt-1 flex-shrink-0" />
                    <p className="text-sm">High burst coding behavior detected ({productivity.burstScore}%). Jump in while focused!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===================== REPOSITORIES TAB ===================== */}
        {activeTab === 'Repositories' && (
          <div className="space-y-10 fade-in">
            {/* Repo Analytics Table */}
            <div className="card max-h-[400px] overflow-y-auto custom-scrollbar">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Folders size={20} className="text-github-blue" /> All Repositories
              </h3>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-github-bg text-github-secondary">
                    <th className="pb-3">Repository</th>
                    <th className="pb-3">Language</th>
                    <th className="pb-3">Stars</th>
                    <th className="pb-3">Forks</th>
                    <th className="pb-3">Issues</th>
                    <th className="pb-3">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {repos.slice(0, 3).map(repo => (
                    <tr key={repo.id} className="border-b border-github-bg/50 hover:bg-github-bg/30">
                      <td className="py-3 font-semibold text-github-blue">{repo.name}</td>
                      <td className="py-3">{repo.language || 'N/A'}</td>
                      <td className="py-3">{repo.stargazers_count}</td>
                      <td className="py-3">{repo.forks_count}</td>
                      <td className="py-3">{repo.open_issues_count}</td>
                      <td className="py-3">{new Date(repo.updated_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {repos.length > 3 && (
                <div className="pt-4 text-center mt-2 border-t border-github-bg">
                  <button 
                    onClick={() => navigate('/all-repos')} 
                    className="text-github-secondary hover:text-white transition-colors text-sm font-semibold"
                  >
                    View All {repos.length} Repositories
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              {/* Deep Repo Health Rankings */}
              <div className="card flex flex-col">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                  <CheckCircle size={20} className="text-github-green" /> Deep Repo Health Rankings
                </h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {health?.slice(0, 3).map((r, i) => (
                    <div key={r.repo_id} className="p-4 rounded-xl bg-github-bg-tertiary space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-github-blue">{r.name}</span>
                          {r.details?.isGrowing && <span className="badge text-[8px] bg-github-blue/20 text-github-blue">GROWING</span>}
                        </div>
                        <span className="text-lg font-bold" style={{ color: r.score > 70 ? '#3fb950' : r.score > 40 ? '#d29922' : '#f85149' }}>{r.score}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-[10px] text-github-secondary">MAINT: <span className="text-white">{r.details?.maintenanceScore}%</span></div>
                        <div className="text-[10px] text-github-secondary">ACTIVITY: <span className="text-white">{r.details?.activityScore}%</span></div>
                        <div className="text-[10px] text-github-secondary">COMMUNITY: <span className="text-white">{r.details?.communityScore}%</span></div>
                      </div>
                      <div className="w-full h-1 bg-github-bg rounded-full overflow-hidden">
                        <div
                          className="h-full bg-github-green"
                          style={{ width: `${r.score}%`, backgroundColor: r.score > 70 ? '#3fb950' : r.score > 40 ? '#d29922' : '#f85149' }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {health?.length > 3 && (
                    <div className="pt-2 text-center pb-2">
                      <button 
                        onClick={() => navigate('/health-rankings')} 
                        className="text-github-secondary hover:text-white transition-colors text-xs font-semibold"
                      >
                        View All {health.length} Rankings
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Repo Stars Chart */}
              <div className="card flex flex-col">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                  <Star size={20} className="text-github-yellow" /> Repo Stars Analysis
                </h3>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={basicInsights.starsStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                      <XAxis dataKey="name" stroke="#8b949e" tick={{ fontSize: 10, dy: 10, dx: -2 }} angle={-45} textAnchor="end" interval={0} height={80} />
                      <YAxis stroke="#8b949e" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#161b22', border: 'none', borderRadius: '8px' }} cursor={{ fill: '#ffffff10' }} />
                      <Bar dataKey="stars" fill="#d29922" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Repo Growth Graph */}
            <div className="card h-full">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-github-blue" /> Repo Growth Profile (Stars & Forks)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={repos.map(r => ({ name: r.name, forks: r.forks_count, stars: r.stargazers_count }))} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                  <XAxis dataKey="name" stroke="#8b949e" tick={{ fontSize: 10, dy: 10, dx: -2 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#8b949e" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#161b22', border: 'none', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="stars" stroke="#58a6ff" strokeWidth={2} name="Stars" dot={{ r: 2 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="forks" stroke="#3fb950" strokeWidth={2} name="Forks" dot={{ r: 2 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ===================== PRODUCTIVITY TAB ===================== */}
        {activeTab === 'Productivity' && (
          <div className="space-y-10 fade-in">
            {/* Contribution Heatmap */}
            <div className="card">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <History size={20} className="text-github-green" /> Annual Contribution Heatmap
              </h3>
              <div className="flex flex-wrap gap-1 items-start justify-center">
                {contribution?.heatmapData?.map((day, i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-sm transition-all hover:scale-125 cursor-help"
                    title={`${day.count} commits`}
                    style={{
                      backgroundColor: day.count > 10 ? '#39d353' : day.count > 5 ? '#26a641' : day.count > 0 ? '#0e4429' : '#161b22',
                      border: day.count > 0 ? 'none' : '1px solid #30363d'
                    }}
                  ></div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-github-secondary">
                <div className="flex items-center gap-4">
                  <span>Longest Streak: <b className="text-white">{contribution?.longestStreak} Days</b></span>
                  <span>Active Months: <b className="text-white">{contribution?.activeMonths}</b></span>
                </div>
                <div className="flex items-center gap-1">
                  <span>Less</span>
                  <div className="w-3 h-3 bg-[#161b22] border border-[#30363d]"></div>
                  <div className="w-3 h-3 bg-[#0e4429]"></div>
                  <div className="w-3 h-3 bg-[#26a641]"></div>
                  <div className="w-3 h-3 bg-[#39d353]"></div>
                  <span>More</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Hourly Activity Patterns */}
              <div className="card flex flex-col">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                  <TrendingUp size={20} className="text-github-green" /> Hourly Activity Patterns
                </h3>
                {productivity?.hourStats?.length > 0 ? (
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={productivity.hourStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                        <XAxis dataKey="hour" stroke="#8b949e" tick={{ fontSize: 9 }} />
                        <YAxis stroke="#8b949e" tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#161b22', border: 'none', borderRadius: '8px' }} cursor={{ fill: '#ffffff10' }} />
                        <Bar dataKey="count" fill="#58a6ff" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-github-secondary">Collecting hourly data...</div>
                )}
              </div>

              {/* Weekly Productivity Profiles */}
              <div className="card flex flex-col">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                  <Zap size={20} className="text-github-yellow" /> Weekly Productivity Profiles
                </h3>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart data={productivity?.dayStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                      <XAxis dataKey="day" stroke="#8b949e" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#8b949e" />
                      <Tooltip contentStyle={{ backgroundColor: '#161b22', border: 'none' }} cursor={{ fill: '#ffffff10' }} />
                      <Bar dataKey="count" fill="#d29922" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="p-3 bg-github-bg rounded-lg text-center">
                    <p className="text-[10px] text-github-secondary mb-1">BEST DAY</p>
                    <p className="font-bold text-sm tracking-wide">{productivity?.bestDay}</p>
                  </div>
                  <div className="p-3 bg-github-bg rounded-lg text-center">
                    <p className="text-[10px] text-github-secondary mb-1">WEEKEND / WEEKDAY</p>
                    <p className="font-bold text-sm tracking-wide">{productivity?.weekendRatio}</p>
                  </div>
                  <div className="p-3 bg-github-bg rounded-lg text-center">
                    <p className="text-[10px] text-github-secondary mb-1">NIGHT CODER</p>
                    <p className="font-bold text-sm tracking-wide">{productivity?.isNightCoder ? 'YES' : 'NO'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Commit Timeline Graph */}
              <div className="card h-full flex flex-col">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                  <Activity size={20} className="text-github-green" /> Commit Timeline Graph
                </h3>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                      <XAxis dataKey="week" stroke="#8b949e" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#8b949e" />
                      <Tooltip contentStyle={{ backgroundColor: '#161b22', border: 'none' }} />
                      <Line type="monotone" dataKey="commits" stroke="#3fb950" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Activity Radar Chart */}
              <div className="card h-full flex flex-col">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                  <Activity size={20} className="text-github-purple" /> Dynamic Activity Radar
                </h3>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={productivity?.dayStats}>
                      <PolarGrid stroke="#30363d" />
                      <PolarAngleAxis dataKey="day" tick={{ fill: '#8b949e', fontSize: 10 }} />
                      <Radar name="Commits" dataKey="count" stroke="#bc8cff" fill="#bc8cff" fillOpacity={0.6} />
                      <Tooltip contentStyle={{ backgroundColor: '#161b22', border: 'none' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== LANGUAGES TAB ===================== */}
        {activeTab === 'Languages' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 fade-in">
            {/* Language Distribution Chart */}
            <div className="card flex flex-col">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <PieChartIcon size={20} className="text-github-blue" /> Language Distribution Base
              </h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={basicInsights.languageDistribution.slice(0, 5)} dataKey="value" nameKey="name" outerRadius={110} label>
                      {basicInsights.languageDistribution.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#161b22', border: 'none', borderRadius: '8px' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Language Intelligence */}
            <div className="card flex flex-col">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Code size={20} className="text-github-purple" /> Codebase Intelligence
              </h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={languages?.distribution?.slice(0, 6)}>
                    <PolarGrid stroke="#30363d" />
                    <PolarAngleAxis dataKey="name" tick={{ fill: '#8b949e', fontSize: 10 }} />
                    <Radar name="Usage" dataKey="value" stroke="#bc8cff" fill="#bc8cff" fillOpacity={0.6} />
                    <Tooltip contentStyle={{ backgroundColor: '#161b22', border: 'none' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-3 bg-github-bg rounded-lg text-center">
                  <p className="text-[10px] uppercase text-github-secondary tracking-widest mb-1">Polyglot Score</p>
                  <p className="text-xl font-bold text-github-purple">{languages?.polyglotScore}</p>
                </div>
                <div className="p-3 bg-github-bg rounded-lg text-center">
                  <p className="text-[10px] uppercase text-github-secondary tracking-widest mb-1">Dominant Lang</p>
                  <p className="text-xl font-bold text-white truncate px-1">{languages?.distribution[0]?.name || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, subValue, color }) => (
  <div className="card flex flex-col gap-4 p-6 hover:translate-y-[-4px] transition-all">
    <div className="flex items-center justify-between">
      <div className="flex items-center justify-center">
        {React.cloneElement(icon, { size: 18, style: { color } })}
      </div>
      <p className="text-xs text-github-secondary uppercase tracking-wider font-semibold">{label}</p>
    </div>
    <div className="mt-2">
      <p className="text-xl font-bold truncate text-white" title={value}>{value}</p>
      {subValue && <p className="text-xs text-github-secondary mt-1">{subValue}</p>}
    </div>
  </div>
);

export default Dashboard;
