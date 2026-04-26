import React, { useState } from 'react';
import { MapPin, Users, TrendingUp, TrendingDown, Minus, Info, X } from 'lucide-react';

const STATUS_CFG = {
  HIGH:     { color: '#ef4444', border: 'rgba(239,68,68,0.25)',  bg: 'rgba(239,68,68,0.12)',  bar: 'linear-gradient(90deg,#ef4444,#f97316)', accent: '#ef4444' },
  MODERATE: { color: '#a855f7', border: 'rgba(168,85,247,0.25)', bg: 'rgba(168,85,247,0.12)', bar: 'linear-gradient(90deg,#a855f7,#ec4899)', accent: '#a855f7' },
  LOW:      { color: '#22c55e', border: 'rgba(34,197,94,0.25)',  bg: 'rgba(34,197,94,0.10)',  bar: 'linear-gradient(90deg,#22c55e,#06b6d4)', accent: '#22c55e' },
};

function TrendIcon({ current, previous }) {
  if (previous === undefined) return <Minus size={12} color="#475569" />;
  if (current > previous + 3)  return <TrendingUp   size={12} color="#ef4444" />;
  if (current < previous - 3)  return <TrendingDown  size={12} color="#22c55e" />;
  return <Minus size={12} color="#475569" />;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", 
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Lakshadweep", "Delhi", "Puducherry", "Ladakh", "Jammu and Kashmir"
];

