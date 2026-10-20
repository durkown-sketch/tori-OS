import React, { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Mic2, ArrowRight, Filter, Loader2, FileText } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { meetingsApi } from '../api/services';
import type { Meeting, MeetingsParams } from '../types';
import { formatDistanceToNow, formatDuration } from '../utils/formatters';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'transcribing', label: 'Transcribing' },
  { value: 'failed', label: 'Failed' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [results, setResults] = useState<Meeting[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string, s: string) => {
    if (!q.trim() && !s) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const res = await meetingsApi.list({ search: q, status: s as MeetingsParams['status'], ordering: '-created_at' });
      setResults(res.results);
      setCount(res.count);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query, status), 400);
    return () => clearTimeout(t);
  }, [query, status, doSearch]);

  return (
    <AppLayout>
      <div style={{ padding: 'clamp(24px,4vw,40px)', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 800, color: '#0B1B3F', letterSpacing: '-0.03em', marginBottom: 6 }}>
            Search
          </h1>
          <p style={{ fontSize: 14, color: '#64748B' }}>Search across all your meetings and transcripts.</p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
            <input
              id="global-search"
              type="text"
              className="input"
              placeholder="Search meetings and transcripts…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: 44, fontSize: 15 }}
              autoFocus
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Filter size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
            <select
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ paddingLeft: 34, paddingRight: 32, appearance: 'none', cursor: 'pointer', minWidth: 150 }}
            >
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <Loader2 size={28} color="#8B5CF6" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {!loading && searched && (
          <>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
              {count} result{count !== 1 ? 's' : ''} for <strong>"{query || status}"</strong>
            </div>
            {results.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 0' }}>
                <div className="empty-state-icon"><FileText size={24} /></div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0B1B3F' }}>No results found</h3>
                <p style={{ fontSize: 14, color: '#64748B', maxWidth: 340 }}>
                  Try different keywords or broaden your filter.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {results.map((m) => (
                  <Link key={m.id} to={`/meetings/${m.id}`} style={{ textDecoration: 'none' }}>
                    <div
                      className="card"
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#8B5CF6'; el.style.transform = 'translateX(3px)'; }}
                      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = ''; el.style.transform = ''; }}
                    >
                      <div style={{ width: 38, height: 38, borderRadius: 9, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Mic2 size={17} color="#8B5CF6" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#0B1B3F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{m.title}</div>
                        <div style={{ fontSize: 12, color: '#94A3B8' }}>
                          {formatDistanceToNow(m.created_at)}
                          {m.audio_duration_seconds && ` · ${formatDuration(m.audio_duration_seconds)}`}
                        </div>
                      </div>
                      <span className={`badge ${m.status === 'completed' ? 'badge-green' : m.status === 'failed' ? 'badge-red' : 'badge-amber'}`}>
                        {m.status}
                      </span>
                      <ArrowRight size={15} color="#CBD5E1" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {!loading && !searched && (
          <div className="empty-state" style={{ padding: '60px 0' }}>
            <div className="empty-state-icon"><Search size={26} /></div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0B1B3F' }}>Search your meetings</h3>
            <p style={{ fontSize: 14, color: '#64748B', maxWidth: 320 }}>
              Type a keyword to search meeting titles and transcript content.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
