import { useAuth } from '../hooks/useAuth';

export default function DashboardPage() {
  const { logout, isLoading, user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Navbar ── */}
      <header className="dashboard-header">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'rgba(52,211,153,0.08)',
            border: '1px solid rgba(52,211,153,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="font-display"
              style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-accent)', lineHeight: 1 }}>
              ₹
            </span>
          </div>
          <span className="font-display"
            style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
            PaisaVasool
          </span>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>

          {/* User chip — hidden on mobile */}
          {user?.first_name && (
            <div className="user-chip">
              <div className="user-avatar">
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', lineHeight: 1 }}>
                  {user.first_name.charAt(0)}
                </span>
              </div>
              <span style={{ fontSize: '0.775rem', color: 'var(--color-text)', fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.first_name}
              </span>
            </div>
          )}

          {/* Sign out button */}
          <button onClick={logout} disabled={isLoading} className="btn-secondary">
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="spinner" />
                <span style={{ display: 'none' }} className="sm:inline">Logging out…</span>
              </span>
            ) : 'Sign Out'}
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1.5rem' }}>
        <div className="animate-slide-up" style={{ textAlign: 'center', width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>

          {/* Logo mark */}
          <div className="animate-float glow-accent-lg"
            style={{
              width: 68, height: 68, borderRadius: 18,
              background: 'var(--color-surface)',
              border: '1px solid rgba(52,211,153,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <span className="font-display" style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-accent)', lineHeight: 1 }}>₹</span>
          </div>

          {/* Welcome text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h1 className="font-display" style={{
              fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700,
              color: 'var(--color-text)', letterSpacing: '-0.015em',
            }}>
              Welcome{user?.first_name ? `, ${user.first_name.split(' ')[0]}` : ''}!
            </h1>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', lineHeight: 1.65, maxWidth: '30ch', margin: '0 auto' }}>
              You're successfully authenticated. Dashboard features coming soon.
            </p>
          </div>

          {/* Session badge */}
          <div className="session-badge">
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--color-accent)',
              animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
              flexShrink: 0,
            }} />
            Session Active
          </div>

          {/* Placeholder stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
            {[
              { label: 'Total Balance', value: '—', icon: '' },
              { label: 'This Month',    value: '—', icon: '' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="stat-card" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '1.1rem' }}>{icon}</span>
                <p className="font-display" style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1 }}>{value}</p>
                <p style={{ fontSize: '0.69rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}