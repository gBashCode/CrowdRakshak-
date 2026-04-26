import React, { useState, useEffect, useRef, useCallback } from 'react';
import MapView from './components/Map';
import Sidebar from './components/Sidebar';
import CrowdStats from './components/CrowdStats';
import { createDataEngine } from './dataEngine';
import { Bell, X, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const UPDATE_INTERVAL = 12_000; // 12 seconds — realistic, not jittery

export default function App() {
  const [temples, setTemples] = useState([]);
  const [selected, setSelected] = useState(null);
  
  const engine = useRef(null);
  const mapElRef = useRef(null);

  const [crowdData, setCrowdData] = useState({});
  const [prevCrowdData, setPrevCrowdData] = useState({});
  const [notifications, setNotifs] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [activeSOS, setActiveSOS] = useState(null);

  // Fetch temples on mount
  useEffect(() => {
    axios.get('http://localhost:8000/temples').then(res => {
      const data = res.data.map(t => ({
        ...t,
        lat: t.latitude,
        lng: t.longitude
      }));
      if (data.length > 0) {
        setTemples(data);
        setSelected(data[0]);
        engine.current = createDataEngine(data);
        setCrowdData(engine.current.tick());
      }
    }).catch(err => {
      console.error("Failed to load temples", err);
    });
  }, []);

  // ── Try WebSocket; fall back to simulation ──────────────────────────────
  useEffect(() => {
    let ws;
    let interval;

    function startSimulation() {
      if (!engine.current) return;
      interval = setInterval(() => {
        setPrevCrowdData((prev) => prev);
        setCrowdData((prev) => {
          setPrevCrowdData(prev);
          const next = engine.current.tick();
          // Notify on HIGH
          Object.values(next).forEach((d) => {
            if (d.status === 'HIGH' && prev[d.temple_id]?.status !== 'HIGH') {
              const name = temples.find(t => t.id === d.temple_id)?.name ?? d.temple_id;
              pushNotif(`🚨 High crowd at ${name}!`);
            }
          });
          return next;
        });
      }, UPDATE_INTERVAL);
    }

    try {
      ws = new WebSocket('ws://localhost:8000/ws/crowd');
      ws.onopen = () => { setWsConnected(true); };
      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        setCrowdData((prev) => {
          setPrevCrowdData(prev);
          return { ...prev, [data.temple_id]: data };
        });
      };
      ws.onerror = () => { setWsConnected(false); startSimulation(); };
      ws.onclose = () => { setWsConnected(false); };
    } catch {
      setWsConnected(false);
      startSimulation();
    }

    startSimulation(); // always run sim as backup

    return () => {
      ws?.close();
      clearInterval(interval);
    };
  }, []);

  const pushNotif = useCallback((msg) => {
    const id = Date.now();
    setNotifs((p) => [...p, { id, msg }]);
    setTimeout(() => setNotifs((p) => p.filter((n) => n.id !== id)), 6000);
  }, []);

  if (!selected) {
    return <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', color: 'white'}}>Loading...</div>;
  }

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      fontFamily: "'Inter', system-ui, sans-serif",
      boxShadow: activeSOS ? 'inset 0 0 150px rgba(220, 38, 38, 0.45)' : 'none',
      transition: 'box-shadow 0.5s ease-in-out',
    }}>
      <style>{`
        @keyframes pulse-sos {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.3; }
        }
      `}</style>

      {/* ── Global SOS Overlays ── */}
      {activeSOS && (
        <>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(220, 38, 38, 0.12)',
            pointerEvents: 'none',
            zIndex: 9998,
            animation: 'pulse-sos 2s infinite',
          }} />
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            background: '#ef4444', color: 'white',
            padding: '8px', textAlign: 'center',
            fontWeight: 900, letterSpacing: '0.2em', fontSize: 14,
            zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10,
            boxShadow: '0 4px 20px rgba(239,68,68,0.5)'
          }}>
            <AlertTriangle size={18} />
            {activeSOS.toUpperCase()} EMERGENCY ACTIVE
            <AlertTriangle size={18} />
          </div>
        </>
      )}

      {/* Map fills entire screen */}
      <div style={{ position: 'absolute', inset: 0 }} ref={mapElRef}>
        <MapView
          temples={temples}
          selected={selected}
          crowdData={crowdData}
          mapElRef={mapElRef}
          activeSOS={activeSOS}
          setActiveSOS={setActiveSOS}
        />

        {/* ── Connection status pill — offset to sit beside sidebar ── */}
        <div style={{
          position: 'absolute', top: 16, left: 352, zIndex: 1100,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 99,
          background: 'rgba(8,15,35,0.6)',
          backdropFilter: 'blur(16px)',
          border: wsConnected
            ? '1px solid rgba(34,197,94,0.25)'
            : '1px solid rgba(245,158,11,0.25)',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: wsConnected ? '#22c55e' : '#f59e0b',
            boxShadow: wsConnected ? '0 0 6px #22c55e' : '0 0 6px #f59e0b',
          }} />
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            color: wsConnected ? '#4ade80' : '#fbbf24',
          }}>
            {wsConnected ? 'WebSocket Live' : 'Simulation Mode'}
          </span>
        </div>

        {/* ── Stats card ── */}
        <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}>
          <CrowdStats
            data={crowdData[selected.id]}
            prevData={prevCrowdData[selected.id]}
            temple={selected}
            mapElRef={mapElRef}
          />
        </div>

        {/* ── Notifications ── */}
        <div style={{
          position: 'absolute', bottom: 24, left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center',
        }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              className="animate-fade-up"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 18px', borderRadius: 99,
                background: 'rgba(239,68,68,0.85)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(239,68,68,0.5)',
                boxShadow: '0 4px 24px rgba(239,68,68,0.35)',
                color: 'white',
              }}
            >
              <Bell size={14} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>{n.msg}</span>
              <button
                onClick={() => setNotifs((p) => p.filter((x) => x.id !== n.id))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex' }}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sidebar overlays map on the left ── */}
      <div style={{
        position: 'absolute', top: 16, left: 16, bottom: 16,
        zIndex: 1000, borderRadius: 24, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        <Sidebar
          temples={temples}
          crowdData={crowdData}
          prevCrowdData={prevCrowdData}
          selectedId={selected.id}
          onSelect={(t) => {
            setSelected(t);
            const data = crowdData[t.id];
            if (data && data.status === 'HIGH') {
              pushNotif(`🚨 Alert: ${t.name} is currently experiencing heavy overcrowding!`);
            }
          }}
        />
      </div>
    </div>
  );
}
