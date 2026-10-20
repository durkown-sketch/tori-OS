import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Mic2, Edit2, Trash2, RefreshCw, Check, X,
  Loader2, AlertCircle, Play, Pause, SkipBack, Volume2,
  FileText, List, Lightbulb, CheckSquare,
  ChevronDown, ChevronUp, Copy, RotateCcw,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { meetingsApi } from '../api/services';
import { useToast } from '../contexts/ToastContext';
import { normalizeError } from '../api/client';
import type { MeetingDetail, ActionItem, Transcript } from '../types';
import { formatDate, formatDuration, formatFileSize } from '../utils/formatters';

// ── Status badge colors ───────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfgs: Record<string, { label: string; color: string; bg: string }> = {
    uploaded: { label: 'Uploaded', color: '#2563EB', bg: '#EFF6FF' },
    queued: { label: 'Queued', color: '#2563EB', bg: '#EFF6FF' },
    transcribing: { label: 'Transcribing', color: '#D97706', bg: '#FFFBEB' },
    generating: { label: 'Generating Insights', color: '#D97706', bg: '#FFFBEB' },
    completed: { label: 'Completed', color: '#059669', bg: '#ECFDF5' },
    failed: { label: 'Failed', color: '#DC2626', bg: '#FEF2F2' },
  };
  const c = cfgs[status] ?? { label: status, color: '#64748B', bg: '#F1F5F9' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 12, fontWeight: 600,
      color: c.color, background: c.bg,
      borderRadius: 100, padding: '4px 12px',
    }}>
      {(status === 'transcribing' || status === 'generating') && (
        <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
      )}
      {c.label}
    </span>
  );
}

