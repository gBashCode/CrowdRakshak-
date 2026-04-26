const fs = require('fs');
const path = require('path');

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
        "Odisha": "0674-23",
        "Uttarakhand": "0135-27",
        "Tamil Nadu": "044-23"
    };
    const prefix = prefixes[state] || "011-23";
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${rand}`;
}

const filePath = path.join(__dirname, 'src', 'templeData.js');
let content = fs.readFileSync(filePath, 'utf8');

// We'll parse the array using a regex or simple string manipulation since it's a JS file
// But a safer way is to use a regex to inject the fields into the objects.

// Find each temple object and add police_contact and address
const regex = /\{[\s\S]*?"id":\s*"(.*?)",[\s\S]*?"name":\s*"(.*?)",[\s\S]*?"state":\s*"(.*?)",/g;

let match;
const updates = [];

while ((match = regex.exec(content)) !== null) {
    const [fullMatch, id, name, state] = match;
    const police = generatePoliceNumber(state);
    const address = `Station Road, Near ${name}, ${state}`;
    
    const replacement = `${fullMatch}\n    "police_contact": "${police}",\n    "address": "${address}",`;
    updates.push({ search: fullMatch, replace: replacement });
}

// Apply updates from bottom to top to avoid offset issues
for (let i = updates.length - 1; i >= 0; i--) {
    content = content.replace(updates[i].search, updates[i].replace);
}

fs.writeFileSync(filePath, content);
console.log(`Successfully enriched ${updates.length} temples in templeData.js with police contacts.`);
