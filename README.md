# 💎 Prime Bot 2.1.0

This is an expanded version of the supplied Prime Bot project. The original `cmds/`, `core/`, config, and package files are preserved. A separate `commands/` system has been added so new commands are isolated one file per command.

## Start

```powershell
npm install --legacy-peer-deps
npm start
```

The first run displays a QR in the terminal. On the client's phone:
WhatsApp → Settings → Linked Devices → Link a Device → scan the QR.

The `core/auth_info` directory is intentionally empty in this distribution. Your live WhatsApp credentials are never bundled.

## Command layout

```text
commands/
├── general/
├── ai/
├── media/
├── downloader/
├── utilities/
├── group/
├── protection/
├── games/
├── casino/
└── freefire/
```

Each file exports one command. `core/command-loader.js` loads them automatically, and `core/sock.js` dispatches messages to the matching command.

## Commands

General:
`/help /ping /alive /owner /about /runtime /speed /repo /botinfo /hello`

AI:
`/ai /ask /chat /imagine /summarize`

Media:
`/sticker /toimg /tovideo /tourl /ss /removebg /enhance /caption`

Downloader:
`/play /song /ytmp3 /ytmp4 /ytsearch /tiktok /instagram /facebook /twitter /mediafire`

Utilities:
`/weather /translate /define /wiki /calc /time /country /shortlink /qr`

Group:
`/kick /add /promote /demote /mute /unmute /ban /unban /warn /unwarn /warnings /tagall /hidetag /admins /groupinfo /setname /setdesc /link /revoke`

Protection:
`/antilink /antispam /antitag /antibot /welcome /goodbye /setwelcome /setgoodbye /mutechat`

Games:
`/coinflip /dice /slots /roulette /rps /guess /trivia /quiz /8ball /tictactoe /hangman /scramble /mathgame /daily`

Casino:
`/balance /daily /gamble /leaderboard /casino`

Free Fire:
`/ffsens /ffsensitivity /ffdpi /ffhud /ffdevice /ffheadshot /ffsettings`

## External services

Some commands intentionally require a provider/API rather than pretending to download or generate something:
- `/ai`, `/ask`, `/chat`, `/summarize`: set `OPENAI_API_KEY` and optionally `OPENAI_MODEL`.
- `/play`, `/song`, `/ytmp3`, `/ytmp4`: search works through `yt-search`; actual media downloading needs a downloader such as yt-dlp configured on the server.
- `/tiktok`, `/instagram`, `/facebook`, `/twitter`, `/mediafire`: require a suitable external downloader/provider.
- `/removebg`, `/enhance`, `/ss`, `/imagine`: require their respective external providers.

## Testing your own messages

The new command handler deliberately allows `fromMe` command messages. That means you can send `/ping` from the bot account itself and receive a response. Replies are ordinary text and do not start with a command, so they do not loop.

## Security

Do not share `core/auth_info/creds.json` or the other auth files. They represent the WhatsApp session.