// ── Audio Player ──────────────────────────────────────────────────────────
function AudioPlayer({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.pause();
    else a.play();
    setPlaying(!playing);
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Number(e.target.value);
    setCurrentTime(a.currentTime);
  };

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div style={{
      background: '#F8FAFC', border: '1px solid #E2E8F0',
      borderRadius: 14, padding: '16px 20px',
    }}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setPlaying(false)}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, currentTime - 10); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', padding: 4 }}
          title="Back 10s"
        >
          <SkipBack size={18} />
        </button>
        <button
          onClick={toggle}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: '#8B5CF6', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
          }}
        >
          {playing ? <Pause size={18} color="#fff" /> : <Play size={18} color="#fff" />}
        </button>
        <div style={{ flex: 1 }}>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={seek}
            style={{ width: '100%', accentColor: '#8B5CF6' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
        <Volume2 size={16} color="#94A3B8" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => {
            const v = Number(e.target.value);
            setVolume(v);
            if (audioRef.current) audioRef.current.volume = v;
          }}
          style={{ width: 64, accentColor: '#8B5CF6' }}
        />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
type TabId = 'overview' | 'transcript' | 'action-items';

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');
  const [tab, setTab] = useState<TabId>('overview');
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const fetchMeeting = useCallback(async () => {
    if (!id) return;
    try {
      const m = await meetingsApi.get(id);
      setMeeting(m);
      setEditTitle(m.title);
      setLoadErr('');
    } catch (err) {
      setLoadErr('Failed to load meeting.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchMeeting(); }, [fetchMeeting]);

  // Auto-refresh while processing
  useEffect(() => {
    if (!meeting) return;
    if (!['transcribing', 'generating', 'queued', 'uploaded'].includes(meeting.status)) return;
    const t = setInterval(fetchMeeting, 6000);
    return () => clearInterval(t);
  }, [meeting, fetchMeeting]);

  // Load audio URL when meeting has a file
  useEffect(() => {
    if (!meeting?.audio_file_path || audioUrl) return;
    meetingsApi.getAudioUrl(meeting.id).then((r) => setAudioUrl(r.url)).catch(() => {});
  }, [meeting, audioUrl]);

  const saveTitle = async () => {
    if (!meeting || !editTitle.trim()) return;
    setSavingTitle(true);
    try {
      const updated = await meetingsApi.update(meeting.id, { title: editTitle.trim() });
      setMeeting({ ...meeting, title: updated.title });
      setEditing(false);
      success('Title updated.');
    } catch { showError('Could not update title.'); }
    finally { setSavingTitle(false); }
  };

  const handleDelete = async () => {
    if (!meeting) return;
    if (!confirm(`Delete "${meeting.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await meetingsApi.delete(meeting.id);
      success('Meeting deleted.');
      navigate('/meetings');
    } catch { showError('Failed to delete meeting.'); setDeleting(false); }
  };

  const handleRegenerate = async () => {
    if (!meeting) return;
    setRegenerating(true);
    try {
      await meetingsApi.regenerateInsights(meeting.id);
      success('Regenerating insights… refresh in a moment.');
      setTimeout(fetchMeeting, 3000);
    } catch (err) {
      const e = normalizeError(err);
      showError(e.message || 'Failed to regenerate.');
    } finally { setRegenerating(false); }
  };

  const handleRetry = async () => {
    if (!meeting) return;
    try {
      await meetingsApi.retryProcessing(meeting.id);
      success('Retrying processing…');
      setTimeout(fetchMeeting, 2000);
    } catch { showError('Failed to retry.'); }
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ padding: 'clamp(24px,4vw,40px)' }}>
          <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={32} color="#8B5CF6" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (loadErr || !meeting) {
    return (
      <AppLayout>
        <div style={{ padding: 'clamp(24px,4vw,40px)' }}>
          <div className="empty-state">
            <AlertCircle size={40} color="#EF4444" />
            <h3 style={{ color: '#0B1B3F', fontWeight: 700 }}>{loadErr || 'Meeting not found'}</h3>
            <Link to="/meetings" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              <ArrowLeft size={16} /> Back to Meetings
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ padding: 'clamp(24px,4vw,40px)', maxWidth: 900, margin: '0 auto' }}>
        {/* Back link */}
        <Link
          to="/meetings"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 13, fontWeight: 500, textDecoration: 'none', marginBottom: 24, }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#0B1B3F')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
        >
          <ArrowLeft size={15} /> Back to Meetings
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            {editing ? (
              <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                <input
                  className="input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{ flex: 1, fontSize: 20, fontWeight: 700, minWidth: 200 }}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditing(false); }}
                  disabled={savingTitle}
                />
                <button className="btn btn-primary btn-sm" onClick={saveTitle} disabled={savingTitle}>
                  {savingTitle ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={14} />}
                  Save
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 'clamp(20px,3vw,26px)', fontWeight: 800, color: '#0B1B3F', letterSpacing: '-0.03em' }}>
                  {meeting.title}
                </h1>
                <button
                  onClick={() => setEditing(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#8B5CF6')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                  title="Rename meeting"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {meeting.status === 'failed' && (
                <button className="btn btn-secondary btn-sm" onClick={handleRetry}>
                  <RotateCcw size={14} /> Retry
                </button>
              )}
              {meeting.status === 'completed' && (
                <button className="btn btn-ghost btn-sm" onClick={handleRegenerate} disabled={regenerating}>
                  {regenerating ? <div className="spinner" style={{ width: 13, height: 13 }} /> : <RefreshCw size={13} />}
                  Regenerate
                </button>
              )}
              <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
                {deleting ? <div className="spinner" style={{ width: 13, height: 13 }} /> : <Trash2 size={13} />}
                Delete
              </button>
            </div>
          </div>

          {/* Meta */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <StatusBadge status={meeting.status} />
            <span style={{ fontSize: 13, color: '#64748B' }}>{formatDate(meeting.created_at)}</span>
            {meeting.audio_duration_seconds && (
              <span style={{ fontSize: 13, color: '#64748B' }}>{formatDuration(meeting.audio_duration_seconds)}</span>
            )}
            {meeting.audio_file_size && (
              <span style={{ fontSize: 13, color: '#64748B' }}>{formatFileSize(meeting.audio_file_size)}</span>
            )}
          </div>
        </div>

        {/* Error / failure message */}
        {meeting.status === 'failed' && meeting.error_message && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, padding: '14px 16px', marginBottom: 24,
          }}>
            <AlertCircle size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#DC2626', marginBottom: 4 }}>Processing failed</div>
              <div style={{ fontSize: 13, color: '#DC2626', opacity: 0.8 }}>{meeting.error_message}</div>
            </div>
          </div>
        )}

        {/* Processing indicator */}
        {['transcribing', 'generating', 'queued', 'uploaded'].includes(meeting.status) && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: 12, padding: '16px 20px', marginBottom: 24,
          }}>
            <Loader2 size={20} color="#8B5CF6" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#6D28D9' }}>
                {meeting.status === 'transcribing' && 'Transcribing your recording…'}
                {meeting.status === 'generating' && 'Generating AI insights…'}
                {['queued', 'uploaded'].includes(meeting.status) && 'Queued for processing…'}
              </div>
              <div style={{ fontSize: 13, color: '#8B5CF6', opacity: 0.8, marginTop: 2 }}>
                This page will update automatically. Typical time: 1–5 minutes.
              </div>
            </div>
          </div>
        )}

        {/* Audio player */}
        {audioUrl && (
          <div style={{ marginBottom: 28 }}>
            <AudioPlayer audioUrl={audioUrl} />
          </div>
        )}

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 28 }}>
          {([
            { id: 'overview', icon: Lightbulb, label: 'Overview' },
            { id: 'transcript', icon: FileText, label: 'Transcript' },
            { id: 'action-items', icon: CheckSquare, label: 'Action Items' },
          ] as const).map(({ id: tid, icon: Icon, label }) => (
            <button
              key={tid}
              className={`tab-item ${tab === tid ? 'active' : ''}`}
              onClick={() => setTab(tid)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'overview' && <OverviewTab meeting={meeting} />}
        {tab === 'transcript' && <TranscriptTab transcript={meeting.transcript} status={meeting.status} />}
        {tab === 'action-items' && <ActionItemsTab items={meeting.insights?.action_items} status={meeting.status} />}
      </div>
    </AppLayout>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────
function OverviewTab({ meeting }: { meeting: MeetingDetail }) {
  const { insights } = meeting;

  if (!insights) {
    return (
      <div className="empty-state" style={{ padding: '40px 0' }}>
        <div className="empty-state-icon"><Lightbulb size={24} /></div>
        <p style={{ color: '#64748B', fontSize: 15 }}>
          {meeting.status === 'completed'
            ? 'No insights were generated for this meeting.'
            : 'Insights will appear here once processing is complete.'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Executive summary */}
      <InsightCard title="Executive Summary" icon={Lightbulb}>
        <p style={{ fontSize: 15, color: '#172033', lineHeight: 1.75 }}>{insights.executive_summary}</p>
      </InsightCard>

      {/* Key points */}
      {insights.key_points?.length > 0 && (
        <InsightCard title="Key Points" icon={List}>
          <ul style={{ paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {insights.key_points.map((p, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0, marginTop: 5, width: 6, height: 6, borderRadius: '50%', background: '#8B5CF6', display: 'inline-block' }} />
                <span style={{ fontSize: 14, color: '#172033', lineHeight: 1.65 }}>{p}</span>
              </li>
            ))}
          </ul>
        </InsightCard>
      )}

      {/* Decisions */}
      {insights.decisions?.length > 0 && (
        <InsightCard title="Decisions Made" icon={CheckSquare}>
          <ul style={{ paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {insights.decisions.map((d, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Check size={14} color="#10B981" style={{ flexShrink: 0, marginTop: 3 }} />
                <span style={{ fontSize: 14, color: '#172033', lineHeight: 1.65 }}>{d}</span>
              </li>
            ))}
          </ul>
        </InsightCard>
      )}

      {/* Unresolved questions */}
      {insights.unresolved_questions?.length > 0 && (
        <InsightCard title="Unresolved Questions" icon={AlertCircle}>
          <ul style={{ paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {insights.unresolved_questions.map((q, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <AlertCircle size={14} color="#F59E0B" style={{ flexShrink: 0, marginTop: 3 }} />
                <span style={{ fontSize: 14, color: '#172033', lineHeight: 1.65 }}>{q}</span>
              </li>
            ))}
          </ul>
        </InsightCard>
      )}

      {/* Topics */}
      {insights.topics?.length > 0 && (
        <InsightCard title="Topics Discussed" icon={Mic2}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {insights.topics.map((t, i) => (
              <span key={i} className="badge badge-purple">{t}</span>
            ))}
          </div>
        </InsightCard>
      )}
    </div>
  );
}

function InsightCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    const el = document.createElement('div');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: expanded ? 16 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={16} color="#8B5CF6" />
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0B1B3F' }}>{title}</h3>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', padding: 4 }}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>
      {expanded && children}
    </div>
  );
}

// ── Transcript Tab ─────────────────────────────────────────────────────────
function TranscriptTab({ transcript, status }: { transcript?: Transcript; status: string }) {
  const [search, setSearch] = useState('');

  if (!transcript) {
    return (
      <div className="empty-state" style={{ padding: '40px 0' }}>
        <div className="empty-state-icon"><FileText size={24} /></div>
        <p style={{ color: '#64748B', fontSize: 15 }}>
          {status === 'completed' ? 'No transcript available for this meeting.' : 'Transcript will appear here once processing is complete.'}
        </p>
      </div>
    );
  }

  const text = transcript.full_text;
  const highlighted = search
    ? text.replace(new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark style="background: #FEF08A; border-radius: 2px;">$1</mark>')
    : text;

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, flex: 1 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <input
              className="input"
              placeholder="Search transcript…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {transcript.language && <span className="badge badge-gray">{transcript.language.toUpperCase()}</span>}
          {transcript.word_count > 0 && <span className="badge badge-gray">{transcript.word_count.toLocaleString()} words</span>}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigator.clipboard.writeText(transcript.full_text)}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Copy size={13} /> Copy
          </button>
        </div>
      </div>

      <div
        className="card"
        style={{
          maxHeight: 520, overflowY: 'auto',
          fontSize: 14, lineHeight: 1.85, color: '#172033',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />

      {/* Segments */}
      {transcript.segments?.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0B1B3F', marginBottom: 12 }}>Timestamped segments</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {transcript.segments.map((seg, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #F1F5F9', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#8B5CF6', whiteSpace: 'nowrap', fontFamily: 'monospace', minWidth: 72 }}>
                  {formatSeconds(seg.start)}
                </span>
                {seg.speaker && <span className="badge badge-gray" style={{ flexShrink: 0, fontSize: 11 }}>{seg.speaker}</span>}
                <span style={{ fontSize: 13, color: '#172033', lineHeight: 1.6 }}>{seg.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatSeconds(s: number) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

// ── Action Items Tab ───────────────────────────────────────────────────────
function ActionItemsTab({ items, status }: { items?: ActionItem[]; status: string }) {
  const PRIORITY_COLOR: Record<string, string> = { high: '#EF4444', medium: '#F59E0B', low: '#10B981' };

  if (!items || items.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '40px 0' }}>
        <div className="empty-state-icon"><CheckSquare size={24} /></div>
        <p style={{ color: '#64748B', fontSize: 15 }}>
          {status === 'completed' ? 'No action items were identified.' : 'Action items will appear here once processing is complete.'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 4 }}>
        {items.length} action item{items.length !== 1 ? 's' : ''} identified
      </div>
      {items.map((item, i) => (
        <div
          key={i}
          className="card"
          style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '16px 20px' }}
        >
          <div style={{
            width: 20, height: 20, borderRadius: 6, border: '2px solid #8B5CF6',
            flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#172033', lineHeight: 1.5, marginBottom: item.owner || item.deadline ? 10 : 0 }}>
              {item.task}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {item.owner && <span className="badge badge-purple">👤 {item.owner}</span>}
              {item.deadline && <span className="badge badge-amber">📅 {item.deadline}</span>}
              {item.priority && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 11, fontWeight: 600, borderRadius: 100, padding: '2px 10px',
                  color: PRIORITY_COLOR[item.priority] ?? '#64748B',
                  background: `${PRIORITY_COLOR[item.priority] ?? '#64748B'}18`,
                }}>
                  {item.priority.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
