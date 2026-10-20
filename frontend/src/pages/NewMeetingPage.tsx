import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Mic, Square, Pause, Play, CloudUpload,
  FileAudio, X, AlertCircle, CheckCircle2, ChevronRight,
} from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { meetingsApi } from '../api/services';
import { useToast } from '../contexts/ToastContext';
import { normalizeError } from '../api/client';
import type { UploadProgress } from '../types';

const ALLOWED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'audio/webm', 'audio/flac', 'audio/x-wav', 'video/mp4'];
const MAX_SIZE_MB = 200;

type Tab = 'upload' | 'record';

export default function NewMeetingPage() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [tab, setTab] = useState<Tab>('upload');

  return (
    <AppLayout>
      <div style={{ padding: 'clamp(24px, 4vw, 40px)', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 800, color: '#0B1B3F', letterSpacing: '-0.03em', marginBottom: 6 }}>
            New Meeting
          </h1>
          <p style={{ fontSize: 14, color: '#64748B' }}>
            Upload an existing recording or capture audio directly.
          </p>
        </div>

        {/* Tab selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {([
            { id: 'upload', label: 'Upload Recording', icon: Upload },
            { id: 'record', label: 'Record Now', icon: Mic },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10,
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                border: tab === id ? '1.5px solid #8B5CF6' : '1.5px solid #E2E8F0',
                background: tab === id ? 'rgba(139,92,246,0.06)' : '#fff',
                color: tab === id ? '#8B5CF6' : '#64748B',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {tab === 'upload' ? (
          <UploadTab onSuccess={(id) => { success('Meeting created! Processing will begin shortly.'); navigate(`/meetings/${id}`); }} />
        ) : (
          <RecordTab onSuccess={(id) => { success('Recording saved! Processing will begin shortly.'); navigate(`/meetings/${id}`); }} />
        )}
      </div>
    </AppLayout>
  );
}

// ── Upload Tab ─────────────────────────────────────────────────────────────
function UploadTab({ onSuccess }: { onSuccess: (id: string) => void }) {
  const { error: showError } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [title, setTitle] = useState('');
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function validateFile(f: File): string {
    if (!ALLOWED_TYPES.includes(f.type)) {
      return `Unsupported file type: ${f.type || 'unknown'}. Please use MP3, WAV, M4A, MP4, OGG, WEBM, or FLAC.`;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Maximum is ${MAX_SIZE_MB} MB.`;
    }
    return '';
  }

  function handleFileSelect(f: File) {
    const err = validateFile(f);
    if (err) { setFileError(err); setFile(null); return; }
    setFileError('');
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setProgress(null);
    try {
      const meeting = await meetingsApi.create({ title: title.trim() || file.name });
      await meetingsApi.upload(meeting.id, file, setProgress);
      await meetingsApi.transcribe(meeting.id).catch(() => {}); // kick off pipeline
      onSuccess(meeting.id);
    } catch (err) {
      const apiErr = normalizeError(err);
      showError(apiErr.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Drop zone */}
      <div
        style={{
          border: `2px dashed ${dragging ? '#8B5CF6' : fileError ? '#EF4444' : file ? '#10B981' : '#E2E8F0'}`,
          borderRadius: 16,
          padding: '48px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? 'rgba(139,92,246,0.04)' : file ? 'rgba(16,185,129,0.03)' : '#F8FAFC',
          transition: 'all 0.2s',
          marginBottom: 24,
        }}
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,video/mp4"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
          disabled={loading}
        />

        {file ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <div style={{ width: 56, height: 56, background: 'rgba(16,185,129,0.1)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileAudio size={26} color="#10B981" />
              </div>
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#0B1B3F', marginBottom: 4 }}>{file.name}</p>
            <p style={{ fontSize: 13, color: '#64748B', marginBottom: 12 }}>
              {(file.size / 1024 / 1024).toFixed(1)} MB · {file.type}
            </p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); setTitle(''); }}
              style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500 }}
            >
              <X size={14} /> Remove
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 60, height: 60, background: 'rgba(139,92,246,0.08)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CloudUpload size={28} color="#8B5CF6" />
              </div>
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#0B1B3F', marginBottom: 8 }}>
              {dragging ? 'Drop your audio file here' : 'Drop audio here, or click to browse'}
            </p>
            <p style={{ fontSize: 13, color: '#94A3B8' }}>
              MP3, WAV, M4A, MP4, OGG, WEBM, FLAC · Up to {MAX_SIZE_MB} MB
            </p>
          </div>
        )}
      </div>

      {fileError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
          <AlertCircle size={15} color="#EF4444" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#DC2626' }}>{fileError}</span>
        </div>
      )}

      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <label className="label" htmlFor="meeting-title">Meeting title</label>
        <input
          id="meeting-title"
          type="text"
          className="input"
          placeholder="e.g. Q4 Planning Session"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Upload progress */}
      {progress && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>Uploading…</span>
            <span style={{ fontSize: 13, color: '#8B5CF6', fontWeight: 700 }}>{progress.percentage}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress.percentage}%` }} />
          </div>
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={!file || loading}
        style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
      >
        {loading ? (
          <>
            <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
            {progress ? `Uploading ${progress.percentage}%…` : 'Processing…'}
          </>
        ) : (
          <>
            <Upload size={16} />
            Upload & Process
            <ChevronRight size={16} />
          </>
        )}
      </button>
    </form>
  );
}

// ── Record Tab ─────────────────────────────────────────────────────────────
type RecordState = 'idle' | 'recording' | 'paused' | 'stopped';

function RecordTab({ onSuccess }: { onSuccess: (id: string) => void }) {
  const { error: showError } = useToast();
  const [recordState, setRecordState] = useState<RecordState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [title, setTitle] = useState('');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [permError, setPermError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startTimer = () => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startRecording = async () => {
    setPermError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setRecordState('recording');
      setElapsed(0);
      startTimer();
    } catch (err) {
      setPermError('Microphone access denied. Please allow microphone access in your browser settings.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordState('paused');
      stopTimer();
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordState('recording');
      startTimer();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    }
    setRecordState('stopped');
    stopTimer();
  };

  const resetRecording = () => {
    setRecordState('idle');
    setRecordedBlob(null);
    setElapsed(0);
    setTitle('');
  };

  const handleSave = async () => {
    if (!recordedBlob) return;
    setLoading(true);
    const file = new File([recordedBlob], 'recording.webm', { type: 'audio/webm' });
    const meetingTitle = title.trim() || `Recording ${new Date().toLocaleString()}`;
    try {
      const meeting = await meetingsApi.create({ title: meetingTitle });
      await meetingsApi.upload(meeting.id, file);
      await meetingsApi.transcribe(meeting.id).catch(() => {});
      onSuccess(meeting.id);
    } catch (err) {
      const apiErr = normalizeError(err);
      showError(apiErr.message || 'Save failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div>
      {permError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
          <AlertCircle size={15} color="#EF4444" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: '#DC2626' }}>{permError}</span>
        </div>
      )}

      <div style={{
        background: '#F8FAFC', border: '1px solid #E2E8F0',
        borderRadius: 16, padding: '48px 24px',
        textAlign: 'center', marginBottom: 24,
      }}>
        {/* Timer */}
        <div style={{
          fontSize: 52, fontWeight: 800, color: recordState === 'recording' ? '#8B5CF6' : '#0B1B3F',
          letterSpacing: '-0.03em', marginBottom: 8,
          fontVariantNumeric: 'tabular-nums',
          fontFamily: 'monospace',
        }}>
          {fmt(elapsed)}
        </div>

        {/* Status */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 32 }}>
          {recordState === 'recording' && (
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'pulse 1s ease-in-out infinite' }} />
          )}
          <span style={{ fontSize: 14, fontWeight: 500, color: '#64748B' }}>
            {recordState === 'idle' && 'Ready to record'}
            {recordState === 'recording' && 'Recording…'}
            {recordState === 'paused' && 'Paused'}
            {recordState === 'stopped' && 'Recording complete'}
          </span>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          {recordState === 'idle' && (
            <button
              className="btn btn-primary btn-lg"
              onClick={startRecording}
              style={{ borderRadius: '50%', padding: 0, width: 72, height: 72, justifyContent: 'center' }}
            >
              <Mic size={28} />
            </button>
          )}

          {(recordState === 'recording' || recordState === 'paused') && (
            <>
              <button
                className="btn btn-secondary btn-icon"
                onClick={recordState === 'recording' ? pauseRecording : resumeRecording}
                style={{ width: 52, height: 52, justifyContent: 'center', borderRadius: '50%' }}
              >
                {recordState === 'recording' ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button
                className="btn btn-danger"
                onClick={stopRecording}
                style={{ borderRadius: '50%', padding: 0, width: 64, height: 64, justifyContent: 'center' }}
              >
                <Square size={22} />
              </button>
            </>
          )}

          {recordState === 'stopped' && (
            <>
              <CheckCircle2 size={48} color="#10B981" />
              <button
                className="btn btn-ghost"
                onClick={resetRecording}
                style={{ marginTop: 4 }}
              >
                Record again
              </button>
            </>
          )}
        </div>

        <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 24 }}>
          {recordState === 'idle' ? 'Microphone-only recording. System audio capture is not supported.' : ''}
          {recordState === 'stopped' ? 'Your recording is ready to save.' : ''}
        </p>
      </div>

      {/* Save form — shown when stopped */}
      {recordState === 'stopped' && recordedBlob && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <label className="label" htmlFor="record-title">Meeting title</label>
            <input
              id="record-title"
              type="text"
              className="input"
              placeholder={`Recording ${new Date().toLocaleString()}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
          >
            {loading ? (
              <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving…</>
            ) : (
              <><CloudUpload size={16} /> Save & Process Recording <ChevronRight size={16} /></>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
