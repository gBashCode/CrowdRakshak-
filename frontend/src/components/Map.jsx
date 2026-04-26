import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import html2canvas from 'html2canvas';
import { Download, Map as MapIcon, X } from 'lucide-react';

// ── Fix default icons ──────────────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ── Custom icons ───────────────────────────────────────────────────────────────
const userIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:18px; height:18px; border-radius:50%;
    background:rgba(59,130,246,0.9);
    border:3px solid white;
    box-shadow:0 0 0 6px rgba(59,130,246,0.25), 0 2px 12px rgba(0,0,0,0.4);
    animation: pulse-user 1.5s ease-in-out infinite;
  "></div>
  <style>
    @keyframes pulse-user {
      0%,100% { box-shadow:0 0 0 6px rgba(59,130,246,0.25), 0 2px 12px rgba(0,0,0,0.4); }
      50%      { box-shadow:0 0 0 14px rgba(59,130,246,0.08), 0 2px 12px rgba(0,0,0,0.4); }
    }
  </style>`,
  iconSize:   [18, 18],
  iconAnchor: [9, 9],
});

function templeIcon(status) {
  const color = status === 'HIGH' ? '#ef4444' : status === 'MODERATE' ? '#a855f7' : '#22c55e';
  return L.divIcon({
    className: '',
    html: `<div style="
      width:14px; height:14px; border-radius:50%;
      background:${color};
      border:2.5px solid white;
      box-shadow:0 0 12px ${color}88, 0 2px 8px rgba(0,0,0,0.5);
    "></div>`,
    iconSize:   [14, 14],
    iconAnchor: [7, 7],
  });
}

// ── Smooth fly-to on temple select ────────────────────────────────────────────
function FlyTo({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 17, { duration: 1.6, easeLinearity: 0.25 });
  }, [lat, lng]);
  return null;
}

// ── Leaflet.heat heatmap layer ────────────────────────────────────────────────
function HeatmapLayer({ temple, crowdData }) {
  const map     = useMap();
  const heatRef = useRef(null);

  useEffect(() => {
    const cfg_zones = temple.zones_config;
    const data = crowdData[temple.id];
    if (!cfg_zones || !data) return;

    const points = [];
    data.zones.forEach((zone) => {
      const zoneCfg = cfg_zones.find((z) => z.id === zone.id) || cfg_zones[0];
      const intensity = Math.min(zone.count / 160, 1);
      const numPoints = Math.min(zone.count * 4, 400);

      for (let i = 0; i < numPoints; i++) {
        const spread = (zoneCfg.radius / 111320) * (0.4 + Math.random() * 0.6);
        const angle  = Math.random() * Math.PI * 2;
        const lat    = zoneCfg.lat + spread * Math.cos(angle);
        const lng    = zoneCfg.lng + spread * Math.sin(angle) * 1.2;
        points.push([lat, lng, intensity]);
      }
    });

    if (heatRef.current) {
      heatRef.current.setLatLngs(points);
    } else {
      heatRef.current = L.heatLayer(points, {
        radius:  35,
        blur:    25,
        maxZoom: 18,
        gradient: {
          0.0: 'rgba(34,197,94,0)',
          0.2: '#22c55e',
          0.5: '#a855f7',
          0.75: '#ef4444',
          1.0: '#ff0000',
        },
      }).addTo(map);
    }

    return () => {
      if (heatRef.current) {
        map.removeLayer(heatRef.current);
        heatRef.current = null;
      }
    };
  }, [crowdData, temple, map]);

  return null;
}

