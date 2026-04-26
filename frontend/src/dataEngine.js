/**
 * Realistic crowd simulation engine.
 * - Time-of-day aware base crowd levels
 * - Gradual drift (±10 per tick) instead of random jumps
 * - State is preserved between updates
 */

const TEMPLE_PROFILES = {
  T1: { name: 'Kashi Vishwanath Temple', peakHours: [6, 7, 17, 18, 19], baseMod: 1.2 },
  T2: { name: 'Sankat Mochan Temple',    peakHours: [7, 8, 16, 17, 18], baseMod: 0.85 },
  T3: { name: 'Durga Temple',            peakHours: [8, 9, 16, 17],     baseMod: 0.7  },
};

function getTimeBaseCrowd(templeId) {
  const hour = new Date().getHours();
  const profile = TEMPLE_PROFILES[templeId] || { peakHours: [8, 17], baseMod: 1 };
  const isPeak = profile.peakHours.includes(hour);
  const isNight = hour >= 22 || hour <= 4;
  const base = isNight ? 15 : isPeak ? 160 : 80;
  return Math.round(base * profile.baseMod);
}

export function createDataEngine(temples) {
  // Initialize state with realistic values per temple
  const state = {};
  temples.forEach((t) => {
    const base = getTimeBaseCrowd(t.id);
    const noise = Math.floor(Math.random() * 30) - 15;
    const count = Math.max(5, base + noise);
    state[t.id] = {
      count,
      zoneRatio: 0.4 + Math.random() * 0.2, // zone A gets 40–60%
    };
  });

  function tick() {
    const updated = {};
    temples.forEach((t) => {
      const s = state[t.id];
      const timeCrowd = getTimeBaseCrowd(t.id);

      // Drift slowly toward time-based baseline (mean-reversion)
      const drift  = (timeCrowd - s.count) * 0.08;
      const noise  = (Math.random() - 0.5) * 18;
      const newCount = Math.max(5, Math.min(300, Math.round(s.count + drift + noise)));

      // Zone ratio drifts slowly
      const ratioDrift = (Math.random() - 0.5) * 0.04;
      const newRatio = Math.max(0.3, Math.min(0.7, s.zoneRatio + ratioDrift));

      state[t.id] = { count: newCount, zoneRatio: newRatio };

      const zoneA = Math.round(newCount * newRatio);
      const zoneB = newCount - zoneA;
      const status = newCount < 70 ? 'LOW' : newCount < 160 ? 'MODERATE' : 'HIGH';

      updated[t.id] = {
        temple_id: t.id,
        timestamp: new Date().toISOString(),
        total_count: newCount,
        zones: [
          { id: 'A', count: zoneA },
          { id: 'B', count: zoneB },
        ],
        status,
      };
    });
    return updated;
  }

  return { tick, getState: () => state };
}
