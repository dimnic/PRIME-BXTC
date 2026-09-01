'use strict';

/**
 * PRIME BOT — Owner Economy Controls
 *
 * Direct database file:
 *   data/users.json
 *
 * Owner-only controls for inspecting and modifying virtual balances.
 */

const {
  readDB,
  writeDB,
  userKey
} = require('../user-store');

function money(n) {
  return `${Math.floor(Number(n) || 0).toLocaleString()} PRIME COINS`;
}

function isAdmin(ctx) {
  return Boolean(
    ctx.isOwner ||
    ctx.isSudo
  );
}

function target(ctx) {
  if (ctx.mentions?.[0]) {
    return userKey(ctx.mentions[0]);
  }
  return userKey(
    ctx.args?.[0] || ''
  );
}

function ensure(db, id) {
  if (!db.users[id]) {
    db.users[id] = {
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
        maritalStatus: 'single'
      },
      company: {
        created: false,
        name: '',
        industry: '',
        level: 1,
        hourlyIncome: 250,
        lastClaim: 0,
        totalEarned: 0,
        totalUpgrades: 0
      },
      donated: 0,
      received: 0,
      created: Date.now()
    };
  }

  return db.users[id];
}

const plugins = [];

function add(name, aliases, description, execute) {
  plugins.push({
    name,
    alias: aliases,
    aliases,
    description,
    category: 'OWNER ECONOMY',
    execute
  });
}

