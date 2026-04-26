const axios = require('axios');
const cheerio = require('cheerio');
const Database = require('better-sqlite3');
const crypto = require('crypto');

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getCoordinates(query) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://nominatim.openstreetmap.org/'
            }
        });
        if (res.data && res.data.length > 0) {
            return {
                lat: parseFloat(res.data[0].lat),
                lon: parseFloat(res.data[0].lon)
            };
        }
    } catch (e) {
        // Ignore errors quietly to continue scraping
    }
    return null;
}

async function scrapeTemples() {
    const url = 'https://en.wikipedia.org/wiki/List_of_Hindu_temples_in_India';
    console.log("Fetching Wikipedia page...");
    const res = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
    });

    const $ = cheerio.load(res.data);
    const temples = [];

    // The states are inside div.mw-heading or h2/h3
    let currentState = 'India';
    $('#mw-content-text .mw-parser-output > *').each((i, el) => {
        const tag = el.tagName.toLowerCase();
        if (tag === 'h2' || tag === 'h3' || tag === 'div') {
            const title = $(el).find('h2, h3, .mw-headline').text().trim() || $(el).text().trim();
            if (title && !title.includes('See also') && !title.includes('References')) {
                // If it's a heading div
                if($(el).hasClass('mw-heading')) {
                    currentState = title;
                } else if (tag === 'h2' || tag === 'h3') {
                    currentState = title;
                }
            }
        } else if (tag === 'ul') {
            $(el).find('li').each((j, li) => {
                const templeName = $(li).find('a').first().text().trim() || $(li).text().split(',')[0].trim();
                if (templeName && templeName.length > 2) {
                    temples.push({ name: templeName, state: currentState });
                }
            });
        }
    });

    console.log(`Found ${temples.length} temples. Opening database...`);
    
    const db = new Database('crowdrakshak.db');
    db.exec(`
        CREATE TABLE IF NOT EXISTS temples (
            id TEXT PRIMARY KEY,
            name TEXT,
            latitude REAL,
            longitude REAL,
            state TEXT,
            imageLink TEXT,
            zones_config TEXT,
            exit_routes_config TEXT
        )
    `);

    const insertStmt = db.prepare(`
        INSERT INTO temples (id, name, latitude, longitude, state, imageLink, zones_config, exit_routes_config)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let count = 0;
    for (const t of temples) {
        const cleanName = t.name.replace(/\[.*?\]/g, '').trim();
        const cleanState = t.state.replace(/\[.*?\]/g, '').trim();
        let query = `${cleanName}, ${cleanState}, India`;
        if (cleanState === 'Unknown' || cleanState === 'India') {
            query = `${cleanName}, India`;
        }
        
        await delay(1200);
        
        const coords = await getCoordinates(query);
        let lat = null, lon = null;
        if (coords) {
            lat = coords.lat;
            lon = coords.lon;
            console.log(`[✓] ${cleanName}: ${lat}, ${lon}`);
        } else {
            console.log(`[x] ${cleanName}: Coordinates not found.`);
        }

        try {
            insertStmt.run(crypto.randomUUID(), cleanName, lat, lon, cleanState, '', '{}', '{}');
            count++;
        } catch (err) {
            // pass
        }
    }

    db.close();
    console.log(`Finished. Inserted/Processed ${count} temples.`);
}

scrapeTemples().catch(console.error);
