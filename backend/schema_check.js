const Database = require('better-sqlite3');
const db = new Database('./crowdrakshak.db');

// List all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('=== TABLES IN DATABASE ===');
tables.forEach(t => {
  console.log('\n--- TABLE:', t.name, '---');
  const info = db.prepare(`PRAGMA table_info(${t.name})`).all();
  info.forEach(c => {
    console.log(`  Col ${c.cid}: ${c.name} | type: ${c.type} | nullable: ${!c.notnull} | default: ${c.dflt_value}`);
  });
  const count = db.prepare(`SELECT COUNT(*) as c FROM ${t.name}`).get();
  console.log(`  >> Total rows: ${count.c}`);
});

// Show 3 sample records
console.log('\n\n=== SAMPLE TEMPLE RECORD ===');
const sample = db.prepare('SELECT * FROM temples LIMIT 3').all();
sample.forEach((r, i) => {
  console.log(`\n[Record ${i+1}]`);
  Object.entries(r).forEach(([k, v]) => {
    const val = typeof v === 'string' && v.length > 80 ? v.substring(0, 80) + '...' : v;
    console.log(`  ${k}: ${val}`);
  });
});
