# PRIME BOT Website

Static HTML/CSS/JavaScript landing page for PRIME BOT.

## Local preview

Run from this folder:

```bash
python -m http.server 8000
```

Open http://localhost:8000

## GitHub

Copy this entire folder to your repository as `website/`, then:

```bash
git add website
git commit -m "Add PRIME BOT website"
git push origin main
```

## Render

Create a **Static Site** and point it at your repository. Set the **Publish Directory** to `website` when this site is inside the bot repository. Leave the build command blank.

## GitHub Pages

In repository Settings → Pages, choose a branch/folder that contains the site. For a site inside `website/`, Render is the simplest option unless you configure a Pages workflow to publish that folder.

## Security

Do not place WhatsApp auth/session files, `.env`, API keys, passwords, private user data or database files in the public website repository.
