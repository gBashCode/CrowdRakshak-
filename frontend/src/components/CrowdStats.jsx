import React, { useState } from 'react';
import { Users, TrendingUp, TrendingDown, Minus, Navigation, AlertTriangle, Clock, Download, Layers, Cloud, Droplets, Wind, Thermometer } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useWeather } from '../useWeather';

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
      borderRadius: 12,
      padding: '10px 12px',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
        <Icon size={11} color="#94a3b8" />
        <span style={{ fontSize: 8, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <p style={{ fontSize: 20, fontWeight: 900, color, letterSpacing: '-0.02em' }}>{value}</p>
    </div>
  );
}

const CrowdStats = ({ data, temple, prevData, mapElRef, isMobile }) => {
  const [downloading, setDownloading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { weather, loading: weatherLoading } = useWeather(temple?.lat, temple?.lng);
  const status = data?.status?.toUpperCase() || 'LOW';
  const cfg    = STATUS_CFG[status] || STATUS_CFG['LOW'];
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
      className={isMobile ? "animate-slide-up-mobile" : "animate-slide-right"}
      style={{
        width: isMobile ? 'calc(100vw - 32px)' : 300,
        maxWidth: isMobile ? 360 : 300,
        borderRadius: 20,
        overflow: 'hidden',
        background: 'rgba(8, 15, 35, 0.75)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 40px ${cfg.color}15, inset 0 1px 0 rgba(255,255,255,0.05)`,
        border: `1px solid ${cfg.border}`,
        transition: 'box-shadow 0.6s ease, border-color 0.4s ease',
      }}
    >
      {/* Color accent bar */}
      <div style={{ height: 3, background: cfg.bar, width: '100%' }} />

      {/* Mobile header — always visible, tap to expand */}
      {isMobile ? (
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', cursor: 'pointer',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {temple.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>{count} people</span>
            </div>
          </div>
          <div style={{
            marginLeft: 10, width: 22, height: 22, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, color: '#94a3b8', flexShrink: 0,
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s',
          }}>▲</div>
        </div>
      ) : null}

      {/* Full content — always on desktop, collapsible on mobile */}
      <div style={{ padding: isMobile ? '8px 12px 14px' : '14px 14px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ flex: 1, paddingRight: 10 }}>
            <h2 style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2, marginBottom: 2 }}>
              {temple.name}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ position: 'relative', display: 'inline-flex', width: 6, height: 6 }}>
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ade80', opacity: 0.6, animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite' }} />
                <span style={{ position: 'relative', width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
              </span>
              <span style={{ fontSize: 8, fontWeight: 700, color: '#4ade80', letterSpacing: '0.05em', textTransform: 'uppercase' }}>LIVE</span>
              {time && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 8, color: '#94a3b8' }}>
                  <Clock size={8} />
                  {time}
                </span>
              )}
            </div>
          </div>
          <span style={{
            fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 99,
            background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
            whiteSpace: 'nowrap',
          }}>
            {cfg.label}
          </span>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
          <StatBox icon={Users}  label="Total"  value={count} color={cfg.color} />
          <StatBox icon={Layers} label="Zones"  value={data?.zones?.length ?? '—'} color="#94a3b8" />
        </div>

        {/* ── Live Weather (Compact) ── */}
        {weather && (
          <div style={{ marginBottom: 10 }}>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4,
            }}>
              <div title="Temperature" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '6px 4px', borderRadius: 8,
                background: 'rgba(59,130,246,0.06)',
                border: '1px solid rgba(59,130,246,0.10)',
              }}>
                <Thermometer size={10} color="#60a5fa" />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#f1f5f9' }}>{weather.temp}°</span>
              </div>
              
              <div title={weather.description} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
                padding: '4px 4px', borderRadius: 8,
                background: 'rgba(34,197,94,0.06)',
                border: '1px solid rgba(34,197,94,0.10)',
              }}>
                <img
                  src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                  alt={weather.description}
                  style={{ width: 24, height: 24, marginBottom: -4 }}
                />
                <span style={{ fontSize: 7, fontWeight: 600, color: '#94a3b8', textTransform: 'capitalize' }}>Sky</span>
              </div>

              <div title="Humidity" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '6px 4px', borderRadius: 8,
                background: 'rgba(168,85,247,0.06)',
                border: '1px solid rgba(168,85,247,0.10)',
              }}>
                <Droplets size={10} color="#c084fc" />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#f1f5f9' }}>{weather.humidity}%</span>
              </div>

              <div title="Wind Speed" style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '6px 4px', borderRadius: 8,
                background: 'rgba(245,158,11,0.06)',
                border: '1px solid rgba(245,158,11,0.10)',
              }}>
                <Wind size={10} color="#fbbf24" />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#f1f5f9' }}>{weather.wind_speed}</span>
              </div>
            </div>
          </div>
        )}
        {weatherLoading && (
          <div style={{ marginBottom: 10, fontSize: 8, color: '#94a3b8', textAlign: 'center' }}>
            Updating weather...
          </div>
        )}

        {/* Collapsible Details */}
        <div style={{
          display: 'grid',
          gridTemplateRows: (!isMobile || isExpanded) ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.3s ease-in-out',
        }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ paddingTop: (!isMobile || isExpanded) ? 4 : 0 }}>

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
            <p style={{ fontSize: 9, fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
              Zone Density
            </p>
            {data.zones.map((zone) => (
              <div key={zone.id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span style={{ color: '#e2e8f0', fontWeight: 500 }}>Zone {zone.id}</span>
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
      </div>
    </div>
    </div>
  );
};

export default CrowdStats;
