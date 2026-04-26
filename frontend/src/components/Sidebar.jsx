import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Users, TrendingUp, TrendingDown, Minus, Info, X, Search } from 'lucide-react';

const STATUS_CFG = {
  HIGH: { color: '#ef4444', border: 'rgba(239,68,68,0.25)', bg: 'rgba(239,68,68,0.12)', bar: 'linear-gradient(90deg,#ef4444,#f97316)' },
  MODERATE: { color: '#a855f7', border: 'rgba(168,85,247,0.25)', bg: 'rgba(168,85,247,0.12)', bar: 'linear-gradient(90deg,#a855f7,#ec4899)' },
  LOW: { color: '#22c55e', border: 'rgba(34,197,94,0.25)', bg: 'rgba(34,197,94,0.10)', bar: 'linear-gradient(90deg,#22c55e,#06b6d4)' },
};

function TrendIcon({ current, previous }) {
  if (previous === undefined) return <Minus size={12} color="#475569" />;
  if (current > previous + 3) return <TrendingUp size={12} color="#ef4444" />;
  if (current < previous - 3) return <TrendingDown size={12} color="#22c55e" />;
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

  // Filter temples by both state AND search query
  const stateFiltered = selectedState === 'All States'
    ? temples
    : temples.filter(t => (t.state || 'Unknown') === selectedState);

  const searchFiltered = searchQuery.trim().length > 0
    ? stateFiltered.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : stateFiltered;

  const suggestions = searchQuery.trim().length > 0
    ? stateFiltered.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 8)
    : [];

  const handleStateChange = (newState) => {
    setSelectedState(newState);
    setSearchQuery('');
    setShowSuggestions(false);
    if (newState !== 'All States' && onStateSelect) {
      const stateTemples = temples.filter(t => (t.state || 'Unknown') === newState);
      if (stateTemples.length > 0) {
        const lats = stateTemples.map(t => t.lat);
        const lngs = stateTemples.map(t => t.lng);
        onStateSelect(
          [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]],
          stateTemples[0]
        );
      }
    } else if (newState === 'All States' && onStateSelect) {
      onStateSelect([[8.4, 68.7], [37.6, 97.2]], temples[0]);
    }
  };

  const handleSelectTemple = (t) => {
    onSelect(t);
    setSelectedState(t.state || 'All States');
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleSearchClick = () => {
    if (suggestions.length > 0) {
      handleSelectTemple(suggestions[0]);
    } else if (searchFiltered.length > 0) {
      handleSelectTemple(searchFiltered[0]);
    }
  };

  return (
    <div style={{
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
    }}>
      {/* Accent bar */}
      <div style={{ height: 3, background: 'linear-gradient(90deg,#7c3aed,#db2777,#3b82f6)', flexShrink: 0 }} />

      {/* Header */}
      <div style={{
        padding: '16px 18px 14px',
        borderBottom: '1px solid rgba(148,163,184,0.08)',
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <img
              src="/logo.png"
              alt="CrowdRakshak Logo"
              style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, boxShadow: '0 4px 16px rgba(0,0,0,0.45)', objectFit: 'cover', background: '#f1f5f9' }}
            />
            <div>
              <h1 style={{ fontSize: 15, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.02em' }}>CrowdRakshak</h1>
              <p style={{ fontSize: 10, color: '#e2e8f0', fontWeight: 500 }}>Real-time crowd intelligence</p>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 10px', borderRadius: 8,
            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)',
            width: 'fit-content',
          }}>
            <span style={{ position: 'relative', display: 'inline-flex', width: 7, height: 7 }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ade80', opacity: 0.7, animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite' }} />
              <span style={{ position: 'relative', width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#4ade80', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Live Monitoring</span>
          </div>
        </div>
        {isMobile && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}>
            <X size={22} />
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div style={{ padding: '12px 18px 8px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* State dropdown */}
        <select
          value={selectedState}
          onChange={(e) => handleStateChange(e.target.value)}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 8,
            background: 'rgba(15,23,42,0.6)', color: '#f1f5f9',
            border: '1px solid rgba(148,163,184,0.2)', fontSize: 12, fontWeight: 600,
            outline: 'none', cursor: 'pointer',
          }}
        >
          {filterOptions.map(state => (
            <option key={state} value={state} style={{ background: '#0f172a', color: '#f1f5f9' }}>{state}</option>
          ))}
        </select>

        {/* Search input + button */}
        <div style={{ display: 'flex', gap: 8, position: 'relative' }} ref={searchRef}>
          <input
            type="text"
            placeholder="Search temple name..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearchClick(); }}
            style={{
              flex: 1, padding: '8px 12px', borderRadius: 8,
              background: 'rgba(15,23,42,0.6)', color: '#f1f5f9',
              border: '1px solid rgba(148,163,184,0.2)', fontSize: 12, fontWeight: 500,
              outline: 'none', minWidth: 0,
            }}
          />
          <button
            onClick={handleSearchClick}
            style={{
              background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8,
              padding: '0 14px', fontSize: 11, fontWeight: 800, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
            onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
          >
            <Search size={13} />
          </button>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
              background: 'rgba(10,18,40,0.98)', backdropFilter: 'blur(16px)',
              border: '1px solid rgba(148,163,184,0.2)', borderRadius: 8,
              maxHeight: 220, overflowY: 'auto', zIndex: 50,
              boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
            }}>
              {suggestions.map(t => {
                  const d = crowdData[t.id];
                  const status = d?.status?.toUpperCase() || 'LOW';
                  const cfg = STATUS_CFG[status] || STATUS_CFG['LOW'];
                  return (
                    <div
                      key={t.id}
                      onClick={() => handleSelectTemple(t)}
                      style={{ padding: '10px 12px', borderBottom: '1px solid rgba(148,163,184,0.08)', cursor: 'pointer' }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>{t.name}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '2px 6px', borderRadius: 99, border: `1px solid ${cfg.border}` }}>{status}</span>
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>📍 {t.state || 'Unknown'}</div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Result count */}
        <p style={{ fontSize: 10, color: '#475569', fontWeight: 600 }}>
          {searchFiltered.length} temple{searchFiltered.length !== 1 ? 's' : ''} {selectedState !== 'All States' ? `in ${selectedState}` : 'across India'}
        </p>
      </div>

      {/* Scrollable temple list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 12px' }}>
        {searchFiltered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
            <MapPin size={28} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
            <p style={{ fontSize: 12 }}>No temples found</p>
          </div>
        ) : (
          searchFiltered.map((t) => {
            const d = crowdData[t.id];
            const prevD = prevCrowdData?.[t.id];
            const status = d?.status?.toUpperCase() || 'LOW';
            const cfg = STATUS_CFG[status] || STATUS_CFG['LOW'];
            const isSelected = t.id === selectedId;
            const count = d?.total_count ?? '—';
            const prevCount = prevD?.total_count;

            return (
              <div
                key={t.id}
                onClick={() => handleSelectTemple(t)}
                style={{
                  padding: '11px 12px',
                  borderRadius: 12,
                  marginBottom: 6,
                  cursor: 'pointer',
                  border: isSelected ? `1px solid ${cfg.border}` : '1px solid rgba(148,163,184,0.07)',
                  background: isSelected ? cfg.bg : 'rgba(15,23,42,0.35)',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? `0 0 14px ${cfg.color}18` : 'none',
                }}
                onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(15,23,42,0.35)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ flex: 1, paddingRight: 8 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: isSelected ? '#f1f5f9' : '#cbd5e1', lineHeight: 1.3 }}>{t.name}</p>
                    <p style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>📍 {t.state || 'Unknown'}</p>
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 99, whiteSpace: 'nowrap',
                    color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
                  }}>{status}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Users size={11} color="#64748b" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{count}</span>
                    <span style={{ fontSize: 10, color: '#64748b' }}>people</span>
                  </div>
                  <TrendIcon current={count} previous={prevCount} />
                </div>

                {/* Mini crowd bar */}
                <div style={{ marginTop: 6, height: 3, background: 'rgba(100,116,139,0.15)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(((count || 0) / 800) * 100, 100)}%`,
                    background: cfg.bar,
                    borderRadius: 99,
                    transition: 'width 1.2s ease',
                  }} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '10px 18px',
        borderTop: '1px solid rgba(148,163,184,0.08)',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <Info size={11} color="#e2e8f0" />
        <p style={{ fontSize: 10, color: '#e2e8f0' }}>
          Updates every ~12s · {searchFiltered.length} shown
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
