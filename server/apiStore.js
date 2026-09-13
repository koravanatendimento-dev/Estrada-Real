const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_FILE = path.join(__dirname, 'data', 'api-data.json');

const EMPTY_DATA = {
    residents: [],
    sessions: [],
    parcels: [],
    notifications: [],
    reservations: [],
    occurrences: []
};

function ensureDataFile() {
    const directory = path.dirname(DATA_FILE);
    if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify(EMPTY_DATA, null, 2));
}

function readData() {
    ensureDataFile();
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const data = { ...EMPTY_DATA, ...parsed };
    let changed = false;
    data.parcels = data.parcels.map(parcel => {
        if (!/^[A-Z0-9]{6}$/.test(String(parcel.code || '').toUpperCase())) {
            parcel.code = randomParcelCode();
            changed = true;
        } else {
            parcel.code = String(parcel.code).toUpperCase();
        }
        return parcel;
    });
    if (changed) writeData(data);
    return data;
}

function randomParcelCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[crypto.randomInt(chars.length)]).join('');
}

function writeData(data) {
    ensureDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function id(prefix) {
    return `${prefix}_${crypto.randomUUID()}`;
}

function token() {
    return crypto.randomBytes(32).toString('hex');
}

function passwordHash(password, salt = crypto.randomBytes(16).toString('hex')) {
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
    if (!storedHash || !password) return false;
    const [salt, expected] = storedHash.split(':');
    if (!salt || !expected) return false;
    const actual = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}

module.exports = {
    readData,
    writeData,
    id,
    token,
    passwordHash,
    verifyPassword
};
