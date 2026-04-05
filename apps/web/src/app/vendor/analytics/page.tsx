'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { formatNGN } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  ReferenceLine, Area, AreaChart,
} from 'recharts';
import { Activity, DollarSign, MapPin, Calendar, RefreshCw } from 'lucide-react';

const ALERT_COLORS: Record<string, string> = {
  HIGH: '#3DFF7A', MEDIUM: '#FFB830', LOW: '#FF4444', CAUTION: '#4DAAFF',
};
const TREND_COLORS: Record<string, string> = {
  STRONG: '#3DFF7A', MODERATE: '#FFB830', SLOW: '#FF4444',
};
const PRICE_POS: Record<string, { label: string; color: string; desc: string }> = {
  BELOW_MARKET: { label: 'Below Market', color: '#4DAAFF', desc: 'You may be undercharging' },
  AT_MARKET:    { label: 'At Market',    color: '#3DFF7A', desc: 'Pricing is competitive' },
  PREMIUM:      { label: 'Premium',      color: '#FFB830', desc: 'Premium tier pricing' },
  UNSET:        { label: 'Price Unset',  color: '#FF4444', desc: 'Set pricing to appear in search' },
};

const LAGOS_GRID: Record<string, { row: number; col: number; short: string }> = {
  'Victoria Island': { row: 3, col: 4, short: 'VI' },
  'Ikoyi':           { row: 2, col: 4, short: 'IKY' },
  'Lagos Island':    { row: 2, col: 3, short: 'LGI' },
  'Lekki':           { row: 3, col: 6, short: 'LKI' },
  'Ajah':            { row: 4, col: 7, short: 'AJH' },
  'Surulere':        { row: 1, col: 3, short: 'SUR' },
  'Yaba':            { row: 1, col: 4, short: 'YAB' },
  'Oshodi':          { row: 0, col: 3, short: 'OSH' },
  'Ikeja GRA':       { row: 0, col: 2, short: 'IKJ' },
  'Magodo':          { row: 0, col: 5, short: 'MGD' },
};