add(
  'userdata',
  ['useradmin', 'inspectuser'],
  'Inspect a users complete economy/profile/company data.',
  async ctx => {
    if (!isAdmin(ctx)) {
      return ctx.reply('❌ OWNER/SUDO ONLY');
    }

    const id = target(ctx);

    if (!id || id === 'unknown') {
      return ctx.reply(
        'Usage: /userdata @user'
      );
    }

    const db = readDB();
    const u = ensure(db, id);

    writeDB(db);

    await ctx.reply(
      `╭━━━〔 🔐 USER ADMIN 〕━━━╮\n` +
      `┃\n` +
      `┃ ID: ${id}\n` +
      `┃ Profile: ${u.profile?.created ? 'CREATED' : 'NOT CREATED'}\n` +
      `┃ Name: ${u.profile?.name || '—'}\n` +
      `┃\n` +
      `┃ 💰 Cash: ${money(u.coins)}\n` +
      `┃ 🏦 Bank: ${money(u.bank)}\n` +
      `┃ ⭐ Level: ${u.level}\n` +
      `┃ ✨ XP: ${u.xp}\n` +
      `┃ 🏆 Wins: ${u.wins}\n` +
      `┃ 💔 Losses: ${u.losses}\n` +
      `┃\n` +
      `┃ 🏢 Company: ${u.company?.created ? u.company.name : '—'}\n` +
      `┃ 📈 Company level: ${u.company?.level || 1}\n` +
      `┃ 💵 Hourly: ${money(u.company?.hourlyIncome || 0)}\n` +
      `┃\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
      `Edit directly in:\n` +
      `data/users.json`
    );
  }
);

function numericCommand(
  name,
  aliases,
  field,
  label
) {
  add(
    name,
    aliases,
    `Set ${label}.`,
    async ctx => {
      if (!isAdmin(ctx)) {
        return ctx.reply('❌ OWNER/SUDO ONLY');
      }

      const id = target(ctx);
      const amount =
        Number(
          ctx.args?.at(-1)
        );

      if (
        !id ||
        id === 'unknown' ||
        !Number.isFinite(amount)
      ) {
        return ctx.reply(
          `Usage: /${name} @user amount`
        );
      }

      const db = readDB();
      const u = ensure(db, id);

      const old =
        Number(
          u[field]
        ) || 0;

      u[field] =
        Math.max(
          0,
          Math.floor(amount)
        );

      writeDB(db);

      await ctx.reply(
        `✅ *${label.toUpperCase()} UPDATED*\n\n` +
        `User: ${id}\n` +
        `Old: ${field === 'coins' || field === 'bank' ? money(old) : old}\n` +
        `New: ${field === 'coins' || field === 'bank' ? money(u[field]) : u[field]}`
      );
    }
  );
}

numericCommand(
  'setbalance',
  ['setcoins'],
  'coins',
  'Balance'
);

numericCommand(
  'setbank',
  [],
  'bank',
  'Bank'
);

numericCommand(
  'setxp',
  [],
  'xp',
  'XP'
);

numericCommand(
  'setlevel',
  [],
  'level',
  'Level'
);

add(
  'addbalance',
  ['credit'],
  'Add virtual coins.',
  async ctx => {
    if (!isAdmin(ctx)) {
      return ctx.reply('❌ OWNER/SUDO ONLY');
    }

    const id = target(ctx);
    const amount =
      Number(ctx.args?.at(-1));

    if (
      !id ||
      id === 'unknown' ||
      !Number.isFinite(amount)
    ) {
      return ctx.reply(
        'Usage: /addbalance @user amount'
      );
    }

    const db = readDB();
    const u = ensure(db, id);

    u.coins +=
      Math.max(
        0,
        Math.floor(amount)
      );

    writeDB(db);

    await ctx.reply(
      `💰 Added *${money(amount)}*\n\n` +
      `New balance: *${money(u.coins)}*`
    );
  }
);

add(
  'deductbalance',
  ['debit', 'removebalance'],
  'Deduct virtual coins.',
  async ctx => {
    if (!isAdmin(ctx)) {
      return ctx.reply('❌ OWNER/SUDO ONLY');
    }

    const id = target(ctx);
    const amount =
      Number(ctx.args?.at(-1));

    if (
      !id ||
      id === 'unknown' ||
      !Number.isFinite(amount) ||
      amount < 1
    ) {
      return ctx.reply(
        'Usage: /deductbalance @user amount'
      );
    }

    const db = readDB();
    const u = ensure(db, id);

    const old =
      u.coins;

    u.coins =
      Math.max(
        0,
        Math.floor(
          u.coins - amount
        )
      );

    writeDB(db);

    await ctx.reply(
      `💸 *BALANCE DEDUCTED*\n\n` +
      `User: ${id}\n` +
      `Old: ${money(old)}\n` +
      `Deducted: ${money(amount)}\n` +
      `New: ${money(u.coins)}`
    );
  }
);

add(
  'resetuser',
  [],
  'Reset users economy to defaults.',
  async ctx => {
    if (!isAdmin(ctx)) {
      return ctx.reply('❌ OWNER/SUDO ONLY');
    }

    const id = target(ctx);

    if (!id || id === 'unknown') {
      return ctx.reply(
        'Usage: /resetuser @user'
      );
    }

    const db = readDB();
    const old =
      ensure(db, id);

    db.users[id] = {
      ...old,
      coins: 1000,
      bank: 0,
      xp: 0,
      level: 1,
      wins: 0,
      losses: 0,
      streak: 0,
      inventory: {},
      last: {},
      donated: 0,
      received: 0,
      company: {
        created: false,
        name: '',
        industry: '',
        level: 1,
        hourlyIncome: 250,
        lastClaim: 0,
        totalEarned: 0,
        totalUpgrades: 0
      }
    };

    writeDB(db);

    await ctx.reply(
      `♻️ User economy reset:\n${id}`
    );
  }
);

add(
  'userraw',
  ['rawuser'],
  'Show raw JSON for a user.',
  async ctx => {
    if (!ctx.isOwner) {
      return ctx.reply('❌ OWNER ONLY');
    }

    const id = target(ctx);

    if (!id || id === 'unknown') {
      return ctx.reply(
        'Usage: /userraw @user'
      );
    }

    const db = readDB();
    const u = ensure(db, id);

    writeDB(db);

    let raw =
      JSON.stringify(
        u,
        null,
        2
      );

    if (raw.length > 5500) {
      raw =
        raw.slice(0, 5400) +
        '\n...truncated...';
    }

    await ctx.reply(
      `\`\`\`json\n${raw}\n\`\`\``
    );
  }
);

module.exports = plugins;
