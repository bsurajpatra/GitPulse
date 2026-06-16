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
  const jobFit = report.result?.weightedMatchScore ?? report.result?.overallScore ?? 0;
  const quality = report.result?.quality?.qualityScore ?? 0;
  const finalScore = report.result?.finalScore ?? Math.round(0.7 * jobFit + 0.3 * quality);
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
            <span style={{ color: getScoreColor(finalScore), fontWeight: 800 }}>
              {finalScore}% final
            </span>
            <span className="report-meta-dot">·</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.85 }}>
              {jobFit}% fit · {quality}% quality
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
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, type, name }
  const navigate = useNavigate();

  const { bulk = [], single = [] } = reports;

  const handleDeleteClick = (id, type) => {
    let name = '';
    if (type === 'bulk') {
      const rep = bulk.find(r => r.id === id);
      name = rep ? (rep.name || 'Untitled Screening') : 'Screening';
    } else {
      const rep = single.find(r => r.id === id);
      name = rep ? (rep.result?.profile?.name || `@${rep.username}`) : 'Candidate';
    }
    setDeleteConfirm({ id, type, name });
  };

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
                      onDelete={handleDeleteClick}
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
                      onDelete={handleDeleteClick}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            background: 'var(--bg-dark-2)',
            border: '1px solid var(--border-dark-strong)',
            padding: '1.75rem',
            borderRadius: 'var(--radius-md)',
            width: '100%',
            maxWidth: '400px',
            animation: 'scaleIn 0.25s ease'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-on-dark)', fontWeight: 800 }}>Confirm Deletion</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted-on-dark)', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>
              Are you sure you want to delete the report for <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                style={{
                  background: 'var(--bg-dark)',
                  border: '1px solid var(--border-dark-strong)',
                  color: 'var(--text-on-dark)',
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteReport(deleteConfirm.id, deleteConfirm.type);
                  setDeleteConfirm(null);
                }}
                style={{
                  background: 'var(--danger-text)',
                  color: '#fff',
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Delete Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