function Card({ title, sub = '', accent = '#3DFF7A', children }: {
  title: string; sub?: string; accent?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ background: '#162019', border: '1px solid #1E3022', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #1E3022', background: '#111D14', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: accent, flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", color: '#6B8F72', letterSpacing: '0.12em', textTransform: 'uppercase' as const }}>{title}</span>
        {sub && <span style={{ fontSize: 10, color: '#4A6650', marginLeft: 'auto', fontFamily: "'IBM Plex Mono',monospace" }}>{sub}</span>}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

export default function VendorMarketPage() {
  const [tab, setTab] = useState<'pricing'|'heatmap'|'season'>('pricing');
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: market, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['market-intelligence', refreshKey],
    queryFn: () => analyticsApi.marketIntelligence().then(r => r.data),
    staleTime: 300_000,
  });

  const { data: rev } = useQuery({
    queryKey: ['vendor-revenue'],
    queryFn: () => analyticsApi.vendorRevenue().then(r => r.data),
  });

  const stats = rev?.stats;
  const pricing = market?.pricingInsight;
  const pos = market?.positioning;
  const posConfig = pos ? (PRICE_POS[pos.pricePosition] || PRICE_POS.UNSET) : null;
  const lastSync = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }) : '—';

  // Build grid
  const grid: any[] = [];
  for (let r = 4; r >= 0; r--) {
    for (let c = 0; c < 8; c++) {
      const entry = Object.entries(LAGOS_GRID).find(([_, g]) => g.row === (4 - r) && g.col === c);
      const heat = entry ? (market?.heatmap ?? []).find((z: any) => z.zone === entry[0]) : null;
      grid.push({ zone: entry?.[0] ?? null, short: entry ? LAGOS_GRID[entry[0]].short : null, intensity: heat?.intensity ?? 0, bookings: heat?.bookings ?? 0 });
    }
  }

  return (
    <div style={{ padding: 24, background: '#0C1A0F', minHeight: '100vh', fontFamily: "'DM Sans',system-ui,sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 28, height: 28, background: '#3DFF7A', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={14} color="#0C1A0F" />
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#E8F5E9', margin: 0 }}>Market Intelligence</h1>
            {market?.category && (
              <span style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", color: '#3DFF7A', letterSpacing: '0.15em', background: 'rgba(61,255,122,0.1)', padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(61,255,122,0.25)', textTransform: 'uppercase' as const }}>
                {market.category.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: '#6B8F72', margin: 0, fontFamily: "'IBM Plex Mono',monospace" }}>
            Lagos market data · Last sync {lastSync}
          </p>
        </div>
        <button onClick={() => setRefreshKey(k => k + 1)}
          style={{ background: '#111D14', border: '1px solid #1E3022', color: '#6B8F72', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: "'IBM Plex Mono',monospace" }}>
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'MY REVENUE', value: stats ? formatNGN(stats.totalRevenue, true) : '—', color: '#3DFF7A', sub: 'completed bookings' },
          { label: 'IN ESCROW', value: stats ? formatNGN(stats.pendingPayout, true) : '—', color: '#FFB830', sub: 'pending release' },
          { label: 'MY RATING', value: stats?.rating ? `${Number(stats.rating).toFixed(1)} ★` : '—', color: '#E8F5E9', sub: `${stats?.reviewCount ?? 0} reviews` },
          { label: 'COMPETITORS', value: pricing?.competitorCount ?? '—', color: '#4DAAFF', sub: 'same category' },
          { label: 'PRICE POS', value: posConfig?.label ?? '—', color: posConfig?.color ?? '#4A6650', sub: posConfig?.desc?.slice(0,26) ?? 'Set pricing' },
        ].map(k => (
          <div key={k.label} style={{ background: '#162019', border: '1px solid #1E3022', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 9, color: '#6B8F72', fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.12em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: k.color, fontFamily: "'IBM Plex Mono',monospace", lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 10, color: '#4A6650', marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {([
          { key: 'pricing' as const, label: 'Competitor Pricing', Icon: DollarSign },
          { key: 'heatmap' as const, label: 'Demand Heatmap', Icon: MapPin },
          { key: 'season'  as const, label: 'Peak Season', Icon: Calendar },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, background: tab === t.key ? '#3DFF7A' : '#111D14', color: tab === t.key ? '#0C1A0F' : '#6B8F72', transition: 'all 0.15s' }}>
            <t.Icon size={12} />{t.label}
          </button>
        ))}
      </div>

      {/* ── PRICING ── */}
      {tab === 'pricing' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card title="Category Price Range" sub={`${pricing?.competitorCount ?? 0} vendors`}>
            {isLoading ? <p style={{ color: '#4A6650', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12 }}>Loading…</p> : <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                {[['MARKET MIN', formatNGN(pricing?.categoryMin ?? 0, true), '#4DAAFF'],
                  ['MEDIAN', formatNGN(pricing?.categoryMedian ?? 0, true), '#3DFF7A'],
                  ['MARKET MAX', formatNGN(pricing?.categoryMax ?? 0, true), '#FFB830']].map(([l, v, c]) => (
                  <div key={l as string} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: '#4A6650', fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.1em', marginBottom: 4 }}>{l}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: c as string, fontFamily: "'IBM Plex Mono',monospace" }}>{v}</div>
                  </div>
                ))}
              </div>
              {(pricing?.myMin ?? 0) > 0 && (pricing?.categoryMax ?? 0) > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ height: 32, background: '#1E3022', borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${(pricing.categoryMedian / pricing.categoryMax) * 100}%`, width: 1.5, background: 'rgba(61,255,122,0.4)' }} />
                    <div style={{ position: 'absolute', top: 6, bottom: 6, left: `${(pricing.myMin / pricing.categoryMax) * 100}%`, width: `${Math.max(((pricing.myMax - pricing.myMin) / pricing.categoryMax) * 100, 3)}%`, background: '#3DFF7A', borderRadius: 3, opacity: 0.9 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: '#4A6650', fontFamily: "'IBM Plex Mono',monospace" }}>
                    <span>₦0</span>
                    <span style={{ color: '#3DFF7A' }}>▲ You: {formatNGN(pricing.myMin, true)}–{formatNGN(pricing.myMax, true)}</span>
                    <span>{formatNGN(pricing.categoryMax, true)}</span>
                  </div>
                </div>
              )}
              <div style={{ background: '#111D14', borderRadius: 8, padding: 12, border: '1px solid #1E3022' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: '#6B8F72', fontFamily: "'IBM Plex Mono',monospace" }}>Your price percentile</span>
                  <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace", color: (pricing?.myPercentile ?? 50) < 30 ? '#4DAAFF' : (pricing?.myPercentile ?? 50) > 70 ? '#FFB830' : '#3DFF7A' }}>
                    {pricing?.myPercentile ?? 50}th
                  </span>
                </div>
                <div style={{ height: 6, background: '#1E3022', borderRadius: 3, position: 'relative' }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${pricing?.myPercentile ?? 50}%`, background: 'linear-gradient(90deg,#4DAAFF,#3DFF7A,#FFB830)' }} />
                  <div style={{ position: 'absolute', top: -3, left: `${pricing?.myPercentile ?? 50}%`, width: 2, height: 12, background: '#fff', borderRadius: 1, transform: 'translateX(-50%)' }} />
                </div>
                <div style={{ fontSize: 10, color: '#4A6650', marginTop: 6, fontFamily: "'IBM Plex Mono',monospace" }}>
                  {(pricing?.myPercentile ?? 50) < 30 ? 'Undercharging vs most competitors' : (pricing?.myPercentile ?? 50) > 70 ? "You're in the premium tier" : 'Right in the market sweet spot'}
                </div>
              </div>
              {(pos?.recommendedPriceMin ?? 0) > 0 && (
                <div style={{ marginTop: 12, background: 'rgba(61,255,122,0.06)', border: '1px solid rgba(61,255,122,0.2)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 9, color: '#3DFF7A', fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.1em', marginBottom: 4 }}>RECOMMENDED RANGE</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#3DFF7A', fontFamily: "'IBM Plex Mono',monospace" }}>
                    {formatNGN(pos.recommendedPriceMin, true)} – {formatNGN(pos.recommendedPriceMax, true)}
                  </div>
                  <div style={{ fontSize: 10, color: '#6B8F72', marginTop: 4 }}>Based on category median — maximises enquiries while protecting margin.</div>
                </div>
              )}
            </>}
          </Card>

          <Card title="Top Competitors" sub="by booking volume" accent="#4DAAFF">
            {(pricing?.topCompetitors ?? []).map((c: any, i: number) => (
              <div key={c.name} style={{ padding: '10px 0', borderBottom: '1px solid #1E3022', display: 'grid', gridTemplateColumns: '20px 1fr auto', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#4A6650', fontFamily: "'IBM Plex Mono',monospace" }}>{String(i+1).padStart(2,'0')}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#C8E6CA', marginBottom: 2 }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: '#4A6650', fontFamily: "'IBM Plex Mono',monospace", display: 'flex', gap: 8 }}>
                    <span style={{ color: '#3DFF7A' }}>★ {Number(c.rating).toFixed(1)}</span>
                    <span>{c.bookings} bkgs</span>
                    {c.isInstantBook && <span style={{ color: '#FFB830' }}>⚡</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#E8F5E9', fontFamily: "'IBM Plex Mono',monospace" }}>{formatNGN(c.minPrice, true)}</div>
                  <div style={{ fontSize: 10, color: '#4A6650', fontFamily: "'IBM Plex Mono',monospace" }}>– {formatNGN(c.maxPrice, true)}</div>
                </div>
              </div>
            ))}
            {!(pricing?.topCompetitors?.length) && (
              <div style={{ fontSize: 12, color: '#4A6650', fontFamily: "'IBM Plex Mono',monospace", textAlign: 'center', padding: '20px 0' }}>No competitor data yet</div>
            )}
          </Card>

          <div style={{ gridColumn: '1/-1' }}>
            <Card title="Price Distribution" sub="min price by competitor">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={[...(pricing?.topCompetitors ?? []).map((c: any) => ({ name: c.name.split(' ')[0], price: c.minPrice, me: false })), ...(pricing?.myMin > 0 ? [{ name: 'YOU', price: pricing.myMin, me: true }] : [])].sort((a:any,b:any) => a.price - b.price)}
                  margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#4A6650', fontFamily: "'IBM Plex Mono',monospace" }} />
                  <YAxis tick={{ fontSize: 10, fill: '#4A6650', fontFamily: "'IBM Plex Mono',monospace" }} tickFormatter={(v:number) => v >= 1e6 ? `₦${(v/1e6).toFixed(1)}M` : `₦${(v/1e3).toFixed(0)}K`} />
                  <Tooltip contentStyle={{ background: '#111D14', border: '1px solid #1E3022', borderRadius: 8, fontSize: 11, color: '#C8E6CA', fontFamily: "'IBM Plex Mono',monospace" }} formatter={(v:any) => [formatNGN(v), 'Min Price']} />
                  {(pricing?.categoryMedian ?? 0) > 0 && <ReferenceLine y={pricing.categoryMedian} stroke="rgba(61,255,122,0.4)" strokeDasharray="4 3" label={{ value: 'MEDIAN', fontSize: 8, fill: '#3DFF7A', fontFamily: "'IBM Plex Mono',monospace" }} />}
                  <Bar dataKey="price" radius={[3,3,0,0]}>
                    {[...(pricing?.topCompetitors ?? []).map((_:any) => ({ me: false })), ...(pricing?.myMin > 0 ? [{ me: true }] : [])].map((_:any,i:number,arr:any[]) => (
                      <Cell key={i} fill={arr[i]?.me ? '#3DFF7A' : '#2A4430'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}

      {/* ── HEATMAP ── */}
      {tab === 'heatmap' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card title="Lagos Demand Grid" sub="90-day booking intensity">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: 4, marginBottom: 14, padding: 12, background: '#111D14', borderRadius: 8, border: '1px solid #1E3022' }}>
              {grid.map((cell, i) => {
                const c = cell.intensity > 60 ? '#3DFF7A' : cell.intensity > 30 ? '#FFB830' : '#4DAAFF';
                const a = cell.zone ? Math.max(0.15, (cell.intensity || 5) / 100) : 0;
                return (
                  <div key={i} title={cell.zone ? `${cell.zone}: ${cell.bookings} bookings` : ''}
                    style={{ height: 34, borderRadius: 4, background: cell.zone ? c : 'transparent', opacity: cell.zone ? a : 1, border: cell.zone ? `1px solid ${c}30` : 'none', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center' }}>
                    {cell.zone && <>
                      <div style={{ fontSize: 7, fontFamily: "'IBM Plex Mono',monospace", color: '#E8F5E9', fontWeight: 700, lineHeight: 1 }}>{cell.short}</div>
                      <div style={{ fontSize: 7, fontFamily: "'IBM Plex Mono',monospace", color: 'rgba(232,245,233,0.6)', lineHeight: 1, marginTop: 1 }}>{cell.bookings}</div>
                    </>}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {[['High (60+)', '#3DFF7A'], ['Medium', '#FFB830'], ['Low', '#4DAAFF']].map(([l,c]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: c, opacity: 0.7 }} />
                  <span style={{ fontSize: 10, color: '#6B8F72', fontFamily: "'IBM Plex Mono',monospace" }}>{l}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Zone Rankings" sub="by booking volume" accent="#4DAAFF">
            {(market?.heatmap ?? []).map((z: any, i: number) => (
              <div key={z.zone} style={{ display: 'grid', gridTemplateColumns: '18px 1fr auto', gap: 10, alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #1E3022' }}>
                <span style={{ fontSize: 10, color: '#4A6650', fontFamily: "'IBM Plex Mono',monospace" }}>{String(i+1).padStart(2,'0')}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 12, color: '#C8E6CA' }}>{z.zone}</span>
                    {z.intensity > 60 && <span style={{ fontSize: 8, fontFamily: "'IBM Plex Mono',monospace", color: '#3DFF7A', background: 'rgba(61,255,122,0.15)', padding: '1px 5px', borderRadius: 3 }}>HOT</span>}
                  </div>
                  <div style={{ height: 3, background: '#1E3022', borderRadius: 2, width: 100 }}>
                    <div style={{ height: '100%', borderRadius: 2, width: `${z.intensity}%`, background: z.intensity > 60 ? '#3DFF7A' : z.intensity > 30 ? '#FFB830' : '#4DAAFF' }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#E8F5E9', fontFamily: "'IBM Plex Mono',monospace" }}>{z.bookings}</div>
                  <div style={{ fontSize: 9, color: '#4A6650', fontFamily: "'IBM Plex Mono',monospace" }}>bkgs</div>
                </div>
              </div>
            ))}
            {!(market?.heatmap?.some((z:any) => z.bookings > 0)) && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#4A6650', fontSize: 12, fontFamily: "'IBM Plex Mono',monospace" }}>Building demand data…<br /><span style={{ fontSize: 10 }}>Zones populate as bookings occur</span></div>
            )}
          </Card>

          <div style={{ gridColumn: '1/-1' }}>
            <Card title="Revenue by Zone" sub="90-day total" accent="#FFB830">
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={(market?.heatmap ?? []).filter((z:any) => z.revenue > 0)} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <XAxis dataKey="zone" tick={{ fontSize: 10, fill: '#4A6650', fontFamily: "'IBM Plex Mono',monospace" }} />
                  <YAxis tick={{ fontSize: 10, fill: '#4A6650', fontFamily: "'IBM Plex Mono',monospace" }} tickFormatter={(v:number) => v >= 1e6 ? `₦${(v/1e6).toFixed(1)}M` : `₦${(v/1e3).toFixed(0)}K`} />
                  <Tooltip contentStyle={{ background: '#111D14', border: '1px solid #1E3022', borderRadius: 8, fontSize: 11, color: '#C8E6CA', fontFamily: "'IBM Plex Mono',monospace" }} formatter={(v:any) => [formatNGN(v), 'Revenue']} />
                  <Bar dataKey="revenue" radius={[3,3,0,0]}>
                    {(market?.heatmap ?? []).filter((z:any) => z.revenue > 0).map((_:any, i:number) => (
                      <Cell key={i} fill={i === 0 ? '#3DFF7A' : i === 1 ? '#FFB830' : '#2A4430'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}

      {/* ── SEASON ── */}
      {tab === 'season' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <Card title="12-Month Demand Calendar" sub="booking volume by event month">
            <ResponsiveContainer width="100%" height={190}>
              <AreaChart data={market?.monthlyDemand ?? []} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="demGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3DFF7A" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3DFF7A" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="monthName" tick={{ fontSize: 10, fill: '#4A6650', fontFamily: "'IBM Plex Mono',monospace" }} />
                <YAxis tick={{ fontSize: 10, fill: '#4A6650', fontFamily: "'IBM Plex Mono',monospace" }} />
                <Tooltip contentStyle={{ background: '#111D14', border: '1px solid #1E3022', borderRadius: 8, fontSize: 11, color: '#C8E6CA', fontFamily: "'IBM Plex Mono',monospace" }} formatter={(v:any) => [v, 'Bookings']} />
                <Area type="monotone" dataKey="bookings" stroke="#3DFF7A" strokeWidth={2} fill="url(#demGrad)" dot={{ fill: '#3DFF7A', strokeWidth: 0, r: 3 }} />
                <ReferenceLine x={(market?.monthlyDemand ?? [])[new Date().getMonth()]?.monthName} stroke="rgba(255,184,48,0.6)" strokeDasharray="3 3" label={{ value: 'NOW', fontSize: 8, fill: '#FFB830', fontFamily: "'IBM Plex Mono',monospace" }} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: 3, marginTop: 8 }}>
              {(market?.monthlyDemand ?? []).map((m: any) => {
                const isNow = m.month === new Date().getMonth() + 1;
                const c = m.demandIndex > 70 ? '#3DFF7A' : m.demandIndex > 40 ? '#FFB830' : m.demandIndex > 10 ? '#4DAAFF' : '#1E3022';
                return (
                  <div key={m.month} title={`${m.monthName}: ${m.bookings} bookings`}
                    style={{ height: 22, background: c, opacity: m.demandIndex > 0 ? Math.max(0.25, m.demandIndex/100) : 0.15, borderRadius: 3, border: isNow ? '1.5px solid #FFB830' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 7, fontFamily: "'IBM Plex Mono',monospace", color: '#E8F5E9', fontWeight: 700 }}>{m.monthName.slice(0,1)}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Card title="Season Alerts" sub="next 90 days" accent="#FFB830">
              {(market?.peakAlerts?.length ?? 0) > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {market.peakAlerts.map((a: any) => {
                    const c = ALERT_COLORS[a.type] ?? '#4A6650';
                    return (
                      <div key={a.name} style={{ background: `${c}10`, border: `1px solid ${c}30`, borderRadius: 8, padding: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#C8E6CA' }}>{a.name}</span>
                          <span style={{ fontSize: 8, fontFamily: "'IBM Plex Mono',monospace", color: c, background: `${c}20`, padding: '2px 6px', borderRadius: 3, flexShrink: 0, marginLeft: 6 }}>{a.type}</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace", color: a.boost > 0 ? c : '#FF4444' }}>
                          {a.boost > 0 ? '+' : ''}{a.boost}% demand
                        </div>
                        <div style={{ fontSize: 9, color: '#4A6650', marginTop: 3 }}>
                          {a.boost > 50 ? '🔥 Raise prices 10–20% now' : a.boost > 0 ? '📈 Strong — book out early' : '⚡ Low season — run promotions'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#4A6650', fontSize: 11, fontFamily: "'IBM Plex Mono',monospace" }}>No active alerts for next 90 days</div>
              )}
            </Card>

            <Card title="3-Month Outlook" accent="#4DAAFF">
              {(market?.nextThreeMonths ?? []).map((m: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < 2 ? '1px solid #1E3022' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#C8E6CA', marginBottom: 3 }}>{m?.monthName}</div>
                    <div style={{ height: 3, background: '#1E3022', borderRadius: 2, width: 80 }}>
                      <div style={{ height: '100%', borderRadius: 2, width: `${m?.demandIndex ?? 0}%`, background: (m?.demandIndex ?? 0) > 60 ? '#3DFF7A' : (m?.demandIndex ?? 0) > 30 ? '#FFB830' : '#4DAAFF' }} />
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace", color: '#E8F5E9' }}>{m?.bookings ?? 0} <span style={{ fontWeight: 400, color: '#4A6650' }}>bkgs</span></div>
                    <div style={{ fontSize: 9, fontFamily: "'IBM Plex Mono',monospace", color: (m?.demandIndex ?? 0) > 60 ? '#3DFF7A' : (m?.demandIndex ?? 0) > 30 ? '#FFB830' : '#4A6650' }}>
                      {(m?.demandIndex ?? 0) > 60 ? 'HIGH' : (m?.demandIndex ?? 0) > 30 ? 'MODERATE' : 'BUILDING'}
                    </div>
                  </div>
                </div>
              ))}
            </Card>

            {pos && (
              <Card title="Your Position" accent={posConfig?.color ?? '#4A6650'}>
                {[
                  { label: 'Price Position', value: posConfig?.label ?? '—', color: posConfig?.color ?? '#4A6650' },
                  { label: 'Rating vs Market', value: `${Number(pos.ratingVsMarket) >= 0 ? '+' : ''}${Number(pos.ratingVsMarket).toFixed(1)} ★`, color: Number(pos.ratingVsMarket) >= 0 ? '#3DFF7A' : '#FF4444' },
                  { label: 'Recent Demand', value: pos.recentDemandTrend, color: TREND_COLORS[pos.recentDemandTrend] ?? '#4A6650' },
                  { label: 'Bookings vs Avg', value: `${pos.bookingsVsAvg >= 0 ? '+' : ''}${pos.bookingsVsAvg}`, color: pos.bookingsVsAvg >= 0 ? '#3DFF7A' : '#FF4444' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #1E3022' }}>
                    <span style={{ fontSize: 11, color: '#6B8F72', fontFamily: "'IBM Plex Mono',monospace" }}>{r.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace", color: r.color }}>{r.value}</span>
                  </div>
                ))}
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
