import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, User, FileText, Search,
  Trash2, ExternalLink, ChevronRight,
  BarChart2, Clock, AlertTriangle,
} from 'lucide-react';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function getScoreColor(score) {
  if (score >= 80) return 'var(--success-text)';
  if (score >= 60) return 'var(--info-text)';
  if (score >= 40) return 'var(--warning-text)';
  return 'var(--danger-text)';
}

// ─── Bulk Report Card ────────────────────────────────────────────────────────
function BulkReportCard({ report, onReopen, onDelete }) {
  return (
    <div className="report-card">
      <div className="report-card-body">
        <div className="report-card-icon report-card-icon-bulk">
          <Users size={15} />
        </div>
        <div className="report-card-content">
          <div className="report-card-title">
            {report.name || 'Untitled Screening'}
          </div>
          <div className="report-card-meta">
            <span>{report.stats?.successfulAnalyses ?? 0} candidates</span>
            <span className="report-meta-dot">·</span>
            <span>Avg {report.stats?.averageScore ?? 0}%</span>
            <span className="report-meta-dot">·</span>
            <span>{report.stats?.shortlistedCandidates ?? 0} shortlisted</span>
            <span className="report-meta-dot">·</span>
            <span className="report-meta-date">
              <Clock size={11} /> {formatDate(report.date)}
            </span>
          </div>
        </div>
      </div>
      <div className="report-card-actions">
        <button
          className="btn-report-reopen"
          onClick={() => onReopen(report)}
        >
          <ExternalLink size={12} />
          Reopen
        </button>
        <button
          className="btn-report-delete"
          onClick={() => onDelete(report.id, 'bulk')}
          title="Delete report"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Single Report Card ──────────────────────────────────────────────────────
function SingleReportCard({ report, onReopen, onDelete }) {
  const score = report.result?.weightedMatchScore ?? report.result?.overallScore ?? 0;
  return (
    <div className="report-card">
      <div className="report-card-body">
        <div className="report-card-icon report-card-icon-single">
          {report.result?.profile?.avatar_url ? (
            <img
              src={report.result.profile.avatar_url}
              alt={report.username}
              className="report-avatar-thumb"
            />
          ) : (
            <User size={15} />
          )}
        </div>
        <div className="report-card-content">
          <div className="report-card-title">
            {report.result?.profile?.name || report.username}
          </div>
          <div className="report-card-meta">
            <span>@{report.username}</span>
            <span className="report-meta-dot">·</span>
            <span style={{ color: getScoreColor(score), fontWeight: 700 }}>
              {score}% match
            </span>
            <span className="report-meta-dot">·</span>
            <span>{report.result?.role || 'Job analysis'}</span>
            <span className="report-meta-dot">·</span>
            <span className="report-meta-date">
              <Clock size={11} /> {formatDate(report.date)}
            </span>
          </div>
        </div>
      </div>
      <div className="report-card-actions">
        <button className="btn-report-reopen" onClick={() => onReopen(report)}>
          <ExternalLink size={12} />
          Reopen
        </button>
        <button
          className="btn-report-delete"
          onClick={() => onDelete(report.id, 'single')}
          title="Delete report"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Reports Page ────────────────────────────────────────────────────────────
export default function Reports({ reports, deleteReport, onBulkReopen, onSingleReopen }) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('bulk'); // 'bulk' | 'single'
  const navigate = useNavigate();

  const { bulk = [], single = [] } = reports;

  const filteredBulk = bulk.filter(r =>
    (r.name || '').toLowerCase().includes(search.toLowerCase())
  );
  const filteredSingle = single.filter(r =>
    r.username.toLowerCase().includes(search.toLowerCase()) ||
    (r.result?.profile?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const isEmpty = bulk.length === 0 && single.length === 0;

  return (
    <div className="reports-page">
      <div className="reports-container">

        {/* Header */}
        <div className="reports-header">
          <div>
            <h1 className="reports-title">Reports</h1>
            <p className="reports-sub">
              {bulk.length} bulk screening{bulk.length !== 1 ? 's' : ''} ·{' '}
              {single.length} single analys{single.length !== 1 ? 'es' : 'is'}
            </p>
          </div>

          {/* Search */}
          {!isEmpty && (
            <div className="reports-search-wrap">
              <Search size={14} className="reports-search-icon" />
              <input
                type="text"
                className="reports-search-input"
                placeholder="Search reports…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Empty state */}
        {isEmpty && (
          <div className="reports-empty">
            <FileText size={36} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <h2 className="reports-empty-title">No reports yet</h2>
            <p className="reports-empty-desc">
              Completed screenings and analyses will appear here automatically.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button className="btn-quick-primary" onClick={() => navigate('/bulk')}>
                <Users size={15} /> Start Bulk Screening
              </button>
              <button className="btn-quick-secondary" onClick={() => navigate('/candidate')}>
                <User size={14} /> Single Analysis
              </button>
            </div>
          </div>
        )}

        {/* Tabs + content */}
        {!isEmpty && (
          <>
            <div className="reports-tabs">
              <button
                className={`reports-tab ${tab === 'bulk' ? 'reports-tab-active' : ''}`}
                onClick={() => setTab('bulk')}
              >
                <Users size={13} />
                Bulk Screenings
                {bulk.length > 0 && <span className="reports-tab-count">{bulk.length}</span>}
              </button>
              <button
                className={`reports-tab ${tab === 'single' ? 'reports-tab-active' : ''}`}
                onClick={() => setTab('single')}
              >
                <User size={13} />
                Single Analyses
                {single.length > 0 && <span className="reports-tab-count">{single.length}</span>}
              </button>
            </div>

            {/* Bulk list */}
            {tab === 'bulk' && (
              <div className="report-list">
                {filteredBulk.length > 0 ? (
                  filteredBulk.map(r => (
                    <BulkReportCard
                      key={r.id}
                      report={r}
                      onReopen={onBulkReopen}
                      onDelete={deleteReport}
                    />
                  ))
                ) : (
                  <p className="reports-no-results">
                    {search ? `No screenings match "${search}"` : 'No bulk screenings yet.'}
                  </p>
                )}
              </div>
            )}

            {/* Single list */}
            {tab === 'single' && (
              <div className="report-list">
                {filteredSingle.length > 0 ? (
                  filteredSingle.map(r => (
                    <SingleReportCard
                      key={r.id}
                      report={r}
                      onReopen={onSingleReopen}
                      onDelete={deleteReport}
                    />
                  ))
                ) : (
                  <p className="reports-no-results">
                    {search ? `No analyses match "${search}"` : 'No single analyses yet.'}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
