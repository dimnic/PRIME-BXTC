'use strict';

/**
 * PRIME BOT — Social / Profile / Company / Community
 *
 * All persistent data lives in:
 *
 *   data/users.json
 *
 * This plugin intentionally uses the same user store as the casino and mega
 * economy systems. There is no separate prime-community.json database.
 */

const {
    readDB,
    writeDB,
    getUser,
    userKey
} = require('../user-store');

const DATA_DIR =
    require('path').join(
        __dirname,
        '..',
        '..',
        'data'
    );

function money(value) {
    return (
        Math.floor(
            Number(value) || 0
        )
        .toLocaleString()
        + ' PRIME COINS'
    );
}

function clean(value, max = 300) {
    return String(value || '')
        .trim()
        .slice(0, max);
}

function targetNumber(ctx) {
    const mentioned =
        Array.isArray(ctx.mentions)
            ? ctx.mentions[0]
            : null;

    if (mentioned) {
        return userKey(mentioned);
    }

    return userKey(
        ctx.args?.[0] || ''
    );
}

function profileRequired(ctx, u) {
    if (u.profile?.created) {
        return true;
    }

    ctx.reply(
        '🪪 *PROFILE REQUIRED*\n\n' +
        'Create your profile before you work, earn, or build a company.\n\n' +
        'Use:\n' +
        '/createprofile Your Name\n\n' +
        'Then edit details with /editprofile.'
    );

    return false;
}

function profileText(id, u) {
    const p = u.profile || {};
    const c = u.company || {};

    return (
        '╭━━━〔 👤 PRIME PROFILE 〕━━━╮\n' +
        '┃\n' +
        `┃ 🪪 Name: ${p.name || 'Not set'}\n` +
        `┃ 📱 ID: ${id}\n` +
        `┃ 📝 Bio: ${p.bio || 'Not set'}\n` +
        `┃ ⚧️ Gender: ${p.gender || 'Not set'}\n` +
        `┃ 🎂 Age: ${p.age || 'Not set'}\n` +
        `┃ 💍 Status: ${p.maritalStatus || 'single'}\n` +
        `┃ 🌍 Country: ${p.country || 'Not set'}\n` +
        `┃ 🏙️ City: ${p.city || 'Not set'}\n` +
        `┃ 🗓️ Birthday: ${p.birthday || 'Not set'}\n` +
        `┃ 🔗 Website: ${p.website || 'Not set'}\n` +
        `┃\n` +
        `┃ 💰 Coins: ${money(u.coins)}\n` +
        `┃ 🏦 Bank: ${money(u.bank)}\n` +
        `┃ ⭐ Level: ${u.level}\n` +
        `┃ ✨ XP: ${u.xp}\n` +
        `┃ 🏆 Wins: ${u.wins}\n` +
        `┃ 💔 Losses: ${u.losses}\n` +
        `┃\n` +
        `┃ 🏢 Company: ${c.created ? c.name : 'None'}\n` +
        `┃ 🏷️ Industry: ${c.industry || 'Not set'}\n` +
        `┃ 📈 Company level: ${c.level || 1}\n` +
        `┃ 💵 Hourly income: ${money(c.hourlyIncome || 0)}\n` +
        `┃\n` +
        '╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n' +
        '✏️ /editprofile field value\n' +
        'Example: /editprofile bio Building the future.'
    );
}

function companyText(u) {
    const c = u.company || {};

    return (
        '╭━━━〔 🏢 COMPANY PROFILE 〕━━━╮\n' +
        '┃\n' +
        `┃ 🏢 Name: ${c.name || 'None'}\n` +
        `┃ 🏷️ Industry: ${c.industry || 'Not set'}\n` +
        `┃ 📈 Level: ${c.level || 1}\n` +
        `┃ 💵 Hourly income: ${money(c.hourlyIncome || 0)}\n` +
        `┃ 💰 Total earned: ${money(c.totalEarned || 0)}\n` +
        `┃ 🛠️ Upgrades: ${c.totalUpgrades || 0}\n` +
        `┃\n` +
        '╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n' +
        'Commands:\n' +
        '/claimcompany\n' +
        '/upgradecompany\n' +
        '/renamecompany New Name'
    );
}

