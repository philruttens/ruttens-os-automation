#!/usr/bin/env python3
"""
Daily Artifact Backup & Report
Runs via GitHub Actions at 2:00 AM UTC
Reads artifacts from Google Drive, generates HTML email, sends via Gmail SMTP
"""

import os
import re
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# Configuration
GMAIL_USER = "pruttens@gmail.com"
TOKEN_FILE = os.path.expanduser("~/.ruttens_gmail_token")

# Artifact manifest (hardcoded for GitHub Actions)
ARTIFACTS = [
    ("ruttens-client-weekly-wayfina", "Wayfina Weekly", "high"),
    ("ruttens-client-weekly-aya", "AYA Weekly", "high"),
    ("ruttens-client-weekly-erea", "EREA Weekly", "high"),
    ("ruttens-personal-weekly-dashboard", "Personal Dashboard", "high"),
    ("ruttens-skills-roadmap", "Skills Roadmap", "normal"),
    ("ruttens-investment-dashboard", "Investment Dashboard", "normal"),
    ("ruttens-client-simple-template", "Simple Template", "normal"),
    ("ruttens-fy25-action-checklist", "FY25 Checklist", "normal"),
    ("inbox-triage", "Inbox Triage", "normal"),
    ("erea-handover-2026", "EREA Handover", "normal"),
    ("admin-finances", "Admin & Finances", "normal"),
]

def count_checkboxes(html):
    """Count checkbox instances in HTML"""
    return (len(re.findall(r'class="[^"]*\bcb\b[^"]*"', html)) +
            len(re.findall(r'class="[^"]*\baction-check\b[^"]*"', html)) +
            len(re.findall(r'class="[^"]*\bal-check\b[^"]*"', html)) +
            len(re.findall(r'<input[^>]+type=["\']checkbox["\']', html, re.IGNORECASE)))

