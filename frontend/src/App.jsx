import React, { useState, useEffect, useRef, useCallback } from 'react';
import MapView from './components/Map';
import Sidebar from './components/Sidebar';
import CrowdStats from './components/CrowdStats';
import { createDataEngine } from './dataEngine';
import { Bell, X, AlertTriangle } from 'lucide-react';
import axios from 'axios';

const UPDATE_INTERVAL = 12_000; // 12 seconds — realistic, not jittery

const FALLBACK_TEMPLES = [
  {
    id: "T1",
    name: "Kashi Vishwanath Temple",
    latitude: 25.3109,
    longitude: 83.0107,
    state: "Uttar Pradesh",
    zones_config: [
      { id: "A", label: "Main Sanctum", lat: 25.3109, lng: 83.0108, radius: 60 },
      { id: "B", label: "Gyanvapi Gate", lat: 25.3112, lng: 83.0102, radius: 50 },
      { id: "C", label: "Vishwanath Gali", lat: 25.3106, lng: 83.0115, radius: 70 }
    ],
    exit_routes_config: [
      { id: "exit-main", label: "Main Exit → Dashashwamedh Ghat", color: "#22c55e", points: [[25.3109, 83.0107], [25.3105, 83.0118], [25.3098, 83.0128], [25.3093, 83.0138], [25.3089, 83.0148]] },
      { id: "exit-north", label: "North Exit → Lahurabir", color: "#3b82f6", points: [[25.3109, 83.0107], [25.3115, 83.0102], [25.3122, 83.0096], [25.3130, 83.0088]] },
      { id: "exit-emergency", label: "Emergency Exit → Maidagin", color: "#f59e0b", points: [[25.3109, 83.0107], [25.3116, 83.0115], [25.3125, 83.0120], [25.3135, 83.0125]], dashed: true }
    ]
  },
  {
    id: "T2",
    name: "Sankat Mochan Temple",
    latitude: 25.2887,
    longitude: 82.9996,
    state: "Uttar Pradesh",
    zones_config: [
      { id: "A", label: "Main Shrine", lat: 25.2887, lng: 82.9996, radius: 55 },
      { id: "B", label: "Outer Courtyard", lat: 25.2882, lng: 83.0002, radius: 65 }
    ],
    exit_routes_config: [
      { id: "exit-assi", label: "Main Gate → Assi Ghat Road", color: "#22c55e", points: [[25.2887, 82.9996], [25.2880, 83.0005], [25.2873, 83.0015], [25.2865, 83.0025]] },
      { id: "exit-lanka", label: "Side Exit → Lanka", color: "#a855f7", points: [[25.2887, 82.9996], [25.2893, 82.9988], [25.2900, 82.9978]], dashed: true }
    ]
  },
  {
    id: "T3",
    name: "Durga Temple",
    latitude: 25.2802,
    longitude: 83.0061,
    state: "Uttar Pradesh",
    zones_config: [
      { id: "A", label: "Main Hall", lat: 25.2802, lng: 83.0061, radius: 50 },
      { id: "B", label: "Durgakund Side", lat: 25.2798, lng: 83.0070, radius: 60 }
    ],
    exit_routes_config: [
      { id: "exit-lanka", label: "Main Gate → Lanka Road", color: "#22c55e", points: [[25.2802, 83.0061], [25.2795, 83.0070], [25.2788, 83.0082]] },
      { id: "exit-durgakund", label: "Side Exit → Durgakund", color: "#3b82f6", points: [[25.2802, 83.0061], [25.2808, 83.0052], [25.2815, 83.0044]], dashed: true }
    ]
  }
];

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
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    axios.get(`${API_URL}/temples`).then(res => {
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
      console.warn("Failed to load temples from API, falling back to local simulation data.");
      const data = FALLBACK_TEMPLES.map(t => ({
        ...t,
        lat: t.latitude,
        lng: t.longitude
      }));
      setTemples(data);
      setSelected(data[0]);
      engine.current = createDataEngine(data);
      setCrowdData(engine.current.tick());
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
      const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/crowd';
      ws = new WebSocket(WS_URL);
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
