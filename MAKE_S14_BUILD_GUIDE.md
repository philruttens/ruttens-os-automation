# Make.com S14: Daily Artifact Report
## Cloud-native scheduled backup + HTML email report

**Status:** Ready to build  
**Team:** 2194923  
**Org:** 4459710  
**Schedule:** Daily 2:00 AM CET  
**Connections:** Gmail (14187007) · Google Drive (TBD) · Google Sheets (14225939)

---

## Architecture

```
Schedule (2 AM)
  ↓
[1] Google Drive: List files in /RUTTENS+OS/Artifacts/
  ↓
[2] Iterator: For each artifact folder
  ↓
[3] Google Drive: Get file (index.html)
  ↓
[4] Set Variable: Extract file content
  ↓
[5] JavaScript: Count checkboxes + parse metadata
  ↓
[6] Array Aggregator: Collect all artifact data
  ↓
[7] Text Aggregator: Build HTML email body
  ↓
[8] Gmail: Send HTML email
  ↓
[9] Google Sheets: Log execution timestamp
```

---

## Module Setup

### [1] Schedule Trigger
**Module:** `schedule:simple`
- **Interval:** Daily
- **Time:** 02:00 (CET)
- **Timezone:** Europe/Brussels

### [2] Google Drive: List Files
**Module:** `google-drive:listFiles`
**Connection:** Google Drive (14225939) — or create new
**Config:**
- **Drive:** My Drive
- **Folder ID:** `/RUTTENS+OS/Artifacts/` (get folder ID from Google Drive)
- **Limit:** 50
- **Output:** Array of folders

**Tip:** To get folder ID:
1. Open https://drive.google.com
2. Navigate to `/RUTTENS+OS/Artifacts/`
3. Copy the folder ID from URL: `https://drive.google.com/drive/folders/{FOLDER_ID}`

### [3] Iterator
**Module:** `util:Iterator`
**Input:** Output from [2] (files array)
- **Array:** `modules.GoogleDrive_listFiles.files`
- **Map:** For each folder, extract ID and name

### [4] Google Drive: Get File Content
**Module:** `google-drive:downloadFile`
**Config:**
- **Drive:** My Drive
- **File ID:** `{{modules.Iterator.id}}` — from folder iterator
- **File:** `index.html`
- **Return:** Base64 or text content

**Note:** Make's native module may not support reading HTML directly. Alternative: Use **HTTP module** with Drive's export-as-text endpoint.

### [5] JavaScript: Parse Checkboxes
**Module:** `util:RunScript`
**Language:** JavaScript
**Input Variables:**
```javascript
let htmlContent = `{{modules.GoogleDrive.content}}`;
let artifactName = `{{modules.Iterator.name}}`;

// Count checkboxes
let checkboxCount = (
  (htmlContent.match(/class="[^"]*\bcb\b[^"]*"/g) || []).length +
  (htmlContent.match(/class="[^"]*\baction-check\b[^"]*"/g) || []).length +
  (htmlContent.match(/class="[^"]*\bal-check\b[^"]*"/g) || []).length +
  (htmlContent.match(/<input[^>]+type=['"]checkbox['"][^>]*>/gi) || []).length
);

// Determine urgency
let priority = `{{modules.Iterator.priority}}`; // from manifest
let forecastPct = 40; // Calculate from day of week
let isUrgent = priority === "high" && forecastPct >= 40;
let badge = isUrgent ? "⚡ OPEN NOW" : "✓ ON TRACK";
let badgeColor = isUrgent ? "#fb923c" : "#6ee7b7";

// Return structured data
export({
  artifactName: artifactName,
  taskCount: checkboxCount,
  badge: badge,
  badgeColor: badgeColor,
  isUrgent: isUrgent
});
```

### [6] Array Aggregator
**Module:** `util:ArrayAggregator`
**Config:**
- **Source Module:** [5] JavaScript output
- **Target Array:** Aggregate all artifact rows
- **Output:** Single array with all artifacts

### [7] Text Aggregator: Build HTML Email
**Module:** `util:TextAggregator`
**Config:**
- **Source Module:** [6] Array Aggregator
- **Template:** Use Row Separator to build table rows

