'use strict';

/**
 * Casino plugin — uses the unified user store (data/users.json).
 * Edit balances in VS Code: open data/users.json and change "coins".
 */

const {
  readDB,
  writeDB,
  getUser,
  userKey
} = require('../user-store');

function money(n) {
  return `${Math.floor(Number(n) || 0).toLocaleString()} PRIME COINS`;
}

module.exports = [
  {
    name: 'balance',
    alias: ['bal'],
    description: 'Check casino / economy balance',
    category: 'CASINO',

    async execute({ reply, sender }) {
      const db = readDB();
      const u = getUser(db, sender);
      writeDB(db); // persist if user was just created
      await reply(
        `💰 *PRIME BALANCE*\n\n` +
        `Cash: *${money(u.coins)}*\n` +
        `Bank: *${money(u.bank)}*\n` +
        `Level: *${u.level}* | XP: *${u.xp}*\n` +
        `Wins: ${u.wins} | Losses: ${u.losses}`
      );
    }
  },

  {
    name: 'daily',
    description: 'Claim daily PRIME COINS',
    category: 'CASINO',

    async execute({ reply, sender }) {
      const db = readDB();
      const u = getUser(db, sender);
      if (!u.profile?.created) {
        return reply('🪪 *PROFILE REQUIRED*\n\nCreate your profile first with /createprofile Your Name');
      }
      const key = 'daily';
      const cool = 24 * 60 * 60 * 1000;
      const last = Number(u.last[key] || 0);
      const left = cool - (Date.now() - last);
      if (left > 0) {
        const h = Math.ceil(left / 3600000);
        return reply(`⏳ Daily already claimed. Try again in ~${h}h.`);
      }
      const reward = 500;
      u.coins += reward;
      u.last[key] = Date.now();
      writeDB(db);
      await reply(
        `🎁 *DAILY REWARD*\n\n` +
        `You received: *${money(reward)}*\n` +
        `Balance: *${money(u.coins)}*`
      );
    }
  },

  {
    name: 'roulette',
    description: 'Play roulette (bet amount)',
    category: 'CASINO',

    async execute({ reply, sender, args }) {
      const db0 = readDB();
      const u0 = getUser(db0, sender);
      if (!u0.profile?.created) {
        return reply('🪪 *PROFILE REQUIRED*\n\nCreate your profile first with /createprofile Your Name');
      }

      const bet = Number(args && args[0]);
      if (!Number.isInteger(bet) || bet <= 0) {
        return reply('🎰 Usage: /roulette 100');
      }
      const db = readDB();
      const u = getUser(db, sender);
      if (bet > u.coins) {
        return reply(`❌ Insufficient PRIME COINS. Balance: ${money(u.coins)}`);
      }
      const win = Math.random() < 0.5;
      if (win) {
        u.coins += bet;
        u.wins += 1;
      } else {
        u.coins = Math.max(0, u.coins - bet);
        u.losses += 1;
      }
      writeDB(db);
      await reply(
        `🎰 *ROULETTE*\n\n` +
        `${win ? '🎉 You won!' : '💀 You lost!'}\n` +
        `Amount: ${bet}\n` +
        `Balance: ${money(u.coins)}`
      );
    }
  },

  {
    name: 'blackjack',
    description: 'Play blackjack (fun mode, no bet)',
    category: 'CASINO',

    async execute({ reply }) {
      const player = Math.floor(Math.random() * 10) + 11;
      const dealer = Math.floor(Math.random() * 10) + 11;
      await reply(
        `🃏 *BLACKJACK*\n\n` +
        `You: ${player}\n` +
        `Dealer: ${dealer}\n\n` +
        `${player > dealer ? '🎉 You win!' : player === dealer ? '🤝 Draw!' : '💀 Dealer wins!'}`
      );
    }
  }
];
