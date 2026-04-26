import React, { useState } from 'react';
import { Users, TrendingUp, TrendingDown, Minus, Navigation, AlertTriangle, Clock, Download, Layers } from 'lucide-react';
import html2canvas from 'html2canvas';

const STATUS_CFG = {
  HIGH:     { color: '#ef4444', border: 'rgba(239,68,68,0.25)',  bg: 'rgba(239,68,68,0.10)',  bar: 'linear-gradient(90deg,#ef4444,#f97316)', label: '🚨 HIGH'     },
  MODERATE: { color: '#a855f7', border: 'rgba(168,85,247,0.25)', bg: 'rgba(168,85,247,0.10)', bar: 'linear-gradient(90deg,#a855f7,#ec4899)', label: '⚠️ MODERATE' },
  LOW:      { color: '#22c55e', border: 'rgba(34,197,94,0.25)',  bg: 'rgba(34,197,94,0.08)',  bar: 'linear-gradient(90deg,#22c55e,#06b6d4)', label: '✅ LOW'       },
};

function StatBox({ icon: Icon, label, value, color }) {
  return (
    <div style={{
      background: 'rgba(2,6,23,0.30)',
      border: '1px solid rgba(148,163,184,0.08)',
      borderRadius: 14,
      padding: '14px',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Icon size={13} color="#64748b" />
        <span style={{ fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
      </div>
      <p style={{ fontSize: 28, fontWeight: 900, color, letterSpacing: '-0.03em' }}>{value}</p>
    </div>
  );
}

const CrowdStats = ({ data, temple, prevData, mapElRef }) => {
  const [downloading, setDownloading] = useState(false);
  const status = data?.status || 'LOW';
  const cfg    = STATUS_CFG[status];
  const count  = data?.total_count ?? 0;
  const prev   = prevData?.total_count;
  const delta  = prev !== undefined ? count - prev : 0;

  const time = data?.timestamp
    ? new Date(data.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  async function handleDownload() {
    setDownloading(true);
    try {
      const el = mapElRef?.current;
      if (!el) return;
      const canvas = await html2canvas(el, { useCORS: true, backgroundColor: '#0f172a', scale: 2, logging: false });
      const link = document.createElement('a');
      link.download = `${temple.name.replace(/\s+/g, '_')}_offline_map.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  const handleNavigate = () => {
    const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${temple.lat},${temple.lng}`;
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const url = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${temple.lat},${temple.lng}`;
          window.open(url, '_blank', 'noopener,noreferrer');
        },
        (error) => {
          console.warn('Geolocation error:', error);
          window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
        }
      );
    } else {
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className="animate-slide-right"
      style={{
        width: 300,
        borderRadius: 24,
        overflow: 'hidden',
        background: 'rgba(8, 15, 35, 0.45)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 40px ${cfg.color}15, inset 0 1px 0 rgba(255,255,255,0.05)`,
        border: `1px solid ${cfg.border}`,
        transition: 'box-shadow 0.6s ease, border-color 0.4s ease',
      }}
    >
      {/* Color accent bar */}
      <div style={{ height: 3, background: cfg.bar, width: '100%' }} />

      <div style={{ padding: '18px 18px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div style={{ flex: 1, paddingRight: 10 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.3, marginBottom: 4 }}>
              {temple.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ position: 'relative', display: 'inline-flex', width: 7, height: 7 }}>
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ade80', opacity: 0.6, animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite' }} />
                <span style={{ position: 'relative', width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
              </span>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#4ade80', letterSpacing: '0.1em', textTransform: 'uppercase' }}>LIVE</span>
              {time && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: '#475569' }}>
                  <Clock size={9} />
                  {time}
                </span>
              )}
            </div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 800, padding: '5px 10px', borderRadius: 99,
            background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
            whiteSpace: 'nowrap',
          }}>
            {cfg.label}
          </span>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          <StatBox icon={Users}  label="Total"  value={count} color={cfg.color} />
          <StatBox icon={Layers} label="Zones"  value={data?.zones?.length ?? '—'} color="#94a3b8" />
        </div>

        {/* Delta indicator */}
        {prev !== undefined && Math.abs(delta) > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 12px', borderRadius: 10, marginBottom: 14,
            background: delta > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
            border: `1px solid ${delta > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)'}`,
          }}>
            {delta > 0
              ? <TrendingUp  size={13} color="#ef4444" />
              : <TrendingDown size={13} color="#22c55e" />
            }
            <span style={{ fontSize: 11, fontWeight: 600, color: delta > 0 ? '#ef4444' : '#22c55e' }}>
              {delta > 0 ? '+' : ''}{delta} since last update
            </span>
          </div>
        )}

        {/* Zone bars */}
        {data?.zones && (
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
              Zone Density
            </p>
            {data.zones.map((zone) => (
              <div key={zone.id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: '#94a3b8', fontWeight: 500 }}>Zone {zone.id}</span>
                  <span style={{ color: cfg.color, fontWeight: 700 }}>{zone.count} ppl</span>
                </div>
                <div style={{ height: 4, background: 'rgba(100,116,139,0.15)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min((zone.count / 200) * 100, 100)}%`,
                    background: cfg.bar,
                    borderRadius: 99,
                    transition: 'width 1.5s cubic-bezier(.16,1,.3,1)',
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Alert */}
        {status === 'HIGH' && (
          <div style={{
            display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 12, marginBottom: 14,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)',
          }}>
            <AlertTriangle size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 11, color: '#fca5a5', lineHeight: 1.55 }}>
              Heavy crowd detected. Consider visiting during off-peak hours or use a low-density route.
            </p>
          </div>
        )}
        {status === 'LOW' && (
          <div style={{
            display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 12, marginBottom: 14,
            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)',
          }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>✓</span>
            <p style={{ fontSize: 11, color: '#86efac', lineHeight: 1.55 }}>
              Great time to visit! Minimal crowd expected right now.
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={handleNavigate}
            style={{
              width: '100%', padding: '13px 16px', borderRadius: 14,
              background: 'linear-gradient(135deg,#7c3aed,#db2777)',
              color: 'white', fontWeight: 700, fontSize: 13,
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
              transition: 'all 0.2s',
            }}
          >
            <Navigation size={15} />
            Navigate to Temple
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              width: '100%', padding: '11px 16px', borderRadius: 14,
              background: 'rgba(30,41,59,0.6)',
              color: downloading ? '#475569' : '#94a3b8',
              fontWeight: 600, fontSize: 12,
              border: '1px solid rgba(148,163,184,0.12)',
              cursor: downloading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s',
            }}
          >
            <Download size={14} />
            {downloading ? 'Downloading...' : 'Download Offline Map'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrowdStats;
