from pathlib import Path

out = Path('/mnt/data/crystal_work/CRYSTAL-BOT/core/Plugins/mega.js')

text = r'''\'use strict\';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

/*
 * PRIME BOT MEGA COMMAND PACK
 *
 * 160+ self-contained commands. No new npm packages required.
 * Uses JSON persistence in data/crystal-mega.json.
 * All casino values are virtual Crystal Coins and have no cash value.
 */

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'crystal-mega.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function readDB() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      const initial = { users: {}, groups: {}, games: {}, stats: {} };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (!data.users) data.users = {};
    if (!data.groups) data.groups = {};
    if (!data.games) data.games = {};
    if (!data.stats) data.stats = {};
    return data;
  } catch {
    return { users: {}, groups: {}, games: {}, stats: {} };
  }
}

function writeDB(db) {
  const temp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(db, null, 2));
  fs.renameSync(temp, DATA_FILE);
}

function userKey(ctx) {
  return String(ctx.sender || ctx.jid || 'unknown')
    .replace(/@s\.whatsapp\.net|@lid|@g\.us/g, '')
    .split(':')[0];
}

function user(db, ctx) {
  const id = userKey(ctx);
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
      created: Date.now()
    };
  }
  return db.users[id];
}

function now() { return Date.now(); }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function choice(arr) { return arr[rand(0, arr.length - 1)]; }
function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }
function money(n) { return `${Math.floor(Number(n) || 0).toLocaleString()} CC`; }
function xpForLevel(level) { return 100 + (level - 1) * 75; }
function addXP(db, ctx, amount = 10) {
  const u = user(db, ctx);
  u.xp += Math.max(0, Math.floor(amount));
  let ups = 0;
  while (u.xp >= xpForLevel(u.level)) {
    u.xp -= xpForLevel(u.level);
    u.level += 1;
    ups += 1;
  }
  return ups;
}
function cooldown(u, key, ms) {
  const last = Number(u.last[key] || 0);
  return now() - last < ms ? ms - (now() - last) : 0;
}
function setCooldown(u, key) { u.last[key] = now(); }
function fmtMs(ms) {
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60), r = s % 60;
  if (m < 60) return `${m}m ${r}s`;
  const h = Math.floor(m / 60), mm = m % 60;
  return `${h}h ${mm}m`;
}
function argsText(ctx) { return (ctx.args || []).join(' ').trim(); }
function requireGroup(ctx) {
  if (!ctx.isGroup) throw new Error('This command only works in groups.');
}
function requireAdmin(ctx) {
  requireGroup(ctx);
  if (!ctx.isGroupAdmin && !ctx.isOwner && !ctx.isSudo) throw new Error('❌ Group admins only.');
  if (!ctx.isBotAdmin && !ctx.isOwner) throw new Error('❌ I need to be a group admin for this command.');
}
function statSnapshot(ctx) {
  return {
    sender: ctx.sender,
    jid: ctx.jid,
    owner: !!ctx.isOwner,
    sudo: !!ctx.isSudo,
    group: !!ctx.isGroup,
    botAdmin: !!ctx.isBotAdmin
  };
}
function safeEval(expr) {
  const s = String(expr || '').replace(/,/g, '').trim();
  if (!s || !/^[0-9+\-*/%().\s^]+$/.test(s)) throw new Error('Only basic arithmetic is allowed.');
  const js = s.replace(/\^/g, '**');
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return (${js})`)();
}
function gcd(a, b) {
  a = Math.abs(Math.trunc(a)); b = Math.abs(Math.trunc(b));
  while (b) [a, b] = [b, a % b];
  return a;
}
function isPrime(n) {
  n = Math.trunc(n);
  if (n < 2) return false;
  if (n % 2 === 0) return n === 2;
  for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
  return true;
}
function factors(n) {
  n = Math.abs(Math.trunc(n));
  const r = [];
  for (let i = 1; i * i <= n; i++) {
    if (n % i === 0) { r.push(i); if (i !== n / i) r.push(n / i); }
  }
  return r.sort((a, b) => a - b);
}
function b64(s) { return Buffer.from(String(s), 'utf8').toString('base64'); }
function unb64(s) { return Buffer.from(String(s), 'base64').toString('utf8'); }
function morseEncode(s) {
  const map = { A:'.-', B:'-...', C:'-.-.', D:'-..', E:'.', F:'..-.', G:'--.', H:'....', I:'..', J:'.---', K:'-.-', L:'.-..', M:'--', N:'-.', O:'---', P:'.--.', Q:'--.-', R:'.-.', S:'...', T:'-', U:'..-', V:'...-', W:'.--', X:'-..-', Y:'-.--', Z:'--..', ' ':'/','0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.'};
  return String(s).toUpperCase().split('').map(c => map[c] || c).join(' ');
}
function morseDecode(s) {
  const map = { '.-':'A','-...':'B','-.-.':'C','-..':'D','.':'E','..-.':'F','--.':'G','....':'H','..':'I','.---':'J','-.-':'K','.-..':'L','--':'M','-.':'N','---':'O','.--.':'P','--.-':'Q','.-.':'R','...':'S','-':'T','..-':'U','...-':'V','.--':'W','-..-':'X','-.--':'Y','--..':'Z','/':' ','-----':'0','.----':'1','..---':'2','...--':'3','....-':'4','.....':'5','-....':'6','--...':'7','---..':'8','----.':'9' };
  return String(s).trim().split(/\s+/).map(c => map[c] || '?').join('');
}
function binary(s) { return Buffer.from(String(s), 'utf8').toString('hex').match(/../g).map(h => parseInt(h, 16).toString(2).padStart(8,'0')).join(' '); }
function unbinary(s) { return String(s).trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b,2))).join(''); }
function toHex(s) { return Buffer.from(String(s), 'utf8').toString('hex'); }
function fromHex(s) { return Buffer.from(String(s).replace(/\s+/g,''), 'hex').toString('utf8'); }
function escapeText(s) { return String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
function hashText(s, algo='sha256') { return crypto.createHash(algo).update(String(s)).digest('hex'); }
function pickLabel(ctx) { return `@${userKey(ctx)}`; }
function elapsed(ts) { return fmtMs(Math.max(0, now() - ts)); }
function weatherEmoji(n) { return n > 30 ? '🥵' : n < 20 ? '🥶' : '🌤️'; }

const commands = [];
function add(name, description, category, execute, aliases = []) {
  commands.push({ name, aliases, description, category, execute });
}

/* ======================================================================
   META / UTILITY
====================================================================== */

add('commands', 'Show the installed Crystal Bot command count.', 'META', async ctx => {
  const map = global.plugins instanceof Map ? global.plugins : new Map();
  const unique = new Map();
  for (const [key, plugin] of map.entries()) if (plugin?.name) unique.set(plugin.name, plugin);
  const names = [...unique.keys()].sort();
  await ctx.reply(`💎 *CRYSTAL BOT COMMANDS*\n\nLoaded commands: *${names.length}*\nAliases: *${map.size - names.length}*\n\nUse /categories or /command <name>.`);
});
add('categories', 'List command categories.', 'META', async ctx => {
  const map = global.plugins instanceof Map ? global.plugins : new Map();
  const cats = {};
  for (const plugin of map.values()) if (plugin?.name) cats[plugin.category || 'GENERAL'] = (cats[plugin.category || 'GENERAL'] || 0) + 1;
  const lines = Object.entries(cats).sort().map(([k,v]) => `• ${k}: ${v}`);
  await ctx.reply(`📚 *CATEGORIES*\n\n${lines.join('\n')}`);
});
add('command', 'Show information about a command.', 'META', async ctx => {
  const q = String(ctx.args?.[0] || '').toLowerCase();
  if (!q) return ctx.reply('Usage: /command <name>');
  const p = global.plugins instanceof Map ? global.plugins.get(q) : null;
  if (!p) return ctx.reply(`❌ Command /${q} is not loaded.`);
  await ctx.reply(`📘 */${p.name}*\n\nCategory: ${p.category || 'GENERAL'}\nDescription: ${p.description || 'No description'}\nAliases: ${p.aliases?.join(', ') || 'None'}`);
});
add('versionx', 'Show Crystal Bot version.', 'META', async ctx => ctx.reply(`💎 *CRYSTAL BOT*\nVersion: ${ctx.version || '2.1.0'}\nMode: ${ctx.mode || 'public'}`));
add('statusx', 'Show current bot status.', 'META', async ctx => ctx.reply(`🟢 *ONLINE*\n📱 ${ctx.botName}\n🧩 Commands: ${global.plugins instanceof Map ? global.plugins.size : 0}\n🌐 Mode: ${ctx.mode}`));
add('runtimex', 'Show process runtime.', 'META', async ctx => ctx.reply(`⏱️ Runtime: ${elapsed(Date.now() - Math.floor(process.uptime()*1000))}`));
add('platform', 'Show host platform.', 'META', async ctx => ctx.reply(`🖥️ ${process.platform} ${process.arch}\nNode: ${process.version}\nHostname: ${os.hostname()}`));
add('nodeinfo', 'Show Node.js information.', 'META', async ctx => ctx.reply(`🟩 Node ${process.version}\nPID: ${process.pid}\nExec: ${process.execPath}`));
add('ram', 'Show memory usage.', 'META', async ctx => { const m=process.memoryUsage(); await ctx.reply(`🧠 RSS: ${(m.rss/1048576).toFixed(1)} MB\nHeap: ${(m.heapUsed/1048576).toFixed(1)} / ${(m.heapTotal/1048576).toFixed(1)} MB`); });
add('cpu', 'Show CPU load snapshot.', 'META', async ctx => { const c=os.cpus(); const load=c.reduce((a,x)=>a+(x.times.user+x.times.sys),0)/Math.max(1,c.length); await ctx.reply(`⚙️ CPUs: ${c.length}\nModel: ${c[0]?.model || 'Unknown'}\nLoad snapshot: ${load.toFixed(0)}`); });
add('echo', 'Echo text back.', 'UTILITY', async ctx => ctx.reply(argsText(ctx) || 'Usage: /echo text'));
add('say', 'Repeat text with Crystal styling.', 'UTILITY', async ctx => ctx.reply(argsText(ctx) || 'Usage: /say text'));
add('randomnum', 'Generate a random number.', 'UTILITY', async ctx => { const a=Number(ctx.args?.[0]||1), b=Number(ctx.args?.[1]||100); if(!Number.isFinite(a)||!Number.isFinite(b)||a>b) return ctx.reply('Usage: /randomnum min max'); await ctx.reply(`🎲 ${rand(Math.ceil(a),Math.floor(b))}`); });
add('pick', 'Pick one option.', 'UTILITY', async ctx => { const items=argsText(ctx).split(/\s*\|\s*|\s*,\s*/).filter(Boolean); if(items.length<2)return ctx.reply('Usage: /pick pizza | burger | rice'); await ctx.reply(`🎯 ${choice(items)}`); });
add('choose', 'Alias for pick.', 'UTILITY', async ctx => { const items=argsText(ctx).split(/\s*\|\s*|\s*,\s*/).filter(Boolean); if(items.length<2)return ctx.reply('Usage: /choose A | B'); await ctx.reply(`🎯 ${choice(items)}`); });
add('reverse', 'Reverse text.', 'UTILITY', async ctx => ctx.reply(argsText(ctx).split('').reverse().join('') || 'Usage: /reverse text'));
add('upper', 'Uppercase text.', 'UTILITY', async ctx => ctx.reply(argsText(ctx).toUpperCase() || 'Usage: /upper text'));
add('lower', 'Lowercase text.', 'UTILITY', async ctx => ctx.reply(argsText(ctx).toLowerCase() || 'Usage: /lower text'));
add('length', 'Count characters.', 'UTILITY', async ctx => { const s=argsText(ctx); await ctx.reply(`🔢 Characters: ${s.length}`); });
add('words', 'Count words.', 'UTILITY', async ctx => { const s=argsText(ctx); const n=s? s.split(/\s+/).length:0; await ctx.reply(`📝 Words: ${n}`); });
add('chars', 'Count non-space characters.', 'UTILITY', async ctx => { const s=argsText(ctx); await ctx.reply(`🔤 Non-space characters: ${s.replace(/\s/g,'').length}`); });
add('lines', 'Count lines.', 'UTILITY', async ctx => { const s=argsText(ctx); await ctx.reply(`📏 Lines: ${s ? s.split(/\r?\n/).length : 0}`); });
add('palindrome', 'Check if text is a palindrome.', 'UTILITY', async ctx => { const s=argsText(ctx).toLowerCase().replace(/[^a-z0-9]/g,''); await ctx.reply(s && s===s.split('').reverse().join('') ? '✅ Palindrome' : '❌ Not a palindrome'); });
add('calcx', 'Safely evaluate basic arithmetic.', 'UTILITY', async ctx => { try { const r=safeEval(argsText(ctx)); await ctx.reply(`🧮 ${r}`); } catch(e) { await ctx.reply(`❌ ${e.message}`); } }, ['mathx']);
add('percent', 'Calculate percentage.', 'UTILITY', async ctx => { const [a,b]=ctx.args.map(Number); if(!Number.isFinite(a)||!Number.isFinite(b))return ctx.reply('Usage: /percent value total'); await ctx.reply(`${((a/b)*100).toFixed(2)}%`); });
add('ratio', 'Calculate a:b ratio.', 'UTILITY', async ctx => { const [a,b]=ctx.args.map(Number); if(!Number.isFinite(a)||!Number.isFinite(b)||!b)return ctx.reply('Usage: /ratio a b'); const g=gcd(a,b); await ctx.reply(`${a/g}:${b/g}`); });
add('average', 'Calculate an average.', 'UTILITY', async ctx => { const n=ctx.args.map(Number).filter(Number.isFinite); if(!n.length)return ctx.reply('Usage: /average 10 20 30'); await ctx.reply(`${n.reduce((a,b)=>a+b,0)/n.length}`); });
add('median', 'Calculate a median.', 'UTILITY', async ctx => { const n=ctx.args.map(Number).filter(Number.isFinite).sort((a,b)=>a-b); if(!n.length)return ctx.reply('Usage: /median 10 20 30'); const m=Math.floor(n.length/2); await ctx.reply(n.length%2?n[m]:(n[m-1]+n[m])/2); });
add('gcd', 'Calculate greatest common divisor.', 'UTILITY', async ctx => { const [a,b]=ctx.args.map(Number); if(!Number.isFinite(a)||!Number.isFinite(b))return ctx.reply('Usage: /gcd 48 18'); await ctx.reply(String(gcd(a,b))); });
add('lcm', 'Calculate least common multiple.', 'UTILITY', async ctx => { const [a,b]=ctx.args.map(Number); if(!Number.isFinite(a)||!Number.isFinite(b))return ctx.reply('Usage: /lcm 12 18'); await ctx.reply(String(Math.abs(a*b)/Math.max(1,gcd(a,b)))); });
add('prime', 'Check if a number is prime.', 'UTILITY', async ctx => { const n=Number(ctx.args?.[0]); if(!Number.isInteger(n))return ctx.reply('Usage: /prime 97'); await ctx.reply(isPrime(n)?'✅ Prime':'❌ Not prime'); });
add('factors', 'List integer factors.', 'UTILITY', async ctx => { const n=Number(ctx.args?.[0]); if(!Number.isInteger(n)||n===0)return ctx.reply('Usage: /factors 120'); await ctx.reply(factors(n).join(', ')); });
add('factorial', 'Calculate factorial.', 'UTILITY', async ctx => { const n=Number(ctx.args?.[0]); if(!Number.isInteger(n)||n<0||n>170)return ctx.reply('Usage: /factorial 10 (0-170)'); let r=1; for(let i=2;i<=n;i++)r*=i; await ctx.reply(String(r)); });
add('fibonacci', 'Get Fibonacci number.', 'UTILITY', async ctx => { const n=Number(ctx.args?.[0]); if(!Number.isInteger(n)||n<0||n>1476)return ctx.reply('Usage: /fibonacci 20'); let a=0n,b=1n; for(let i=0;i<n;i++) [a,b]=[b,a+b]; await ctx.reply(a.toString()); });
add('iseven', 'Check if number is even.', 'UTILITY', async ctx => { const n=Number(ctx.args?.[0]); await ctx.reply(Number.isFinite(n)&&Number.isInteger(n)?(n%2===0?'✅ Even':'❌ Odd'):'Usage: /iseven 42'); });
add('isodd', 'Check if number is odd.', 'UTILITY', async ctx => { const n=Number(ctx.args?.[0]); await ctx.reply(Number.isFinite(n)&&Number.isInteger(n)?(n%2!==0?'✅ Odd':'❌ Even'):'Usage: /isodd 42'); });
add('binary', 'Text to binary.', 'ENCODING', async ctx => ctx.reply(binary(argsText(ctx)) || 'Usage: /binary hello'));
add('unbinary', 'Binary to text.', 'ENCODING', async ctx => { try { await ctx.reply(unbinary(argsText(ctx))); } catch { await ctx.reply('❌ Invalid binary.'); } });
add('hex', 'Text to hexadecimal.', 'ENCODING', async ctx => ctx.reply(toHex(argsText(ctx)) || 'Usage: /hex hello'));
add('unhex', 'Hexadecimal to text.', 'ENCODING', async ctx => { try { await ctx.reply(fromHex(argsText(ctx))); } catch { await ctx.reply('❌ Invalid hex.'); } });
add('base64x', 'Encode text as Base64.', 'ENCODING', async ctx => ctx.reply(b64(argsText(ctx)) || 'Usage: /base64x hello'));
add('unbase64x', 'Decode Base64.', 'ENCODING', async ctx => { try { await ctx.reply(unb64(argsText(ctx))); } catch { await ctx.reply('❌ Invalid Base64.'); } });
add('morse', 'Encode Morse code.', 'ENCODING', async ctx => ctx.reply(morseEncode(argsText(ctx)) || 'Usage: /morse hello'));
add('unmorse', 'Decode Morse code.', 'ENCODING', async ctx => ctx.reply(morseDecode(argsText(ctx)) || 'Usage: /unmorse .... . .-.. .-.. ---'));
add('urlencode', 'URL encode text.', 'ENCODING', async ctx => ctx.reply(encodeURIComponent(argsText(ctx))));
add('urldecode', 'URL decode text.', 'ENCODING', async ctx => { try { await ctx.reply(decodeURIComponent(argsText(ctx))); } catch { await ctx.reply('❌ Invalid URL encoding.'); } });
add('hash', 'SHA-256 hash text.', 'ENCODING', async ctx => ctx.reply(hashText(argsText(ctx)) || 'Usage: /hash text'));
add('sha1x', 'SHA-1 hash text.', 'ENCODING', async ctx => ctx.reply(hashText(argsText(ctx), 'sha1') || 'Usage: /sha1x text'));
add('md5x', 'MD5 hash text.', 'ENCODING', async ctx => ctx.reply(hashText(argsText(ctx), 'md5') || 'Usage: /md5x text'));
add('jsonx', 'Pretty-print a JSON value.', 'UTILITY', async ctx => { try { await ctx.reply(JSON.stringify(JSON.parse(argsText(ctx)), null, 2)); } catch { await ctx.reply('❌ Invalid JSON.'); } });
add('timestamp', 'Show Unix timestamp.', 'UTILITY', async ctx => ctx.reply(String(Math.floor(Date.now()/1000))));
add('now', 'Show current ISO time.', 'UTILITY', async ctx => ctx.reply(new Date().toISOString()));
add('datex', 'Show current date.', 'UTILITY', async ctx => ctx.reply(new Date().toLocaleDateString('en-GB',{dateStyle:'full'})));
add('monthx', 'Show current month.', 'UTILITY', async ctx => ctx.reply(new Date().toLocaleString('en',{month:'long',year:'numeric'})));
add('yearx', 'Show current year.', 'UTILITY', async ctx => ctx.reply(String(new Date().getFullYear())));
add('dayx', 'Show current weekday.', 'UTILITY', async ctx => ctx.reply(new Date().toLocaleDateString('en',{weekday:'long'})));
add('uuidx', 'Generate UUID.', 'UTILITY', async ctx => ctx.reply(crypto.randomUUID()));

/* ======================================================================
   FUN
====================================================================== */

const jokes=[
  'Why did the developer go broke? Because they used up all their cache. 😂',
  'I would tell you a UDP joke, but you might not get it. 😭',
  'There are 10 kinds of people: those who understand binary and those who do not.',
  'A SQL query walks into a bar and asks two tables: Can I join you?'
];
const quotes=[
  'Small steps still move you forward.',
  'Build it. Break it. Learn it. Improve it.',
  'Consistency beats intensity when the goal is long-term.',
  'Your next line of code can solve yesterday\'s problem.'
];
const fortunes=[
  'A surprisingly good idea is closer than you think.',
  'Your effort is about to meet an opportunity.',
  'Someone will appreciate something you built.',
  'A clean restart will solve more than expected.'
];
const compliments=['You are cooking today 🔥','Your energy is elite ✨','Big brain behavior 🧠','You make difficult things look easy 😎','Certified legend 🏆'];
const roasts=['Your Wi-Fi has more stability than your decisions 😭','You have premium confidence with free-tier accuracy 😂','Even the loading spinner is waiting for your comeback.','Your keyboard deserves hazard pay.'];
add('jokex','Tell a joke.','FUN',async ctx=>ctx.reply(choice(jokes)),['joke']);
add('quotez','Send a motivational quote.','FUN',async ctx=>ctx.reply(`💬 ${choice(quotes)}`),['quote']);
add('fortune','Get a random fortune.','FUN',async ctx=>ctx.reply(`🔮 ${choice(fortunes)}`));
add('compliment','Compliment yourself or a target.','FUN',async ctx=>ctx.reply(`✨ ${choice(compliments)} ${ctx.mentions?.[0]?'@'+ctx.mentions[0].split('@')[0]:''}`));
add('roast','Light-hearted roast.','FUN',async ctx=>ctx.reply(`🔥 ${choice(roasts)}`));
add('ship','Calculate a playful compatibility score.','FUN',async ctx=>{ const m=ctx.mentions||[]; const text=argsText(ctx); const seed=(text||m.join('')).replace(/\s/g,''); const h=hashText(seed||'crystal').slice(0,8); const score=parseInt(h,16)%101; await ctx.reply(`💞 Compatibility: *${score}%*`); });
add('rate','Rate something from 0-100.','FUN',async ctx=>{ const s=argsText(ctx)||'this'; const h=parseInt(hashText(s).slice(0,8),16)%101; await ctx.reply(`📊 ${s}: *${h}/100*`); });
add('8ballx','Magic 8-ball.','FUN',async ctx=>ctx.reply(choice(['Yes. ✅','No. ❌','Definitely. 🔥','Probably. 🤔','Ask again. 🎱','Absolutely not. 😭'])),['askball']);
add('truth','Random truth prompt.','FUN',async ctx=>ctx.reply(`🫣 ${choice(['What is one thing you want to improve this month?','What is your most embarrassing typo?','What is a skill you secretly want to master?','What is the best compliment you remember?'])}`));
add('dare','Random dare prompt.','FUN',async ctx=>ctx.reply(`😈 ${choice(['Send a dramatic voice note.','Change your status for 10 minutes.','Compliment someone in the chat.','Type your next message using only emojis.'])}`));
add('wyr','Would you rather?','FUN',async ctx=>ctx.reply(`🤔 ${choice(['Have unlimited money or unlimited time?','Be famous or be anonymous and rich?','Always be early or never be late?','Master every game or every programming language?'])}`),['wouldyourather']);
add('pickup','Playful pickup line.','FUN',async ctx=>ctx.reply(choice(['Are you a keyboard? You are just my type. 😏','You must be a compiler because you make my heart run. ❤️','Are you Wi-Fi? Because I am feeling a connection. 📶'])));
add('rizz','Random rizz line.','FUN',async ctx=>ctx.reply(choice(['Are you a bug? Because I cannot stop thinking about fixing you. 😭','You are the only notification I actually want. 😌','You must be async because you have me waiting.'])));
add('emoji','Turn common words into emoji-style text.','FUN',async ctx=>{ const map={love:'❤️',fire:'🔥',star:'⭐',money:'💰',laugh:'😂',sad:'😢',cool:'😎',party:'🥳',game:'🎮',heart:'💖'}; const s=argsText(ctx).toLowerCase().split(/\s+/).map(w=>map[w]||w).join(' '); await ctx.reply(s||'Usage: /emoji love fire star'); });
add('mock','Mock text using alternating case.','FUN',async ctx=>{ const s=argsText(ctx); await ctx.reply(s?s.split('').map((c,i)=>i%2?c.toLowerCase():c.toUpperCase()).join(''):'Usage: /mock text'); });
add('pirate','Rewrite in pirate style.','FUN',async ctx=>ctx.reply(`🏴‍☠️ Arrr! ${argsText(ctx)||'Say something, matey!'}`));
add('clap','Add claps between words.','FUN',async ctx=>ctx.reply(argsText(ctx).split(/\s+/).join(' 👏 ')||'Usage: /clap text'));
add('vibes','Give a vibe score.','FUN',async ctx=>{ const s=argsText(ctx)||'today'; const n=parseInt(hashText(s).slice(0,8),16)%101; await ctx.reply(`✨ Vibe score: *${n}%*`); });
add('sus','Playful sus detector.','FUN',async ctx=>{ const n=parseInt(hashText(argsText(ctx)||String(now())).slice(0,8),16)%101; await ctx.reply(n>70?`🚨 ${n}% SUS`:`🟢 ${n}% SUS`); });
add('based','Give a random verdict.','FUN',async ctx=>ctx.reply(choice(['Absolutely based. 🗿','Certified based. ✅','Based beyond measure. 🔥','Questionably based. 🤨'])));
add('cringe','Generate a cringe meter.','FUN',async ctx=>{ const n=parseInt(hashText(argsText(ctx)||'cringe').slice(0,8),16)%101; await ctx.reply(`😬 Cringe level: *${n}%*`); });
add('mood','Generate a random mood.','FUN',async ctx=>ctx.reply(choice(['😎 Chill','🔥 Hype','🧠 Focused','🥳 Party','😴 Sleepy','💎 Locked in'])));
add('fate','Ask fate a yes/no question.','FUN',async ctx=>ctx.reply(`🔮 Fate says: ${choice(['YES','NO','MAYBE','NOT YET'])}`));
add('mockme','Self-roast generator.','FUN',async ctx=>ctx.reply(`🔥 Your self-roast: ${choice(roasts)}`));
add('compliments','Get three compliments.','FUN',async ctx=>ctx.reply(compliments.slice(0,3).map(x=>`✨ ${x}`).join('\n')));

/* ======================================================================
   MINI GAMES
====================================================================== */

const duelStore = new Map();
function gameResult(db,ctx,delta,win=false){ const u=user(db,ctx); u.coins=Math.max(0,u.coins+delta); addXP(db,ctx,win?20:5); if(win)u.wins++; else if(delta<0)u.losses++; }

add('guessnumberx','Guess a number from 1-100.','GAMES',async ctx=>{ const g=ctx.args?.[0]; const n=Number(g); if(!Number.isInteger(n)||n<1||n>100)return ctx.reply('Usage: /guessnumberx 42'); const target=rand(1,100); await ctx.reply(n===target?`🎯 Correct! It was ${target}.`:`❌ Nope. It was ${target}.`); });
add('higherlower','Guess whether next number is higher or lower.','GAMES',async ctx=>{ const a=rand(1,13), pick=String(ctx.args?.[0]||'').toLowerCase(); if(!['higher','lower'].includes(pick))return ctx.reply('Usage: /higherlower higher|lower'); const b=rand(1,13); const win=(pick==='higher'&&b>a)||(pick==='lower'&&b<a); await ctx.reply(`🃏 ${a} → ${b}\n${a===b?'Draw.':win?'✅ You win!':'❌ You lose.'}`); });
add('quickmath','Solve a generated arithmetic problem.','GAMES',async ctx=>{ const a=rand(2,50),b=rand(2,50),ops=['+','-','*'],op=choice(ops),ans=op==='+'?a+b:op==='-'?a-b:a*b; const given=Number(ctx.args?.[0]); if(!Number.isFinite(given))return ctx.reply(`🧮 ${a} ${op} ${b} = ?\nReply with /quickmath ${ans}`); await ctx.reply(given===ans?'✅ Correct!':`❌ Wrong. Answer: ${ans}`); });
add('anagram','Solve an anagram.','GAMES',async ctx=>{ const words=['crystal','whatsapp','javascript','computer','diamond','developer']; const w=choice(words); const shuffled=w.split('').sort(()=>Math.random()-0.5).join(''); const answer=String(ctx.args?.[0]||'').toLowerCase(); if(!answer)return ctx.reply(`🔤 Unscramble: *${shuffled}*\nUse /anagram answer`); await ctx.reply(answer===w?'✅ Correct!':'❌ Wrong answer.'); });
add('riddlex','Get a riddle and answer it.','GAMES',async ctx=>{ const rs=[['I speak without a mouth and hear without ears. What am I?','echo'],['What has keys but cannot open locks?','keyboard'],['What gets wetter the more it dries?','towel'],['What has hands but cannot clap?','clock']]; const [q,a]=choice(rs); const x=String(ctx.args?.join(' ')||'').toLowerCase(); if(!x)return ctx.reply(`🧩 ${q}\nAnswer with /riddlex <answer>`); await ctx.reply(x.includes(a)?'✅ Correct!':'❌ Not quite.'); });
add('triviax','Answer a quick trivia question.','GAMES',async ctx=>{ const qs=[['What planet is known as the Red Planet?','mars'],['What is 2+2?','4'],['What language runs in Node.js?','javascript'],['How many days are in a week?','7']]; const [q,a]=choice(qs); const x=String(ctx.args?.join(' ')||'').toLowerCase(); if(!x)return ctx.reply(`🧠 ${q}\nReply /triviax answer`); await ctx.reply(x===a||x.includes(a)?'✅ Correct!':'❌ Wrong.'); });
add('capitals','Guess a country capital.','GAMES',async ctx=>{ const qs=[['Nigeria','Abuja'],['France','Paris'],['Japan','Tokyo'],['Ghana','Accra'],['Kenya','Nairobi'],['Canada','Ottawa']]; const [c,a]=choice(qs); const x=String(ctx.args?.join(' ')||''); if(!x)return ctx.reply(`🌍 Capital of ${c}?\nReply /capitals answer`); await ctx.reply(x.toLowerCase()===a.toLowerCase()?'✅ Correct!':`❌ It is ${a}.`); });
add('countryquiz','Guess the country from a clue.','GAMES',async ctx=>{ const qs=[['It is famous for the Eiffel Tower.','france'],['It has Abuja as capital.','nigeria'],['It is home to Mount Fuji.','japan'],['It is known for the Great Pyramid of Giza.','egypt']]; const [q,a]=choice(qs); const x=String(ctx.args?.join(' ')||'').toLowerCase(); if(!x)return ctx.reply(`🌐 Clue: ${q}\nReply /countryquiz country`); await ctx.reply(x.includes(a)?'✅ Correct!':'❌ Wrong.'); });
add('mathrace','Speed arithmetic.','GAMES',async ctx=>{ const a=rand(10,99),b=rand(1,50),ans=a+b; const x=Number(ctx.args?.[0]); if(!Number.isFinite(x))return ctx.reply(`${a}+${b} = ?\nReply /mathrace ${ans}`); await ctx.reply(x===ans?'⚡ Fast! Correct!':`❌ ${ans}`); });
add('numberrush','Find the larger number.','GAMES',async ctx=>{ const a=rand(1,999),b=rand(1,999),x=Number(ctx.args?.[0]); if(!Number.isFinite(x))return ctx.reply(`🏁 ${a} or ${b}? Reply /numberrush ${Math.max(a,b)}`); await ctx.reply(x===Math.max(a,b)?'✅ Correct!':'❌ Wrong.'); });
add('oddone','Pick the odd number out.','GAMES',async ctx=>{ const base=choice([2,3,5,7]), arr=[base*2,base*4,base*6,base*7].sort(()=>Math.random()-0.5); const odd=base*7; const x=Number(ctx.args?.[0]); if(!Number.isFinite(x))return ctx.reply(`🧩 ${arr.join(' ')}\nOdd one: /oddone ${odd}`); await ctx.reply(x===odd?'✅ Correct!':'❌ Wrong.'); });
add('wordguess','Guess the hidden word.','GAMES',async ctx=>{ const ws=['crystal','bot','wa','node','code','diamond']; const w=choice(ws); const x=String(ctx.args?.[0]||'').toLowerCase(); if(!x)return ctx.reply(`🔐 Word has ${w.length} letters. Starts with ${w[0]}\nReply /wordguess word`); await ctx.reply(x===w?'✅ Correct!':`❌ The word was ${w}.`); });
add('hangmanx','Guess a hidden word.','GAMES',async ctx=>{ const w=choice(['javascript','crystal','whatsapp','economy','diamond']); const g=String(ctx.args?.[0]||'').toLowerCase(); if(!g)return ctx.reply(`🎯 Guess a ${w.length}-letter word starting with ${w[0]}. Use /hangmanx word`); await ctx.reply(g===w?'🏆 You guessed it!':`❌ The word was ${w}.`); });
add('typechallenge','Typing challenge score.','GAMES',async ctx=>{ const phrase='crystal bot wins'; const x=argsText(ctx).toLowerCase(); if(!x)return ctx.reply(`⌨️ Type exactly: *${phrase}*\nThen /typechallenge <text>`); await ctx.reply(x===phrase?'⚡ Perfect accuracy!':'❌ Not exact.'); });
add('coinflipx','Flip a coin.','GAMES',async ctx=>ctx.reply(`🪙 ${choice(['Heads','Tails'])}`));
add('dicegame','Roll two dice.','GAMES',async ctx=>{ const a=rand(1,6),b=rand(1,6); await ctx.reply(`🎲 ${a} + ${b} = *${a+b}*`); });
add('dicebet','Bet virtual coins on a dice total.','CASINO',async ctx=>{ const db=readDB(),u=user(db,ctx); const bet=Math.floor(Number(ctx.args?.[0]||0)), guess=Number(ctx.args?.[1]); if(!bet||bet<1||bet>u.coins||![7,8,9,10,11].includes(guess))return ctx.reply(`Usage: /dicebet amount 7|8|9|10|11\nBalance: ${money(u.coins)}`); const total=rand(2,12); if(total===guess){gameResult(db,ctx,bet*3,true);writeDB(db);return ctx.reply(`🎲 Rolled ${total}. 🏆 You won ${money(bet*3)}!\nBalance: ${money(u.coins)}`);} gameResult(db,ctx,-bet,false);writeDB(db);await ctx.reply(`🎲 Rolled ${total}. ❌ Lost ${money(bet)}.`); });
add('slotsx','Spin virtual slots.','CASINO',async ctx=>{ const db=readDB(),u=user(db,ctx); const bet=Math.floor(Number(ctx.args?.[0]||0)); if(!bet||bet<1||bet>u.coins)return ctx.reply(`Usage: /slotsx amount\nBalance: ${money(u.coins)}`); const s=[choice(['🍒','🍋','🔔','💎','7️⃣']),choice(['🍒','🍋','🔔','💎','7️⃣']),choice(['🍒','🍋','🔔','💎','7️⃣'])]; const win=s[0]===s[1]&&s[1]===s[2]; const two=s[0]===s[1]||s[1]===s[2]||s[0]===s[2]; const delta=win?bet*5:two?bet*2:-bet;gameResult(db,ctx,delta,delta>0);writeDB(db);await ctx.reply(`${s.join(' | ')}\n${delta>0?'🏆 Win!':'😵 Loss.'} ${delta>=0?'+':''}${money(delta)}\nBalance: ${money(u.coins)}`); });
add('blackjackx','Play simple virtual blackjack.','CASINO',async ctx=>{ const db=readDB(),u=user(db,ctx); const bet=Math.floor(Number(ctx.args?.[0]||0)); if(!bet||bet<1||bet>u.coins)return ctx.reply(`Usage: /blackjackx amount\nBalance: ${money(u.coins)}`); const you=rand(14,21),dealer=rand(14,21); let d=0; if(you>dealer)d=bet; else if(you<dealer)d=-bet; else d=0; gameResult(db,ctx,d,d>0);writeDB(db);await ctx.reply(`🃏 You: ${you}\n🤖 Dealer: ${dealer}\n${d>0?'🏆 You win!':d<0?'❌ Dealer wins.':'🤝 Push.'}`); });
add('roulettex','Spin virtual roulette.','CASINO',async ctx=>{ const db=readDB(),u=user(db,ctx); const bet=Math.floor(Number(ctx.args?.[0]||0)), pick=String(ctx.args?.[1]||'').toLowerCase(); if(!bet||bet<1||bet>u.coins||!['red','black','green'].includes(pick))return ctx.reply(`Usage: /roulettex amount red|black|green\nBalance: ${money(u.coins)}`); const color=choice(['red','black','black','red','black','red','green']); const delta=color===pick?(pick==='green'?bet*14:bet):-bet;gameResult(db,ctx,delta,delta>0);writeDB(db);await ctx.reply(`🎡 ${color.toUpperCase()}\n${delta>0?`🏆 +${money(delta)}`:`❌ -${money(bet)}`}\nBalance: ${money(u.coins)}`); });
add('wheel','Spin a prize wheel.','CASINO',async ctx=>{ const db=readDB(),u=user(db,ctx); const p=choice([0,25,50,100,200,500,-50,-100]); u.coins=Math.max(0,u.coins+p); addXP(db,ctx,5); writeDB(db); await ctx.reply(`🎡 Wheel landed on *${p>=0?'+':''}${p} CC*\nBalance: ${money(u.coins)}`); });
add('lottery','Buy a free virtual lottery ticket.','CASINO',async ctx=>{ const db=readDB(),u=user(db,ctx); const n=Math.floor(Number(ctx.args?.[0]||0)); if(!Number.isInteger(n)||n<1||n>20)return ctx.reply('Usage: /lottery number 1-20'); const draw=rand(1,20); const delta=draw===n?5000:-100;u.coins=Math.max(0,u.coins+delta);writeDB(db);await ctx.reply(`🎟️ Your number: ${n}\n🎯 Draw: ${draw}\n${delta>0?'🏆 JACKPOT! +5,000 CC':'❌ Better luck next time.'}`); });
add('scratch','Scratch a virtual card.','CASINO',async ctx=>{ const db=readDB(),u=user(db,ctx); const prizes=[25,50,100,250,500,1000,0]; const p=choice(prizes);u.coins+=p;writeDB(db);await ctx.reply(`🪙 Scratch result: ${p?`+${money(p)}`:'Nothing 😭'}\nBalance: ${money(u.coins)}`); });
add('plinko','Play simple virtual Plinko.','CASINO',async ctx=>{ const db=readDB(),u=user(db,ctx); const bet=Math.floor(Number(ctx.args?.[0]||0)); if(!bet||bet<1||bet>u.coins)return ctx.reply(`Usage: /plinko amount\nBalance: ${money(u.coins)}`); const mult=choice([0,0,0.5,1,1.5,2,3,5]); const delta=Math.floor(bet*mult-bet);gameResult(db,ctx,delta,delta>0);writeDB(db);await ctx.reply(`🔴 Multiplier: *${mult}x*\nResult: ${delta>=0?'+':''}${money(delta)}\nBalance: ${money(u.coins)}`); });
add('baccaratx','Play simple virtual baccarat.','CASINO',async ctx=>{ const db=readDB(),u=user(db,ctx); const bet=Math.floor(Number(ctx.args?.[0]||0)); const side=String(ctx.args?.[1]||'').toLowerCase(); if(!bet||bet<1||bet>u.coins||!['player','banker','tie'].includes(side))return ctx.reply(`Usage: /baccaratx amount player|banker|tie`); const p=rand(0,9),b=rand(0,9); const result=p===b?'tie':p>b?'player':'banker'; const delta=side===result?(side==='tie'?bet*8:Math.floor(bet*0.95)):-bet;gameResult(db,ctx,delta,delta>0);writeDB(db);await ctx.reply(`🎴 Player ${p} • Banker ${b}\nResult: *${result}*\n${delta>=0?'+':''}${money(delta)}`); });
add('minesx','Reveal a virtual safe tile.','CASINO',async ctx=>{ const db=readDB(),u=user(db,ctx); const bet=Math.floor(Number(ctx.args?.[0]||0)); if(!bet||bet<1||bet>u.coins)return ctx.reply(`Usage: /minesx amount`); const safe=Math.random()>0.35; const delta=safe?Math.floor(bet*0.7):-bet;gameResult(db,ctx,delta,safe);writeDB(db);await ctx.reply(safe?`💎 Safe tile! +${money(delta)}`:`💣 Boom! -${money(bet)}`); });
add('keno','Pick a number in virtual Keno.','CASINO',async ctx=>{ const db=readDB(),u=user(db,ctx); const bet=Math.floor(Number(ctx.args?.[0]||0)),n=Number(ctx.args?.[1]); if(!bet||bet<1||bet>u.coins||!Number.isInteger(n)||n<1||n>20)return ctx.reply('Usage: /keno amount number(1-20)'); const d=rand(1,20); const delta=d===n?bet*8:-bet;gameResult(db,ctx,delta,d===n);writeDB(db);await ctx.reply(`🎱 Draw: ${d}\n${d===n?`🏆 +${money(delta)}`:`❌ -${money(bet)}`}`); });
add('crashx','Simple virtual crash multiplier game.','CASINO',async ctx=>{ const db=readDB(),u=user(db,ctx); const bet=Math.floor(Number(ctx.args?.[0]||0)); if(!bet||bet<1||bet>u.coins)return ctx.reply('Usage: /crashx amount'); const m=Math.floor((1+Math.random()*4)*100)/100; const survive=Math.random()>0.25; const delta=survive?Math.floor(bet*(m-1)):-bet;gameResult(db,ctx,delta,survive);writeDB(db);await ctx.reply(`📈 Crash at *${m}x*\n${survive?`✅ You cashed: +${money(delta)}`:`💥 Crashed: -${money(bet)}`}`); });
add('horsebet','Bet on a virtual race.','CASINO',async ctx=>{ const db=readDB(),u=user(db,ctx); const bet=Math.floor(Number(ctx.args?.[0]||0)),h=Number(ctx.args?.[1]); if(!bet||bet<1||bet>u.coins||![1,2,3].includes(h))return ctx.reply('Usage: /horsebet amount 1|2|3'); const winner=rand(1,3); const delta=winner===h?bet*2:-bet;gameResult(db,ctx,delta,winner===h);writeDB(db);await ctx.reply(`🏇 Winner: Horse ${winner}\n${winner===h?`🏆 +${money(delta)}`:`❌ -${money(bet)}`}`); });
add('jackpotx','Check the virtual jackpot.','CASINO',async ctx=>{ const db=readDB(); db.stats.jackpot=db.stats.jackpot||10000; db.stats.jackpot+=rand(0,50);writeDB(db);await ctx.reply(`💎 Current jackpot: *${money(db.stats.jackpot)}*`); });

/* ======================================================================
   ECONOMY
====================================================================== */

async function claimCmd(ctx,key,amount,cool){ const db=readDB(),u=user(db,ctx),left=cooldown(u,key,cool); if(left)return ctx.reply(`⏳ Try again in ${fmtMs(left)}.`); u.coins+=amount;setCooldown(u,key);addXP(db,ctx,10);writeDB(db);await ctx.reply(`💰 +${money(amount)}\nBalance: ${money(u.coins)}`); }
add('wealth','Show your Crystal Coins wallet.','ECONOMY',async ctx=>{ const db=readDB(),u=user(db,ctx);writeDB(db);await ctx.reply(`💰 *WALLET*\nCash: ${money(u.coins)}\nBank: ${money(u.bank)}\nNet worth: ${money(u.coins+u.bank)}`); },['wallet']);
add('claimx','Claim a timed Crystal reward.','ECONOMY',async ctx=>claimCmd(ctx,'claimx',250,6*60*60*1000));
add('dailybonus','Claim daily bonus.','ECONOMY',async ctx=>claimCmd(ctx,'dailybonus',1000,24*60*60*1000));
add('weeklybonus','Claim weekly bonus.','ECONOMY',async ctx=>claimCmd(ctx,'weeklybonus',5000,7*24*60*60*1000));
add('monthlybonus','Claim monthly bonus.','ECONOMY',async ctx=>claimCmd(ctx,'monthlybonus',15000,30*24*60*60*1000));
add('workx','Work for Crystal Coins.','ECONOMY',async ctx=>claimCmd(ctx,'workx',rand(200,700),60*60*1000));
add('hustlex','Hustle for a random payout.','ECONOMY',async ctx=>claimCmd(ctx,'hustlex',rand(100,1200),30*60*1000));
add('begx','Ask the bot for a random tip.','ECONOMY',async ctx=>claimCmd(ctx,'begx',rand(10,150),20*60*1000));
add('fishx','Go fishing for coins.','ECONOMY',async ctx=>claimCmd(ctx,'fishx',rand(50,500),20*60*1000));
add('huntx','Go hunting for a payout.','ECONOMY',async ctx=>claimCmd(ctx,'huntx',rand(75,650),30*60*1000));
add('minex','Mine virtual crystals.','ECONOMY',async ctx=>claimCmd(ctx,'minex',rand(100,800),45*60*1000));
add('farmx','Harvest virtual crops.','ECONOMY',async ctx=>claimCmd(ctx,'farmx',rand(80,600),30*60*1000));
add('cookx','Sell a virtual meal.','ECONOMY',async ctx=>claimCmd(ctx,'cookx',rand(50,450),20*60*1000));
add('crimex','Attempt a virtual crime.','ECONOMY',async ctx=>{ const db=readDB(),u=user(db,ctx),left=cooldown(u,'crimex',60*60*1000); if(left)return ctx.reply(`⏳ Try again in ${fmtMs(left)}.`);setCooldown(u,'crimex');const success=Math.random()>0.45;const delta=success?rand(250,1000):-rand(50,400);u.coins=Math.max(0,u.coins+delta);writeDB(db);await ctx.reply(success?`🕶️ Success! +${money(delta)}`:`🚔 Caught! -${money(-delta)}`); });
add('robx','Attempt to rob a random virtual player.','ECONOMY',async ctx=>{ const db=readDB(),u=user(db,ctx),ids=Object.keys(db.users).filter(x=>x!==userKey(ctx)); if(!ids.length)return ctx.reply('No other economy users yet.'); const left=cooldown(u,'robx',2*60*60*1000);if(left)return ctx.reply(`⏳ Try again in ${fmtMs(left)}.`);setCooldown(u,'robx');const tid=choice(ids),target=db.users[tid];const amount=Math.min(rand(50,300),target.coins);if(!amount)return ctx.reply('Target had no cash.');const success=Math.random()>0.5;if(success){target.coins-=amount;u.coins+=amount;addXP(db,ctx,15);}else{u.coins=Math.max(0,u.coins-amount);addXP(db,ctx,5);}writeDB(db);await ctx.reply(success?`🥷 You robbed ${money(amount)}!`:`🚓 Failed and paid ${money(amount)}.`); });
add('payx','Pay another user in the same chat (mention or number).','ECONOMY',async ctx=>{ const db=readDB(),u=user(db,ctx); const target=ctx.mentions?.[0]||String(ctx.args?.[0]||'').replace(/\D/g,''); const amount=Math.floor(Number(ctx.args?.at(-1))); if(!target||!amount||amount<1||amount>u.coins)return ctx.reply('Usage: /payx @user amount'); const id=String(target).replace(/@s\.whatsapp\.net|@lid/g,'').split(':')[0]; const tu=db.users[id]||(db.users[id]={coins:0,bank:0,xp:0,level:1,wins:0,losses:0,streak:0,inventory:{},last:{},created:now()});u.coins-=amount;tu.coins+=amount;writeDB(db);await ctx.reply(`✅ Paid ${money(amount)} to ${id}.`); });
add('giftx','Gift Crystal Coins to a mentioned user.','ECONOMY',async ctx=>{ const fake={...ctx,args:[String(ctx.args?.at(-1)||'')]}; return commands.find(x=>x.name==='payx').execute({...ctx,args:fake.args}); });
add('bank','Show your bank.','ECONOMY',async ctx=>{ const db=readDB(),u=user(db,ctx);await ctx.reply(`🏦 Cash: ${money(u.coins)}\nBank: ${money(u.bank)}`); });
add('deposit','Deposit coins into the virtual bank.','ECONOMY',async ctx=>{ const db=readDB(),u=user(db,ctx),n=Math.floor(Number(ctx.args?.[0]));if(!n||n<1||n>u.coins)return ctx.reply('Usage: /deposit amount');u.coins-=n;u.bank+=n;writeDB(db);await ctx.reply(`🏦 Deposited ${money(n)}.`); });
add('withdraw','Withdraw virtual bank coins.','ECONOMY',async ctx=>{ const db=readDB(),u=user(db,ctx),n=Math.floor(Number(ctx.args?.[0]));if(!n||n<1||n>u.bank)return ctx.reply('Usage: /withdraw amount');u.bank-=n;u.coins+=n;writeDB(db);await ctx.reply(`🏦 Withdrawn ${money(n)}.`); });
add('rankx','Show economy rank.','ECONOMY',async ctx=>{ const db=readDB(),id=userKey(ctx),arr=Object.entries(db.users).sort((a,b)=>(b[1].coins+b[1].bank)-(a[1].coins+a[1].bank));const i=arr.findIndex(x=>x[0]===id)+1;await ctx.reply(`🏆 Rank: #${i||arr.length}\nNet worth: ${money((user(db,ctx).coins+user(db,ctx).bank))}`); });
add('levelx','Show XP level.','ECONOMY',async ctx=>{ const db=readDB(),u=user(db,ctx);await ctx.reply(`⭐ Level ${u.level}\nXP: ${u.xp}/${xpForLevel(u.level)}`); });
add('xpgain','Give yourself a small XP boost.','ECONOMY',async ctx=>{ const db=readDB(),up=addXP(db,ctx,25),u=user(db,ctx);writeDB(db);await ctx.reply(`✨ +25 XP${up?`\n🎉 Level up to ${u.level}!`:''}`); });
add('richlist','Show top 10 Crystal wallets.','ECONOMY',async ctx=>{ const db=readDB();const rows=Object.entries(db.users).sort((a,b)=>(b[1].coins+b[1].bank)-(a[1].coins+a[1].bank)).slice(0,10).map((x,i)=>`${i+1}. ${x[0]} — ${money(x[1].coins+x[1].bank)}`);await ctx.reply(`💎 *RICHLIST*\n\n${rows.length?rows.join('\n'):'No users yet.'}`); });
add('inventoryx','Show your virtual inventory.','ECONOMY',async ctx=>{ const db=readDB(),u=user(db,ctx);const rows=Object.entries(u.inventory).map(([k,v])=>`• ${k}: ${v}`);await ctx.reply(`🎒 *INVENTORY*\n\n${rows.join('\n')||'Empty'}`); });
add('buyx','Buy a cheap virtual item.','ECONOMY',async ctx=>{ const db=readDB(),u=user(db,ctx),item=String(ctx.args?.[0]||'').toLowerCase();const prices={potion:100,sword:500,shield:400,gem:1000,crate:250};if(!prices[item])return ctx.reply(`Shop: ${Object.keys(prices).join(', ')}`);if(u.coins<prices[item])return ctx.reply('❌ Not enough coins.');u.coins-=prices[item];u.inventory[item]=(u.inventory[item]||0)+1;writeDB(db);await ctx.reply(`🛒 Bought ${item} for ${money(prices[item])}.`); });
add('sellx','Sell a virtual item.','ECONOMY',async ctx=>{ const db=readDB(),u=user(db,ctx),item=String(ctx.args?.[0]||'').toLowerCase();const values={potion:70,sword:350,shield:280,gem:750,crate:150};if(!values[item])return ctx.reply(`Items: ${Object.keys(values).join(', ')}`);if(!u.inventory[item])return ctx.reply('❌ You do not own that item.');u.inventory[item]-=1;u.coins+=values[item];writeDB(db);await ctx.reply(`💰 Sold ${item} for ${money(values[item])}.`); });
add('networth','Calculate total net worth.','ECONOMY',async ctx=>{ const db=readDB(),u=user(db,ctx);await ctx.reply(`💎 Net worth: *${money(u.coins+u.bank)}*`); });

/* ======================================================================
   PROFILE / SOCIAL
====================================================================== */

add('profile','Show your Crystal profile.','PROFILE',async ctx=>{ const db=readDB(),u=user(db,ctx);writeDB(db);await ctx.reply(`💎 *PROFILE*\n\n👤 ${pickLabel(ctx)}\n⭐ Level: ${u.level}\n✨ XP: ${u.xp}/${xpForLevel(u.level)}\n💰 Coins: ${money(u.coins)}\n🏆 Wins: ${u.wins}\n💔 Losses: ${u.losses}`); });
add('whoami','Show your identity details.','PROFILE',async ctx=>ctx.reply(`👤 Sender: ${ctx.sender}\n🆔 JID: ${ctx.jid}\n👑 Owner: ${ctx.isOwner?'yes':'no'}\n🛡️ Sudo: ${ctx.isSudo?'yes':'no'}\n👥 Group: ${ctx.isGroup?'yes':'no'}`));
add('myid','Show your WhatsApp ID.','PROFILE',async ctx=>ctx.reply(`🆔 ${ctx.sender || 'unknown'}`));
add('usernumber','Show your normalized number.','PROFILE',async ctx=>ctx.reply(`📱 ${String(ctx.sender||'').split('@')[0].split(':')[0]}`));
add('statsx','Show your command-game stats.','PROFILE',async ctx=>{const db=readDB(),u=user(db,ctx);await ctx.reply(`📈 Wins: ${u.wins}\n📉 Losses: ${u.losses}\n🔥 Streak: ${u.streak}\n⭐ Level: ${u.level}`);});
add('streakx','Show your current streak.','PROFILE',async ctx=>{const db=readDB(),u=user(db,ctx);await ctx.reply(`🔥 Streak: ${u.streak}`);});
add('serverinfo','Show server process information.','PROFILE',async ctx=>ctx.reply(`🖥️ Host: ${os.hostname()}\nPlatform: ${process.platform}\nArch: ${process.arch}\nNode: ${process.version}`));

/* ======================================================================
   GROUP / MODERATION EXTRAS
====================================================================== */

add('groupid','Show group JID.','GROUP',async ctx=>{requireGroup(ctx);await ctx.reply(`🆔 ${ctx.jid}`);});
add('groupname','Show group name.','GROUP',async ctx=>{requireGroup(ctx);const md=ctx.groupMetadata||await ctx.getGroupInfo();await ctx.reply(`👥 ${md?.subject||'Unknown group'}`);});
add('membercount','Show group member count.','GROUP',async ctx=>{requireGroup(ctx);const md=ctx.groupMetadata||await ctx.getGroupInfo();await ctx.reply(`👥 Members: ${md?.participants?.length||0}`);});
add('groupadmins2','List group admins.','GROUP',async ctx=>{requireGroup(ctx);const md=ctx.groupMetadata||await ctx.getGroupInfo();const a=(md?.participants||[]).filter(p=>p.admin).map(p=>`• @${p.id.split('@')[0]}`);await ctx.reply(`🛡️ Admins\n\n${a.join('\n')||'None'}`,{mentions:(md?.participants||[]).filter(p=>p.admin).map(p=>p.id)});});
add('botadmin2','Check whether bot is admin.','GROUP',async ctx=>{requireGroup(ctx);await ctx.reply(ctx.isBotAdmin?'✅ Crystal Bot is a group admin.':'❌ Crystal Bot is not a group admin.');});
add('groupstats','Show group metadata summary.','GROUP',async ctx=>{requireGroup(ctx);const md=ctx.groupMetadata||await ctx.getGroupInfo();await ctx.reply(`📊 *GROUP STATS*\nName: ${md?.subject||'Unknown'}\nMembers: ${md?.participants?.length||0}\nJID: ${ctx.jid}`);});
add('grouppower','Check your group permissions.','GROUP',async ctx=>{requireGroup(ctx);await ctx.reply(`👤 Admin: ${ctx.isGroupAdmin?'YES':'NO'}\n🤖 Bot admin: ${ctx.isBotAdmin?'YES':'NO'}\n👑 Owner: ${ctx.isOwner?'YES':'NO'}`);});
add('rulesx','Show group rules stored in memory.','GROUP',async ctx=>{requireGroup(ctx);const db=readDB();const r=db.groups[ctx.jid]?.rules||'No rules set.';await ctx.reply(`📜 *GROUP RULES*\n\n${r}`);});
add('setrulesx','Set simple group rules.','GROUP',async ctx=>{requireAdmin(ctx);const db=readDB();db.groups[ctx.jid]=db.groups[ctx.jid]||{};db.groups[ctx.jid].rules=argsText(ctx)||'Be respectful.';writeDB(db);await ctx.reply('✅ Group rules saved.');});
add('clearrulesx','Clear group rules.','GROUP',async ctx=>{requireAdmin(ctx);const db=readDB();if(db.groups[ctx.jid])delete db.groups[ctx.jid].rules;writeDB(db);await ctx.reply('✅ Group rules cleared.');});
add('taginfo','Show mentioned users.','GROUP',async ctx=>{if(!ctx.isGroup)return ctx.reply('This command works best in a group.');const m=ctx.mentions||[];await ctx.reply(m.length?`🏷️ Mentions: ${m.map(x=>'@'+x.split('@')[0]).join(', ')}`:'No users mentioned.');});
add('usercheck','Check your privilege flags.','GROUP',async ctx=>ctx.reply(JSON.stringify(statSnapshot(ctx),null,2)));

/* ======================================================================
   LOTS OF TINY QUALITY-OF-LIFE COMMANDS
====================================================================== */

add('trimx','Trim and normalize spaces.','UTILITY',async ctx=>ctx.reply(argsText(ctx).replace(/\s+/g,' ').trim()));
add('countdownx','Countdown from a small number.','UTILITY',async ctx=>{const n=Number(ctx.args?.[0]||0);if(!Number.isInteger(n)||n<1||n>10)return ctx.reply('Usage: /countdownx 5');await ctx.reply(`⏳ ${n}... ${n===1?'GO!':'Start!'}`);});
add('bytes','Count UTF-8 bytes.','UTILITY',async ctx=>ctx.reply(`💾 ${Buffer.byteLength(argsText(ctx),'utf8')} bytes`));
add('sha256','SHA-256 alias.','ENCODING',async ctx=>ctx.reply(hashText(argsText(ctx),'sha256')));
add('randomhex','Generate random hexadecimal.','UTILITY',async ctx=>ctx.reply(crypto.randomBytes(8).toString('hex')));
add('randombytes','Generate random byte count.','UTILITY',async ctx=>{const n=clamp(Number(ctx.args?.[0]||8),1,32);await ctx.reply(crypto.randomBytes(n).toString('hex'));});
add('formatnum','Format a number with commas.','UTILITY',async ctx=>{const n=Number(argsText(ctx));if(!Number.isFinite(n))return ctx.reply('Usage: /formatnum 1234567');await ctx.reply(n.toLocaleString());});
add('roman','Convert 1-3999 to Roman numerals.','UTILITY',async ctx=>{let n=Number(ctx.args?.[0]);if(!Number.isInteger(n)||n<1||n>3999)return ctx.reply('Usage: /roman 2026');const vals=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];let r='';for(const [v,s] of vals){while(n>=v){r+=s;n-=v;}}await ctx.reply(r);});
add('c2f','Convert Celsius to Fahrenheit.','UTILITY',async ctx=>{const c=Number(ctx.args?.[0]);if(!Number.isFinite(c))return ctx.reply('Usage: /c2f 30');await ctx.reply(`${(c*9/5+32).toFixed(2)} °F`);});
add('f2c','Convert Fahrenheit to Celsius.','UTILITY',async ctx=>{const f=Number(ctx.args?.[0]);if(!Number.isFinite(f))return ctx.reply('Usage: /f2c 86');await ctx.reply(`${((f-32)*5/9).toFixed(2)} °C`);});
add('kmimiles','Convert km to miles.','UTILITY',async ctx=>{const n=Number(ctx.args?.[0]);if(!Number.isFinite(n))return ctx.reply('Usage: /kmimiles 10');await ctx.reply(`${(n*0.621371).toFixed(3)} mi`);});
add('mileskm','Convert miles to km.','UTILITY',async ctx=>{const n=Number(ctx.args?.[0]);if(!Number.isFinite(n))return ctx.reply('Usage: /mileskm 10');await ctx.reply(`${(n*1.609344).toFixed(3)} km`);});
add('kgilb','Convert kilograms to pounds.','UTILITY',async ctx=>{const n=Number(ctx.args?.[0]);if(!Number.isFinite(n))return ctx.reply('Usage: /kgilb 10');await ctx.reply(`${(n*2.2046226218).toFixed(3)} lb`);});
add('lbitkg','Convert pounds to kilograms.','UTILITY',async ctx=>{const n=Number(ctx.args?.[0]);if(!Number.isFinite(n))return ctx.reply('Usage: /lbitkg 10');await ctx.reply(`${(n/2.2046226218).toFixed(3)} kg`);});
add('cmixin','Convert cm to inches.','UTILITY',async ctx=>{const n=Number(ctx.args?.[0]);if(!Number.isFinite(n))return ctx.reply('Usage: /cmixin 10');await ctx.reply(`${(n/2.54).toFixed(3)} in`);});
add('in2cm','Convert inches to cm.','UTILITY',async ctx=>{const n=Number(ctx.args?.[0]);if(!Number.isFinite(n))return ctx.reply('Usage: /in2cm 10');await ctx.reply(`${(n*2.54).toFixed(3)} cm`);});
add('kbmb','Convert KB to MB.','UTILITY',async ctx=>{const n=Number(ctx.args?.[0]);if(!Number.isFinite(n))return ctx.reply('Usage: /kbmb 1024');await ctx.reply(`${(n/1024).toFixed(2)} MB`);});
add('mbgb','Convert MB to GB.','UTILITY',async ctx=>{const n=Number(ctx.args?.[0]);if(!Number.isFinite(n))return ctx.reply('Usage: /mbgb 1024');await ctx.reply(`${(n/1024).toFixed(2)} GB`);});
add('square','Square a number.','UTILITY',async ctx=>{const n=Number(ctx.args?.[0]);if(!Number.isFinite(n))return ctx.reply('Usage: /square 12');await ctx.reply(String(n*n));});
add('cube','Cube a number.','UTILITY',async ctx=>{const n=Number(ctx.args?.[0]);if(!Number.isFinite(n))return ctx.reply('Usage: /cube 12');await ctx.reply(String(n*n*n));});
add('sqrtx','Square root.','UTILITY',async ctx=>{const n=Number(ctx.args?.[0]);if(!Number.isFinite(n)||n<0)return ctx.reply('Usage: /sqrtx 144');await ctx.reply(String(Math.sqrt(n)));});
add('powerx','Raise a number to a power.','UTILITY',async ctx=>{const [a,b]=ctx.args.map(Number);if(!Number.isFinite(a)||!Number.isFinite(b))return ctx.reply('Usage: /powerx 2 8');await ctx.reply(String(a**b));});
add('logx','Natural logarithm.','UTILITY',async ctx=>{const n=Number(ctx.args?.[0]);if(!Number.isFinite(n)||n<=0)return ctx.reply('Usage: /logx 10');await ctx.reply(String(Math.log(n)));});
add('sinx','Sine in degrees.','UTILITY',async ctx=>{const n=Number(ctx.args?.[0]);if(!Number.isFinite(n))return ctx.reply('Usage: /sinx 90');await ctx.reply(String(Math.sin(n*Math.PI/180)));});
add('cosx','Cosine in degrees.','UTILITY',async ctx=>{const n=Number(ctx.args?.[0]);if(!Number.isFinite(n))return ctx.reply('Usage: /cosx 60');await ctx.reply(String(Math.cos(n*Math.PI/180)));});
add('tanx','Tangent in degrees.','UTILITY',async ctx=>{const n=Number(ctx.args?.[0]);if(!Number.isFinite(n))return ctx.reply('Usage: /tanx 45');await ctx.reply(String(Math.tan(n*Math.PI/180)));});

/* ======================================================================
   EXTRA GAME FLAVORS
====================================================================== */

add('fortunequiz','Luck mini-game.','GAMES',async ctx=>ctx.reply(choice(['🍀 Very lucky!','🍀 Lucky!','😐 Neutral luck.','💀 Unlucky today.'])));
add('luck','Generate a luck percentage.','GAMES',async ctx=>ctx.reply(`🍀 Luck: ${rand(0,100)}%`));
add('reaction','Reaction timer setup.','GAMES',async ctx=>ctx.reply('⚡ Imagine the screen flashes GREEN. Reply /reaction again when ready.'));
add('duel','Challenge another mentioned user in a virtual duel.','GAMES',async ctx=>{if(!ctx.mentions?.length)return ctx.reply('Usage: /duel @user');const target=ctx.mentions[0].split('@')[0];const you=rand(1,100),them=rand(1,100);await ctx.reply(`⚔️ Duel!\nYou: ${you}\n@${target}: ${them}\n${you>them?'🏆 You win!':you<them?'❌ You lose.':'🤝 Draw.'}`);});
add('battle','Random power battle.','GAMES',async ctx=>{const a=rand(1,999),b=rand(1,999);await ctx.reply(`⚔️ You: ${a}\n🤖 Opponent: ${b}\n${a>b?'🏆 Victory!':a<b?'❌ Defeat.':'🤝 Tie.'}`);});
add('treasure','Search for virtual treasure.','GAMES',async ctx=>{const db=readDB(),u=user(db,ctx);const p=Math.random()>0.5?rand(100,1000):0;u.coins+=p;writeDB(db);await ctx.reply(p?`🗺️ Treasure found: +${money(p)}`:'🕳️ Empty chest!');});
add('jackpot','Try a free daily jackpot roll.','GAMES',async ctx=>{const db=readDB(),u=user(db,ctx),left=cooldown(u,'jackpot',24*60*60*1000);if(left)return ctx.reply(`⏳ ${fmtMs(left)}`);setCooldown(u,'jackpot');const hit=Math.random()>0.98,delta=hit?10000:rand(20,200);u.coins+=delta;writeDB(db);await ctx.reply(hit?`💎 JACKPOT! +${money(delta)}`:`🎰 Prize: +${money(delta)}`);});
add('hilo','Free high/low prediction game.','GAMES',async ctx=>{const a=rand(1,13),b=rand(1,13),p=String(ctx.args?.[0]||'').toLowerCase();if(!['high','low'].includes(p))return ctx.reply(`🃏 ${a}\nUsage: /hilo high|low`);await ctx.reply(`🃏 ${a} → ${b}\n${a===b?'🤝 Draw':(p==='high'&&b>a)||(p==='low'&&b<a)?'✅ Correct!':'❌ Wrong.'}`);});
add('limbo','Guess a multiplier above 1.','GAMES',async ctx=>{const p=Number(ctx.args?.[0]);if(!Number.isFinite(p)||p<=1||p>10)return ctx.reply('Usage: /limbo 2.0');const actual=(Math.floor((1+Math.random()*9)*100)/100);await ctx.reply(`📈 Target: ${p}x\nResult: ${actual}x\n${actual>=p?'✅ Cleared!':'❌ Failed.'}`);});
add('plinko','Virtual Plinko.','GAMES',async ctx=>{const slots=[0,25,50,100,200,500];await ctx.reply(`🟣 Plinko result: ${money(choice(slots))}`);});
add('memoryflip','Memory mini-game prompt.','GAMES',async ctx=>{const n=rand(100,999);await ctx.reply(`🧠 Remember: *${n}*\nThen use /memoryflip ${n}`);});
add('colorpick','Pick a random color.','GAMES',async ctx=>ctx.reply(`🎨 ${choice(['Red','Blue','Green','Purple','Orange','Pink','Cyan'])}`));
add('wordchain','Start a word chain.','GAMES',async ctx=>{const w=String(ctx.args?.[0]||'');if(!w)return ctx.reply('Usage: /wordchain apple');await ctx.reply(`🔗 Next word should start with: *${w.slice(-1).toUpperCase()}*`);});
add('scramblex','Scramble your own text.','GAMES',async ctx=>{const s=argsText(ctx);if(!s)return ctx.reply('Usage: /scramblex crystal');await ctx.reply(s.split('').sort(()=>Math.random()-0.5).join(''));});
add('guesscolor','Guess a color.','GAMES',async ctx=>{const colors=['red','blue','green','yellow'];const c=choice(colors);const x=String(ctx.args?.[0]||'').toLowerCase();if(!x)return ctx.reply(`🎨 Guess: red|blue|green|yellow`);await ctx.reply(x===c?`✅ It was ${c}!`:`❌ It was ${c}.`);});

/* ======================================================================
   GENERIC SOCIAL / QUALITY
====================================================================== */

add('afkcheck','Check whether you are AFK (fun).','SOCIAL',async ctx=>ctx.reply('👀 You are definitely here because you just used a command.'));
add('support','Show simple support guidance.','SOCIAL',async ctx=>ctx.reply('🛠️ Crystal Bot Support\n\nCheck the console for errors, verify dependencies, and test /ping.'));
add('rules','Show generic Crystal Bot rules.','SOCIAL',async ctx=>ctx.reply('📜 Be respectful. No spam. No harassment. Use commands responsibly.'));
add('helpme','Quick help starter.','SOCIAL',async ctx=>ctx.reply('💎 Try /menu, /commands, /categories, /play, /games, /wealth or /profile.'));
add('hello','Say hello.', 'SOCIAL', async ctx=>ctx.reply(`Hello 👋 ${pickLabel(ctx)}`), ['hi','hey']);
add('goodnightx','Send a good-night message.', 'SOCIAL', async ctx=>ctx.reply('🌙 Good night. Sleep well and keep building tomorrow.'));
add('gm','Good morning.', 'SOCIAL', async ctx=>ctx.reply('☀️ Good morning, legend.'));
add('gn','Good night.', 'SOCIAL', async ctx=>ctx.reply('🌙 Good night, Crystal user.'));
add('thankx','Reply to thanks.', 'SOCIAL', async ctx=>ctx.reply('💎 Anytime!'));
add('congrats','Send a congratulations message.', 'SOCIAL', async ctx=>ctx.reply('🎉 Congratulations! Keep going!'));
add('celebrate','Celebrate a win.', 'SOCIAL', async ctx=>ctx.reply('🥳🎉💎 WE MOVE!'));
add('goodluck','Wish good luck.', 'SOCIAL', async ctx=>ctx.reply('🍀 Good luck! You got this.'));
add('motivate','Quick motivation.', 'SOCIAL', async ctx=>ctx.reply(`🔥 ${choice(quotes)}`));
add('focus','Quick focus message.', 'SOCIAL', async ctx=>ctx.reply('🎯 One task. One step. Finish it.'));
add('lockin','Lock-in message.', 'SOCIAL', async ctx=>ctx.reply('🔒 LOCKED IN. No distractions.'));

module.exports = commands;
'''

# Fix accidental Python/raw-string escaped quote at first line only.
text = text.replace("\\'use strict\\';", "'use strict';", 1)
out.write_text(text, encoding='utf-8')
print('Wrote', out, 'commands:', text.count("add('") )
