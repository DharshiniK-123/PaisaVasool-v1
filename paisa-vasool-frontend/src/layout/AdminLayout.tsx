import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { ROUTES } from '../config/constants';
import { logoutThunk, logout } from '../features/auth';


const IconDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>
  </svg>
);

const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const IconMenu = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const IconChevronRight = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const ADMIN_NAV = [
  { label: 'Dashboard',       to: ROUTES.ADMIN_DASHBOARD, icon: <IconDashboard /> },
  { label: 'User Management', to: ROUTES.ADMIN_USERS,     icon: <IconUsers /> },
];

const ADMIN_PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  [ROUTES.ADMIN_DASHBOARD]: { title: 'Admin Dashboard',   subtitle: 'Overview of your payment operations' },
  [ROUTES.ADMIN_USERS]:     { title: 'User Management',   subtitle: 'Create and manage finance associate accounts' },
};

function AdminSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(s => s.auth.user);

  const handleLogout = async () => {
    dispatch(logout());
    navigate(ROUTES.LOGIN);
    dispatch(logoutThunk());
  };

  return (
    <aside style={{
      width: collapsed ? 60 : 220,
      minHeight: '100vh',
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.3s var(--ease-out-expo)',
      position: 'fixed', top: 0, left: 0, bottom: 0,
      zIndex: 30, overflow: 'hidden', flexShrink: 0,
      boxShadow: '1px 0 0 var(--color-border)',
    }}>
      <div style={{
        padding: collapsed ? '0 0' : '0 1.125rem',
        height: 60, borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: '0.5rem', flexShrink: 0,
        background: 'var(--color-surface)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
          <div style={{
            width: 32, height: 32, flexShrink: 0, borderRadius: 9,
            background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dim) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
          }}>
            <span className="font-display" style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>₹</span>
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <span className="font-display" style={{
                fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)',
                letterSpacing: '-0.01em', whiteSpace: 'nowrap',
                animation: 'fadeIn 0.2s ease both', display: 'block',
              }}>
                PaisaVasool
              </span>
              <span style={{
                fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.15em',
                color: 'var(--color-accent)', fontWeight: 600, whiteSpace: 'nowrap',
              }}>
                Admin Panel
              </span>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={onToggle}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-muted)', padding: '0.3rem',
              display: 'flex', borderRadius: 6, flexShrink: 0,
              transition: 'color 0.15s',
            }}
            title="Collapse sidebar"
          >
            <IconMenu />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={onToggle}
          style={{
            margin: '0.625rem auto 0', background: 'none',
            border: '1px solid var(--color-border)', borderRadius: 8,
            padding: '0.4rem', cursor: 'pointer', color: 'var(--color-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
          }}
          title="Expand sidebar"
        >
          <IconChevronRight />
        </button>
      )}

      <nav style={{
        flex: 1, padding: '0.75rem 0.5rem',
        display: 'flex', flexDirection: 'column', gap: '0.1rem',
        overflowY: 'auto', overflowX: 'hidden',
      }}>
        {ADMIN_NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: collapsed ? '0.65rem' : '0.6rem 0.875rem',
              borderRadius: 9, textDecoration: 'none', cursor: 'pointer',
              justifyContent: collapsed ? 'center' : 'flex-start',
              fontSize: '0.82rem', fontWeight: isActive ? 600 : 400,
              fontFamily: "'DM Sans', sans-serif",
              color: isActive ? 'var(--color-accent)' : 'var(--color-muted)',
              background: isActive ? 'var(--color-accent-soft)' : 'transparent',
              border: isActive ? '1px solid rgba(37,99,235,0.12)' : '1px solid transparent',
              transition: 'all 0.18s',
              whiteSpace: 'nowrap', overflow: 'hidden',
            })}
          >
            <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
            {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div style={{
        padding: '0.625rem 0.5rem',
        borderTop: '1px solid var(--color-border)',
        display: 'flex', flexDirection: 'column', gap: '0.1rem',
      }}>
        {!collapsed && user && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.6rem 0.875rem', borderRadius: 9,
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            marginBottom: '0.25rem',
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(37,99,235,0.1)',
              border: '1px solid rgba(37,99,235,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-accent)' }}>
                {((user as any).email?.[0] ?? 'A').toUpperCase()}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: '0.72rem', fontWeight: 500,
                color: 'var(--color-text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {(user as any).email}
              </p>
              <p style={{ fontSize: '0.62rem', color: 'var(--color-accent)', fontWeight: 600 }}>Admin</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: collapsed ? '0.65rem' : '0.6rem 0.875rem',
            borderRadius: 9, cursor: 'pointer',
            border: '1px solid transparent', background: 'transparent',
            color: 'var(--color-muted)', fontSize: '0.82rem',
            fontWeight: 400, fontFamily: "'DM Sans', sans-serif",
            transition: 'all 0.18s', justifyContent: collapsed ? 'center' : 'flex-start',
            whiteSpace: 'nowrap', width: '100%',
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = '#ef4444'; el.style.borderColor = 'rgba(239,68,68,0.12)'; el.style.background = 'rgba(239,68,68,0.05)'; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = 'var(--color-muted)'; el.style.borderColor = 'transparent'; el.style.background = 'transparent'; }}
        >
          <span style={{ flexShrink: 0, display: 'flex' }}><IconLogout /></span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

function AdminTopBar() {
  const location = useLocation();
  const page = ADMIN_PAGE_TITLES[location.pathname] ?? { title: 'Admin Panel', subtitle: '' };
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <header className="dashboard-header">
      <div>
        <h1 className="font-display" style={{
          fontSize: '1.1rem', fontWeight: 700,
          color: 'var(--color-text)', letterSpacing: '-0.01em', lineHeight: 1.2,
        }}>
          {page.title}
        </h1>
        <p style={{ fontSize: '0.68rem', color: 'var(--color-muted)', marginTop: '0.1rem' }}>
          {page.subtitle || dateStr}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--color-muted)' }}>{dateStr}</span>
        <div className="session-badge">
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--color-accent)', display: 'inline-block',
            boxShadow: '0 0 6px var(--color-accent)',
            animation: 'pulseSlow 2s ease-in-out infinite',
          }} />
          Live
        </div>
      </div>
    </header>
  );
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const SIDEBAR_W = collapsed ? 60 : 220;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex' }}>
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div style={{
        marginLeft: SIDEBAR_W,
        flex: 1, minWidth: 0,
        display: 'flex', flexDirection: 'column',
        minHeight: '100vh',
        transition: 'margin-left 0.3s var(--ease-out-expo)',
        position: 'relative', zIndex: 1,
      }}>
        <AdminTopBar />
        <main style={{ flex: 1, padding: '1.75rem 2rem', overflowX: 'hidden' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