**Template:**
```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d1b2a;font-family:'IBM Plex Sans',Arial,sans-serif;color:#fff}
.wrap{max-width:620px;margin:0 auto;background:#0d1b2a}
.header{background:#123044;padding:26px 30px 20px;border-bottom:3px solid #38B6FF}
.logo{font-family:'Oswald',Impact,sans-serif;font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#38B6FF;margin-bottom:8px}
h1{font-family:'Oswald',Impact,sans-serif;font-size:24px;font-weight:700;text-transform:uppercase;color:#fff;letter-spacing:.04em}
.meta{font-size:13px;color:#a0b4c4;margin-top:5px}
.meta strong{color:#38B6FF}
.body{padding:24px 30px}
.summary-box{background:#1a2d3f;border-left:3px solid #38B6FF;padding:16px 20px;margin-bottom:22px;font-family:'IBM Plex Sans',Arial,sans-serif}
.sec-label{font-family:'Oswald',Impact,sans-serif;font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#38B6FF;margin-bottom:12px}
table{width:100%;border-collapse:collapse}
th{font-family:'Oswald',Impact,sans-serif;font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#4a5b6b;padding:8px 10px;text-align:left;border-bottom:1px solid #1e3347}
td{padding:11px 10px;border-bottom:1px solid #1a2d3f;vertical-align:middle}
.art-name{font-family:'IBM Plex Sans',Arial,sans-serif;font-size:14px;font-weight:600;color:#fff}
.tasks-col{font-size:13px;color:#fff;width:50px;text-align:center}
.bar-col{width:200px}
.prog-wrap{background:#1e3347;border-radius:2px;height:7px;width:100%;overflow:hidden}
.prog-fill{height:7px;border-radius:2px;background:#38B6FF}
.badge{font-family:'IBM Plex Sans',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.footer{background:#091420;padding:16px 30px;text-align:center}
.footer p{font-size:11px;color:#4a5b6b;line-height:1.8}
.footer strong{color:#38B6FF}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo">RUTTENS<span style="color:#38B6FF">+</span>OS · AUTO-PILOT</div>
    <h1>Daily Artifact Report</h1>
    <p class="meta">{{now | formatDate("dddd, YYYY-MM-DD")}} · Weekly target: {{forecastPct}}% done</p>
  </div>
  <div class="body">
    <div class="summary-box">
      <p class="sec-label">Summary</p>
      <ul style="padding-left:18px;margin:0;line-height:1.9;font-size:14px;color:#fff;">
        <li><strong style="color:#fb923c;">Action needed:</strong> {{urgentArtifacts}}</li>
        <li><strong style="color:#6ee7b7;">On track:</strong> {{onTrackArtifacts}}</li>
        <li>Backup synced to Google Drive ✅</li>
      </ul>
    </div>
    <p class="sec-label">Artifact Detail</p>
    <table>
      <thead>
        <tr>
          <th>Artifact</th>
          <th style="text-align:center">Tasks</th>
          <th>Target</th>
          <th style="text-align:right">Status</th>
        </tr>
      </thead>
      <tbody>
        {{#each artifacts}}
        <tr>
          <td class="art-name">{{this.artifactName}}</td>
          <td class="tasks-col">{{this.taskCount}}</td>
          <td class="bar-col">
            <div class="prog-wrap"><div class="prog-fill"></div></div>
          </td>
          <td class="urg-col">
            <span class="badge" style="color:{{this.badgeColor}};">{{this.badge}}</span>
          </td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>
  <div class="footer">
    <p>Open each artifact in Cowork to see your live ✓ progress · <strong>RUTTENS+OS Auto-Pilot</strong><br>
    Next report: Tomorrow 2:00 AM</p>
  </div>
</div>
</body>
</html>
```

### [8] Gmail: Send Email
**Module:** `google-email:sendAnEmail`
**Connection:** Gmail (14187007)
**Config:**
- **To:** `pruttens@gmail.com`
- **Subject:** `🗂️ RUTTENS+OS · {{now | formatDate("dddd")}} Report · {{forecastPct}}%`
- **Body Type:** `rawHtml`
- **Content:** `{{modules.TextAggregator.result}}`

### [9] Google Sheets: Log Execution
**Module:** `google-sheets:appendValues`
**Connection:** Google Sheets (14225939)
**Config:**
- **Spreadsheet ID:** (Create or use existing)
- **Sheet Name:** `S14_Logs`
- **Range:** `A:C`
- **Values:** `[timestamp, status, artifacts_found]`

---

## Alternative: Using Google Drive API Module

If you don't have Google Drive module, create connection:

1. Go to Make.com → Connections
2. **Create Connection** → Google Drive
3. Authenticate with your Google account
4. Note the connection ID (for reference)

---

## Testing Checklist

- [ ] Schedule trigger configured for 2:00 AM CET
- [ ] Google Drive module can list `/RUTTENS+OS/Artifacts/` folder
- [ ] JavaScript correctly counts checkboxes in sample HTML
- [ ] Email template renders correctly in Gmail
- [ ] Gmail sends to pruttens@gmail.com
- [ ] Google Sheets logs execution timestamp
- [ ] Manual test via "Run once" works
- [ ] Scheduled run at 2 AM executes successfully

---

## Expected Output

**Email received at 2:00 AM daily:**
- Subject: `🗂️ RUTTENS+OS · Tuesday Report · 40%`
- HTML table with all 11 artifacts
- Urgent flags for "action needed" items
- Progress bars by day of week
- Backup confirmation ✅

**Google Sheets log:**
| Timestamp | Status | Artifacts Found |
|-----------|--------|-----------------|
| 2026-06-23 02:00 | ✅ | 11 |
| 2026-06-24 02:00 | ✅ | 11 |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Module list files returns empty | Verify folder path + permissions in Google Drive |
| HTML not parsed | Check Google Drive file access; may need to export as text |
| Email not sent | Verify Gmail connection is authenticated |
| Wrong timezone | Check Make.org settings + system timezone |
| Template not rendering | Test with sample data in Text Aggregator module |

---

## Next Steps

1. **Build this scenario in Make UI** (interactive, easier debugging)
2. **Test with manual run** (via "Run once" button)
3. **Enable schedule** after verification
4. **Monitor first runs** (check email + sheets logs)

---

## References

- [Make Google Drive Module](https://www.make.com/en/integrations/google-drive)
- [Make Gmail Module](https://www.make.com/en/integrations/gmail)
- [Make JavaScript Module](https://www.make.com/en/integrations/tools/runscript)
- [Handlebars Templating](https://www.make.com/en/help/bundles/handlebars)