function claimCompany(ctx) {
    const db = readDB();
    const u = getUser(db, ctx);

    if (!profileRequired(ctx, u)) {
        return;
    }

    if (!u.company?.created) {
        return ctx.reply(
            '🏢 *NO COMPANY YET*\n\n' +
            'Create one first:\n' +
            '/createcompany Company Name | Industry'
        );
    }

    const hour =
        60 * 60 * 1000;

    const last =
        Number(
            u.company.lastClaim || 0
        );

    const remaining =
        hour -
        (Date.now() - last);

    if (remaining > 0) {
        const minutes =
            Math.ceil(
                remaining / 60000
            );

        return ctx.reply(
            `⏳ *COMPANY PAYOUT LOCKED*\n\n` +
            `Come back in approximately *${minutes} minutes*.\n\n` +
            `💵 Hourly income: ${money(u.company.hourlyIncome)}`
        );
    }

    const payout =
        Math.max(
            1,
            Math.floor(
                Number(
                    u.company.hourlyIncome
                ) || 0
            )
        );

    u.coins += payout;
    u.company.lastClaim = Date.now();
    u.company.totalEarned =
        Number(
            u.company.totalEarned
        ) + payout;

    writeDB(db);

    return ctx.reply(
        `🏢 *COMPANY PAYOUT COLLECTED*\n\n` +
        `🏷️ ${u.company.name}\n` +
        `💵 Income: *${money(payout)}*\n` +
        `💰 New balance: *${money(u.coins)}*\n\n` +
        `⏰ Next claim: in 1 hour`
    );
}

const commands = [];

function add(
    name,
    aliases,
    description,
    category,
    execute
) {
    commands.push({
        name,
        alias: aliases,
        aliases,
        description,
        category,
        execute
    });
}

/* PROFILE CREATION */

