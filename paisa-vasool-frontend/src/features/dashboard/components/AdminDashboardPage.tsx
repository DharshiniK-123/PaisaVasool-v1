import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale,
  BarElement, BarController,
  DoughnutController,
  LineElement, LineController,
  PointElement, Filler,
  Title,
} from 'chart.js';
import { adminService } from '../../UserManagement/services/adminService';
import type { FinanceUser, UserActivityStat } from '../../UserManagement/types';
import { ROUTES } from '../../../config/constants';

ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale,
  BarElement, BarController,
  DoughnutController,
  LineElement, LineController,
  PointElement, Filler,
  Title,
);


const IconUsers    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconActive   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const IconInactive = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>;
const IconNewUser  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>;
const IconActivity = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const IconRefresh  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const IconPower    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>;
const IconInvoice  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IconPayment  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IconMatch    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;

function Spinner({ size = 16, color = 'var(--color-accent)' }: { size?: number; color?: string }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', border: `2px solid ${color}33`, borderTopColor: color, animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />;
}
function SkeletonBar({ w = '100%', h = 14 }: { w?: string | number; h?: number }) {
  return <div style={{ width: w, height: h, borderRadius: 4, background: 'var(--color-surface-2)', animation: 'shimmer 1.4s ease infinite' }} />;
}

function ChartCard({ title, subtitle, children, loading }: {
  title: string; subtitle?: string; children: React.ReactNode; loading?: boolean;
}) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
        <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text)' }}>{title}</p>
        {subtitle && <p style={{ fontSize: '0.65rem', color: 'var(--color-muted)', marginTop: '0.15rem' }}>{subtitle}</p>}
      </div>
      <div style={{ padding: '1.25rem' }}>
        {loading
          ? <SkeletonBar h={200} />
          : children
        }
      </div>
    </div>
  );
}


