# DEPLOYMENT GUIDE: Integrated LinkedIn Phase 1 + Phase 2

**Status:** Ready to Deploy  
**Time Required:** 10 minutes  
**Complexity:** Low

---

## Prerequisites ✅

Before you start, you need:

1. **Apify Account** (free at apify.com)
   - API token from Settings → Integrations → API tokens
   - Copy it (you'll paste it in 2 minutes)

2. **Claude API Key** (from claude.ai/settings/api)
   - Your existing key or create a new one
   - Keep it handy

3. **Google Apps Script Project**
   - Your "LinkedIn Daily Post Queue" project
   - Access to Project Settings

---

## Deployment Steps

### Step 1: Add API Keys to Script Properties (2 min)

1. Open your **Google Apps Script project** (LinkedIn Daily Post Queue)
2. Click **⚙️ Project Settings** (bottom-left gear icon)
3. Scroll to **Script Properties**
4. Click **Add row** and add BOTH keys:

   | Property Name | Value |
   |---------------|-------|
   | `APIFY_TOKEN` | (paste from apify.com) |
   | `CLAUDE_API_KEY` | (paste from claude.ai/settings/api) |

5. **Save** (bottom-right button)

✅ **Check:** Both keys appear in Script Properties with no errors

---

### Step 2: Paste the Integrated Code (3 min)

1. In your Apps Script editor, **delete all existing code** (or back it up first)
2. Copy all code from: **LinkedIn_Phase1-Phase2_Integrated_Code.gs**
3. Paste it into the Apps Script editor (replace everything)
4. **Ctrl+S** (or Cmd+S) to save

✅ **Check:** No syntax errors in the editor

---

### Step 3: Verify Sheet Structure (1 min)

1. In the Apps Script editor, click **Run** (▶️)
2. Select function: `verifySheetStructure`
3. Click **▶️ Execute**
4. Check logs (Execution → View logs)

Expected output:
```
✅ Sheet structure verified
```

✅ **Check:** Function ran without errors

---

### Step 4: Test API Keys (1 min)

1. In the Apps Script editor, click **Run**
2. Select function: `testApiKeys`
3. Click **▶️ Execute**
4. Check logs

Expected output:
```
APIFY_TOKEN set: ✅
CLAUDE_API_KEY set: ✅
```

✅ **Check:** Both show ✅

---

### Step 5: Test Post Fetching (2 min)

1. In the Apps Script editor, click **Run**
2. Select function: `testFetchPosts`
3. Click **▶️ Execute**
4. Check logs (Execution → View logs)

Expected output:
```
✅ Fetched 3 posts
Post 1: "New Azure milestone..." (2020L, 156C)
Post 2: "..." ...
Post 3: "..." ...
```

✅ **Check:** Posts fetched successfully

---

### Step 6: Test Comment Generation (2 min)

1. In the Apps Script editor, click **Run**
2. Select function: `testGenerateComment`
3. Click **▶️ Execute**
4. Check logs

Expected output:
```
✅ Generated comment:
[Your generated comment here]
```

✅ **Check:** Comment generated without errors

---

### Step 7: Test Full Integration (2 min)

1. In the Apps Script editor, click **Run**
2. Select function: `testFullIntegration`
3. Click **▶️ Execute**
4. Check logs

Expected output:
```
Fetching posts...
Generating comment for: Satya Nadella
✅ Success!
Post: "New Azure milestone..." ...
Comment: "[Your generated comment]"
```

✅ **Check:** Full workflow works end-to-end

---

### Step 8: Create Daily Trigger (2 min)

1. In the Apps Script editor, click **⏰ Triggers** (clock icon, left sidebar)
2. Click **+ Create new trigger** (bottom-right)
3. Set up trigger:
   - **Choose which function to run:** `dailyLinkedInWorkflow`
   - **Choose which deployment should run:** Head
   - **Select event source:** Time-driven
   - **Select type of time based trigger:** Day timer
   - **Select time of day:** 9:00 AM - 10:00 AM (your timezone)
4. Click **Save**
5. **Authorize** when prompted (review permissions, click Allow)

✅ **Check:** Trigger appears in the list without error

---

## Verify Deployment

### Check 1: Run Daily Workflow Manually
```
Run → dailyLinkedInWorkflow → Execute
```

Expected:
- Logs show: `🚀 Apify run started...`
- Logs show: `✅ Apify succeeded...`
- Logs show: `💬 Generating comments...`
- Logs show: `✅ Daily workflow complete. X posts processed.`

### Check 2: Verify Sheet Results
1. Open your Google Sheet
2. Look for new sheet: **"Comments Ready"**
3. Should have columns: Date, Author, Post URL, Post Preview, Generated Comment, Status, Posted?
4. Should have rows with:
   - Today's date
   - Influencer names (Pietro Montaldo, etc.)
   - Post URLs
   - Generated comments (2-3 sentences each)

---

## Daily Workflow Overview

Starting tomorrow at 9:00 AM, every day the automation will:

1. **9:00 AM** — Trigger starts
2. **9:01 AM** — Read 57 influencer profiles from Sheet1 Column B
3. **9:02 AM** — Fetch latest 3 posts per influencer from LinkedIn (via Apify)
4. **9:05 AM** — Generate comments for each post (via Claude)
5. **9:10 AM** — Save results to "Comments Ready" sheet
6. **9:15 AM** — Done ✅

**Total time:** 15 minutes  
**Your time:** 0 minutes (fully automated)

---

## What You Get

### Results in "Comments Ready" Sheet

| Date | Author | Post URL | Preview | Comment | Status |
|------|--------|----------|---------|---------|--------|
| 2026-06-25 | Pietro Montaldo | https://linkedin.com/... | "Claude Design is..." | "Your design guide hits perfectly - we've seen 34% of teams..." | ✅ Ready |
| 2026-06-25 | Romuald Czlonkowski | https://linkedin.com/... | "n8n-mcp crossed 100k users" | "100k users on automation tools... that's where the execution..." | ✅ Ready |

### Data for Each Post

- **Author Name** — Direct from LinkedIn profile
- **Post URL** — Link to the post (clickable)
- **Full Post Content** — Original text from the influencer
- **Generated Comment** — Claude-generated, brand-aligned, 2-3 sentences
- **Engagement Data** — Likes, comments, shares from the post
- **Status** — Ready to review or post

---

## Next Steps (Optional: Manual Posting or Make Integration)

### Option A: Manual Review Before Posting
1. Open "Comments Ready" sheet daily
2. Review generated comments
3. Copy comments to LinkedIn manually
4. Mark as "Posted" when done

### Option B: Connect to Make (Phase 3)
Set up a Make scenario that:
- Watches "Comments Ready" sheet for new rows
- Posts comments to LinkedIn via LinkedHelper API
- Marks as "Posted" automatically
- (Contact me for Make setup)

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `APIFY_TOKEN not set` | Check Script Properties has APIFY_TOKEN |
| `CLAUDE_API_KEY not set` | Check Script Properties has CLAUDE_API_KEY |
| `Apify run failed` | Check if your Apify account has credits (free tier has 10 runs/month) |
| `No posts found` | Influencers may have no posts in last 7 days; try running testFetchPosts manually |
| `Comment generation failed` | Check Claude API quota at claude.ai/usage |
| `Sheet not found` | Run verifySheetStructure() to create missing sheets |
| `Trigger not running` | Check Executions tab in Apps Script; look for error logs |

---

## Cost

**Daily Cost Estimate:**
- 57 influencers × 3 posts = 171 posts/day
- Apify: 171 × $0.002 = **$0.34/day**
- Claude: ~100 tokens/comment × 171 = ~$0.02/day
- **Total: ~$0.36/day (~$11/month)**

Free tier covers: 1 full monthly run at no cost ✅

---

## Files Reference

| File | What It Is |
|------|-----------|
| **LinkedIn_Phase1-Phase2_Integrated_Code.gs** | The code to paste |
| **DEPLOY_Integrated_Workflow.md** | This file — deployment steps |
| **Phase1-Phase2_Integration_Guide.md** | How Phase 1 + 2 work together |
| **Apify_Complete_Test_Report.md** | Test results & verification |

---

## Success Checklist

- [ ] APIFY_TOKEN added to Script Properties
- [ ] CLAUDE_API_KEY added to Script Properties
- [ ] Code pasted into Apps Script editor
- [ ] testApiKeys() shows both ✅
- [ ] testFetchPosts() returns posts
- [ ] testGenerateComment() generates comment
- [ ] testFullIntegration() succeeds
- [ ] Daily trigger created for 9:00 AM
- [ ] Manual test of dailyLinkedInWorkflow() shows logs
- [ ] "Comments Ready" sheet created with results
- [ ] Ready for tomorrow's 9:00 AM automated run

---

## You're Done! 🎉

Once all checks pass, your automation is live. Starting tomorrow at 9 AM:
- ✅ Posts fetched automatically from 57 influencers
- ✅ Comments generated via Claude
- ✅ Results saved to sheet
- ✅ Ready for posting (manual or automated via Make)

**Total setup time:** ~15 minutes  
**Daily automation time:** 15 minutes (fully hands-off)  
**Time you save/week:** 5-7 hours
