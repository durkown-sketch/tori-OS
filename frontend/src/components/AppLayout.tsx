import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Mic, Search, Settings, LogOut,
  Menu, X, Plus, ChevronRight, Video,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

/* Exact Columbia palette */
const CU = {
  navyHeader: '#000D74',
  navyDeep:   '#000A5E',
  green:      '#0038A8',
  greenDark:  '#002D8A',
  gold:       '#B9D9EB',
  blue:       '#0038A8',
  blueLight:  '#B9D9EB',
};

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/meetings', icon: Mic, label: 'Meetings' },
  { to: '/bots', icon: Video, label: 'Meeting Bots' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { error } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      error('Sign-out failed. Please try again.');
    }
  };

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F5F5F5', overflow: 'hidden' }}>
      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <aside
        style={{
          width: 240,
          background: CU.navyHeader,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          zIndex: 50,
        }}
        className="hidden-mobile"
      >
        <SidebarContent
          navItems={NAV_ITEMS}
          location={location}
          user={user}
          initials={initials}
          onLogout={handleLogout}
          onNavigate={() => {}}
        />
      </aside>

      {/* ── Mobile overlay ───────────────────────────────────────── */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(20,30,51,0.6)',
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          width: 240,
          background: CU.navyHeader,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 101,
          transition: 'transform 0.3s ease',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <button
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'absolute', top: 16, right: -44,
            background: CU.navyHeader, border: 'none',
            color: '#fff', cursor: 'pointer',
            padding: '8px 10px',
            display: 'flex', alignItems: 'center',
          }}
        >
          <X size={20} />
        </button>
        <SidebarContent
          navItems={NAV_ITEMS}
          location={location}
          user={user}
          initials={initials}
          onLogout={handleLogout}
          onNavigate={() => setMobileOpen(false)}
        />
      </aside>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Mobile header */}
        <header
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            height: 56,
            background: CU.navyHeader,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            flexShrink: 0,
            zIndex: 40,
          }}
          className="show-mobile"
        >
          <button
            onClick={() => setMobileOpen(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex' }}
          >
            <Menu size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/torios-logo-white.png" alt="ToriOS" style={{ height: 32, width: 'auto' }} />
          </div>
          <Link
            to="/meetings/new"
            style={{
              background: CU.green, color: '#fff',
              padding: '8px 14px',
              fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
              textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.04em',
            }}
          >
            <Plus size={14} />
            New
          </Link>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ── Sidebar content ──────────────────────────────────────────────────────────
interface SidebarContentProps {
  navItems: typeof NAV_ITEMS;
  location: ReturnType<typeof useLocation>;
  user: ReturnType<typeof useAuth>['user'];
  initials: string;
  onLogout: () => void;
  onNavigate: () => void;
}

function SidebarContent({ navItems, location, user, initials, onLogout, onNavigate }: SidebarContentProps) {
  return (
    <>
      {/* Gold accent bar at top */}
      <div style={{ height: 4, background: CU.gold, flexShrink: 0 }} />

      {/* Logo */}
      <div style={{ padding: '20px 20px 14px' }}>
        <Link
          to="/dashboard"
          onClick={onNavigate}
          style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
        >
          <img
            src="/torios-logo-white.png"
            alt="ToriOS"
            style={{ height: 40, width: 'auto' }}
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement;
              el.style.display = 'none';
            }}
          />
        </Link>
        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', marginTop: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Your AI Assistant, Everywhere
        </p>
      </div>

      {/* New Meeting CTA — Green like Columbia nav */}
      <div style={{ padding: '0 16px 14px' }}>
        <Link
          to="/meetings/new"
          onClick={onNavigate}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8,
            background: CU.green,
            color: '#fff',
            padding: '10px 16px',
            fontSize: 12, fontWeight: 700,
            textDecoration: 'none',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            transition: 'background 150ms ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = CU.greenDark;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = CU.green;
          }}
        >
          <Plus size={14} />
          New Meeting
        </Link>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 16px 10px' }} />

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0 12px' }}>
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || location.pathname.startsWith(to + '/');
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                marginBottom: 2,
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.50)',
                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                borderLeft: isActive ? `3px solid ${CU.green}` : '3px solid transparent',
                textDecoration: 'none',
                transition: 'all 120ms ease',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.50)';
                }
              }}
            >
              <Icon size={16} />
              {label}
              {isActive && (
                <ChevronRight size={13} style={{ marginLeft: 'auto', opacity: 0.5 }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div style={{
        padding: '14px 16px 20px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 32, height: 32,
            background: CU.green,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name || 'User'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.35)',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
            padding: '8px 12px',
            transition: 'all 120ms ease',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(198,40,40,0.15)';
            (e.currentTarget as HTMLElement).style.color = '#FCA5A5';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'none';
            (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)';
          }}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </>
  );
}