function ActiveInactiveChart({ active, inactive }: { active: number; inactive: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new ChartJS(canvasRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Active', 'Inactive'],
        datasets: [{
          data: [active || 0, inactive || 0],
          backgroundColor: ['rgba(22,163,74,0.85)', 'rgba(239,68,68,0.75)'],
          borderColor:     ['rgba(22,163,74,1)',    'rgba(239,68,68,1)'],
          borderWidth: 2,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'rgb(148,163,184)',
              font: { family: "'DM Sans', sans-serif", size: 12 },
              padding: 16,
              usePointStyle: true,
              pointStyleWidth: 8,
            },
          },
          tooltip: {
            backgroundColor: 'rgba(15,23,42,0.9)',
            titleColor: '#fff',
            bodyColor: 'rgb(148,163,184)',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 10,
            callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} users` },
          },
        },
      },
    });
    return () => { chartRef.current?.destroy(); };
  }, [active, inactive]);

  const total = active + inactive;
  const pct   = total > 0 ? Math.round((active / total) * 100) : 0;

  return (
    <div style={{ position: 'relative', height: 220 }}>
      <canvas ref={canvasRef} />
      <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', pointerEvents: 'none' }}>
        <p style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }} className="font-display">{pct}%</p>
        <p style={{ fontSize: '0.6rem', color: 'var(--color-muted)', marginTop: '0.2rem' }}>active</p>
      </div>
    </div>
  );
}


function UserGrowthChart({ users }: { users: FinanceUser[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<ChartJS | null>(null);

  const now    = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), count: 0 };
  });
  users.forEach(u => {
    if (!u.created_at) return;
    const d = new Date(u.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const m = months.find(m => m.key === key);
    if (m) m.count++;
  });
  let cum = 0;
  const cumCounts = months.map(m => { cum += m.count; return cum; });

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new ChartJS(canvasRef.current, {
      type: 'line',
      data: {
        labels: months.map(m => m.label),
        datasets: [
          {
            label: 'New Users',
            data: months.map(m => m.count),
            borderColor: 'rgba(37,99,235,1)',
            backgroundColor: 'rgba(37,99,235,0.1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(37,99,235,1)',
            pointRadius: 4, pointHoverRadius: 6,
            tension: 0.4, fill: true, yAxisID: 'y',
          },
          {
            label: 'Total Users',
            data: cumCounts,
            borderColor: 'rgba(52,211,153,1)',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 4],
            pointBackgroundColor: 'rgba(52,211,153,1)',
            pointRadius: 4, pointHoverRadius: 6,
            tension: 0.4, fill: false, yAxisID: 'y',
          },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', align: 'end', labels: { color: 'rgb(148,163,184)', font: { family: "'DM Sans', sans-serif", size: 11 }, padding: 12, usePointStyle: true, pointStyleWidth: 8 } },
          tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', titleColor: '#fff', bodyColor: 'rgb(148,163,184)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 10 },
        },
        scales: {
          x: { ticks: { color: 'rgb(148,163,184)', font: { family: "'DM Sans', sans-serif", size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { beginAtZero: true, ticks: { color: 'rgb(148,163,184)', font: { family: "'DM Sans', sans-serif", size: 11 }, stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.06)' } },
        },
      },
    });
    return () => { chartRef.current?.destroy(); };
  }, [users]);

  return <div style={{ height: 220 }}><canvas ref={canvasRef} /></div>;
}


function UserActivityChart({ users, activityMap }: { users: FinanceUser[]; activityMap: Record<number, UserActivityStat> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<ChartJS | null>(null);

  const sorted = users
    .filter(u => activityMap[u.id])
    .sort((a, b) => {
      const sa = activityMap[a.id], sb = activityMap[b.id];
      return (sb.invoices_uploaded + sb.payments_uploaded + sb.matches_made) - (sa.invoices_uploaded + sa.payments_uploaded + sa.matches_made);
    })
    .slice(0, 8);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new ChartJS(canvasRef.current, {
      type: 'bar',
      data: {
        labels: sorted.map(u => u.first_name),
        datasets: [
          { label: 'Invoices', data: sorted.map(u => activityMap[u.id].invoices_uploaded), backgroundColor: 'rgba(37,99,235,0.8)', borderColor: 'rgba(37,99,235,1)', borderWidth: 1, borderRadius: 4 },
          { label: 'Payments', data: sorted.map(u => activityMap[u.id].payments_uploaded), backgroundColor: 'rgba(96,165,250,0.8)', borderColor: 'rgba(96,165,250,1)', borderWidth: 1, borderRadius: 4 },
          { label: 'Matches',  data: sorted.map(u => activityMap[u.id].matches_made),      backgroundColor: 'rgba(52,211,153,0.8)', borderColor: 'rgba(52,211,153,1)', borderWidth: 1, borderRadius: 4 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', align: 'end', labels: { color: 'rgb(148,163,184)', font: { family: "'DM Sans', sans-serif", size: 11 }, padding: 12, usePointStyle: true, pointStyleWidth: 8 } },
          tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', titleColor: '#fff', bodyColor: 'rgb(148,163,184)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 10 },
        },
        scales: {
          x: { ticks: { color: 'rgb(148,163,184)', font: { family: "'DM Sans', sans-serif", size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { beginAtZero: true, ticks: { color: 'rgb(148,163,184)', font: { family: "'DM Sans', sans-serif", size: 11 }, stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.06)' } },
        },
      },
    });
    return () => { chartRef.current?.destroy(); };
  }, [users, activityMap]);

  if (sorted.length === 0) return <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', fontSize: '0.82rem' }}>No activity data yet</div>;
  return <div style={{ height: 240 }}><canvas ref={canvasRef} /></div>;
}


function TopUsersChart({ users, activityMap }: { users: FinanceUser[]; activityMap: Record<number, UserActivityStat> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<ChartJS | null>(null);

  const ranked = users
    .filter(u => activityMap[u.id])
    .map(u => ({ name: `${u.first_name} ${u.last_name}`, total: activityMap[u.id].invoices_uploaded + activityMap[u.id].payments_uploaded + activityMap[u.id].matches_made }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const palette = ['rgba(37,99,235,0.85)', 'rgba(52,211,153,0.85)', 'rgba(96,165,250,0.85)', 'rgba(245,158,11,0.85)', 'rgba(168,85,247,0.85)', 'rgba(236,72,153,0.85)'];

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();
    chartRef.current = new ChartJS(canvasRef.current, {
      type: 'bar',
      data: {
        labels: ranked.map(r => r.name),
        datasets: [{
          label: 'Total Activity',
          data: ranked.map(r => r.total),
          backgroundColor: ranked.map((_, i) => palette[i % palette.length]),
          borderColor: ranked.map((_, i) => palette[i % palette.length].replace('0.85', '1')),
          borderWidth: 1, borderRadius: 6,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', titleColor: '#fff', bodyColor: 'rgb(148,163,184)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 10, callbacks: { label: ctx => ` Total: ${ctx.parsed.x} actions` } },
        },
        scales: {
          x: { beginAtZero: true, ticks: { color: 'rgb(148,163,184)', font: { family: "'DM Sans', sans-serif", size: 11 }, stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.06)' } },
          y: { ticks: { color: 'rgb(148,163,184)', font: { family: "'DM Sans', sans-serif", size: 11 } }, grid: { display: false } },
        },
      },
    });
    return () => { chartRef.current?.destroy(); };
  }, [users, activityMap]);

  if (ranked.length === 0) return <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', fontSize: '0.82rem' }}>No activity data yet</div>;
  return <div style={{ height: Math.max(160, ranked.length * 44) }}><canvas ref={canvasRef} /></div>;
}


function StatCard({ label, value, icon, color, glow, loading, sub }: {
  label: string; value: number | string; icon: React.ReactNode;
  color: string; glow: string; loading: boolean; sub?: string;
}) {
  return (
    <div
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, minWidth: 160, transition: 'box-shadow 0.2s, transform 0.2s', position: 'relative', overflow: 'hidden' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 24px ${glow}`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
    >
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: glow, filter: 'blur(24px)', opacity: 0.35, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--color-muted)', fontWeight: 600 }}>{label}</p>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
      </div>
      {loading ? <SkeletonBar w="60%" h={32} /> : <p className="font-display" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>{value}</p>}
      {sub && !loading && <p style={{ fontSize: '0.68rem', color: 'var(--color-muted)' }}>{sub}</p>}
      {sub && loading && <SkeletonBar w="80%" h={12} />}
    </div>
  );
}


function ActivityBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(4, (value / max) * 100) : 4;
  return (
    <div style={{ width: '100%', height: 5, borderRadius: 99, background: 'var(--color-surface-2)', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: color, transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
    </div>
  );
}


function UserActivityRow({ user, stats, maxInvoices, maxPayments, maxMatches, rank, onToggle, toggling }: {
  user: FinanceUser; stats: UserActivityStat | null; maxInvoices: number; maxPayments: number; maxMatches: number; rank: number; onToggle: (u: FinanceUser) => void; toggling: boolean;
}) {
  const isActive   = user.is_active === 'active';
  const initials   = `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase();
  const joinedDate = user.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—';
  const lastActive = stats?.last_active ? (() => {
    const d = new Date(stats.last_active), now = new Date();
    const diffH = Math.floor((now.getTime() - d.getTime()) / 3600000);
    const diffD = Math.floor(diffH / 24);
    if (diffH < 1) return 'Just now'; if (diffH < 24) return `${diffH}h ago`; if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  })() : '—';
  const avatarColors = [['#6366f1','#6366f120'],['#0ea5e9','#0ea5e920'],['#10b981','#10b98120'],['#f59e0b','#f59e0b20'],['#ec4899','#ec489920'],['#8b5cf6','#8b5cf620']];
  const [fg, bg] = avatarColors[user.id % avatarColors.length];

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '32px 2.2fr 1fr 1fr 1fr 1fr 120px', gap: '1rem', padding: '0.875rem 1.25rem', alignItems: 'center', borderBottom: '1px solid var(--color-border)', opacity: isActive ? 1 : 0.55, transition: 'background 0.15s' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-2)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
    >
      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: rank <= 3 ? '#f59e0b' : 'var(--color-faint)', textAlign: 'center' }}>{rank <= 3 ? ['🥇','🥈','🥉'][rank - 1] : `#${rank}`}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: bg, border: `1.5px solid ${fg}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: fg }}>{initials}</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.first_name} {user.last_name}</p>
          <p style={{ fontSize: '0.68rem', color: 'var(--color-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text)' }}>{stats ? stats.invoices_uploaded : <span style={{ color: 'var(--color-faint)' }}>—</span>}</span>
        {stats && <ActivityBar value={stats.invoices_uploaded} max={maxInvoices} color="var(--color-accent)" />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text)' }}>{stats ? stats.payments_uploaded : <span style={{ color: 'var(--color-faint)' }}>—</span>}</span>
        {stats && <ActivityBar value={stats.payments_uploaded} max={maxPayments} color="#60a5fa" />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text)' }}>{stats ? stats.matches_made : <span style={{ color: 'var(--color-faint)' }}>—</span>}</span>
        {stats && <ActivityBar value={stats.matches_made} max={maxMatches} color="#34d399" />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>{lastActive}</span>
        <span style={{ fontSize: '0.62rem', color: 'var(--color-faint)' }}>Joined {joinedDate}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <span style={{ padding: '0.18rem 0.55rem', borderRadius: 99, fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: isActive ? 'rgba(22,163,74,0.08)' : 'rgba(239,68,68,0.08)', color: isActive ? '#15803d' : '#b91c1c', border: `1px solid ${isActive ? 'rgba(22,163,74,0.2)' : 'rgba(239,68,68,0.2)'}`, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: isActive ? '#16a34a' : '#ef4444' }} />
          {isActive ? 'Active' : 'Off'}
        </span>
        <button onClick={() => onToggle(user)} disabled={toggling} title={isActive ? 'Deactivate' : 'Activate'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, cursor: toggling ? 'not-allowed' : 'pointer', border: `1px solid ${isActive ? 'rgba(239,68,68,0.2)' : 'rgba(22,163,74,0.2)'}`, background: isActive ? 'rgba(239,68,68,0.06)' : 'rgba(22,163,74,0.06)', color: isActive ? '#b91c1c' : '#15803d', opacity: toggling ? 0.5 : 1, transition: 'all 0.15s' }}>
          {toggling ? <Spinner size={11} color={isActive ? '#b91c1c' : '#15803d'} /> : <IconPower />}
        </button>
      </div>
    </div>
  );
}