// ── Exit routes as animated polylines ────────────────────────────────────────
function ExitRoutes({ temple }) {
  const routes = temple.exit_routes_config;
  if (!routes) return null;

  return (
    <>
      {routes.map((route) => (
        <React.Fragment key={route.id}>
          {/* Route shadow */}
          <Polyline
            positions={route.points}
            pathOptions={{ color: 'rgba(0,0,0,0.4)', weight: 6, opacity: 1 }}
          />
          {/* Route line */}
          <Polyline
            positions={route.points}
            pathOptions={{
              color:     route.color,
              weight:    3,
              opacity:   0.9,
              dashArray: route.dashed ? '10 8' : null,
              lineCap:   'round',
              lineJoin:  'round',
            }}
          />
          {/* Arrow marker at endpoint */}
          <Circle
            center={route.points[route.points.length - 1]}
            radius={12}
            pathOptions={{
              color:       route.color,
              fillColor:   route.color,
              fillOpacity: 0.8,
              weight:      2,
            }}
          >
            <Popup>
              <div style={{ fontFamily: 'Inter,sans-serif', fontWeight: 600, fontSize: 12 }}>
                {route.label}
              </div>
            </Popup>
          </Circle>
        </React.Fragment>
      ))}
    </>
  );
}

// ── Zone label circles ────────────────────────────────────────────────────────
function ZoneOverlay({ temple, crowdData }) {
  const zones_cfg = temple.zones_config;
  const data = crowdData[temple.id];
  if (!zones_cfg || !data) return null;

  return (
    <>
      {zones_cfg.map((zone) => {
        const zoneData = data.zones.find((z) => z.id === zone.id);
        const count    = zoneData?.count ?? 0;
        const density  = Math.min(count / 160, 1);
        const color    = density > 0.7 ? '#ef4444' : density > 0.4 ? '#a855f7' : '#22c55e';
        return (
          <Circle
            key={zone.id}
            center={[zone.lat, zone.lng]}
            radius={zone.radius}
            pathOptions={{
              color:       color,
              fillColor:   color,
              fillOpacity: 0.08,
              weight:      1.5,
              opacity:     0.5,
              dashArray:   '6 4',
            }}
          >
            <Popup>
              <div style={{ fontFamily: 'Inter,sans-serif', minWidth: 130 }}>
                <strong style={{ fontSize: 13 }}>{zone.label}</strong>
                <div style={{ color, fontWeight: 700, marginTop: 3 }}>{count} people</div>
              </div>
            </Popup>
          </Circle>
        );
      })}
    </>
  );
}

