# LinkedIn Influencer Automation — Deployment Checklist

**Date Created:** 2026-06-24  
**Status:** Ready to Deploy  
**Effort:** 20 minutes to activate Phase 1  
**Estimated Time to Full Automation:** 1 hour Phase 1 + 30 min Phase 2

---

## 📦 Deliverables Summary

You now have:

| File | Purpose | Location |
|------|---------|----------|
| **LinkedInfluencerCommentAutomation.gs** | Main script (copy into Apps Script) | RUTTENS+OS/Scripts/ |
| **Setup Guide** | Step-by-step activation + troubleshooting | Artifacts/ |
| **Phase 2 Guide** | LinkedIn data access options (Apify vs. manual) | Artifacts/ |
| **Examples + Ref** | Sample comments + brand voice guide | Artifacts/ |
| **This checklist** | Your action plan | Artifacts/ |

---

## ⚡ Quick Start (20 minutes)

### 1️⃣ Copy the Google Apps Script (5 min)
- [ ] Open your Google Sheet: [LI Influencers](https://docs.google.com/spreadsheets/d/1xQEP_ZKMmysjQbndyDG-vbZPSU4g_EjW-BsX5EsdL98/)
- [ ] Click **Extensions > Apps Script**
- [ ] A new tab opens → Google Apps Script Editor
- [ ] Delete any existing code
- [ ] Copy the full script from `LinkedInfluencerCommentAutomation.gs`
- [ ] Paste into the editor
- [ ] Click **Save** (Ctrl+S)

### 2️⃣ Store Your Claude API Key (3 min)
- [ ] In Apps Script, find the function dropdown (top center)
- [ ] Select **setupApiKey**
- [ ] Click **Run** (▶️ button)
- [ ] A dialog appears → paste your Claude API key
- [ ] Click **OK**
- [ ] You see: ✅ "API key stored in Script Properties"

### 3️⃣ Verify Sheet Structure (2 min)
- [ ] In Apps Script function dropdown, select **verifySheetStructure**
- [ ] Click **Run**
- [ ] Open the Logs: **View > Logs** or **Ctrl+Enter**
- [ ] You should see:
  ```
  ✅ Both required tabs found
    - Sheet1: 57 rows
    - posts to comment: 1 rows
  ```

### 4️⃣ Create Daily Trigger (5 min)
- [ ] In Apps Script function dropdown, select **createDailyTrigger**
- [ ] Click **Run**
- [ ] You see: ✅ "Trigger created for 9 AM daily run"
- [ ] Verify in Apps Script left sidebar → **Triggers** panel
- [ ] You should see one trigger: `dailyInfluencerCommentRun`

### 5️⃣ Test Comment Generation (5 min)
- [ ] In Apps Script function dropdown, select **testCommentGeneration**
- [ ] Click **Run**
- [ ] Open Logs (**Ctrl+Enter**)
- [ ] You should see a sample comment generated
- [ ] Verify it's in Phil's brand voice (specific, actionable, no generic praise)

---

## ✅ Phase 1 Complete Checklist

Once you finish the 5 steps above, Phase 1 is live:

- [ ] Claude API key stored (`checkApiKey()` shows ✅)
- [ ] Sheet tabs verified (Sheet1 + "posts to comment" exist)
- [ ] Daily trigger created (Apps Script Triggers panel shows it)
- [ ] Test comment generated successfully
- [ ] Sample comment reviewed for quality/brand voice

**Phase 1 Status:** ✅ READY  
**Automation:** Daily 9 AM → pulls 3 influencers → generates comments → writes to sheet

---

## 🚀 Phase 2: LinkedIn Post Fetching (Optional, 30-45 min)

### Decision: How to fetch posts?

Pick ONE:

#### Option A: Apify (Recommended)
**Effort:** 20 min setup  
**Cost:** ~€9/month (~$0.30/day)  
**Process:** Automated scraping, no manual work

**Steps:**
- [ ] Create Apify account (apify.com)
- [ ] Copy default API token from Settings > API tokens
- [ ] In Apps Script, run `setupApifyToken()`
- [ ] Paste Apify token → click OK
- [ ] Copy the Apify implementation code (Phase 2 Guide)
- [ ] Replace `fetchInfluencerPosts()` function in script
- [ ] Save script
- [ ] Run `dailyInfluencerCommentRun()` to test end-to-end
- [ ] Check Logs for posts fetched + comments generated

#### Option B: Manual + Browser Extension
**Effort:** 5 min per day  
**Cost:** €0  
**Process:** You find posts → paste URLs → automation generates comments

**Steps:**
- [ ] Install browser extension: "Save to Google Sheets" (optional)
- [ ] Find influencer's latest 2 posts on LinkedIn
- [ ] Copy post URL from address bar
- [ ] Paste into "posts to comment" sheet, Column C
- [ ] In Apps Script, run `processExistingPostUrls()`
- [ ] Comments auto-generate for all rows with URLs but no comments

#### Option C: Skip Phase 2 for now
- [ ] Continue using Phase 1 only
- [ ] Manually paste post URLs into sheet
- [ ] Comments generate on-demand

---

## 📋 Week 1 Action Plan

### Day 1 (Today): Set up Phase 1
- [ ] Complete the 5 quick-start steps above (20 min)
- [ ] Review test comment in Logs
- [ ] Make sure trigger is created

### Day 2: Manual test + Phase 2 decision
- [ ] Find 1-2 influencer posts manually (from your 57 list)
- [ ] Paste post URLs into "posts to comment" sheet
- [ ] Run `processExistingPostUrls()` from Apps Script
- [ ] Check that comments are generated ✅
- [ ] Decide on Phase 2 (Apify vs. Manual vs. Skip)

### Day 3-5: Phase 2 implementation (if chosen)
- [ ] Set up Apify (if Option A)
- [ ] Test 1-2 posts end-to-end
- [ ] Verify comments are insightful + on-brand

### Day 6-7: First manual posts
- [ ] Review generated comments from Phase 1
- [ ] Post 3-5 comments on LinkedIn
- [ ] Track engagement (likes, replies, DMs)
- [ ] Note which topics/influencers get most engagement

### Start of Week 2: Go live
- [ ] Automation runs daily at 9 AM
- [ ] You review comments in "posts to comment" sheet
- [ ] Post comments manually (or automate via LinkedHelper + Make)
- [ ] Track engagement patterns

---

## 🎯 Success Metrics

### Phase 1 (Comment Generation)
- [ ] Comments generated daily (3/day with default config)
- [ ] Comments are 2-3 sentences (LinkedIn optimal length)
- [ ] Comments reference specific post topics (not generic)
- [ ] Comments include data/insights from Phil's expertise
- [ ] Comments mention ruttens.com subtly

### Phase 2 (Post Fetching, once implemented)
- [ ] Posts automatically extracted from influencer profiles
- [ ] Post URLs are valid (linkedin.com/feed/update/...)
- [ ] Posts are from last 7 days (or your configured lookback)
- [ ] No duplicate posts across days
- [ ] Comments generated within 2 hours of trigger

### Engagement (After posting comments)
- [ ] 1-5 comments posted per day (your pace)
- [ ] Average 10+ likes per comment (influence-dependent)
- [ ] 1-5 replies per 100 comments posted
- [ ] 0-2 DMs per 100 comments (inbound interest)
- [ ] Click-through to ruttens.com from profile bio

---

## 🔧 Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| "CLAUDE_API_KEY not found" | Run `setupApiKey()` again |
| Comment generation fails | Check Logs for error; verify API key |
| Trigger not firing at 9 AM | Delete trigger + run `createDailyTrigger()` again |
| Sheet structure error | Run `verifySheetStructure()` + check tab names match |
| Apify no posts found | Check profile URL is public + recent posts exist |
| Comment is generic | Edit prompt in `buildCommentPrompt()` function |

**Full troubleshooting:** See Setup Guide (Artifacts/)

---

## 📊 Configuration Tuning (Optional)

Once Phase 1 is running, you can adjust:

```javascript
CONFIG = {
  INFLUENCERS_PER_RUN: 3,      // Change to 5 for more comments/day
  POST_LOOKBACK_DAYS: 7,        // Change to 14 for older posts
  CLAUDE_MODEL: "claude-3-5-sonnet-20241022",  // Keep this (best balance)
  TIMEZONE: "Europe/Brussels",   // Change if not Brussels time
};
```

**If you want faster responses:** Use Sonnet (currently set, good choice)  
**If you want higher quality:** Use Opus (`claude-opus-4-8`) — 2x slower but better insights  
**If you want cheaper:** Use Haiku (`claude-3-haiku-20240307`) — 3x faster, lower quality

---

## 📞 Getting Help

**If something doesn't work:**
1. Check the Logs (Ctrl+Enter in Apps Script)
2. Run a diagnostic function (checkApiKey, verifySheetStructure)
3. Review the Setup Guide (Artifacts/) for your error message
4. Compare your sheet structure to the reference in Phase 2 Guide

**To update/improve:**
1. Edit the comment prompt in `buildCommentPrompt()`
2. Test with `testCommentGeneration()`
3. If happy, run full cycle with `dailyInfluencerCommentRun()`

---

## 📝 Final Notes

### What you get:
✅ **Fully automated comment generation** (Phase 1)  
✅ **Personalized, insightful comments** (in Phil's brand voice)  
✅ **Daily queue ready to post** (visible in sheet)  
✅ **Scalable to any number of influencers** (just add rows to Sheet1)  
✅ **Integration-ready** (plugs into Make, LinkedHelper, etc.)

### What's next (Phase 2):
→ Choose LinkedIn data source (Apify recommended)  
→ Implement post fetching  
→ Full end-to-end automation  
→ Daily comments with minimal manual work

### Cost:
- Phase 1: ~$0.005 per comment (~€0.10/day or ~€3/month)
- Phase 2 (Apify): ~$0.30/day (~€9/month)
- Phase 2 (Manual): €0

---

## ✨ You're Ready!

**Next step:** Start with the 5-minute quick start above.  
**Then:** Decide on Phase 2.  
**Then:** Enjoy daily LinkedIn engagement automation.  

**Questions?** Check the Setup Guide or Phase 2 Guide (all in Artifacts).

---

**Deployment Date:** 2026-06-24  
**Estimated First Full Cycle:** 2026-06-25 at 09:00 CET  
**Status:** 🚀 Ready to Launch