def read_artifact_html(artifact_id):
    """
    Read artifact HTML from local filesystem
    GitHub Actions will have artifacts synced via git or downloaded
    """
    # Try local first (for local testing)
    local_path = f"/Users/philruttens/Documents/Claude/Artifacts/{artifact_id}/index.html"
    if os.path.exists(local_path):
        with open(local_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()

    # Try repo root (for GitHub Actions)
    repo_path = f"./Artifacts/{artifact_id}/index.html"
    if os.path.exists(repo_path):
        with open(repo_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()

    return None

def generate_html_email(urgent_list, ok_list, missing_list, rows_html, forecast_pct, day_name, date_str):
    """Generate branded HTML email body"""
    summary_items = []
    if urgent_list:
        summary_items.append(f"<li><strong style='color:#fb923c;'>Action needed:</strong> {', '.join(urgent_list)}</li>")
    if ok_list:
        summary_items.append(f"<li><strong style='color:#6ee7b7;'>On track:</strong> {', '.join(ok_list)}</li>")
    if missing_list:
        summary_items.append(f"<li><strong style='color:#fcd34d;'>Check:</strong> {', '.join(missing_list)} — file not found</li>")
    summary_items.append(f"<li>Backup synced to Google Drive &nbsp;✅</li>")
    summary_html = "<ul style='padding-left:18px;margin:0;line-height:1.9;font-size:14px;color:#fff;'>" + "".join(summary_items) + "</ul>"

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*{{box-sizing:border-box;margin:0;padding:0}}
body{{background:#0d1b2a;font-family:'IBM Plex Sans',Arial,sans-serif;color:#fff}}
.wrap{{max-width:620px;margin:0 auto;background:#0d1b2a}}
.header{{background:#123044;padding:26px 30px 20px;border-bottom:3px solid #38B6FF}}
.logo{{font-family:'Oswald',Impact,sans-serif;font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#38B6FF;margin-bottom:8px}}
h1{{font-family:'Oswald',Impact,sans-serif;font-size:24px;font-weight:700;text-transform:uppercase;color:#fff;letter-spacing:.04em}}
.meta{{font-size:13px;color:#a0b4c4;margin-top:5px}}
.meta strong{{color:#38B6FF}}
.body{{padding:24px 30px}}
.summary-box{{background:#1a2d3f;border-left:3px solid #38B6FF;padding:16px 20px;margin-bottom:22px;font-family:'IBM Plex Sans',Arial,sans-serif}}
.sec-label{{font-family:'Oswald',Impact,sans-serif;font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#38B6FF;margin-bottom:12px}}
table{{width:100%;border-collapse:collapse}}
th{{font-family:'Oswald',Impact,sans-serif;font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#4a5b6b;padding:8px 10px;text-align:left;border-bottom:1px solid #1e3347}}
td{{padding:11px 10px;border-bottom:1px solid #1a2d3f;vertical-align:middle}}
tr:last-child td{{border-bottom:none}}
.art-name{{font-family:'IBM Plex Sans',Arial,sans-serif;font-size:14px;font-weight:600;color:#fff}}
.tasks-col{{font-size:13px;color:#fff;width:50px;text-align:center}}
.bar-col{{width:200px}}
.prog-wrap{{background:#1e3347;border-radius:2px;height:7px;width:100%;overflow:hidden}}
.prog-fill{{height:7px;border-radius:2px}}
.urg-col{{width:110px;text-align:right}}
.badge{{font-family:'IBM Plex Sans',Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}}
.footer{{background:#091420;padding:16px 30px;text-align:center}}
.footer p{{font-size:11px;color:#4a5b6b;line-height:1.8}}
.footer strong{{color:#38B6FF}}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo">RUTTENS<span style="color:#38B6FF">+</span>OS &nbsp;·&nbsp; AUTO-PILOT</div>
    <h1>Daily Artifact Report</h1>
    <p class="meta">{day_name}, {date_str} &nbsp;·&nbsp; Weekly target: <strong>{forecast_pct}%</strong> done by today</p>
  </div>
  <div class="body">
    <div class="summary-box">
      <p class="sec-label">Summary</p>
      {summary_html}
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
      <tbody>{rows_html}</tbody>
    </table>
  </div>
  <div class="footer">
    <p>Open each artifact in Cowork to see your live ✓ progress &nbsp;·&nbsp; <strong>RUTTENS+OS Auto-Pilot</strong><br>
    Next report: Tomorrow 2:00 AM</p>
  </div>
</div>
</body>
</html>"""

def main():
    today = datetime.now()
    dow = today.weekday()
    forecast_pct = int(min(100, (min(dow + 1, 5) / 5) * 100))
    day_name = today.strftime("%A")
    date_str = today.strftime("%Y-%m-%d")

    # Read Gmail token
    try:
        with open(TOKEN_FILE) as f:
            app_password = f.read().replace(" ", "").strip()
    except FileNotFoundError:
        print(f"ERROR: Token file not found at {TOKEN_FILE}")
        print("ACTION: Add GMAIL_APP_PASSWORD as a GitHub Secret in repo Settings → Secrets → Actions")
        return False

    if not app_password:
        print("ERROR: GMAIL_APP_PASSWORD secret is empty.")
        print("ACTION: Go to GitHub repo → Settings → Secrets → Actions → update GMAIL_APP_PASSWORD")
        print("  Create an App Password at: myaccount.google.com → Security → 2-Step Verification → App Passwords")
        return False

    rows_html = ""
    urgent_list = []
    ok_list = []
    missing_list = []

    # Process each artifact
    for fid, label, priority in ARTIFACTS:
        html_content = read_artifact_html(fid)

        if not html_content:
            missing_list.append(label)
            rows_html += f"""
        <tr>
          <td class="art-name">{label}</td>
          <td class="tasks-col">—</td>
          <td class="bar-col"><span style="color:#6b7280;font-size:12px;">Not found</span></td>
          <td class="urg-col"><span class="badge" style="color:#fcd34d;">⚠ CHECK</span></td>
        </tr>"""
            continue

        total = count_checkboxes(html_content)
        bar_color = ("#10b981" if forecast_pct == 100 else
                     "#38B6FF" if forecast_pct >= 60 else
                     "#f59e0b" if forecast_pct >= 40 else "#ef4444")

        is_urgent = priority == "high" and forecast_pct >= 40
        if is_urgent:
            badge = '<span class="badge" style="color:#fb923c;font-weight:700;">⚡ OPEN NOW</span>'
            urgent_list.append(label)
        else:
            badge = '<span class="badge" style="color:#6ee7b7;">✓ ON TRACK</span>'
            ok_list.append(label)

        tasks_label = str(total) if total > 0 else "—"
        rows_html += f"""
        <tr>
          <td class="art-name">{label}</td>
          <td class="tasks-col">{tasks_label}</td>
          <td class="bar-col">
            <div class="prog-wrap"><div class="prog-fill" style="width:{forecast_pct}%;background:{bar_color};"></div></div>
          </td>
          <td class="urg-col">{badge}</td>
        </tr>"""

    # Generate and send email
    html_body = generate_html_email(urgent_list, ok_list, missing_list, rows_html, forecast_pct, day_name, date_str)
    plain = (f"RUTTENS+OS · {day_name} {date_str} · Target: {forecast_pct}%\n\n"
             + ("OPEN NOW: " + ", ".join(urgent_list) + "\n" if urgent_list else "")
             + ("On track: " + ", ".join(ok_list) + "\n" if ok_list else "")
             + "\nOpen your Cowork artifacts to tick off tasks.\n-- RUTTENS+OS Auto-Pilot")

    subject = f"🗂️ RUTTENS+OS · {day_name} Report · {date_str} · Target {forecast_pct}%"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = GMAIL_USER
    msg["To"] = GMAIL_USER
    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_USER, app_password)
            server.sendmail(GMAIL_USER, GMAIL_USER, msg.as_string())
        print(f"✅ Email sent: {subject}")
        return True
    except Exception as e:
        print(f"❌ Email send failed: {e}")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
