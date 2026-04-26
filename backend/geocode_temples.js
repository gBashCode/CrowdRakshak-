const Database = require('better-sqlite3');
const https = require('https');

const db = new Database('./crowdrakshak.db');

// Helper: HTTP GET as promise
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: { 'User-Agent': 'CrowdRakshak-Geocoder/1.0 (temple-management-app)' }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve(null); }
      });
    }).on('error', reject);
  });
}

// Sleep helper (Nominatim rate limit: 1 req/sec)
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// State name lookup map for "Unknown" temples
const TEMPLE_STATE_MAP = {
  // Andhra Pradesh
  'Ahobilam': 'Andhra Pradesh', 'Alipiri': 'Andhra Pradesh', 'Amararama': 'Andhra Pradesh',
  'Annavaram': 'Andhra Pradesh', 'Bhavanarayana Temple': 'Andhra Pradesh',
  'Bugga Ramalingeswara': 'Andhra Pradesh', 'Chintalarayaswami': 'Andhra Pradesh',
  'Draksharama': 'Andhra Pradesh', 'Govindaraja Temple': 'Andhra Pradesh',
  'Jogulamba': 'Andhra Pradesh', 'Kanaka Durga': 'Andhra Pradesh',
  'Kapila Theertham': 'Andhra Pradesh', 'Kalyana Venkateswara': 'Andhra Pradesh',
  'Kodandarama Temple, Tirupati': 'Andhra Pradesh', 'Kotappakonda': 'Andhra Pradesh',
  'Kumararama Temple': 'Andhra Pradesh', 'Mahanandi': 'Andhra Pradesh',
  'Mallikarjuna': 'Andhra Pradesh', 'Narasimha Swamy': 'Andhra Pradesh',
  'Panakala Lakshmi Narasimha': 'Andhra Pradesh', 'Simhachalam': 'Andhra Pradesh',
  'Srikalahasti': 'Andhra Pradesh', 'Srisailam': 'Andhra Pradesh',
  'Tirumala Venkateswara': 'Andhra Pradesh', 'Varadaraja Swamy': 'Andhra Pradesh',
  'Vemulavada': 'Andhra Pradesh', 'Vijayawada': 'Andhra Pradesh',
};

async function geocodeTemple(name, state) {
  // Try with state hint first
  const stateHint = (state && state !== 'Unknown') ? state : '';
  const query1 = encodeURIComponent(`${name} temple ${stateHint} India`);
  const url1 = `https://nominatim.openstreetmap.org/search?q=${query1}&format=json&limit=1&countrycodes=in`;

  let result = await httpGet(url1);
  if (result && result.length > 0) {
    return { lat: parseFloat(result[0].lat), lng: parseFloat(result[0].lon), source: 'nominatim' };
  }

  // Fallback: just name + India
  await sleep(1100);
  const query2 = encodeURIComponent(`${name} India`);
  const url2 = `https://nominatim.openstreetmap.org/search?q=${query2}&format=json&limit=1&countrycodes=in`;
  result = await httpGet(url2);
  if (result && result.length > 0) {
    return { lat: parseFloat(result[0].lat), lng: parseFloat(result[0].lon), source: 'nominatim-fallback' };
  }

  return null;
}

async function main() {
  const temples = db.prepare(`
    SELECT id, name, state FROM temples
    WHERE latitude IS NULL OR longitude IS NULL OR latitude = '' OR longitude = ''
  `).all();

  console.log(`Found ${temples.length} temples to geocode...\n`);

  const updateStmt = db.prepare('UPDATE temples SET latitude=?, longitude=?, state=? WHERE id=?');
  
  let success = 0, failed = 0;

  for (let i = 0; i < temples.length; i++) {
    const t = temples[i];
    
    // Fix state if Unknown
    let state = t.state;
    if (!state || state === 'Unknown') {
      for (const [keyword, s] of Object.entries(TEMPLE_STATE_MAP)) {
        if (t.name.includes(keyword)) { state = s; break; }
      }
    }

    process.stdout.write(`[${i+1}/${temples.length}] ${t.name.substring(0,40).padEnd(40)} `);

    try {
      const coords = await geocodeTemple(t.name, state);
      if (coords) {
        updateStmt.run(coords.lat, coords.lng, state, t.id);
        console.log(`✅ ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)} (${coords.source})`);
        success++;
      } else {
        console.log(`❌ Not found`);
        // Still fix state even if no coords
        if (state !== t.state) {
          db.prepare('UPDATE temples SET state=? WHERE id=?').run(state, t.id);
        }
        failed++;
      }
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
      failed++;
    }

    // Nominatim rate limit: max 1 request/second
    await sleep(1200);
  }

  console.log(`\n✅ Done! Geocoded: ${success} | Failed: ${failed}`);
  
  // Final stats
  const valid = db.prepare("SELECT COUNT(*) as c FROM temples WHERE latitude IS NOT NULL AND longitude IS NOT NULL").get();
  console.log(`Total temples with coordinates: ${valid.c}/515`);
}

main().catch(console.error);
