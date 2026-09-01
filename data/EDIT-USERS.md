# PRIME BOT — Editing Users in VS Code

All economy, casino, profile, company, XP and game data is stored in:

`data/users.json`

Each user key is the WhatsApp phone number without `@s.whatsapp.net`.

Example:

```json
{
  "users": {
    "2347052042544": {
      "coins": 10000,
      "bank": 5000,
      "xp": 250,
      "level": 4,
      "profile": {
        "created": true,
        "name": "Prime Player",
        "bio": "Building something great.",
        "maritalStatus": "single"
      },
      "company": {
        "created": true,
        "name": "Prime Labs",
        "industry": "Technology",
        "level": 3,
        "hourlyIncome": 562
      }
    }
  }
}
```

Because PRIME BOT reloads the file on every database read, you can save the file in VS Code and the new values will be picked up by the next economy command.

Recommended profile flow:

`/createprofile Your Name`

`/editprofile bio Your bio`

`/editprofile status married`

`/createcompany Company Name | Technology`

`/claimcompany`

`/upgradecompany`

Owner controls:

`/userdata @user`

`/setbalance @user 100000`

`/addbalance @user 5000`

`/deductbalance @user 1000`

`/setbank @user 50000`

`/setxp @user 500`

`/setlevel @user 10`

`/resetuser @user`

Virtual Prime Coins have no cash value.