add(
    'createprofile',
    ['register', 'signup'],
    'Create your PRIME profile.',
    'PROFILE',
    async ctx => {
        const db = readDB();
        const u = getUser(db, ctx);
        const name =
            clean(
                ctx.args?.join(' '),
                60
            );

        if (!name) {
            return ctx.reply(
                '🪪 Usage:\n/createprofile Your Name'
            );
        }

        if (u.profile.created) {
            return ctx.reply(
                '✅ You already have a profile.\n\n' +
                'Use /editprofile to change it.'
            );
        }

        u.profile.created = true;
        u.profile.name = name;
        u.profile.createdAt = Date.now();
        u.profile.updatedAt = Date.now();

        writeDB(db);

        return ctx.reply(
            `╭━━〔 🪪 PROFILE CREATED 〕━━╮\n` +
            `┃\n` +
            `┃ 👤 Name: ${name}\n` +
            `┃ 💰 Starting coins: ${money(u.coins)}\n` +
            `┃ ⭐ Level: ${u.level}\n` +
            `┃\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
            `Now use /editprofile to add your bio, status, city and other details.`
        );
    }
);

/* PROFILE */

add(
    'profile',
    ['me', 'prof'],
    'Show your complete PRIME profile.',
    'PROFILE',
    async ctx => {
        const db = readDB();
        const u = getUser(db, ctx);
        writeDB(db);

        const id =
            userKey(ctx);

        const caption =
            profileText(
                id,
                u
            );

        /*
         * Fetch WhatsApp profile photo when possible.
         * The URL itself is not stored unless returned successfully.
         */
        try {
            if (
                ctx.sock &&
                typeof ctx.sock.profilePictureUrl === 'function' &&
                ctx.sender
            ) {
                const url =
                    await ctx.sock.profilePictureUrl(
                        ctx.sender,
                        'image'
                    );

                if (url) {
                    u.profile.pictureUrl = url;
                    u.profile.updatedAt = Date.now();
                    writeDB(db);

                    await ctx.sock.sendMessage(
                        ctx.jid,
                        {
                            image: {
                                url
                            },
                            caption
                        },
                        {
                            quoted: ctx.message
                        }
                    );

                    return;
                }
            }
        } catch (_) {}

        await ctx.reply(caption);
    }
);

/* EDIT PROFILE */

add(
    'editprofile',
    ['setprofile'],
    'Edit profile fields.',
    'PROFILE',
    async ctx => {
        const db = readDB();
        const u = getUser(db, ctx);

        if (!profileRequired(ctx, u)) {
            return;
        }

        const field =
            String(
                ctx.args?.[0] || ''
            ).toLowerCase();

        const value =
            clean(
                ctx.args?.slice(1).join(' '),
                300
            );

        const allowed = {
            name: 'name',
            bio: 'bio',
            gender: 'gender',
            age: 'age',
            country: 'country',
            city: 'city',
            status: 'maritalStatus',
            marital: 'maritalStatus',
            maritalstatus: 'maritalStatus',
            birthday: 'birthday',
            website: 'website',
            pronouns: 'pronouns'
        };

        const actual =
            allowed[field];

        if (!actual) {
            return ctx.reply(
                '✏️ *EDIT PROFILE*\n\n' +
                'Allowed fields:\n' +
                'name\n' +
                'bio\n' +
                'gender\n' +
                'age\n' +
                'country\n' +
                'city\n' +
                'status\n' +
                'birthday\n' +
                'website\n' +
                'pronouns\n\n' +
                'Example:\n' +
                '/editprofile status married'
            );
        }

        if (!value) {
            return ctx.reply(
                `Usage: /editprofile ${field} value`
            );
        }

        if (
            actual === 'maritalStatus'
        ) {
            const allowedStatus = [
                'single',
                'dating',
                'engaged',
                'married',
                'divorced',
                'widowed',
                'complicated'
            ];

            const normalized =
                value.toLowerCase();

            if (
                !allowedStatus.includes(
                    normalized
                )
            ) {
                return ctx.reply(
                    `💍 Status options:\n${allowedStatus.join(', ')}`
                );
            }

            u.profile[actual] =
                normalized;
        } else {
            u.profile[actual] =
                value;
        }

        u.profile.updatedAt =
            Date.now();

        writeDB(db);

        return ctx.reply(
            `✅ *PROFILE UPDATED*\n\n` +
            `Field: ${actual}\n` +
            `Value: ${u.profile[actual]}`
        );
    }
);

/* PROFILE PICTURE */

add(
    'profilepic',
    ['pp', 'avatar'],
    'Show your WhatsApp profile picture.',
    'PROFILE',
    async ctx => {
        if (
            !ctx.sock ||
            typeof ctx.sock.profilePictureUrl !== 'function'
        ) {
            return ctx.reply(
                '❌ Profile picture lookup is unavailable.'
            );
        }

        try {
            const url =
                await ctx.sock.profilePictureUrl(
                    ctx.sender,
                    'image'
                );

            if (!url) {
                return ctx.reply(
                    '❌ No profile picture is available.'
                );
            }

            await ctx.sock.sendMessage(
                ctx.jid,
                {
                    image: {
                        url
                    },
                    caption:
                        `👤 *${ctx.botName} PROFILE PICTURE*`
                },
                {
                    quoted: ctx.message
                }
            );
        } catch (error) {
            await ctx.reply(
                `❌ Could not fetch profile picture.`
            );
        }
    }
);

/* COMPANY */

add(
    'createcompany',
    ['newcompany', 'companycreate'],
    'Create your virtual company.',
    'COMPANY',
    async ctx => {
        const db = readDB();
        const u = getUser(db, ctx);

        if (!profileRequired(ctx, u)) {
            return;
        }

        if (u.company.created) {
            return ctx.reply(
                '🏢 You already own a company.\n\n' +
                '/companyprofile'
            );
        }

        const raw =
            ctx.args?.join(' ') || '';

        const [namePart, industryPart] =
            raw.split('|');

        const name =
            clean(
                namePart,
                60
            );

        const industry =
            clean(
                industryPart ||
                'General',
                60
            );

        if (!name) {
            return ctx.reply(
                '🏢 Usage:\n' +
                '/createcompany Company Name | Industry'
            );
        }

        u.company.created = true;
        u.company.name = name;
        u.company.industry = industry;
        u.company.level = 1;
        u.company.hourlyIncome = 250;
        u.company.lastClaim = 0;
        u.company.totalEarned = 0;
        u.company.totalUpgrades = 0;
        u.company.createdAt = Date.now();
        u.company.updatedAt = Date.now();

        writeDB(db);

        return ctx.reply(
            `╭━━〔 🏢 COMPANY CREATED 〕━━╮\n` +
            `┃\n` +
            `┃ 🏢 ${name}\n` +
            `┃ 🏷️ ${industry}\n` +
            `┃ 📈 Level: 1\n` +
            `┃ 💵 Hourly income: ${money(250)}\n` +
            `┃\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
            `Use /claimcompany every hour.\n` +
            `Use /upgradecompany to increase your income.`
        );
    }
);

