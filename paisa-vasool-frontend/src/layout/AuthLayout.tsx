import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex' }}>
      <aside className="auth-layout-left">
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 80% 60% at 20% 30%, rgba(255,255,255,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 85% 80%, rgba(255,255,255,0.04) 0%, transparent 60%)
          `,
        }} />
        <div className="grid-pattern absolute inset-0" style={{ opacity: 0.06 }} />
        <div className="glow-orb" style={{ width: 400, height: 400, background: 'rgba(255,255,255,0.15)', top: '-15%', left: '-14%' }} />
        <div className="glow-orb" style={{ width: 240, height: 240, background: 'rgba(147,197,253,0.2)', bottom: '8%', right: '-10%', animationDelay: '2s' }} />

        <div style={{
          position: 'relative', zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', gap: '2.125rem',
          width: '100%', maxWidth: 308,
        }}>
          <div className="animate-float" style={{ position: 'relative', width: 82, height: 82 }}>
            <div style={{
              position: 'absolute', inset: -7, borderRadius: 27,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
            }} />
            <div style={{
              position: 'relative', width: '100%', height: '100%', borderRadius: 22,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 14px 40px rgba(0,0,0,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="font-display" style={{ fontSize: '2.125rem', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
                ₹
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <h1 className="font-display" style={{
              fontSize: 'clamp(2.75rem, 3.6vw, 3.5rem)',
              fontWeight: 800, lineHeight: 1.06,
              letterSpacing: '-0.03em',
              color: '#ffffff',
            }}>
              Paisa<br />
              <span style={{ color: '#bfdbfe' }}>
                Vasool
              </span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.92rem', fontWeight: 300, lineHeight: 1.78 }}>
              Your money, working harder.<br />
              Every rupee accounted for.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', width: '100%' }}>
            {[
              { value: '10K+', label: 'Active Users' },
              { value: '₹2Cr+', label: 'Tracked Monthly' },
            ].map(({ value, label }) => (
              <div key={label}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 14, padding: '1rem 1.1rem', textAlign: 'left',
                  transition: 'background 0.25s, transform 0.25s var(--ease-out-expo)',
                  cursor: 'default',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.15)'; el.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.1)'; el.style.transform = 'translateY(0)'; }}
              >
                <p className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', lineHeight: 1 }}>
                  {value}
                </p>
                <p style={{ fontSize: '0.63rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', justifyContent: 'center' }}>
            {['Smart Budgeting', 'Live Tracking', 'UPI Ready'].map(label => (
              <span key={label} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.3rem 0.7rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 99,
                fontSize: '0.67rem',
                color: '#ffffff',
                fontWeight: 500,
                letterSpacing: '0.015em',
              }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </aside>

      <main className="auth-layout-right">
        <div className="form-container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="mobile-logo">
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-dim))',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="font-display" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>₹</span>
            </div>
            <span className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
              PaisaVasool
            </span>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
