import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ArrowRight, Video, Mail, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { normalizeError } from '../api/client';

const CU = {
  navyHeader: '#000D74',
  navyDeep:   '#000A5E',
  green:      '#0038A8',
  blue:       '#0038A8',
  blueLight:  '#B9D9EB',
  gold:       '#B9D9EB',
  white:      '#FFFFFF',
  offWhite:   '#F5F5F5',
  textBody:   '#333333',
  textMuted:  '#666666',
  border:     '#D5D5D5',
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { success } = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setErrors({});
    try {
      await login(form.email, form.password);
      success('Welcome back to ToriOS!');
      navigate(from, { replace: true });
    } catch (err) {
      const apiErr = normalizeError(err);
      if (apiErr.field_errors) {
        setErrors(Object.fromEntries(Object.entries(apiErr.field_errors).map(([k, v]) => [k, v[0]])));
      } else {
        setErrors({ general: apiErr.message });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* ── Left Panel — Columbia Institutional ─── */}
      <div style={{
        flex: '0 0 44%', display: 'none', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 48px',
        background: CU.navyHeader,
        position: 'relative',
      }} className="auth-left">
        {/* Gold accent */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: CU.gold }} />

        {/* Logo — white version for dark panel */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/torios-logo-white.png" alt="ToriOS" style={{ height: 56 }} />
        </Link>

        {/* Editorial copy */}
        <div>
          <h2 style={{ fontFamily: "'Cinzel', 'Times New Roman', serif", fontSize: 34, fontWeight: 700, color: '#fff', marginBottom: 16, lineHeight: 1.2 }}>
            Your conversations,<br />
            <em style={{ fontStyle: 'italic', color: CU.blueLight }}>understood.</em>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.50)', lineHeight: 1.75, marginBottom: 36, maxWidth: 320, fontFamily: "'Cinzel', 'Times New Roman', serif" }}>
            ToriOS joins your Google Meet and Zoom meetings, transcribes every word, and sends AI summaries to all participants.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: Video, text: 'Attends Google Meet & Zoom' },
              { icon: FileText, text: 'AI transcription with speaker detection' },
              { icon: Mail, text: 'Summary emails to all participants' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, background: `rgba(0,56,168,0.20)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={14} color="#B9D9EB" />
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.60)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.20)', letterSpacing: '0.04em' }}>© 2026 TORIOS · ALL RIGHTS RESERVED</p>
      </div>

      {/* ── Right Panel — Form ─── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '48px 24px', background: CU.white,
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile logo */}
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', marginBottom: 36 }} className="auth-logo-mobile">
            <img src="/torios-logo.png" alt="ToriOS" style={{ height: 44 }} />
          </Link>

          <h1 style={{ fontFamily: "'Cinzel', 'Times New Roman', serif", fontSize: 28, fontWeight: 700, color: CU.navyHeader, marginBottom: 6 }}>Welcome Back</h1>
          <p style={{ fontSize: 15, color: CU.textMuted, marginBottom: 28 }}>Sign in to your ToriOS workspace.</p>

          {/* Green top rule */}
          <div style={{ width: 48, height: 3, background: CU.green, marginBottom: 28 }} />

          {errors.general && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(198,40,40,0.05)', border: '1px solid rgba(198,40,40,0.15)', padding: '12px 14px', marginBottom: 18 }}>
              <AlertCircle size={16} color="#C62828" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: '#C62828' }}>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: 18 }}>
              <label className="label" htmlFor="email">Email Address</label>
              <input id="email" type="email" className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email" disabled={loading} />
              {errors.email && <p style={{ color: '#C62828', fontSize: 12, marginTop: 5 }}>{errors.email}</p>}
            </div>

            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="label" htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
                <a href="#" style={{ fontSize: 12, color: CU.blue, textDecoration: 'none', fontWeight: 500 }}>Forgot password?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <input id="password" type={showPw ? 'text' : 'password'}
                  className={`input ${errors.password ? 'input-error' : ''}`}
                  placeholder="Enter your password" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password" disabled={loading}
                  style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', display: 'flex', padding: 4 }}>
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <p style={{ color: '#C62828', fontSize: 12, marginTop: 5 }}>{errors.password}</p>}
            </div>

            <button type="submit" className="btn btn-green" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
              {loading ? (
                <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Signing in…</>
              ) : (
                <>SIGN IN <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: CU.textMuted, marginTop: 24 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: CU.blue, fontWeight: 600, textDecoration: 'underline' }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .auth-left { display: flex !important; }
          .auth-logo-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