add(
    'companyprofile',
    ['company', 'companyinfo', 'comp'],
    'Show your company profile.',
    'COMPANY',
    async ctx => {
        const db = readDB();
        const u = getUser(db, ctx);

        if (!profileRequired(ctx, u)) {
            return;
        }

        if (!u.company.created) {
            return ctx.reply(
                '🏢 You do not own a company yet.\n\n' +
                '/createcompany Company Name | Industry'
            );
        }

        await ctx.reply(
            companyText(u)
        );
    }
);

add(
    'renamecompany',
    ['companyname', 'setcompanyname'],
    'Rename your company.',
    'COMPANY',
    async ctx => {
        const db = readDB();
        const u = getUser(db, ctx);

        if (!profileRequired(ctx, u)) {
            return;
        }

        if (!u.company.created) {
            return ctx.reply(
                'Create your company first with /createcompany.'
            );
        }

        const name =
            clean(
                ctx.args?.join(' '),
                60
            );

        if (!name) {
            return ctx.reply(
                'Usage:\n/renamecompany New Company Name'
            );
        }

        u.company.name = name;
        u.company.updatedAt =
            Date.now();

        writeDB(db);

        return ctx.reply(
            `✅ *COMPANY RENAMED*\n\n🏢 New name: *${name}*`
        );
    }
);

add(
    'upgradecompany',
    ['companyupgrade', 'upgrade'],
    'Upgrade company level and hourly income.',
    'COMPANY',
    async ctx => {
        const db = readDB();
        const u = getUser(db, ctx);

        if (!profileRequired(ctx, u)) {
            return;
        }

        if (!u.company.created) {
            return ctx.reply(
                'Create your company first.'
            );
        }

        const level =
            Number(
                u.company.level || 1
            );

        const cost =
            Math.floor(
                1500 *
                Math.pow(
                    1.75,
                    level - 1
                )
            );

        if (u.coins < cost) {
            return ctx.reply(
                `❌ *INSUFFICIENT FUNDS*\n\n` +
                `Upgrade cost: ${money(cost)}\n` +
                `Your balance: ${money(u.coins)}`
            );
        }

        const oldIncome =
            Number(
                u.company.hourlyIncome
            ) || 250;

        const newIncome =
            Math.floor(
                oldIncome * 1.5
            );

        u.coins -= cost;
        u.company.level =
            level + 1;
        u.company.hourlyIncome =
            newIncome;
        u.company.totalUpgrades =
            Number(
                u.company.totalUpgrades || 0
            ) + 1;
        u.company.updatedAt =
            Date.now();

        writeDB(db);

        return ctx.reply(
            `╭━━〔 📈 COMPANY UPGRADED 〕━━╮\n` +
            `┃\n` +
            `┃ 🏢 ${u.company.name}\n` +
            `┃ 📈 Level: ${level} → ${level + 1}\n` +
            `┃ 💵 Income: ${money(oldIncome)} → ${money(newIncome)} / hour\n` +
            `┃ 💸 Cost: ${money(cost)}\n` +
            `┃ 💰 Balance: ${money(u.coins)}\n` +
            `┃\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━━╯`
        );
    }
);

add(
    'claimcompany',
    ['companyclaim', 'claimincome', 'hourly'],
    'Collect your company hourly income.',
    'COMPANY',
    claimCompany
);

/* EARN */

add(
    'work',
    ['worknow'],
    'Work for your company / virtual economy.',
    'ECONOMY',
    async ctx => {
        const db = readDB();
        const u = getUser(db, ctx);

        if (!profileRequired(ctx, u)) {
            return;
        }

        if (!u.company.created) {
            return ctx.reply(
                '🏢 Create a company before working:\n' +
                '/createcompany Company Name | Industry'
            );
        }

        const payout =
            Math.max(
                50,
                Math.floor(
                    u.company.hourlyIncome *
                    (0.35 + Math.random() * 0.6)
                )
            );

        const key = 'prime_work';

        const last =
            Number(
                u.last[key] || 0
            );

        const remaining =
            30 * 60 * 1000 -
            (Date.now() - last);

        if (remaining > 0) {
            return ctx.reply(
                `⏳ You are already working.\nTry again in ${Math.ceil(remaining / 60000)} minutes.`
            );
        }

        u.last[key] =
            Date.now();

        u.coins += payout;
        u.xp += 15;

        writeDB(db);

        await ctx.reply(
            `💼 *WORK COMPLETE*\n\n` +
            `🏢 ${u.company.name}\n` +
            `💰 Earned: *${money(payout)}*\n` +
            `💳 Balance: *${money(u.coins)}*`
        );
    }
);

