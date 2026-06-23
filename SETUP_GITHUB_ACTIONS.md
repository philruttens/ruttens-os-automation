# GitHub Actions Setup — Daily Artifact Backup

## Overview
Automated daily artifact backup + HTML email report, running at **2:00 AM daily** via GitHub Actions.

**Files created:**
- `.github/workflows/daily-artifact-backup.yml` — Workflow definition
- `scripts/daily_artifact_backup.py` — Main backup + email script

---

## Setup Steps

### 1. Create GitHub Repository

```bash
# Initialize git (already done)
cd "/Users/philruttens/Library/CloudStorage/GoogleDrive-pruttens@gmail.com/My Drive/RUTTENS+OS"

# Add files to git
git add .github/workflows/daily-artifact-backup.yml scripts/daily_artifact_backup.py SETUP_GITHUB_ACTIONS.md

# Create initial commit
git commit -m "🤖 Add GitHub Actions daily artifact backup workflow"

# Create repo on GitHub (visit https://github.com/new)
# Repo name: ruttens-os-automation
# Description: RUTTENS+OS daily backup & reporting

# Add remote (replace USERNAME with your GitHub username)
git remote add origin https://github.com/USERNAME/ruttens-os-automation.git
git branch -M main
git push -u origin main
```

### 2. Set GitHub Secrets

1. Go to: `https://github.com/USERNAME/ruttens-os-automation/settings/secrets/actions`
2. Click **New repository secret**
3. Add secret: `GMAIL_APP_PASSWORD`
   - Value: Your Gmail App Password (from `~/.ruttens_gmail_token`)
   - ⚠️ **Do NOT use your regular Google password** — use the 16-char App Password

### 3. Adjust Timezone

The workflow runs at **00:00 UTC** (= **02:00 CEST** in summer, **01:00 CET** in winter).

To change the time, edit `.github/workflows/daily-artifact-backup.yml`:

```yaml
on:
  schedule:
    - cron: '00 00 * * *'  # Change this
```

**Common timezones (cron format):**
- 02:00 CEST: `cron: '00 00 * * *'` (current)
- 02:00 CET: `cron: '01 00 * * *'`
- 08:00 UTC: `cron: '00 08 * * *'`

[Cron expression generator](https://crontab.guru/)

### 4. Prepare Artifacts

The workflow reads artifacts from two locations:

**Local (for manual testing):**
```
/Users/philruttens/Documents/Claude/Artifacts/
```

**GitHub Actions (cloud):**
The script will look for artifacts in the repo root. To enable this:

**Option A: Git LFS (Large File Storage)** — Recommended for binary/large files
```bash
git lfs install
git lfs track "Artifacts/**/*.html"
git add .gitattributes
git commit -m "Add LFS tracking for artifacts"
git push
```

**Option B: Store only index.html files** — Lightweight
- Copy only `Artifacts/*/index.html` to the repo
- Ignore other artifact files

**Option C: Skip artifact sync** — Use manual GitHub Actions dispatch
- Run workflow manually via GitHub UI
- Manually sync artifacts as needed

---

## Testing

### Manual Run (GitHub UI)

1. Go to: `https://github.com/USERNAME/ruttens-os-automation/actions`
2. Select workflow: **Daily Artifact Backup & Report**
3. Click **Run workflow** → **Run workflow**
4. Check your email for the report

### View Logs

1. Go to: **Actions** tab
2. Select the latest workflow run
3. Click **backup-and-report** job to see logs
4. Check for `✅ Email sent:` message

### Local Test

```bash
cd "/Users/philruttens/Library/CloudStorage/GoogleDrive-pruttens@gmail.com/My Drive/RUTTENS+OS"

# Create token
mkdir -p ~/.config
echo "YOUR_16_CHAR_APP_PASSWORD" > ~/.ruttens_gmail_token

# Run script
python3 scripts/daily_artifact_backup.py
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Email not sent | Check GitHub Secret `GMAIL_APP_PASSWORD` is set correctly |
| Artifacts not found | Ensure `Artifacts/*/index.html` are in repo root or use LFS |
| Wrong time | Edit cron expression in `.github/workflows/daily-artifact-backup.yml` |
| Auth failed | Regenerate Gmail App Password in Google Account Settings |

---

## Next: Make.com Workflow (S14)

After GitHub Actions is working, we'll build the full Make.com scenario for:
- Reading artifacts from Google Drive API
- Using Make's native modules for email
- Logging to Google Sheets
- Advanced scheduling + monitoring

---

## References

- [GitHub Actions Cron](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
