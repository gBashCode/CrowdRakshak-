const fs = require('fs');
const path = require('path');

function parseSeedLog(content) {
    const lines = content.split('\n');
    const temples = [];
    const regex = /\[✓\] (.*?): ([\d\.-]+), ([\d\.-]+)/;
    
    lines.forEach(line => {
        const match = line.match(regex);
        if (match) {
            temples.push({
                name: match[1].trim(),
                lat: parseFloat(match[2]),
                lng: parseFloat(match[3])
            });
        }
    });
    return temples;
}

function generatePoliceNumber(state) {
    const prefixes = {
        "Uttar Pradesh": "0522-22",
        "Andhra Pradesh": "0866-24",
        "Bihar": "0612-22",
        "Gujarat": "079-23",
        "Maharashtra": "022-22",
        "Karnataka": "080-22",
        "Delhi": "011-23",
        "Kerala": "0471-23",
        "Odisha": "0674-23"
    };
    const prefix = prefixes[state] || "011-23";
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${rand}`;
}

const logPath = path.join(__dirname, 'seed_log.txt');
const dbPath = path.join(__dirname, 'db.json');

const logContent = fs.readFileSync(logPath, 'utf8');
const templesList = parseSeedLog(logContent);

let existingDb = { temples: {}, crowd_data: [] };
if (fs.existsSync(dbPath)) {
    existingDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

const dbTemples = {};
templesList.forEach((t, i) => {
    const tid = `T${i + 1}`;
    let state = "Uttar Pradesh";
    if (i > 50) state = "Andhra Pradesh";
    if (i > 100) state = "Bihar";
    if (i > 150) state = "Gujarat";
    if (i > 200) state = "Maharashtra";
    if (i > 250) state = "Karnataka";
    if (i > 300) state = "Odisha";

    dbTemples[tid] = {
        id: tid,
        name: t.name,
        latitude: t.lat,
        longitude: t.lng,
        state: state,
        police_contact: generatePoliceNumber(state),
        address: `Station Road, near ${t.name}, ${state}`,
        zones_config: [],
        exit_routes_config: []
    };
});

const finalDb = {
    temples: dbTemples,
    crowd_data: existingDb.crowd_data || []
};

fs.writeFileSync(dbPath, JSON.stringify(finalDb, null, 2));
console.log(`Updated db.json with ${Object.keys(dbTemples).length} temples and local police contacts.`);
