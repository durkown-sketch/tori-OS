import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Mic2, TrendingUp, Clock, CheckCircle2, AlertCircle,
  ArrowRight, RefreshCw, Loader2,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { meetingsApi, statsApi } from '../api/services';
import type { Meeting, DashboardStats } from '../types';
import { formatDistanceToNow } from '../utils/formatters';

function StatusBadge({ status }: { status: Meeting['status'] }) {
  const cfg: Record<Meeting['status'], { label: string; cls: string }> = {
    uploaded: { label: 'Uploaded', cls: 'badge-blue' },
    queued: { label: 'Queued', cls: 'badge-blue' },
    transcribing: { label: 'Transcribing', cls: 'badge-amber' },
    generating: { label: 'Generating', cls: 'badge-amber' },
    completed: { label: 'Completed', cls: 'badge-green' },
    failed: { label: 'Failed', cls: 'badge-red' },
  };
  const { label, cls } = cfg[status] ?? { label: status, cls: 'badge-gray' };
  return <span className={`badge ${cls}`}>{label}</span>;
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: number | string; color: string;
}) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
      <div style={{
        width: 44, height: 44, flexShrink: 0,
        background: `${color}12`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#000D74', letterSpacing: '-0.02em' }}>{value}</div>
        <div style={{ fontSize: 13, color: '#666', fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const firstName = user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, meetingsRes] = await Promise.all([
        statsApi.getDashboard().catch(() => null),
        meetingsApi.list({ page: 1 }),
      ]);
      if (statsRes) setStats(statsRes);
      setRecent(meetingsRes.results.slice(0, 6));
    } catch (err) {
      setError('Could not load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh if there are processing meetings
  useEffect(() => {
    const hasProcessing = recent.some(
      (m) => m.status === 'transcribing' || m.status === 'generating' || m.status === 'queued'
    );
    if (!hasProcessing) return;
    const id = setInterval(fetchData, 8000);
    return () => clearInterval(id);
  }, [recent, fetchData]);

  return (
    <AppLayout>
      <div style={{ padding: 'clamp(24px, 4vw, 40px)', maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "'Cinzel', 'Times New Roman', serif", fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 700, color: '#000D74', marginBottom: 6 }}>
              Good {getGreeting()}, {firstName}
            </h1>
            <p style={{ fontSize: 15, color: '#666' }}>
              Here's what's happening in your meeting workspace.
            </p>
          </div>
          <Link
            to="/meetings/new"
            className="btn btn-green"
            style={{ textDecoration: 'none', flexShrink: 0 }}
          >
            <Plus size={18} />
            New Meeting
          </Link>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(198,40,40,0.05)', border: '1px solid rgba(198,40,40,0.15)',
            padding: '12px 16px', marginBottom: 24,
          }}>
            <AlertCircle size={16} color="#C62828" />
            <span style={{ fontSize: 14, color: '#C62828', flex: 1 }}>{error}</span>
            <button
              onClick={fetchData}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#0038A8', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 40 }}>
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="card skeleton" style={{ height: 90 }} />
            ))
          ) : (
            <>
              <StatCard icon={Mic2} label="Total Meetings" value={stats?.total_meetings ?? recent.length} color="#000D74" />
              <StatCard icon={CheckCircle2} label="Completed" value={stats?.completed_meetings ?? recent.filter((m) => m.status === 'completed').length} color="#2E7D32" />
              <StatCard icon={Clock} label="Processing" value={stats?.pending_meetings ?? recent.filter((m) => ['queued','transcribing','generating','uploaded'].includes(m.status)).length} color="#E65100" />
              <StatCard icon={TrendingUp} label="Failed" value={stats?.failed_meetings ?? recent.filter((m) => m.status === 'failed').length} color="#C62828" />
            </>
          )}
        </div>

        {/* Recent meetings */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Cinzel', 'Times New Roman', serif", fontSize: 18, fontWeight: 700, color: '#000D74' }}>
            Recent Meetings
          </h2>
          <Link
            to="/meetings"
            style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#0038A8', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 68, borderRadius: 12 }} />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Mic2 size={28} />
            </div>
            <h3 style={{ fontFamily: "'Cinzel', 'Times New Roman', serif", fontSize: 18, fontWeight: 700, color: '#000D74' }}>No meetings yet</h3>
            <p style={{ fontSize: 15, color: '#666', maxWidth: 360 }}>
              Upload a recording or start recording directly to begin building your meeting knowledge base.
            </p>
            <Link to="/meetings/new" className="btn btn-green" style={{ textDecoration: 'none', marginTop: 8 }}>
              <Plus size={16} />
              Start your first meeting
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recent.map((m) => (
              <Link
                key={m.id}
                to={`/meetings/${m.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="card"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '16px 20px',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = '#0038A8';
                    el.style.transform = 'translateX(3px)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = '';
                    el.style.transform = '';
                  }}
                >
                  <div style={{
                    width: 40, height: 40,
                    background: 'rgba(90,131,47,0.08)',
                    border: '1px solid rgba(90,131,47,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {m.status === 'transcribing' || m.status === 'generating' ? (
                      <Loader2 size={18} color="#0038A8" style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <Mic2 size={18} color="#0038A8" />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#000D74', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.title}
                    </div>
                    <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
                      {formatDistanceToNow(m.created_at)}
                      {m.audio_duration_seconds && ` · ${formatDuration(m.audio_duration_seconds)}`}
                    </div>
                  </div>

                  <StatusBadge status={m.status} />
                  <ArrowRight size={16} color="#CBD5E1" style={{ flexShrink: 0 }} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