function ConfirmDialog({ user, onConfirm, onCancel, loading }: { user: FinanceUser; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  const isActive = user.is_active === 'active';
  const action = isActive ? 'Deactivate' : 'Activate';
  const ac = isActive ? '#ef4444' : '#16a34a';
  const bg = isActive ? 'rgba(239,68,68,0.06)' : 'rgba(22,163,74,0.06)';
  const bc = isActive ? 'rgba(239,68,68,0.2)' : 'rgba(22,163,74,0.2)';
  return (
    <>
      <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', zIndex: 60 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '100%', maxWidth: 420, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, zIndex: 70, padding: '1.75rem', boxShadow: '0 24px 64px rgba(15,40,90,0.18)', animation: 'popIn 0.2s cubic-bezier(0.16,1,0.3,1) both' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, marginBottom: '1.25rem', background: bg, border: `1px solid ${bc}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ac }}><IconPower /></div>
        <h3 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.5rem' }}>{action} User?</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          {isActive ? <>Deactivating <strong style={{ color: 'var(--color-text)' }}>{user.first_name} {user.last_name}</strong> will revoke their platform access.</> : <>Re-activating <strong style={{ color: 'var(--color-text)' }}>{user.first_name} {user.last_name}</strong> will restore their access.</>}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onCancel} disabled={loading} style={{ flex: 1, padding: '0.7rem', borderRadius: 9, border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-muted)', fontSize: '0.875rem', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ flex: 1, padding: '0.7rem', borderRadius: 9, border: `1px solid ${bc}`, background: bg, color: ac, fontSize: '0.875rem', fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: loading ? 0.6 : 1 }}>
            {loading ? <Spinner size={14} color={ac} /> : <IconPower />}
            {loading ? 'Updating…' : action}
          </button>
        </div>
      </div>
      <style>{`@keyframes popIn { from { opacity:0; transform:translate(-50%,-48%) scale(0.95); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }`}</style>
    </>
  );
}

