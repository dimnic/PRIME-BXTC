# Prime Bot Mega Upgrade

## What changed

- Patched `core/sock.js` so the existing `core/Plugins/` tree still has priority,
  while the existing `commands/` directory is also loaded recursively.
- Added `core/Plugins/mega.js` with 200+ additional self-contained commands.
- Added persistent virtual Prime Coins / XP data in `data/PRIME-mega.json`.
- Added additional utility, encoding, fun, games, casino, economy, profile,
  social, and group-information commands.
- No new npm dependency is required by the mega command pack.

## Important

`node_modules/`, `.git/`, `.env`, authentication/session runtime state, and
database runtime files are intentionally excluded from the distribution ZIP.
Run `npm install --legacy-peer-deps` after extracting on a new machine/server.

The command pack uses virtual Prime Coins only; they have no cash value.

## Main files

- `core/sock.js`
- `core/Plugins/mega.js`
- `COMMAND-CATALOG.md`

## Unified economy store (this build)

- **Single file:** `data/users.json`
- Casino plugin, `commands/casino/*`, and mega economy/casino commands all read/write this file.
- Edit balances in VS Code: see `data/EDIT-USERS.md`.
- Helper module: `core/user-store.js` (`getBalance`, `setBalance`, `getUser`, `readDB`, `writeDB`).
