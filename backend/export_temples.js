const Database = require('better-sqlite3');
const fs = require('fs');

const db = new Database('./crowdrakshak.db');

const temples = db.prepare(`
  SELECT id, name, latitude, longitude, state, imageLink, zones_config, exit_routes_config
  FROM temples
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL
  AND latitude != '' AND longitude != ''
`).all().map(t => {
  let zones = [];
  let exits = [];
  try { zones = JSON.parse(t.zones_config || '[]'); } catch(e) {}
  try { exits = JSON.parse(t.exit_routes_config || '[]'); } catch(e) {}
  return {
    id: t.id,
    name: t.name,
    latitude: parseFloat(t.latitude),
    longitude: parseFloat(t.longitude),
    state: t.state || 'Unknown',
    imageLink: t.imageLink || '',
    zones_config: zones,
    exit_routes_config: exits
  };
});

const output = `// Auto-generated from crowdrakshak.db — DO NOT EDIT MANUALLY
// Generated: ${new Date().toISOString()}
// Total temples: ${temples.length}

const TEMPLE_DATA = ${JSON.stringify(temples, null, 2)};

export default TEMPLE_DATA;
`;

fs.writeFileSync('../frontend/src/templeData.js', output);
console.log(`Exported ${temples.length} temples to frontend/src/templeData.js`);