const ROLE_COLORS: Record<string, [string, string]> = {
  finance_associate: ['#6366f1', 'rgba(99,102,241,0.1)'],
  admin:             ['#f59e0b', 'rgba(245,158,11,0.1)'],
};


export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [users,        setUsers]        = useState<FinanceUser[]>([]);
  const [activityMap,  setActivityMap]  = useState<Record<number, UserActivityStat>>({});
  const [loadingUsers,    setLoadingUsers]    = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [error,        setError]        = useState('');
  const [successMsg,   setSuccessMsg]   = useState('');
  const [confirmUser,  setConfirmUser]  = useState<FinanceUser | null>(null);
  const [toggling,     setToggling]     = useState<number | null>(null);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [refreshing,   setRefreshing]   = useState(false);

  const fetchUsers = useCallback(async (silent = false) => {
    if (!silent) setLoadingUsers(true);
    setError('');
    try { setUsers(await adminService.listUsers()); }
    catch (err: any) { setError(err?.response?.data?.detail ?? 'Failed to load users.'); }
    finally { setLoadingUsers(false); }
  }, []);

  const fetchActivity = useCallback(async () => {
    setLoadingActivity(true);
    try {
      const stats = await adminService.getUserStats();
      const map: Record<number, UserActivityStat> = {};
      stats.forEach(s => { map[s.user_id] = s; });
      setActivityMap(map);
    } catch { /* endpoint not yet available */ }
    finally { setLoadingActivity(false); }
  }, []);

  useEffect(() => { fetchUsers(); fetchActivity(); }, [fetchUsers, fetchActivity]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUsers(true), fetchActivity()]);
    setRefreshing(false);
  };

  const handleToggleConfirm = async () => {
    if (!confirmUser) return;
    setToggling(confirmUser.id);
    try {
      const updated = await adminService.toggleUserStatus(confirmUser.id);
      setUsers(u => u.map(x => x.id === updated.id ? updated : x));
      const action = updated.is_active === 'active' ? 'activated' : 'deactivated';
      setSuccessMsg(`${updated.first_name} ${updated.last_name} has been ${action}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) { setError(err?.response?.data?.detail ?? 'Failed to update user status.'); }
    finally { setToggling(null); setConfirmUser(null); }
  };

  const activeCount   = users.filter(u => u.is_active === 'active').length;
  const inactiveCount = users.filter(u => u.is_active !== 'active').length;
  const thisMonth     = users.filter(u => { if (!u.created_at) return false; const d = new Date(u.created_at), n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length;
  const totalInvoices = Object.values(activityMap).reduce((s, a) => s + a.invoices_uploaded, 0);
  const totalPayments = Object.values(activityMap).reduce((s, a) => s + a.payments_uploaded, 0);
  const totalMatches  = Object.values(activityMap).reduce((s, a) => s + a.matches_made, 0);
  const hasStats      = Object.keys(activityMap).length > 0;

  const filtered = users
    .filter(u => {
      const q = search.toLowerCase();
      const ms = !q || u.first_name.toLowerCase().includes(q) || u.last_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone_no.includes(q);
      const mf = statusFilter === 'all' || (statusFilter === 'active' && u.is_active === 'active') || (statusFilter === 'inactive' && u.is_active !== 'active');
      return ms && mf;
    })
    .sort((a, b) => {
      const sa = activityMap[a.id], sb = activityMap[b.id];
      if (sa && sb) return (sb.invoices_uploaded + sb.payments_uploaded + sb.matches_made) - (sa.invoices_uploaded + sa.payments_uploaded + sa.matches_made);
      return a.is_active === 'active' ? -1 : 1;
    });

  const maxInvoices = Math.max(1, ...Object.values(activityMap).map(s => s.invoices_uploaded));
  const maxPayments = Math.max(1, ...Object.values(activityMap).map(s => s.payments_uploaded));
  const maxMatches  = Math.max(1, ...Object.values(activityMap).map(s => s.matches_made));
  const roleCounts  = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--color-accent)', fontWeight: 700, marginBottom: '0.25rem' }}>Admin</p>
          <h2 className="font-display" style={{ fontSize: 'clamp(1.375rem, 2.5vw, 1.75rem)', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.02em' }}>Dashboard</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>User activity and platform health overview</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={handleRefresh} disabled={refreshing} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', borderRadius: 9, border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-muted)', fontSize: '0.78rem', fontFamily: "'DM Sans', sans-serif", cursor: refreshing ? 'not-allowed' : 'pointer', opacity: refreshing ? 0.6 : 1 }}>
            <span style={{ display: 'flex', animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }}><IconRefresh /></span>
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button onClick={() => navigate(ROUTES.ADMIN_USERS)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.125rem', borderRadius: 9, border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: '0.78rem', fontWeight: 700, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>
            <IconUsers /> Manage Users
          </button>
        </div>
      </div>

      {error      && <div className="banner banner-error   animate-fade-in"><span className="banner-icon">⚠</span><p>{error}</p></div>}
      {successMsg && <div className="banner banner-success animate-fade-in"><span className="banner-icon">✓</span><p>{successMsg}</p></div>}

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <StatCard label="Total Users"       value={users.length}  icon={<IconUsers />}    color="var(--color-accent)" glow="rgba(37,99,235,0.18)"  loading={loadingUsers} sub={`${roleCounts['finance_associate'] ?? 0} finance associates`} />
        <StatCard label="Active"            value={activeCount}   icon={<IconActive />}   color="#16a34a"             glow="rgba(22,163,74,0.18)"  loading={loadingUsers} sub={users.length > 0 ? `${Math.round((activeCount / users.length) * 100)}% of all users` : undefined} />
        <StatCard label="Inactive"          value={inactiveCount} icon={<IconInactive />} color="#ef4444"             glow="rgba(239,68,68,0.15)"  loading={loadingUsers} sub={inactiveCount > 0 ? 'Require attention' : 'All users active'} />
        <StatCard label="Joined This Month" value={thisMonth}     icon={<IconNewUser />}  color="#f59e0b"             glow="rgba(245,158,11,0.15)" loading={loadingUsers} sub="New signups" />
      </div>

      {!loadingActivity && hasStats && (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Total Invoices Uploaded', value: totalInvoices, icon: <IconInvoice />, color: 'var(--color-accent)' },
            { label: 'Total Payments Uploaded', value: totalPayments, icon: <IconPayment />, color: '#60a5fa' },
            { label: 'Total Matches Made',      value: totalMatches,  icon: <IconMatch />,   color: '#34d399' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, minWidth: 140, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>{s.icon}</div>
              <div>
                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }} className="font-display">{s.value}</p>
                <p style={{ fontSize: '0.65rem', color: 'var(--color-muted)', marginTop: '0.2rem' }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
        <ChartCard title="User Status" subtitle="Active vs inactive breakdown" loading={loadingUsers}>
          {!loadingUsers && <ActiveInactiveChart active={activeCount} inactive={inactiveCount} />}
        </ChartCard>
        <ChartCard title="User Growth" subtitle="New signups & cumulative total (last 6 months)" loading={loadingUsers}>
          {!loadingUsers && <UserGrowthChart users={users} />}
        </ChartCard>
      </div>

      {hasStats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <ChartCard title="Activity Breakdown" subtitle="Invoices, payments & matches per user" loading={loadingActivity}>
            {!loadingActivity && <UserActivityChart users={users} activityMap={activityMap} />}
          </ChartCard>
          <ChartCard title="Top Users" subtitle="Ranked by total actions" loading={loadingActivity}>
            {!loadingActivity && <TopUsersChart users={users} activityMap={activityMap} />}
          </ChartCard>
        </div>
      )}

      {!loadingActivity && !hasStats && (
        <div style={{ padding: '0.875rem 1.25rem', borderRadius: 10, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>⏳</span>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--color-text)' }}>Activity charts will appear here</strong> once users upload documents. Stats are tracked from new uploads onwards.
          </p>
        </div>
      )}

      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', background: 'var(--color-surface-2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--color-accent-soft)', border: '1px solid rgba(37,99,235,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent)' }}><IconActivity /></div>
            <div>
              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text)' }}>User Activity</p>
              <p style={{ fontSize: '0.62rem', color: 'var(--color-muted)' }}>{loadingUsers ? 'Loading…' : `${filtered.length} of ${users.length} users`}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '0.4rem 0.75rem', minWidth: 200 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--color-muted)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--color-text)', fontSize: '0.78rem', fontFamily: "'DM Sans', sans-serif", flex: 1 }} />
            </div>
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              {(['all', 'active', 'inactive'] as const).map(f => (
                <button key={f} onClick={() => setStatusFilter(f)} style={{ padding: '0.32rem 0.75rem', borderRadius: 99, fontSize: '0.7rem', fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s', border: statusFilter === f ? f === 'active' ? '1px solid rgba(22,163,74,0.3)' : f === 'inactive' ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(37,99,235,0.3)' : '1px solid var(--color-border)', background: statusFilter === f ? f === 'active' ? 'rgba(22,163,74,0.08)' : f === 'inactive' ? 'rgba(239,68,68,0.08)' : 'var(--color-accent-soft)' : 'transparent', color: statusFilter === f ? f === 'active' ? '#15803d' : f === 'inactive' ? '#b91c1c' : 'var(--color-accent)' : 'var(--color-muted)' }}>
                  {f === 'all' ? `All (${users.length})` : f === 'active' ? `Active (${activeCount})` : `Inactive (${inactiveCount})`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '32px 2.2fr 1fr 1fr 1fr 1fr 120px', gap: '1rem', padding: '0.55rem 1.25rem', background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
          {[{ label: '#', align: 'center' as const }, { label: 'User', align: 'left' as const }, { label: 'Invoices', align: 'left' as const }, { label: 'Payments', align: 'left' as const }, { label: 'Matches', align: 'left' as const }, { label: 'Last Active', align: 'left' as const }, { label: 'Status', align: 'right' as const }].map(h => (
            <p key={h.label} style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--color-muted)', textAlign: h.align }}>{h.label}</p>
          ))}
        </div>

        {loadingUsers
          ? <div style={{ padding: '3rem', display: 'flex', justifyContent: 'center' }}><Spinner size={22} /></div>
          : filtered.length === 0
            ? <div style={{ padding: '3rem', textAlign: 'center' }}><p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', fontWeight: 500 }}>No users match your filters</p></div>
            : filtered.map((user, i) => (
                <UserActivityRow key={user.id} user={user} stats={activityMap[user.id] ?? null} maxInvoices={maxInvoices} maxPayments={maxPayments} maxMatches={maxMatches} rank={i + 1} onToggle={u => setConfirmUser(u)} toggling={toggling === user.id} />
              ))
        }

        {!loadingUsers && filtered.length > 0 && (
          <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-faint)' }}>Showing {filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {Object.entries(roleCounts).map(([role, count]) => {
                const [fg, bg] = ROLE_COLORS[role] ?? ['var(--color-muted)', 'var(--color-surface-2)'];
                return <span key={role} style={{ fontSize: '0.65rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: 99, background: bg, color: fg, border: `1px solid ${fg}30`, textTransform: 'capitalize' }}>{role.replace('_', ' ')}: {count}</span>;
              })}
            </div>
          </div>
        )}
      </div>

      {confirmUser && <ConfirmDialog user={confirmUser} onConfirm={handleToggleConfirm} onCancel={() => setConfirmUser(null)} loading={toggling === confirmUser.id} />}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shimmer { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}