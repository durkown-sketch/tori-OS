import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';
import './index.css';

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
const LandingPage    = lazy(() => import('./pages/LandingPage'));
const LoginPage      = lazy(() => import('./pages/LoginPage'));
const RegisterPage   = lazy(() => import('./pages/RegisterPage'));
const DashboardPage  = lazy(() => import('./pages/DashboardPage'));
const MeetingsPage   = lazy(() => import('./pages/MeetingsPage'));
const NewMeetingPage = lazy(() => import('./pages/NewMeetingPage'));
const MeetingDetail  = lazy(() => import('./pages/MeetingDetailPage'));
const BotsPage       = lazy(() => import('./pages/BotsPage'));
const SearchPage     = lazy(() => import('./pages/SearchPage'));
const SettingsPage   = lazy(() => import('./pages/SettingsPage'));

// ── Loader ────────────────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh',
      background: '#fff', gap: 16,
    }}>
      <img src="/torios-logo.png" alt="ToriOS" style={{ height: 52, opacity: 0.85 }} />
      <div style={{
        width: 28, height: 28,
        border: '3px solid rgba(29,45,78,0.10)',
        borderTopColor: '#000D74',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
              <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

              {/* Protected */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/meetings" element={<ProtectedRoute><MeetingsPage /></ProtectedRoute>} />
              <Route path="/meetings/new" element={<ProtectedRoute><NewMeetingPage /></ProtectedRoute>} />
              <Route path="/meetings/:id" element={<ProtectedRoute><MeetingDetail /></ProtectedRoute>} />
              <Route path="/bots" element={<ProtectedRoute><BotsPage /></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