// ── User live location ────────────────────────────────────────────────────────
function UserLocation() {
  const [pos, setPos] = useState(null);
  const [err, setErr] = useState(false);
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) { setErr(true); return; }

    const watcher = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const latlng = [coords.latitude, coords.longitude];
        setPos(latlng);
      },
      () => setErr(true),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  if (!pos || err) return null;

  return (
    <Marker position={pos} icon={userIcon} zIndexOffset={1000}>
      <Popup>
        <div style={{ fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600 }}>
          📍 Your Location
          <div style={{ color: '#64748b', fontWeight: 400, marginTop: 2 }}>
            {pos[0].toFixed(5)}, {pos[1].toFixed(5)}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

// ── Main MapView ──────────────────────────────────────────────────────────────
const MapView = ({ temples, selected, crowdData, mapElRef, activeSOS, setActiveSOS, isMobile }) => {
  const [downloading, setDownloading] = useState(false);
  const [showBuildingMap, setShowBuildingMap] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [pendingSOS, setPendingSOS] = useState(null);

  // Close modal and reset error when selected temple changes
  useEffect(() => {
    setShowBuildingMap(false);
    setImgError(false);
  }, [selected]);

  async function handleDownload() {
    setDownloading(true);
    try {
      const el = mapElRef?.current;
      if (!el) return;
      const canvas = await html2canvas(el, { useCORS: true, backgroundColor: '#0f172a', scale: 2, logging: false });
      const link = document.createElement('a');
      link.download = `${selected.name.replace(/\s+/g, '_')}_offline_map.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={[selected.lat, selected.lng]}
        zoom={16}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Fly to selected temple */}
        <FlyTo lat={selected.lat} lng={selected.lng} />

        {/* Heatmap for selected temple only */}
        <HeatmapLayer temple={selected} crowdData={crowdData} />

        {/* Zone boundary circles */}
        <ZoneOverlay temple={selected} crowdData={crowdData} />

        {/* Exit routes */}
        <ExitRoutes temple={selected} />

        {/* Live user location */}
        <UserLocation />

        {/* Temple markers (all temples, dim non-selected) */}
        {temples.map((temple) => {
          const status = crowdData[temple.id]?.status || 'LOW';
          const isSelected = temple.id === selected.id;
          return (
            <React.Fragment key={temple.id}>
              {/* Boundary marker with black dashed lines */}
              <Circle
                center={[temple.lat, temple.lng]}
                radius={100}
                pathOptions={{
                  color: '#000000',
                  weight: 2,
                  dashArray: '8 8',
                  fillOpacity: 0.0,
                  opacity: isSelected ? 0.8 : 0.3,
                }}
              />
              <Marker
                position={[temple.lat, temple.lng]}
                icon={templeIcon(status)}
                opacity={isSelected ? 1 : 0.45}
                zIndexOffset={isSelected ? 500 : 0}
              >
                <Popup>
                  <div style={{ fontFamily: 'Inter,sans-serif', minWidth: 160 }}>
                    <strong style={{ fontSize: 13 }}>{temple.name}</strong>
                    <div style={{
                      color: status === 'HIGH' ? '#ef4444' : status === 'MODERATE' ? '#a855f7' : '#22c55e',
                      fontWeight: 700, marginTop: 4, fontSize: 12
                    }}>
                      {status} · {crowdData[temple.id]?.total_count ?? '—'} people
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>
                      {(temple.exit_routes_config?.length ?? 0)} exit routes mapped
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Bottom Right Controls (Legend + Buttons) */}
      <div style={{
        position: 'absolute', 
        bottom: isMobile ? 'auto' : 24, 
        top: isMobile ? 70 : 'auto',
        right: isMobile ? 16 : 24, 
        zIndex: 1000,
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: 'flex-end', 
        gap: 16,
      }}>
        {/* SOS Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activeSOS ? (
            <button
              onClick={() => setActiveSOS(null)}
              style={{
                background: 'rgba(220, 38, 38, 0.9)',
                backdropFilter: 'blur(16px)',
                border: '2px solid rgba(248, 113, 113, 0.8)',
                borderRadius: 14, padding: '16px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                color: '#fff', cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 24px rgba(220,38,38,0.6)',
                fontWeight: 800, fontSize: 13, letterSpacing: '0.05em',
                animation: 'pulse-sos 1.5s infinite',
              }}
            >
              <X size={18} />
              END SOS
            </button>
          ) : (
            <div style={{
              background: 'rgba(8,15,35,0.72)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(148,163,184,0.1)',
              borderRadius: 14, padding: '10px',
              display: 'flex', flexDirection: 'column', gap: 6,
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 2 }}>Emergency</p>
              <button
                onClick={() => setPendingSOS('Medical')}
                style={{
                  background: 'rgba(225, 29, 72, 0.15)', border: '1px solid rgba(225, 29, 72, 0.3)',
                  color: '#fb7185', borderRadius: 8, padding: '8px 12px', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(225, 29, 72, 0.3)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(225, 29, 72, 0.15)'; }}
              >
                MEDICAL SOS
              </button>
              <button
                onClick={() => setPendingSOS('Fire')}
                style={{
                  background: 'rgba(234, 88, 12, 0.15)', border: '1px solid rgba(234, 88, 12, 0.3)',
                  color: '#fdba74', borderRadius: 8, padding: '8px 12px', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(234, 88, 12, 0.3)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(234, 88, 12, 0.15)'; }}
              >
                FIRE DEPT
              </button>
              <button
                onClick={() => setPendingSOS('Stampede')}
                style={{
                  background: 'rgba(147, 51, 234, 0.15)', border: '1px solid rgba(147, 51, 234, 0.3)',
                  color: '#d8b4fe', borderRadius: 8, padding: '8px 12px', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(147, 51, 234, 0.3)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(147, 51, 234, 0.15)'; }}
              >
                STAMPEDE RISK
              </button>
            </div>
          )}
          
          {/* Building Map Button */}
          <button
            onClick={() => setShowBuildingMap(true)}
            style={{
              background: 'rgba(8,15,35,0.72)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(148,163,184,0.1)',
              borderRadius: 14, padding: '12px 16px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
              color: '#e2e8f0', cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              height: 'fit-content',
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(30,41,59,0.8)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(8,15,35,0.72)'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapIcon size={18} color="#3b82f6" />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>STRUCTURAL MAP</span>
            </div>
            <span style={{ fontSize: 9, color: '#94a3b8' }}>View Building Plan</span>
          </button>
        </div>

        {/* Legend overlay */}
        <div style={{
          background: 'rgba(8,15,35,0.72)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(148,163,184,0.1)',
          borderRadius: 14, padding: '12px 14px',
          display: 'flex', flexDirection: 'column', gap: 6,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Map Legend</p>
          {[
            { color: '#22c55e', label: 'Low density / Safe exit' },
            { color: '#a855f7', label: 'Moderate density' },
            { color: '#ef4444', label: 'High density' },
            { color: '#3b82f6', label: 'Your location' },
            { color: '#f59e0b', label: 'Emergency exit' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Download button */}
      {!isMobile && (
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 99,
            background: 'rgba(8,15,35,0.72)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(168,85,247,0.3)',
            color: downloading ? '#475569' : '#c4b5fd',
            fontFamily: 'Inter,sans-serif', fontSize: 12, fontWeight: 600,
            cursor: downloading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            transition: 'all 0.2s',
          }}
        >
          <Download size={14} />
          {downloading ? 'Capturing...' : 'Download Offline Map'}
        </button>
      )}

      {/* Building Map Modal Overlay */}
      {showBuildingMap && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(2,6,23,0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            position: 'relative',
            width: '90%', maxWidth: 1000, height: '85vh',
            background: 'rgba(15,23,42,0.9)',
            border: '1px solid rgba(148,163,184,0.15)',
            borderRadius: 24,
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
            overflow: 'hidden',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid rgba(148,163,184,0.1)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  Structural Building Map
                </h3>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>
                  {selected.name}
                </p>
              </div>
              <button
                onClick={() => setShowBuildingMap(false)}
                style={{
                  background: 'rgba(30,41,59,0.8)', border: 'none', cursor: 'pointer',
                  width: 36, height: 36, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#94a3b8', transition: 'all 0.2s',
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(51,65,85,1)'; e.currentTarget.style.color = '#fff'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(30,41,59,0.8)'; e.currentTarget.style.color = '#94a3b8'; }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: The Image */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {!imgError ? (
                <img
                  src={`/structural_maps/${selected.id}.png`}
                  alt={`${selected.name} Building Map`}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => {
                    if (e.target.src.endsWith('.png')) {
                      e.target.src = `/structural_maps/${selected.id}.jpg`;
                    } else {
                      setImgError(true);
                    }
                  }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#64748b', textAlign: 'center' }}>
                  <MapIcon size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
                  <p style={{ fontSize: 15, fontWeight: 500 }}>No structural map image found.</p>
                  <p style={{ fontSize: 13, marginTop: 8 }}>
                    Please add an image file (e.g. <strong>{selected.id}.png</strong> or <strong>{selected.id}.jpg</strong>) to the <br/>
                    <code>public/structural_maps/</code> folder.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* SOS Confirmation Modal */}
      {pendingSOS && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(2,6,23,0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: 'rgba(15,23,42,0.95)',
            border: '1px solid rgba(220, 38, 38, 0.4)',
            borderRadius: 20, padding: 24, width: '90%', maxWidth: 400,
            boxShadow: '0 20px 60px rgba(220,38,38,0.2)',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc', marginBottom: 12 }}>
              Activate {pendingSOS} SOS?
            </h3>
            <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24, lineHeight: 1.5 }}>
              This will immediately alert the corresponding authorities and change the dashboard to emergency mode. Are you sure you want to proceed?
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setPendingSOS(null)}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                  background: 'rgba(255,255,255,0.1)', color: '#e2e8f0',
                  fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setActiveSOS(pendingSOS);
                  setPendingSOS(null);
                }}
                style={{
                  flex: 1, padding: '12px', borderRadius: 12, border: 'none',
                  background: '#ef4444', color: 'white',
                  fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.4)'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
                onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
              >
                Confirm SOS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
