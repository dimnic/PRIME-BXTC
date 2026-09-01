'use strict';

/**
 * PRIME BOT — Unified User Store
 * ==============================
 * Single source of truth for every user, economy, game, profile and company.
 *
 * File: data/users.json
 *
 * You can edit users directly in VS Code. Changes are reloaded from disk on
 * every read, so changing coins/bank/profile/company fields does not require
 * rebuilding the project.
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function defaultUser() {
  return {
    coins: 1000,
    bank: 0,
    xp: 0,
    level: 1,
    wins: 0,
    losses: 0,
    streak: 0,
    inventory: {},
    last: {},

    profile: {
      created: false,
      name: '',
      bio: '',
      gender: '',
      age: '',
      country: '',
      city: '',
      maritalStatus: 'single',
      birthday: '',
      website: '',
      pronouns: '',
      pictureUrl: '',
      createdAt: null,
      updatedAt: null
    },

    company: {
      created: false,
      name: '',
      industry: '',
      level: 1,
      hourlyIncome: 250,
      lastClaim: 0,
      totalEarned: 0,
      totalUpgrades: 0,
      createdAt: null,
      updatedAt: null
    },

    donated: 0,
    received: 0,
    created: Date.now()
  };
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function emptyDB() {
  return {
    users: {},
    groups: {},
    games: {},
    stats: {
      jackpot: 0
    }
  };
}

function normalizeNumber(value) {
  return String(value || '')
    .replace(/\D/g, '')
    .replace(/^0+(?=\d)/, '');
}

function readDB() {
  ensureDir();

  try {
    if (!fs.existsSync(USERS_FILE)) {
      const initial = emptyDB();
      writeDB(initial);
      return initial;
    }

    const raw = fs.readFileSync(
      USERS_FILE,
      'utf8'
    );

    const data = raw.trim()
      ? JSON.parse(raw)
      : emptyDB();

    if (!data.users) data.users = {};
    if (!data.groups) data.groups = {};
    if (!data.games) data.games = {};
    if (!data.stats) data.stats = {};

    return data;
  } catch (error) {
    console.error(
      '[user-store] read failed:',
      error.message
    );

    return emptyDB();
  }
}

function writeDB(db) {
  ensureDir();

  const temp = `${USERS_FILE}.tmp`;

  fs.writeFileSync(
    temp,
    JSON.stringify(
      db,
      null,
      2
    ),
    'utf8'
  );

  fs.renameSync(
    temp,
    USERS_FILE
  );
}

function userKey(idOrCtx) {
  let id = idOrCtx;

  if (
    idOrCtx &&
    typeof idOrCtx === 'object'
  ) {
    id =
      idOrCtx.sender ||
      idOrCtx.jid ||
      idOrCtx.id ||
      'unknown';
  }

  const raw =
    String(id || 'unknown')
      .trim();

  /*
   * Keep group JIDs intact when the caller explicitly passes one.
   * User records normally use plain phone numbers.
   */
  if (raw.endsWith('@g.us')) {
    return raw;
  }

  return normalizeNumber(
    raw
      .replace(
        /@s\.whatsapp\.net|@lid|@c\.us/gi,
        ''
      )
      .split(':')[0]
  ) || 'unknown';
}

function mergeUserDefaults(existing) {
  const base = defaultUser();

  if (
    !existing ||
    typeof existing !== 'object'
  ) {
    return base;
  }

  const result = {
    ...base,
    ...existing
  };

  result.inventory =
    existing.inventory &&
    typeof existing.inventory === 'object'
      ? existing.inventory
      : {};

  result.last =
    existing.last &&
    typeof existing.last === 'object'
      ? existing.last
      : {};

  result.profile = {
    ...base.profile,
    ...(existing.profile || {})
  };

  result.company = {
    ...base.company,
    ...(existing.company || {})
  };

  return result;
}

function getUser(db, idOrCtx) {
  const id = userKey(idOrCtx);

  if (!db.users[id]) {
    db.users[id] = defaultUser();
  } else {
    db.users[id] =
      mergeUserDefaults(
        db.users[id]
      );
  }

  return db.users[id];
}

function getBalance(idOrCtx) {
  const db = readDB();

  return getUser(
    db,
    idOrCtx
  ).coins;
}

function setBalance(
  idOrCtx,
  amount
) {
  const db = readDB();
  const u =
    getUser(
      db,
      idOrCtx
    );

  u.coins =
    Math.max(
      0,
      Math.floor(
        Number(amount) || 0
      )
    );

  writeDB(db);

  return u.coins;
}

function addCoins(
  idOrCtx,
  delta
) {
  const db = readDB();
  const u =
    getUser(
      db,
      idOrCtx
    );

  u.coins =
    Math.max(
      0,
      Math.floor(
        u.coins +
        (Number(delta) || 0)
      )
    );

  writeDB(db);

  return u.coins;
}

function getUserRecord(
  idOrCtx
) {
  const db = readDB();

  return {
    ...getUser(
      db,
      idOrCtx
    )
  };
}

function leaderboard(
  limit = 10
) {
  const db = readDB();

  return Object.entries(
    db.users
  )
    .map(
      ([id, u]) => ({
        id,
        coins:
          Number(u.coins) || 0,
        bank:
          Number(u.bank) || 0,
        level:
          Number(u.level) || 1,
        profile:
          u.profile || {},
        company:
          u.company || {}
      })
    )
    .sort(
      (a, b) =>
        (
          b.coins +
          b.bank
        ) -
        (
          a.coins +
          a.bank
        )
    )
    .slice(
      0,
      limit
    );
}

module.exports = {
  USERS_FILE,
  DATA_DIR,
  DEFAULT_USER: defaultUser,
  readDB,
  writeDB,
  userKey,
  getUser,
  getBalance,
  setBalance,
  addCoins,
  getUserRecord,
  leaderboard,
  mergeUserDefaults
};
