const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function ensureJson(file, fallback = {}) {
  const p = path.join(DATA_DIR, file);
  if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(fallback, null, 2));
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}
function saveJson(file, data) {
  fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
}
function jidNumber(jid='') { return String(jid).split('@')[0].split(':')[0]; }
function mention(jid) { return '@' + jidNumber(jid); }
function argsText(args) { return (args || []).join(' ').trim(); }
function pickTarget(ctx) {
  if (ctx.message?.key?.participant) return ctx.message.key.participant;
  if (ctx.message?.key?.remoteJid && !ctx.message.key.remoteJid.endsWith('@g.us')) return ctx.message.key.remoteJid;
  const m = ctx.message?.message?.extendedTextMessage?.contextInfo?.mentionedJid;
  if (m?.length) return m[0];
  return null;
}
function mentionsFrom(ctx) {
  return ctx.message?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
}
async function isGroupAdmin(sock, jid, user) {
  if (!jid?.endsWith('@g.us')) return false;
  const md = await sock.groupMetadata(jid);
  const p = md.participants.find(x => x.id === user);
  return !!p && (p.admin === 'admin' || p.admin === 'superadmin');
}
async function isBotAdmin(sock, jid) {
  const md = await sock.groupMetadata(jid);
  const me = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
  const p = md.participants.find(x => x.id === me || x.id?.split(':')[0] === sock.user?.id?.split(':')[0]);
  return !!p && (p.admin === 'admin' || p.admin === 'superadmin');
}
async function requireGroup(ctx) {
  if (!ctx.jid.endsWith('@g.us')) throw new Error('This command only works in a group.');
}
async function requireAdmin(ctx) {
  await requireGroup(ctx);
  if (!(await isGroupAdmin(ctx.sock, ctx.jid, ctx.sender))) throw new Error('❌ Admins only.');
  if (!(await isBotAdmin(ctx.sock, ctx.jid))) throw new Error('❌ I need to be a group admin for this command.');
}
function randomInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function formatDuration(ms){
  let s=Math.floor(ms/1000), d=Math.floor(s/86400); s%=86400;
  let h=Math.floor(s/3600); s%=3600; let m=Math.floor(s/60); s%=60;
  return `${d}d ${h}h ${m}m ${s}s`;
}
function getText(ctx){ return String(ctx.text || '').trim(); }

module.exports = {
  DATA_DIR, ensureJson, saveJson, jidNumber, mention, argsText, pickTarget,
  mentionsFrom, isGroupAdmin, isBotAdmin, requireGroup, requireAdmin,
  randomInt, formatDuration, getText
};
