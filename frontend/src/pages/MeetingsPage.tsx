import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Filter, Mic2, ArrowRight, RefreshCw,
  AlertCircle, Loader2, CheckCircle2, Clock, XCircle, Calendar,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { meetingsApi } from '../api/services';
import type { Meeting, MeetingsParams } from '../types';
import { formatDistanceToNow, formatDuration, formatFileSize } from '../utils/formatters';
import { useToast } from '../contexts/ToastContext';

function StatusBadge({ status }: { status: Meeting['status'] }) {
  const cfg: Record<Meeting['status'], { label: string; cls: string; icon: React.ReactNode }> = {
    uploaded: { label: 'Uploaded', cls: 'badge-blue', icon: <Mic2 size={11} /> },
    queued: { label: 'Queued', cls: 'badge-blue', icon: <Clock size={11} /> },
    transcribing: { label: 'Transcribing', cls: 'badge-amber', icon: <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> },
    generating: { label: 'Generating', cls: 'badge-amber', icon: <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> },
    completed: { label: 'Completed', cls: 'badge-green', icon: <CheckCircle2 size={11} /> },
    failed: { label: 'Failed', cls: 'badge-red', icon: <XCircle size={11} /> },
  };
  const { label, cls, icon } = cfg[status] ?? { label: status, cls: 'badge-gray', icon: null };
  return <span className={`badge ${cls}`}>{icon}{label}</span>;
}

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'transcribing', label: 'Transcribing' },
  { value: 'generating', label: 'Generating' },
  { value: 'uploaded', label: 'Uploaded' },
  { value: 'failed', label: 'Failed' },
];

export default function MeetingsPage() {
  const { success, error: showError } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [params, setParams] = useState<MeetingsParams>({ search: '', status: '', page: 1, ordering: '-created_at' });
  const [searchInput, setSearchInput] = useState('');

  const fetchMeetings = useCallback(async (p: MeetingsParams) => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await meetingsApi.list(p);
      setMeetings(res.results);
      setTotalCount(res.count);
    } catch {
      setLoadError('Failed to load meetings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMeetings(params); }, [params, fetchMeetings]);

  // Auto-refresh if processing
  useEffect(() => {
    const hasProcessing = meetings.some((m) =>
      ['transcribing', 'generating', 'queued'].includes(m.status)
    );
    if (!hasProcessing) return;
    const id = setInterval(() => fetchMeetings(params), 8000);
    return () => clearInterval(id);
  }, [meetings, params, fetchMeetings]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== params.search) {
        setParams((p) => ({ ...p, search: searchInput, page: 1 }));
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput, params.search]);

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await meetingsApi.delete(id);
      success('Meeting deleted.');
      fetchMeetings(params);
    } catch {
      showError('Failed to delete meeting.');
    }
  };

  const PAGE_SIZE = 20;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <AppLayout>
      <div style={{ padding: 'clamp(24px, 4vw, 40px)', maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 'clamp(22px, 3vw, 28px)', fontWeight: 800, color: '#0B1B3F', letterSpacing: '-0.03em', marginBottom: 4 }}>
              Meetings
            </h1>
            <p style={{ fontSize: 14, color: '#64748B' }}>
              {totalCount > 0 ? `${totalCount} meeting${totalCount !== 1 ? 's' : ''} in your workspace` : 'Your meeting workspace'}
            </p>
          </div>
          <Link to="/meetings/new" className="btn btn-primary" style={{ textDecoration: 'none', flexShrink: 0 }}>
            <Plus size={17} />
            New Meeting
          </Link>
        </div>

        {/* Search + Filter bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
            <input
              type="text"
              className="input"
              placeholder="Search meetings…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ paddingLeft: 40 }}
              id="meetings-search"
            />
          </div>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Filter size={15} style={{ position: 'absolute', left: 12, color: '#94A3B8', pointerEvents: 'none' }} />
            <select
              className="input"
              value={params.status || ''}
              onChange={(e) => setParams((p) => ({ ...p, status: e.target.value as Meeting['status'] | '', page: 1 }))}
              style={{ paddingLeft: 36, paddingRight: 32, appearance: 'none', cursor: 'pointer', minWidth: 160 }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => fetchMeetings(params)}
            className="btn btn-ghost btn-icon"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Error state */}
        {loadError && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, padding: '12px 16px', marginBottom: 20,
          }}>
            <AlertCircle size={16} color="#EF4444" />
            <span style={{ fontSize: 14, color: '#DC2626', flex: 1 }}>{loadError}</span>
          </div>
        )}

        {/* Meetings table */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Mic2 size={28} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0B1B3F' }}>
              {params.search || params.status ? 'No matching meetings' : 'No meetings yet'}
            </h3>
            <p style={{ fontSize: 14, color: '#64748B', maxWidth: 360 }}>
              {params.search || params.status
                ? 'Try adjusting your search or filter.'
                : 'Upload a recording or record directly to get started.'}
            </p>
            {!params.search && !params.status && (
              <Link to="/meetings/new" className="btn btn-primary" style={{ textDecoration: 'none', marginTop: 8 }}>
                <Plus size={16} /> New Meeting
              </Link>
            )}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {meetings.map((m) => (
                <Link key={m.id} to={`/meetings/${m.id}`} style={{ textDecoration: 'none' }}>
                  <div
                    className="card"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '16px 20px', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = '#8B5CF6';
                      el.style.transform = 'translateX(3px)';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = '';
                      el.style.transform = '';
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.05))',
                      border: '1px solid rgba(139,92,246,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {['transcribing', 'generating'].includes(m.status)
                        ? <Loader2 size={17} color="#8B5CF6" style={{ animation: 'spin 1s linear infinite' }} />
                        : <Mic2 size={17} color="#8B5CF6" />
                      }
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#0B1B3F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.title}
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94A3B8' }}>
                          <Calendar size={11} />
                          {formatDistanceToNow(m.created_at)}
                        </span>
                        {m.audio_duration_seconds && (
                          <span style={{ fontSize: 12, color: '#94A3B8' }}>
                            {formatDuration(m.audio_duration_seconds)}
                          </span>
                        )}
                        {m.audio_file_size && (
                          <span style={{ fontSize: 12, color: '#94A3B8' }}>
                            {formatFileSize(m.audio_file_size)}
                          </span>
                        )}
                      </div>
                    </div>

                    <StatusBadge status={m.status} />

                    <button
                      onClick={(e) => handleDelete(e, m.id, m.title)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#CBD5E1', padding: '4px', borderRadius: 6,
                        display: 'flex', transition: 'color 0.15s',
                        flexShrink: 0,
                      }}
                      title="Delete meeting"
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#CBD5E1')}
                    >
                      <XCircle size={16} />
                    </button>

                    <ArrowRight size={16} color="#CBD5E1" style={{ flexShrink: 0 }} />
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 32 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={(params.page ?? 1) <= 1}
                  onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
                >
                  Previous
                </button>
                <span style={{ fontSize: 14, color: '#64748B' }}>
                  Page {params.page ?? 1} of {totalPages}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={(params.page ?? 1) >= totalPages}
                  onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
