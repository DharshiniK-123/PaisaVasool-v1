import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="noise-overlay" style={{ minHeight: '100vh', background: 'var(--color-bg)', display: 'flex' }}>

      
      <aside className="auth-layout-left">

        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 90% 65% at 25% 35%, rgba(52,211,153,0.055) 0%, transparent 65%),
            radial-gradient(ellipse 50% 45% at 85% 85%, rgba(52,211,153,0.03) 0%, transparent 60%)
          `,
        }} />

        <div className="grid-pattern absolute inset-0" style={{ opacity: 0.03 }} />

        <div className="glow-orb" style={{ width: 440, height: 440, background: 'var(--color-accent)', top: '-18%', left: '-16%', animationDelay: '0s' }} />
        <div className="glow-orb" style={{ width: 260, height: 260, background: '#6ee7b7', bottom: '6%', right: '-12%', animationDelay: '2s' }} />
        <div className="glow-orb" style={{ width: 180, height: 180, background: 'var(--color-accent)', top: '58%', left: '8%', animationDelay: '3.5s', opacity: 0.025 }} />

        <div style={{ position: 'absolute', top: 0, left: 0, width: 200, height: 200, background: 'radial-gradient(circle at 0% 0%, rgba(52,211,153,0.07), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 220, height: 220, background: 'radial-gradient(circle at 100% 100%, rgba(52,211,153,0.045), transparent 70%)', pointerEvents: 'none' }} />

        <div style={{
          position: 'absolute', right: 0, top: '8%', bottom: '8%', width: 1,
          background: 'linear-gradient(to bottom, transparent, rgba(52,211,153,0.22) 35%, rgba(52,211,153,0.22) 65%, transparent)',
        }} />

        <div style={{
          position: 'relative', zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', gap: '2.125rem',
          width: '100%', maxWidth: 308,
        }}>

          <div className="animate-float" style={{ position: 'relative', width: 82, height: 82 }}>
          
            <div style={{
              position: 'absolute', inset: -7, borderRadius: 27,
              background: 'rgba(52,211,153,0.06)',
              border: '1px solid rgba(52,211,153,0.11)',
            }} />
            
            <div style={{
              position: 'relative', width: '100%', height: '100%', borderRadius: 22,
              background: 'linear-gradient(150deg, var(--color-surface-3) 0%, var(--color-surface) 100%)',
              border: '1px solid rgba(52,211,153,0.28)',
              boxShadow: '0 0 0 1px rgba(52,211,153,0.07), 0 14px 40px rgba(0,0,0,0.55), 0 0 36px rgba(52,211,153,0.13)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="font-display" style={{ fontSize: '2.125rem', fontWeight: 800, color: 'var(--color-accent)', lineHeight: 1 }}>
                ₹
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <h1 className="font-display" style={{
              fontSize: 'clamp(2.75rem, 3.6vw, 3.5rem)',
              fontWeight: 800, lineHeight: 1.06,
              letterSpacing: '-0.03em',
              color: 'var(--color-text)',
            }}>
              Paisa<br />
              <span style={{ color: 'var(--color-accent)', textShadow: '0 0 48px rgba(52,211,153,0.28)' }}>
                Vasool
              </span>
            </h1>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.92rem', fontWeight: 300, lineHeight: 1.78 }}>
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
                  background: 'linear-gradient(150deg, var(--color-surface-2) 0%, var(--color-surface) 100%)',
                  border: '1px solid rgba(255,255,255,0.055)',
                  borderRadius: 14, padding: '1rem 1.1rem', textAlign: 'left',
                  transition: 'border-color 0.25s var(--ease-in-out), transform 0.25s var(--ease-out-expo)',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = 'rgba(52,211,153,0.25)';
                  el.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = 'rgba(255,255,255,0.055)';
                  el.style.transform = 'translateY(0)';
                }}
              >
                <p className="font-display" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-accent)', lineHeight: 1 }}>
                  {value}
                </p>
                <p style={{ fontSize: '0.63rem', color: 'var(--color-muted)', marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', justifyContent: 'center' }}>
            {[
              { label: 'Smart Budgeting', dot: '' },
              { label: 'Live Tracking',   dot: '' },
              { label: 'UPI Ready',       dot: '' },
            ].map(({ label, dot }) => (
              <span key={label} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.3rem 0.7rem',
                background: 'rgba(52,211,153,0.055)',
                border: '1px solid rgba(52,211,153,0.13)',
                borderRadius: 99,
                fontSize: '0.67rem',
                color: 'var(--color-accent)',
                fontWeight: 500,
                letterSpacing: '0.015em',
              }}>
                <span style={{ fontSize: '0.65rem' }}>{dot}</span>
                {label}
              </span>
            ))}
          </div>

          

        </div>
      </aside>

      <main className="auth-layout-right">

        <div style={{
          position: 'fixed', top: 0, right: 0, width: '55%', height: '100%', pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(ellipse 55% 35% at 85% 18%, rgba(52,211,153,0.022), transparent 60%)',
        }} />

        <div className="form-container" style={{ position: 'relative', zIndex: 1 }}>

          <div className="mobile-logo">
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'var(--color-surface-2)',
              border: '1px solid rgba(52,211,153,0.22)',
              boxShadow: '0 0 16px rgba(52,211,153,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="font-display" style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-accent)', lineHeight: 1 }}>₹</span>
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