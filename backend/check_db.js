const Database = require('better-sqlite3');
const db = new Database('./crowdrakshak.db');

const total = db.prepare('SELECT COUNT(*) as c FROM temples').get();
console.log('Total temples:', total.c);

const sample = db.prepare('SELECT id, name, state, latitude, longitude FROM temples LIMIT 30').all();
console.log('\nSample temples:');
sample.forEach(t => {
  const hasLat = t.latitude !== null && t.latitude !== '' && !isNaN(parseFloat(t.latitude));
  const hasLng = t.longitude !== null && t.longitude !== '' && !isNaN(parseFloat(t.longitude));
  console.log(`  [${hasLat && hasLng ? 'OK' : 'NO COORDS'}] ${t.name} | state=${t.state} | lat=${t.latitude} | lng=${t.longitude}`);
});

const nullCoords = db.prepare("SELECT COUNT(*) as c FROM temples WHERE latitude IS NULL OR longitude IS NULL OR latitude = '' OR longitude = ''").get();
console.log('\nTemples with NULL/empty coordinates:', nullCoords.c);

const validCoords = db.prepare("SELECT COUNT(*) as c FROM temples WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND latitude != '' AND longitude != ''").get();
console.log('Temples with valid coordinates:', validCoords.c);

const byState = db.prepare("SELECT state, COUNT(*) as count FROM temples GROUP BY state ORDER BY count DESC").all();
console.log('\nTemples by state:');
byState.forEach(s => console.log(`  ${s.state}: ${s.count}`));
