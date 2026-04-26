const admin = require('firebase-admin');
const Database = require('better-sqlite3');
const fs = require('fs');

if (!fs.existsSync('serviceAccountKey.json')) {
    console.error("Error: serviceAccountKey.json not found!");
    console.error("Please add your Firebase service account credentials to backend/serviceAccountKey.json");
    process.exit(1);
}

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const sqliteDb = new Database('crowdrakshak.db');

async function migrate() {
    console.log("Reading temples from SQLite database...");
    
    // Check if the temples table exists
    const tableCheck = sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='temples'").get();
    if (!tableCheck) {
        console.error("No temples table found in SQLite database!");
        return;
    }
    
    const temples = sqliteDb.prepare('SELECT * FROM temples').all();
    console.log(`Found ${temples.length} temples to migrate.`);
    
    let count = 0;
    const batchSize = 100;
    let batch = db.batch();
    
    for (const temple of temples) {
        const docRef = db.collection('temples').doc(temple.id);
        
        let zonesConfig = {};
        let exitRoutesConfig = {};
        
        try {
            zonesConfig = JSON.parse(temple.zones_config || '{}');
        } catch(e) {}
        
        try {
            exitRoutesConfig = JSON.parse(temple.exit_routes_config || '{}');
        } catch(e) {}

        const data = {
            id: temple.id,
            name: temple.name,
            latitude: temple.latitude,
            longitude: temple.longitude,
            state: temple.state,
            imageLink: temple.imageLink || '',
            zones_config: zonesConfig,
            exit_routes_config: exitRoutesConfig
        };
        
        // Remove undefined or nulls that Firestore doesn't like, replace with explicit nulls or defaults
        Object.keys(data).forEach(key => {
            if (data[key] === undefined) {
                data[key] = null;
            }
        });

        batch.set(docRef, data);
        count++;

        if (count % batchSize === 0) {
            console.log(`Committing batch of ${batchSize} records...`);
            await batch.commit();
            batch = db.batch(); // Create a new batch
        }
    }
    
    if (count % batchSize !== 0) {
        console.log(`Committing final batch...`);
        await batch.commit();
    }
    
    console.log(`Successfully migrated ${count} temples to Firebase Firestore!`);
    sqliteDb.close();
    process.exit(0);
}

migrate().catch(console.error);
