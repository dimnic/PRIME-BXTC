const fs = require('fs');
const path = require('path');

const commands = new Map();
const aliases = new Map();

function loadCommands(root) {
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.js') && !entry.name.startsWith('_')) files.push(full);
    }
  }
  walk(root);
  for (const file of files) {
    try {
      delete require.cache[require.resolve(file)];
      const mod = require(file);
      if (!mod || !mod.name || typeof mod.execute !== 'function') continue;
      const cmd = { ...mod, name: mod.name.toLowerCase(), aliases: (mod.aliases || []).map(x=>String(x).toLowerCase()) };
      commands.set(cmd.name, cmd);
      for (const a of cmd.aliases) aliases.set(a, cmd.name);
    } catch (e) {
      console.error('Failed to load command:', file, e.message);
    }
  }
  return { commands, aliases };
}

function getCommand(name) {
  const key = String(name || '').toLowerCase();
  return commands.get(key) || commands.get(aliases.get(key));
}

function listCommands() { return [...commands.values()]; }

module.exports = { loadCommands, getCommand, listCommands };