const Sidebar = ({ temples, crowdData, prevCrowdData, selectedId, onSelect, isMobile, onClose }) => {
  const [selectedState, setSelectedState] = useState('Uttar Pradesh');
  const filterOptions = INDIAN_STATES.sort();

  return (
    <div
      style={{
        width: isMobile ? '85vw' : 320,
        maxWidth: 400,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(8, 15, 35, 0.45)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        border: '1px solid rgba(148,163,184,0.10)',
        boxShadow: '4px 4px 40px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.04)',
        zIndex: 20,
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* ── Purple accent bar (mirrors right card) ── */}
      <div style={{ height: 3, background: 'linear-gradient(90deg,#7c3aed,#db2777,#3b82f6)', flexShrink: 0 }} />

      {/* ── Header ── */}
      <div style={{
        padding: '20px 18px 16px',
        borderBottom: '1px solid rgba(148,163,184,0.08)',
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 14, flexShrink: 0,
              background: 'linear-gradient(135deg,#7c3aed,#db2777)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(124,58,237,0.45)',
            }}>
              <Users size={20} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                CrowdRakshak
              </h1>
              <p style={{ fontSize: 10, color: '#64748b', fontWeight: 500 }}>Real-time crowd intelligence</p>
            </div>
          </div>

          {/* Live badge (same as right card) */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', borderRadius: 8,
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.15)',
            width: 'fit-content',
          }}>
            <span style={{ position: 'relative', display: 'inline-flex', width: 7, height: 7 }}>
              <span style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: '#4ade80', opacity: 0.7,
                animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite',
              }} />
              <span style={{ position: 'relative', width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#4ade80', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Live Monitoring
            </span>
          </div>
        </div>
        
        {isMobile && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
            <X size={24} />
          </button>
        )}
      </div>

      {/* ── Temple section label ── */}
      <div style={{ padding: '14px 18px 6px', flexShrink: 0 }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Temples
        </p>
      </div>

      {/* ── State Filter ── */}
      <div style={{ padding: '0 18px 10px', flexShrink: 0 }}>
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(15,23,42,0.6)',
            color: '#f1f5f9',
            border: '1px solid rgba(148,163,184,0.2)',
            fontSize: 12,
            fontWeight: 600,
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          {filterOptions.map(state => (
            <option key={state} value={state} style={{ background: '#0f172a', color: '#f1f5f9' }}>
              {state}
            </option>
          ))}
        </select>
      </div>

      {/* ── Temple cards ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 10px' }}>
        {Object.entries(
          temples
            .filter(t => (t.state || 'Other') === selectedState)
            .reduce((acc, t) => {
            const state = t.state || 'Other';
            if (!acc[state]) acc[state] = [];
            acc[state].push(t);
            return acc;
          }, {})
        ).map(([state, stateTemples]) => (
          <div key={state} style={{ marginBottom: 16 }}>
            <div style={{ padding: '0 8px 8px' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{state}</span>
            </div>
            {stateTemples.map((temple) => {
              const data    = crowdData[temple.id];
              const prev    = prevCrowdData?.[temple.id];
              const status  = data?.status || 'LOW';
              const count   = data?.total_count ?? 0;
              const cfg     = STATUS_CFG[status];
              const isSelected = temple.id === selectedId;

          return (
            <button
              key={temple.id}
              onClick={() => onSelect(temple)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: 0,
                marginBottom: 8,
                borderRadius: 18,
                cursor: 'pointer',
                border: isSelected ? `1px solid ${cfg.border}` : '1px solid rgba(148,163,184,0.08)',
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(30,41,59,0.7), rgba(15,23,42,0.6))'
                  : 'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(15,23,42,0.3))',
                boxShadow: isSelected
                  ? `0 8px 32px rgba(0,0,0,0.4), 0 0 24px ${cfg.color}18`
                  : '0 2px 8px rgba(0,0,0,0.2)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                transition: 'all 0.25s cubic-bezier(.16,1,.3,1)',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {/* Color accent bar — same as right card */}
              <div style={{
                height: 2.5,
                background: isSelected ? cfg.bar : 'rgba(100,116,139,0.2)',
                transition: 'background 0.3s',
              }} />

              <div style={{ padding: '12px 14px 13px' }}>
                {/* Top row: name + status badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <span style={{
                    fontSize: 13, fontWeight: 700,
                    color: isSelected ? '#f1f5f9' : '#94a3b8',
                    lineHeight: 1.35, flex: 1, paddingRight: 8,
                    transition: 'color 0.2s',
                  }}>
                    {temple.name}
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 99,
                    background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                    whiteSpace: 'nowrap', letterSpacing: '0.04em', flexShrink: 0,
                  }}>
                    {status}
                  </span>
                </div>

                {/* Stat boxes row — mirrors right card's grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                  <div style={{
                    background: 'rgba(15,23,42,0.5)',
                    border: '1px solid rgba(148,163,184,0.07)',
                    borderRadius: 10, padding: '8px 10px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                      <Users size={10} color="#475569" />
                      <span style={{ fontSize: 8, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>People</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 20, fontWeight: 900, color: cfg.color, letterSpacing: '-0.03em' }}>{count}</span>
                      <TrendIcon current={count} previous={prev?.total_count} />
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(15,23,42,0.5)',
                    border: '1px solid rgba(148,163,184,0.07)',
                    borderRadius: 10, padding: '8px 10px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                      <MapPin size={10} color="#475569" />
                      <span style={{ fontSize: 8, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Location</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Varanasi</span>
                  </div>
                </div>

                {/* Zone density bar — mirrors right card */}
                {data?.zones && (
                  <div>
                    <p style={{ fontSize: 8, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                      Zone Density
                    </p>
                    {data.zones.map((zone) => (
                      <div key={zone.id} style={{ marginBottom: 5 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
                          <span style={{ color: '#64748b', fontWeight: 500 }}>Zone {zone.id}</span>
                          <span style={{ color: cfg.color, fontWeight: 700 }}>{zone.count} ppl</span>
                        </div>
                        <div style={{ height: 3, width: '100%', background: 'rgba(100,116,139,0.15)', borderRadius: 99, overflow: 'hidden' }}>
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
              </div>
            </button>
          );
        })}
          </div>
        ))}
      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: '12px 18px',
        borderTop: '1px solid rgba(148,163,184,0.08)',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <Info size={12} color="#334155" />
        <p style={{ fontSize: 10, color: '#334155' }}>
          Updates every ~12s · Varanasi, UP
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
