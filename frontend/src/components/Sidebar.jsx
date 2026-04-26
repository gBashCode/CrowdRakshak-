import React, { useState, useEffect, useRef } from 'react';
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

const Sidebar = ({ temples, crowdData, prevCrowdData, selectedId, onSelect, onStateSelect, isMobile, onClose }) => {
  const [selectedState, setSelectedState] = useState('All States');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const filterOptions = ['All States', ...INDIAN_STATES.sort()];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            <img 
              src="/logo.png" 
              alt="CrowdRakshak Logo"
              style={{
                width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
                objectFit: 'cover',
                background: '#f1f5f9'
              }}
            />
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                CrowdRakshak
              </h1>
              <p style={{ fontSize: 10, color: '#e2e8f0', fontWeight: 500 }}>Real-time crowd intelligence</p>
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
        <p style={{ fontSize: 9, fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Temples
        </p>
      </div>

      {/* ── State Filter & Temple Select ── */}
      <div style={{ padding: '0 18px 10px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <select
          value={selectedState}
          onChange={(e) => {
            const newState = e.target.value;
            setSelectedState(newState);
            if (newState !== 'All States' && onStateSelect) {
              const stateTemples = temples.filter(t => (t.state || 'Other') === newState);
              if (stateTemples.length > 0) {
                const lats = stateTemples.map(t => t.lat);
                const lngs = stateTemples.map(t => t.lng);
                const bounds = [
                  [Math.min(...lats), Math.min(...lngs)],
                  [Math.max(...lats), Math.max(...lngs)]
                ];
                onStateSelect(bounds, stateTemples[0]);
              }
            } else if (newState === 'All States' && onStateSelect) {
              onStateSelect([[8.4, 68.7], [37.6, 97.2]], temples[0]);
            }
          }}
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
        
        <div style={{ display: 'flex', gap: 8, position: 'relative' }} ref={searchRef}>
          <input
            type="text"
            placeholder="Search temple name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(15,23,42,0.6)',
              color: '#f1f5f9',
              border: '1px solid rgba(148,163,184,0.2)',
              fontSize: 12,
              fontWeight: 500,
              outline: 'none',
              minWidth: 0,
            }}
          />
          <button
            onClick={() => {
              const temple = temples
                .find(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));
              if (temple) {
                onSelect(temple);
                setSelectedState(temple.state || 'Other');
                setSearchQuery(`${temple.name} (${temple.lat.toFixed(4)}, ${temple.lng.toFixed(4)})`);
                setShowSuggestions(false);
              }
            }}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '0 14px',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '0.05em',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
            onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
          >
            SEARCH
          </button>

          {/* Suggestions Dropdown */}
          {showSuggestions && searchQuery.trim().length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 4,
              background: 'rgba(15,23,42,0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(148,163,184,0.2)',
              borderRadius: 8,
              maxHeight: 250,
              overflowY: 'auto',
              zIndex: 50,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }}>
              {temples
                .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .slice(0, 50)
                .map(t => (
                  <div
                    key={t.id}
                    onClick={() => {
                      onSelect(t);
                      setSelectedState(t.state || 'Other');
                      setSearchQuery(`${t.name} (${t.lat.toFixed(4)}, ${t.lng.toFixed(4)})`);
                      setShowSuggestions(false);
                    }}
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid rgba(148,163,184,0.1)',
                      cursor: 'pointer',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>{t.name}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                       📍 {t.lat.toFixed(4)}, {t.lng.toFixed(4)}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ flex: 1 }} />

      {/* ── Footer ── */}
      <div style={{
        padding: '12px 18px',
        borderTop: '1px solid rgba(148,163,184,0.08)',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <Info size={12} color="#e2e8f0" />
        <p style={{ fontSize: 10, color: '#e2e8f0' }}>
          Updates every ~12s · {selectedState}
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