/* LEADERBOARD */

add(
    'leaderboard',
    ['lb', 'top', 'rich'],
    'Show the Prime community leaderboard.',
    'LEADERBOARD',
    async ctx => {
        const db = readDB();

        const users =
            Object.entries(
                db.users
            );

        const profiled =
            users.filter(
                ([, u]) =>
                    Boolean(
                        u.profile?.created
                    )
            );

        const rows =
            profiled
                .sort(
                    (a, b) =>
                        (
                            Number(
                                b[1].coins
                            ) +
                            Number(
                                b[1].bank
                            )
                        ) -
                        (
                            Number(
                                a[1].coins
                            ) +
                            Number(
                                a[1].bank
                            )
                        )
                )
                .slice(
                    0,
                    15
                );

        let text =
            '╭━━━〔 🏆 PRIME LEADERBOARD 〕━━━╮\n' +
            '┃\n' +
            `┃ 👥 Players with profiles: *${profiled.length}*\n` +
            '┃\n';

        if (!rows.length) {
            text +=
                '┃ No profiles yet.\n';
        } else {
            rows.forEach(
                ([id, u], index) => {
                    const name =
                        u.profile?.name ||
                        id;

                    const company =
                        u.company?.created
                            ? ` • ${u.company.name}`
                            : '';

                    const total =
                        (
                            Number(u.coins) +
                            Number(u.bank)
                        );

                    text +=
                        `┃ ${index + 1}. *${name}*\n` +
                        `┃    💰 ${money(total)}${company}\n` +
                        `┃    ⭐ Level ${u.level}\n` +
                        '┃\n';
                }
            );
        }

        text +=
            '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯';

        await ctx.reply(text);
    }
);

/* WINNERS LEADERBOARD */

add(
    'winners',
    ['winsleaderboard', 'winlb'],
    'Show players with the most game wins.',
    'LEADERBOARD',
    async ctx => {
        const db = readDB();

        const rows =
            Object.entries(
                db.users
            )
                .filter(
                    ([, u]) =>
                        u.profile?.created
                )
                .sort(
                    (a, b) =>
                        Number(b[1].wins || 0) -
                        Number(a[1].wins || 0)
                )
                .slice(
                    0,
                    10
                );

        if (!rows.length) {
            return ctx.reply(
                '🏆 No profiled players yet.'
            );
        }

        const text =
            '🏆 *WINNERS LEADERBOARD*\n\n' +
            rows
                .map(
                    ([id, u], i) =>
                        `${i + 1}. ${u.profile?.name || id} — ${u.wins || 0} wins`
                )
                .join('\n');

        await ctx.reply(text);
    }
);

/* DONATION */

add(
    'donate',
    ['give', 'tip', 'gift'],
    'Send Prime Coins to another user.',
    'ECONOMY',
    async ctx => {
        const db = readDB();
        const sender =
            getUser(db, ctx);

        if (!profileRequired(ctx, sender)) {
            return;
        }

        const target =
            targetNumber(ctx);

        const amount =
            Math.floor(
                Number(
                    ctx.args?.at(-1)
                )
            );

        if (
            !target ||
            target === userKey(ctx) ||
            !Number.isInteger(amount) ||
            amount <= 0
        ) {
            return ctx.reply(
                '💝 Usage:\n/donate @user 500'
            );
        }

        if (sender.coins < amount) {
            return ctx.reply(
                `❌ Insufficient balance.\n\n` +
                `Balance: ${money(sender.coins)}`
            );
        }

        const receiver =
            db.users[target] ||
            getUser(
                db,
                target
            );

        if (
            !receiver.profile?.created
        ) {
            return ctx.reply(
                '❌ That user has not created a PRIME profile yet.'
            );
        }

        sender.coins -= amount;
        sender.donated =
            Number(sender.donated || 0) +
            amount;

        receiver.coins += amount;
        receiver.received =
            Number(receiver.received || 0) +
            amount;

        writeDB(db);

        return ctx.reply(
            `╭━━〔 💝 DONATION COMPLETE 〕━━╮\n` +
            `┃\n` +
            `┃ From: ${sender.profile.name}\n` +
            `┃ To: ${receiver.profile.name}\n` +
            `┃ Amount: ${money(amount)}\n` +
            `┃ Remaining: ${money(sender.coins)}\n` +
            `┃\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━━╯`
        );
    }
);

module.exports = commands;
