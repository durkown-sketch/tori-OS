import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle, Video, Mail, Brain } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { normalizeError } from '../api/client';

const CU = {
  navyHeader: '#000D74', navyDeep: '#000A5E',
  green: '#0038A8', greenLight: '#0046CC',
  blue: '#0038A8', blueLight: '#B9D9EB',
  gold: '#B9D9EB', white: '#FFFFFF',
  textBody: '#333333', textMuted: '#666666', border: '#D5D5D5',
};

const PERKS = [
  { icon: Video, text: 'Joins Google Meet & Zoom automatically' },
  { icon: Brain, text: 'AI-powered transcription & summaries' },
  { icon: Mail, text: 'Summary emails to all participants' },
  { icon: CheckCircle, text: 'Action item extraction' },
  { icon: CheckCircle, text: 'Full-text searchable archive' },
  { icon: CheckCircle, text: 'No credit card required' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { success } = useToast();

  const [form, setForm] = useState({ full_name: '', email: '', password: '', password2: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.full_name.trim()) errs.full_name = 'Name is required';
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Min 8 characters';
    if (form.password !== form.password2) errs.password2 = 'Passwords do not match';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setErrors({});
    try {
      await register(form.email, form.password, form.password2, form.full_name);
      success('Account created! Welcome to ToriOS.');
      navigate('/dashboard', { replace: true });
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

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {/* ── Left Panel — Institutional ─── */}
      <div style={{
        flex: '0 0 44%', display: 'none', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 48px',
        background: CU.navyHeader, position: 'relative',
      }} className="auth-left">
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: CU.gold }} />

        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <img src="/torios-logo-white.png" alt="ToriOS" style={{ height: 56 }} />
        </Link>

        <div>
          <h2 style={{ fontFamily: "'Cinzel', 'Times New Roman', serif", fontSize: 32, fontWeight: 700, color: '#fff', marginBottom: 14, lineHeight: 1.2 }}>
            Start understanding<br />
            <em style={{ fontStyle: 'italic', color: CU.blueLight }}>your meetings today.</em>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 28, lineHeight: 1.75, fontFamily: "'Cinzel', 'Times New Roman', serif" }}>
            Everything you need to turn conversations into structured knowledge — free to start.
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PERKS.map(({ icon: Icon, text }) => (
              <li key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 30, height: 30, background: 'rgba(0,56,168,0.20)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={13} color="#B9D9EB" />
                </div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.60)' }}>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.20)', letterSpacing: '0.04em' }}>© 2026 TORIOS · ALL RIGHTS RESERVED</p>
      </div>

      {/* ── Right Panel — Form ─── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '48px 24px', overflowY: 'auto', background: CU.white,
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', marginBottom: 32 }} className="auth-logo-mobile">
            <img src="/torios-logo.png" alt="ToriOS" style={{ height: 44 }} />
          </Link>

          <h1 style={{ fontFamily: "'Cinzel', 'Times New Roman', serif", fontSize: 26, fontWeight: 700, color: CU.navyHeader, marginBottom: 6 }}>Create Your Account</h1>
          <p style={{ fontSize: 14, color: CU.textMuted, marginBottom: 24 }}>Free to start. No credit card required.</p>
          <div style={{ width: 48, height: 3, background: CU.green, marginBottom: 24 }} />

          {errors.general && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(198,40,40,0.05)', border: '1px solid rgba(198,40,40,0.15)', padding: '12px 14px', marginBottom: 18 }}>
              <AlertCircle size={16} color="#C62828" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: '#C62828' }}>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: 16 }}>
              <label className="label" htmlFor="full_name">Full Name</label>
              <input id="full_name" type="text" className={`input ${errors.full_name ? 'input-error' : ''}`}
                placeholder="Your full name" value={form.full_name}
                onChange={update('full_name')} autoComplete="name" disabled={loading} />
              {errors.full_name && <p style={{ color: '#C62828', fontSize: 12, marginTop: 5 }}>{errors.full_name}</p>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="label" htmlFor="email">Email Address</label>
              <input id="email" type="email" className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@example.com" value={form.email}
                onChange={update('email')} autoComplete="email" disabled={loading} />
              {errors.email && <p style={{ color: '#C62828', fontSize: 12, marginTop: 5 }}>{errors.email}</p>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input id="password" type={showPw ? 'text' : 'password'}
                  className={`input ${errors.password ? 'input-error' : ''}`}
                  placeholder="Min 8 characters" value={form.password}
                  onChange={update('password')} autoComplete="new-password" disabled={loading}
                  style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', display: 'flex', padding: 4 }}>
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <p style={{ color: '#C62828', fontSize: 12, marginTop: 5 }}>{errors.password}</p>}
            </div>

            <div style={{ marginBottom: 28 }}>
              <label className="label" htmlFor="password2">Confirm Password</label>
              <input id="password2" type={showPw ? 'text' : 'password'}
                className={`input ${errors.password2 ? 'input-error' : ''}`}
                placeholder="Re-enter your password" value={form.password2}
                onChange={update('password2')} autoComplete="new-password" disabled={loading} />
              {errors.password2 && <p style={{ color: '#C62828', fontSize: 12, marginTop: 5 }}>{errors.password2}</p>}
            </div>

            <button type="submit" className="btn btn-green" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
              {loading ? (
                <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Creating account…</>
              ) : (
                <>CREATE ACCOUNT <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: CU.textMuted, marginTop: 24 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: CU.blue, fontWeight: 600, textDecoration: 'underline' }}>
              Sign in
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
