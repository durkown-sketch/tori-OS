import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Video, Plus, Loader2, AlertCircle, CheckCircle2,
  Clock, Trash2, Mail, Calendar, RefreshCw, ExternalLink,
  Mic2, Info,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { useToast } from '../contexts/ToastContext';
import apiClient from '../api/client';

const C = { navy: '#000D74', blue: '#0038A8', green: '#0038A8', greenDark: '#002D8A', gold: '#B9D9EB', blueLight: '#B9D9EB' };

type BotStatus = 'scheduled' | 'joining' | 'active' | 'completed' | 'failed' | 'cancelled';

interface BotSession {
  id: string;
  meeting_title: string;
  platform: 'google_meet' | 'zoom';
  meeting_url: string;
  status: BotStatus;
  scheduled_at: string;
  started_at?: string;
  ended_at?: string;
  send_to_organizer: boolean;
  send_to_participants: boolean;
  participants_email_override?: string;
  meeting_id?: string;
  error_message?: string;
  created_at: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  google_meet: 'Google Meet',
  zoom: 'Zoom',
};

const STATUS_CONFIG: Record<BotStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  scheduled: { label: 'Scheduled', color: C.blue, bg: 'rgba(29,111,188,0.08)', icon: <Clock size={11} /> },
  joining: { label: 'Joining...', color: C.blue, bg: 'rgba(29,111,188,0.08)', icon: <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> },
  active: { label: 'Active', color: C.green, bg: 'rgba(90,131,47,0.08)', icon: <Mic2 size={11} /> },
  completed: { label: 'Completed', color: C.green, bg: 'rgba(90,131,47,0.08)', icon: <CheckCircle2 size={11} /> },
  failed: { label: 'Failed', color: '#C62828', bg: 'rgba(198,40,40,0.08)', icon: <AlertCircle size={11} /> },
  cancelled: { label: 'Cancelled', color: '#888', bg: 'rgba(136,136,136,0.08)', icon: <AlertCircle size={11} /> },
};

