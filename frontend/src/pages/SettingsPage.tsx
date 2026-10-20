import React, { useState } from 'react';
import { Check, AlertCircle, User, Building2, LogOut, Shield } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { authApi } from '../api/services';
import { normalizeError } from '../api/client';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [organization, setOrganization] = useState(user?.organization ?? '');
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveErr('');
    try {
      await authApi.updateProfile({ full_name: fullName.trim(), organization: organization.trim() });
      await refreshUser();
      success('Profile updated successfully.');
    } catch (err) {
      const apiErr = normalizeError(err);
      setSaveErr(apiErr.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm('Sign out of ToriOS?')) return;
    await logout();
    navigate('/login');
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <AppLayout>
      <div style={{ padding: 'clamp(24px,4vw,40px)', maxWidth: 680, margin: '0 auto' }}>
        <h1 style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 800, color: '#0B1B3F', letterSpacing: '-0.03em', marginBottom: 6 }}>
          Settings
        </h1>
        <p style={{ fontSize: 14, color: '#64748B', marginBottom: 36 }}>Manage your account and preferences.</p>

        {/* Profile section */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <User size={17} color="#8B5CF6" />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0B1B3F' }}>Profile</h2>
          </div>

          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 28 }}>
            <div style={{
              width: 56, height: 56,
              background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, color: '#fff',
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0B1B3F' }}>{user?.full_name || '—'}</div>
              <div style={{ fontSize: 13, color: '#64748B' }}>{user?.email}</div>
            </div>
          </div>

          <form onSubmit={handleSave}>
            {saveErr && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                <AlertCircle size={14} color="#EF4444" />
                <span style={{ fontSize: 13, color: '#DC2626' }}>{saveErr}</span>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label className="label" htmlFor="settings-name">Full name</label>
              <input
                id="settings-name"
                type="text"
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={saving}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="label" htmlFor="settings-email">Email address</label>
              <input
                id="settings-email"
                type="email"
                className="input"
                value={user?.email ?? ''}
                disabled
                style={{ background: '#F8FAFC', cursor: 'not-allowed' }}
              />
              <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 5 }}>Email cannot be changed.</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="label" htmlFor="settings-org">Organization <span style={{ fontWeight: 400, color: '#94A3B8' }}>(optional)</span></label>
              <div style={{ position: 'relative' }}>
                <Building2 size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  id="settings-org"
                  type="text"
                  className="input"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  disabled={saving}
                  style={{ paddingLeft: 38 }}
                  placeholder="Your organization"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ display: 'inline-flex' }}
            >
              {saving ? (
                <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving…</>
              ) : (
                <><Check size={15} /> Save changes</>
              )}
            </button>
          </form>
        </div>

        {/* Account info */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Shield size={17} color="#8B5CF6" />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0B1B3F' }}>Account</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#64748B' }}>Account ID</span>
              <span style={{ fontSize: 13, fontFamily: 'monospace', color: '#94A3B8' }}>{user?.id?.slice(0, 8)}…</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: '#64748B' }}>Member since</span>
              <span style={{ fontSize: 13, color: '#64748B' }}>
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0B1B3F', marginBottom: 4 }}>Sign out</h3>
              <p style={{ fontSize: 13, color: '#64748B' }}>Sign out of your ToriOS account on this device.</p>
            </div>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
