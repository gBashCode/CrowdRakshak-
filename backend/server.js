const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
app.use(cors());

const db = new Database('crowdrakshak.db');

app.get('/temples', (req, res) => {
    try {
        const temples = db.prepare('SELECT * FROM temples').all();
        // Parse config json strings
        const parsedTemples = temples.map(t => {
            let zones = [];
            let exits = [];
            try { zones = JSON.parse(t.zones_config || '[]'); } catch(e) {}
            try { exits = JSON.parse(t.exit_routes_config || '[]'); } catch(e) {}
            return {
                id: t.id,
                name: t.name,
                latitude: t.latitude,
                longitude: t.longitude,
                state: t.state,
                imageLink: t.imageLink,
                zones_config: zones,
                exit_routes_config: exits
            };
        });
        res.json(parsedTemples);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