function StatusBadge({ status }: { status: BotStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.scheduled;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 700, padding: '3px 10px',
      color: cfg.color, background: cfg.bg,
      textTransform: 'uppercase' as const, letterSpacing: '0.03em',
    }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ── Schedule Bot Modal ─────────────────────────────────────────────────────
function ScheduleBotModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    meeting_title: '',
    platform: 'google_meet' as 'google_meet' | 'zoom',
    meeting_url: '',
    scheduled_at: '',
    send_to_organizer: true,
    send_to_participants: true,
    participants_email_override: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.meeting_url.trim()) { showError('Meeting URL is required.'); return; }
    if (!form.meeting_title.trim()) { showError('Meeting title is required.'); return; }
    setLoading(true);
    try {
      await apiClient.post('/api/bots/', form);
      success('Bot scheduled! ToriOS will join at the specified time.');
      onCreated();
      onClose();
    } catch {
      showError('Failed to schedule bot. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(20,30,51,0.50)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', padding: 32, width: '100%', maxWidth: 520,
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, background: 'rgba(90,131,47,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Video size={18} color={C.green} />
            </div>
            <div>
              <h2 style={{ fontFamily: "'Cinzel', 'Times New Roman', serif", fontSize: 17, fontWeight: 700, color: C.navy }}>Schedule a Meeting Bot</h2>
              <p style={{ fontSize: 12, color: '#888' }}>ToriOS will join and generate a summary</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4, fontSize: 20 }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label className="label" htmlFor="bot-title">Meeting title</label>
            <input id="bot-title" type="text" className="input" placeholder="e.g. Q4 Planning Session"
              value={form.meeting_title} onChange={(e) => setForm({ ...form, meeting_title: e.target.value })} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="label">Platform</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['google_meet', 'zoom'] as const).map((p) => (
                <button key={p} type="button" onClick={() => setForm({ ...form, platform: p })}
                  style={{
                    flex: 1, padding: '10px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                    border: form.platform === p ? `2px solid ${C.blue}` : '1.5px solid #D0DCE8',
                    background: form.platform === p ? 'rgba(27,106,201,0.06)' : '#fff',
                    color: form.platform === p ? C.blue : '#5A6E88',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                  {p === 'google_meet' ? '🎥 Google Meet' : '📹 Zoom'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="label" htmlFor="bot-url">Meeting URL</label>
            <input id="bot-url" type="url" className="input"
              placeholder={form.platform === 'google_meet' ? 'https://meet.google.com/xxx-xxxx-xxx' : 'https://zoom.us/j/1234567890'}
              value={form.meeting_url} onChange={(e) => setForm({ ...form, meeting_url: e.target.value })} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="label" htmlFor="bot-time">Scheduled time <span style={{ fontWeight: 400, color: '#94A3B8' }}>(optional — join immediately if blank)</span></label>
            <input id="bot-time" type="datetime-local" className="input"
              value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
          </div>

          <div style={{ background: '#F7F9FC', border: '1px solid #D0DCE8', borderRadius: 10, padding: '16px', marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.navy, marginBottom: 12 }}>📧 Email summary to</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { key: 'send_to_organizer', label: 'Meeting organizer' },
                { key: 'send_to_participants', label: 'All participants' },
              ].map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form[key as keyof typeof form] as boolean}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: C.blue }} />
                  <span style={{ fontSize: 14, color: '#1A2B4A' }}>{label}</span>
                </label>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <label className="label" htmlFor="extra-emails" style={{ fontSize: 13 }}>Additional email recipients <span style={{ fontWeight: 400, color: '#94A3B8' }}>(comma-separated)</span></label>
              <input id="extra-emails" type="text" className="input"
                placeholder="alice@example.com, bob@example.com"
                value={form.participants_email_override}
                onChange={(e) => setForm({ ...form, participants_email_override: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: '12px', border: '1.5px solid #D0DCE8', borderRadius: 8,
                background: '#fff', color: '#5A6E88', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-green" disabled={loading}
              style={{ flex: 2, justifyContent: 'center', padding: '12px' }}>
              {loading ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Scheduling…</> : <><Video size={15} /> Schedule Bot</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function BotsPage() {
  const { success, error: showError } = useToast();
  const [bots, setBots] = useState<BotSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchBots = async () => {
    try {
      const res = await apiClient.get<{ results: BotSession[] }>('/api/bots/');
      setBots(res.data.results ?? res.data as unknown as BotSession[]);
    } catch {
      /* silently ignore if endpoint not yet set up */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBots(); }, []);

  const handleCancel = async (id: string) => {
    try {
      await apiClient.patch(`/api/bots/${id}/`, { status: 'cancelled' });
      success('Bot cancelled.');
      fetchBots();
    } catch { showError('Failed to cancel bot.'); }
  };

  return (
    <AppLayout>
      {showModal && <ScheduleBotModal onClose={() => setShowModal(false)} onCreated={fetchBots} />}

      <div style={{ padding: 'clamp(24px,4vw,40px)', maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "'Cinzel', 'Times New Roman', serif", fontSize: 'clamp(22px,3vw,28px)', fontWeight: 700, color: C.navy, marginBottom: 6 }}>
              Meeting Bots
            </h1>
            <p style={{ fontSize: 14, color: '#666' }}>
              ToriOS joins your Google Meet & Zoom calls, transcribes, and emails summaries to all participants.
            </p>
          </div>
          <button className="btn btn-green" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Schedule a Bot
          </button>
        </div>

        {/* Info banner */}
        <div style={{
          display: 'flex', gap: 14, alignItems: 'flex-start',
          background: 'rgba(27,106,201,0.05)', border: `1px solid rgba(27,106,201,0.15)`,
          borderRadius: 12, padding: '16px 20px', marginBottom: 28,
        }}>
          <Info size={18} color={C.blue} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.navy, marginBottom: 4 }}>How ToriOS bots work</p>
            <p style={{ fontSize: 13, color: '#5A6E88', lineHeight: 1.65 }}>
              Schedule a bot with your meeting link. ToriOS will join the call as a silent participant, record and transcribe the conversation, then automatically email a structured summary (executive summary, decisions, action items) to the organizer and/or all participants when the meeting ends.
            </p>
          </div>
        </div>

        {/* Platform quick-schedule */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { platform: 'Google Meet', emoji: '🎥', color: '#1B6AC9', bg: 'rgba(27,106,201,0.05)', border: 'rgba(27,106,201,0.15)', desc: 'Paste your meet.google.com link' },
            { platform: 'Zoom', emoji: '📹', color: '#2D8CFF', bg: 'rgba(45,140,255,0.05)', border: 'rgba(45,140,255,0.15)', desc: 'Paste your zoom.us/j/... link' },
          ].map(({ platform, emoji, color, bg, border, desc }) => (
            <div key={platform} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '20px', cursor: 'pointer', transition: 'all 0.2s' }}
              onClick={() => setShowModal(true)}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ''; }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{emoji}</div>
              <div style={{ fontWeight: 700, fontSize: 15, color, marginBottom: 4 }}>{platform}</div>
              <div style={{ fontSize: 12, color: '#5A6E88' }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* Bot list */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>Scheduled & recent bots</h2>
            <button onClick={fetchBots} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A6E88', display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}>
              <RefreshCw size={13} /> Refresh
            </button>
          </div>

          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
              <Loader2 size={28} color={C.blue} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          )}

          {!loading && bots.length === 0 && (
            <div className="empty-state" style={{ padding: '64px 0' }}>
              <div className="empty-state-icon"><Video size={28} /></div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>No bots scheduled yet</h3>
              <p style={{ fontSize: 14, color: '#5A6E88', maxWidth: 320, textAlign: 'center', lineHeight: 1.65 }}>
                Schedule ToriOS to join your next Google Meet or Zoom meeting and automatically send summaries.
              </p>
              <button className="btn btn-green" onClick={() => setShowModal(true)} style={{ marginTop: 8 }}>
                <Plus size={15} /> Schedule your first bot
              </button>
            </div>
          )}

          {!loading && bots.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bots.map((bot) => (
                <div key={bot.id} className="card" style={{ padding: '18px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 16 }}>{bot.platform === 'google_meet' ? '🎥' : '📹'}</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bot.meeting_title}</span>
                        <StatusBadge status={bot.status} />
                      </div>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: '#5A6E88' }}>
                        <span>{PLATFORM_LABELS[bot.platform]}</span>
                        {bot.scheduled_at && <span><Calendar size={11} style={{ display: 'inline', marginRight: 3 }} />{new Date(bot.scheduled_at).toLocaleString()}</span>}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Mail size={11} />
                          {[bot.send_to_organizer && 'Organizer', bot.send_to_participants && 'Participants'].filter(Boolean).join(', ')}
                        </span>
                      </div>
                      {bot.error_message && (
                        <p style={{ fontSize: 12, color: '#C0392B', marginTop: 6 }}>{bot.error_message}</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <a href={bot.meeting_url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: C.blue, textDecoration: 'none', padding: '6px 12px', border: `1.5px solid rgba(27,106,201,0.2)`, borderRadius: 6 }}>
                        <ExternalLink size={11} /> Open
                      </a>
                      {bot.meeting_id && (
                        <Link to={`/meetings/${bot.meeting_id}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: C.navy, textDecoration: 'none', padding: '6px 12px', border: `1.5px solid rgba(1,33,105,0.15)`, borderRadius: 6 }}>
                          <Mic2 size={11} /> View meeting
                        </Link>
                      )}
                      {['scheduled', 'joining'].includes(bot.status) && (
                        <button onClick={() => handleCancel(bot.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#C0392B', background: 'rgba(192,57,43,0.06)', border: '1px solid rgba(192,57,43,0.2)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer' }}>
                          <Trash2 size={11} /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
