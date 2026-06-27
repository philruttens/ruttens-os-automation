# LinkedIn Influencer Comment Automation — Setup Guide

**Status:** Ready to Deploy (Phase 1: Comment Generation) + Phase 2 Placeholder (Post Fetching)  
**Last Updated:** 2026-06-24  
**Model:** Claude 3.5 Sonnet  
**Automation Frequency:** Daily at 9 AM CET (configurable)

---

## 📋 Quick Start (5 minutes)

1. **Store your Claude API key** (Script Properties)
2. **Verify sheet structure** (confirm tabs & columns)
3. **Create daily trigger** (9 AM automation)
4. **Test comment generation** (manual validation)
5. **Phase 2:** Implement LinkedIn post fetching (Apify or manual)

---

## 🔑 Step 1: Store Your Claude API Key

### 1.1 Get/Create your Claude API key
- Go to **https://console.anthropic.com/account/keys**
- Create a new key if needed (keep it safe!)
- Copy the key

### 1.2 Store in Apps Script (Script Properties)
1. Open your Google Sheet: [LI Influencers for posts commenting](https://docs.google.com/spreadsheets/d/1xQEP_ZKMmysjQbndyDG-vbZPSU4g_EjW-BsX5EsdL98/edit)
2. Click **Extensions > Apps Script**
3. Paste the script code (provided separately) into the editor
4. Click **Run > setupApiKey()** (from the function dropdown)
5. A dialog box will appear — paste your Claude API key
6. Click **OK** → you'll see ✅ confirmation
7. Click **Project Settings** → verify **Script ID** (you'll need this if debugging)

### 1.3 Verify it worked
- In Apps Script, run **checkApiKey()** from the dropdown
- You should see: `✅ CLAUDE_API_KEY is stored (first 10 chars: sk-ant...)`

---

## 📊 Step 2: Verify Sheet Structure

### Required Sheet Tabs & Columns

**Tab 1: "Sheet1" (Influencer Master List)**
| Column | Name | Example |
|--------|------|---------|
| A | Name | Sarah Chen |
| B | LinkedIn URL | https://www.linkedin.com/in/sarahchen/ |
| C | Last Processed | (auto-tracked, optional) |

**Tab 2: "posts to comment" (Daily Queue)**
| Column | Name | Example |
|--------|------|---------|
| A | Date | 6/24/2026 |
| B | Influencer | Sarah Chen |
| C | Post URL | https://www.linkedin.com/feed/update/urn:li:activity:123/ |
| D | Proposed Comment | "Most teams optimize..." |
| E | Status | ✅ Ready to Post |

### Run this verification function
1. In Apps Script, run **verifySheetStructure()** from the dropdown
2. Check the Logs (Ctrl+Enter) for output
3. You should see:
   ```
   ✅ Both required tabs found
     - Sheet1: 57 rows
     - posts to comment: 1 rows
   ```

**If tabs are missing:**
- Create "posts to comment" tab manually with header row
- Or modify `CONFIG.INFLUENCER_TAB` and `CONFIG.POSTS_TAB` in the script to match your tab names

---

## ⏰ Step 3: Create Daily Trigger

### 3.1 Set up the 9 AM trigger
1. In Apps Script, run **createDailyTrigger()** from the dropdown
2. You'll see: `✅ Trigger created for 9 AM daily run`
3. Verify in Apps Script **Triggers** panel (left sidebar)
   - You should see one trigger: `dailyInfluencerCommentRun`
   - Time: Daily at 9 AM (Europe/Brussels timezone)

### 3.2 Change the trigger time
- Edit `TIMEZONE` in CONFIG (top of script): `"Europe/Brussels"` → your timezone
- Delete the trigger in the Triggers panel
- Run `createDailyTrigger()` again

### 3.3 Manual trigger (testing)
- Run **dailyInfluencerCommentRun()** from the dropdown anytime
- It will process 3 influencers immediately (respects `INFLUENCERS_PER_RUN` config)

---

## 🧪 Step 4: Test Comment Generation

### 4.1 Quick test (no sheet writes)
1. In Apps Script, run **testCommentGeneration()** from the dropdown
2. Check the Logs (Ctrl+Enter)
3. You should see a sample comment generated in Claude's voice

**Example output:**
```
🧪 Testing comment generation...
Post: The hidden revenue leak in B2B SaaS contracts

✅ Generated Comment:
Sarah's nailing the renewal tracking challenge — we're seeing the same pattern in 
European scaleups: most teams miss 15-30% contract value through poor admin. The 
insight here is that you can't optimize what you don't measure. Quick diagnostic 
if your team wants to audit their own numbers: ruttens.com
```

### 4.2 Full workflow test
1. Run **manualCommentTest()** from the dropdown
2. Check output in Logs
3. If it works, the automation is ready

---

## 🔗 Phase 2: LinkedIn Post Fetching (Next Steps)

**Current Status:** Placeholder function returns empty posts. You need to implement one of these:

### Option A: Apify (Recommended for you)
**Why:** Handles LinkedIn scraping, respects rate limits, ~$0.50-2 per run  
**Setup:**
1. Create [Apify](https://apify.com/) account (free tier available)
2. Use the [LinkedIn Posts Scraper Actor](https://apify.com/nrozhon/linkedin-posts-scraper)
3. In your Google Apps Script, replace `fetchInfluencerPosts()` with:

```javascript
function fetchInfluencerPosts(linkedInProfileUrl, lookbackDays) {
  const apifyUrl = "https://api.apify.com/v2/acts/nrozhon~linkedin-posts-scraper/runs";
  
  const payload = {
    maxPostsPerProfile: 3,
    profiles: [linkedInProfileUrl],
    maxConcurrency: 5
  };

  const options = {
    method: 'post',
    headers: {
      'Authorization': `Bearer YOUR_APIFY_TOKEN`,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(apifyUrl, options);
  const result = JSON.parse(response.getContentText());

  if (result.data && result.data.output && result.data.output.posts) {
    return result.data.output.posts.map(p => ({
      url: p.postUrl,
      title: p.text?.substring(0, 100),
      content: p.text,
      publishedDate: p.createdAt
    })).filter(p => isRecent(p.publishedDate, lookbackDays));
  }
  return [];
}

function isRecent(date, days) {
  const postDate = new Date(date);
  const now = new Date();
  const diffDays = (now - postDate) / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}
```

**Cost:** ~$0.25 per profile per run (57 influencers × $0.005 each = ~$0.30/day)

---

### Option B: Manual + Browser Extension
**Why:** Zero cost, simple, but requires manual work  
**Setup:**
1. Use LinkedIn's native "Share to..." or a browser extension (e.g., Save to Google Sheets)
2. Paste post URLs directly into **"posts to comment"** tab, Column C
3. Run **processExistingPostUrls()** from Apps Script
4. Automation generates comments for all rows with Post URLs but no Comments

**Workflow:**
- You surface ~5-10 posts daily via extension → paste URLs
- Automation generates comments overnight
- You review and post manually

---

### Option C: LinkedIn Official API
**Why:** Most compliant, but requires business application approval  
**Setup:**
1. Apply here: https://www.linkedin.com/developers/apps
2. Wait 1-2 weeks for approval
3. Implement using `/v2/posts` endpoint
4. Higher rate limits, no scraping concerns

**Trade-off:** Slowest approval, most official

---

## 📝 Sample Output (3 Examples)

### Example 1: Post on Revenue Operations
**Influencer:** Marcus Sheridan  
**Post Content:** "Most sales teams optimize for volume, not value. The real win is improving your ACV and deal velocity simultaneously."

**Generated Comment:**
```
Marcus, you're touching on the hidden metric — most teams obsess over pipeline size 
but miss deal quality. We audit about 20 European B2B teams annually, and the pattern 
is consistent: 60% have fragmented deal tracking (Salesforce vs. spreadsheets). Better 
data = better decisions. ruttens.com has a quick diagnostic if your audience wants to 
stress-test their own numbers.
```

---

### Example 2: Post on CAC/LTV
**Influencer:** Tomás Tunguz  
**Post Content:** "SaaS unit economics are broken when you don't track true CAC and LTV properly. Most companies have no idea."

**Generated Comment:**
```
Spot on — we ran a quick audit of 15 European SaaS teams last quarter and found 
this exact gap: 70% didn't have a single-source-of-truth for CAC vs. CAC payback. 
The second-order effect is that pricing strategy becomes guesswork. ruttens.com 
runs diagnostics for B2B operations if your network wants a baseline check.
```

---

### Example 3: Post on European B2B Scale
**Influencer:** Mathias Bynens  
**Post Content:** "European B2B scaleups face unique challenges: talent costs, compliance, shorter sales cycles. How are you solving for this?"

**Generated Comment:**
```
Mathias, the three-way compression is real — tighter margins + longer sales cycles + 
talent scarcity = operational stress. We're seeing teams solve this by ruthlessly 
automating the admin layer (contract management, renewals, forecasting). If you're 
curious how your peers are structuring this, ruttens.com has a quick revenue 
diagnostic built for European scaleup operators.
```

---

## 🎛️ Configuration Reference

Edit these in the `CONFIG` object at the top of the script:

| Setting | Default | What it does |
|---------|---------|--------------|
| `SHEET_ID` | `1xQEP_ZKMmysjQbndyDG-vbZPSU4g_EjW-BsX5EsdL98` | Your Google Sheet ID (don't change) |
| `INFLUENCER_TAB` | `"Sheet1"` | Name of your influencer master list tab |
| `POSTS_TAB` | `"posts to comment"` | Name of your daily queue tab |
| `INFLUENCERS_PER_RUN` | `3` | How many influencers to process per daily trigger (3 = ~6 comments/day) |
| `POST_LOOKBACK_DAYS` | `7` | Only fetch posts from the last N days |
| `TIMEZONE` | `"Europe/Brussels"` | Your timezone for 9 AM trigger |
| `CLAUDE_MODEL` | `"claude-3-5-sonnet-20241022"` | Model (Sonnet = best speed/quality; use Opus for higher quality) |

---

## 🚀 Full Workflow (Day 1)

### Morning: Automation runs
- **9 AM CET:** Google Apps Script trigger fires
- Pulls 3 influencers from Sheet1
- Generates comments using Claude API
- Writes to "posts to comment" sheet
- **Result:** 3 new comment rows ready to review

### Afternoon: You review
- Open "posts to comment" sheet
- Check generated comments for tone/accuracy
- Update Status column: `✅ Ready to Post` or `❌ Needs Edit`
- (Optional: manually edit comments if needed)

### Evening: Post comments
- Copy comment text from column D
- Paste on LinkedIn
- Update Status: `✅ Posted [6/24]`

### Next Day
- Trigger fires again, processes next 3 influencers
- Repeat

---

## 🔧 Troubleshooting

### Issue: "CLAUDE_API_KEY not found"
**Solution:**
1. Run `setupApiKey()` again
2. Or go to **Project Settings** > **Script Properties** > manually add `CLAUDE_API_KEY`

### Issue: Sheet structure error
**Solution:**
1. Run `verifySheetStructure()`
2. Check tab names match `CONFIG` exactly (case-sensitive)
3. Make sure header row exists in both tabs

### Issue: Trigger not firing at 9 AM
**Solution:**
1. Check **Triggers** panel (left sidebar)
2. Verify timezone is correct
3. Delete trigger + run `createDailyTrigger()` again

### Issue: Comment is generic or off-brand
**Solution:**
1. The prompt quality directly affects output
2. Review `buildCommentPrompt()` function — edit examples if needed
3. Test with `testCommentGeneration()` before running full automation

### Issue: Claude API quota exceeded
**Solution:**
1. Check [Anthropic console](https://console.anthropic.com/account) for usage
2. May need to increase billing tier or add payment method
3. Reduce `INFLUENCERS_PER_RUN` from 3 to 2 to lower daily API calls

---

## 📞 Support & Next Steps

**If anything breaks:**
1. Check the **Logs** in Apps Script (Ctrl+Enter)
2. Run diagnostic functions: `checkApiKey()`, `verifySheetStructure()`
3. Look for error messages in the Logs panel

**To implement Phase 2 (LinkedIn post fetching):**
1. Choose your approach (Apify recommended)
2. Get API credentials
3. Replace `fetchInfluencerPosts()` function with live implementation
4. Run `dailyInfluencerCommentRun()` to test full end-to-end

**To optimize further:**
1. Track which comments get the most engagement
2. Analyze successful comments in Claude → refine prompt
3. Increase `INFLUENCERS_PER_RUN` as you scale

---

## 📚 Reference Links

- **Claude API Docs:** https://docs.anthropic.com/
- **Claude Models:** https://docs.anthropic.com/models/latest
- **Apify LinkedIn Scraper:** https://apify.com/nrozhon/linkedin-posts-scraper
- **LinkedIn API:** https://www.linkedin.com/developers/
- **Google Apps Script Docs:** https://developers.google.com/apps-script

---

**You're ready to automate! 🚀**
