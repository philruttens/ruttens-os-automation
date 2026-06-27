# Phase 2: LinkedIn Post Fetching — Implementation Guide

**Status:** Decision & Implementation Roadmap  
**Current State:** Comment generation works; post fetching is a placeholder  
**Objective:** Choose your LinkedIn data access method + implement

---

## 🎯 Decision Matrix

| Factor | Apify (Scraper) | LinkedIn API | Manual + Browser Extension |
|--------|-----------------|--------------|---------------------------|
| **Setup Time** | 15 min | 5 min (code) + 1-2 weeks (approval) | 5 min |
| **Cost** | $0.25-0.50/day | Free (after approval) | Free |
| **Accuracy** | 95%+ | 100% | 100% (manual) |
| **Compliance** | LinkedIn ToS gray zone | Fully compliant | Fully compliant |
| **Scaling** | Works at any scale | Rate-limited, need approval | Manual limit ~10 posts/day |
| **Setup Complexity** | Low | Medium | Minimal |
| **Maintenance** | 2-3 min/month (monitor) | Rare updates | None |
| **Best For** | Hands-off automation | Enterprise compliance | Small-scale testing |

---

## ✅ Recommended: Apify (LinkedIn Posts Scraper)

### Why?
- **You're already in Make.com + automation ecosystem** → natural fit
- **No approval delays** → start immediately
- **Cost is minimal** (~$0.30/day = ~€9/month)
- **Handles rate limits + pagination** automatically
- **Works with your 9 AM daily trigger**

---

## 🔧 Apify Implementation (20 minutes)

### 1. Create Apify Account
1. Go to https://apify.com/
2. Sign up (free tier: 10 free runs/month)
3. Once verified, go to **Settings > API tokens**
4. Copy your **default API token** (keep it safe)

### 2. Find the LinkedIn Posts Scraper
1. Search for: "linkedin-posts-scraper" in the Apify Store
2. Or open directly: https://apify.com/nrozhon/linkedin-posts-scraper
3. Read the README to understand input parameters
4. **Key inputs you'll need:**
   - `profiles`: Array of LinkedIn URLs
   - `maxPostsPerProfile`: How many posts to fetch per profile (recommend: 2-3)
   - `maxConcurrency`: How many profiles to scrape in parallel (recommend: 3-5)

### 3. Test Apify Manually (Optional)
1. In Apify, click **Try for free** or **Test in modal**
2. Paste one LinkedIn profile URL in `profiles`
3. Set `maxPostsPerProfile` to 2
4. Click **Start actor**
5. Wait 30-60 seconds, check output in **Dataset**
6. You should see JSON with posts: `postUrl`, `text`, `createdAt`, etc.

### 4. Integrate into Google Apps Script
Replace the `fetchInfluencerPosts()` function with this:

```javascript
/**
 * Fetch influencer posts from LinkedIn using Apify
 * Returns: Array of posts with { url, title, content, publishedDate }
 */
function fetchInfluencerPosts(linkedInProfileUrl, lookbackDays) {
  const apifyToken = getScriptProperty("APIFY_TOKEN");
  
  if (!apifyToken) {
    Logger.log("⚠️  APIFY_TOKEN not set. Run setupApifyToken() first.");
    return [];
  }

  // Call Apify LinkedIn Posts Scraper
  const actorId = "nrozhon~linkedin-posts-scraper";
  const apifyUrl = `https://api.apify.com/v2/acts/${actorId}/run-sync`;

  const input = {
    profiles: [linkedInProfileUrl],
    maxPostsPerProfile: 3,
    maxConcurrency: 1,
    proxyCountry: "DE" // Use DE/EU proxy to avoid geo-blocking
  };

  const options = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${apifyToken}`,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(input),
    muteHttpExceptions: true,
    timeout: 120 // 2 minutes - Apify can be slow
  };

  try {
    const response = UrlFetchApp.fetch(apifyUrl, options);
    const statusCode = response.getResponseCode();

    if (statusCode !== 200) {
      Logger.log(`⚠️  Apify returned ${statusCode}: ${response.getContentText()}`);
      return [];
    }

    const result = JSON.parse(response.getContentText());
    
    if (!result.output || !result.output.posts || result.output.posts.length === 0) {
      Logger.log(`ℹ️  No posts found for ${linkedInProfileUrl}`);
      return [];
    }

    // Filter by date (last N days) and format
    const posts = result.output.posts
      .filter(p => isRecentPost(p.createdAt, lookbackDays))
      .map(p => ({
        url: p.postUrl || p.url,
        title: extractTitle(p.text),
        content: p.text,
        publishedDate: p.createdAt,
        likes: p.likes || 0,
        comments: p.comments || 0
      }));

    return posts;

  } catch (error) {
    Logger.log(`❌ Apify error: ${error.message}`);
    return [];
  }
}

/**
 * Helper: Check if post is recent
 */
function isRecentPost(dateString, lookbackDays) {
  try {
    const postDate = new Date(dateString);
    const now = new Date();
    const diffMs = now - postDate;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= lookbackDays;
  } catch (e) {
    return false;
  }
}

/**
 * Helper: Extract post title (first 100 chars)
 */
function extractTitle(text) {
  if (!text) return "";
  const cleaned = text.replace(/\n+/g, " ").trim();
  return cleaned.length > 100 ? cleaned.substring(0, 100) + "..." : cleaned;
}

/**
 * SETUP: Store Apify token in Script Properties
 */
function setupApifyToken() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt("Paste your Apify API token:");

  if (response.getSelectedButton() === ui.Button.OK) {
    const token = response.getResponseText();
    PropertiesService.getScriptProperties().setProperty("APIFY_TOKEN", token);
    ui.alert("✅ Apify token stored");
  }
}
```

### 5. Store Apify Token
1. In Apps Script, run **setupApifyToken()** from the dropdown
2. Paste your Apify API token
3. Click OK

### 6. Test
1. Run **dailyInfluencerCommentRun()** from the dropdown
2. Check Logs (Ctrl+Enter)
3. You should see posts fetched and comments generated

---

## 🔐 Cost & Rate Limits (Apify)

**Free Tier:**
- 10 free runs/month
- ~30 sec per profile
- Perfect for testing

**Paid Tier (after 10 free runs):**
- $0.25 per actor run (~1 profile scraped)
- For 57 influencers → ~$0.30/day (runs 3 influencers = $0.75/day)
- ~€22/month for full automation

**To minimize cost:**
- Process 3-5 influencers/day (you are doing 3 → good)
- Fetch only 2-3 posts per influencer (set `maxPostsPerProfile: 2`)
- Run once daily at fixed time (not multiple times)

---

## 🚀 Alternative: Manual + Browser Extension

If you want to **test before committing to Apify**, use this hybrid approach:

### How it works:
1. You manually find influencer posts (via LinkedIn or a browser extension)
2. Paste post URLs into the **"posts to comment"** tab (Column C)
3. Automation generates comments automatically

### Setup:
1. **Browser Extension Option A: Save to Google Sheets**
   - Install: "Save to Google Sheets" extension
   - Configure to save LinkedIn posts to your sheet

2. **Browser Extension Option B: Manual Copy-Paste**
   - Find influencer's latest 2 posts
   - Copy post URL from address bar
   - Paste into sheet Column C

3. **Run automation:**
   ```javascript
   // In Apps Script, run:
   processExistingPostUrls()
   ```
   This scans all rows with a Post URL but no comment → generates comments

### Example workflow:
```
10:00 AM: You find 5 LinkedIn posts you want to comment on
         → Paste 5 post URLs into "posts to comment" sheet (Column C)

11:00 AM: Run processExistingPostUrls()
         → Comments auto-generated for all 5

12:00 PM: You review + post comments manually
```

**Pros:**
- No cost
- 100% control over which posts get commented
- Test comment quality before full automation

**Cons:**
- Manual work (but minimal)
- Not fully automated

---

## 🔄 LinkedIn Official API (Enterprise Path)

**If you eventually want full compliance + no scraping:**

### Apply for access:
1. Go to https://www.linkedin.com/developers/apps
2. Create app (requires LinkedIn account)
3. Request **Sign In with LinkedIn** + **Share on LinkedIn** scopes
4. **Wait 1-2 weeks** for approval (LinkedIn reviews manually)

### Once approved:
Implement using OAuth + endpoints:
- `GET /v2/me/posts` → Get your posts
- `POST /v2/posts` → Share content

**Note:** LinkedIn's API is **limited** for reading others' posts. You can't fetch arbitrary influencer posts through the official API — only your own account's activity. This makes the official API less useful for your use case.

---

## 📊 Implementation Recommendation

### Phase 2A (Week 1 - Test):
- Set up Apify account (free tier)
- Integrate into Apps Script
- Run 1-2 test cycles
- Review comment quality
- **Cost: $0 (using free runs)**

### Phase 2B (Week 2 - Full Deployment):
- Upgrade to Apify paid tier (if satisfied)
- Increase `INFLUENCERS_PER_RUN` to 5
- Run daily at 9 AM
- Monitor quality & engagement

### Phase 2C (Month 2 - Optimize):
- Track which comments get engagement
- Refine comment prompt based on top performers
- Maybe add engagement tracking to sheet (replies, likes)

---

## 🐛 Troubleshooting Apify

### Issue: "No posts found"
- Check LinkedIn profile URL is correct
- Profile might be private/restricted
- Try with a public influencer first to test

### Issue: Apify run times out
- Reduce `maxConcurrency` from 5 to 1
- Reduce `maxPostsPerProfile` from 3 to 2
- LinkedIn might be blocking you — try EU proxy

### Issue: "Invalid API token"
- Make sure you copied the **default API token**, not actor ID
- Go to Settings > API tokens to verify

### Issue: Comment generation still empty
- Run `fetchInfluencerPosts()` independently to debug
- Check Apify dataset output manually
- Make sure post URLs are valid (should start with `linkedin.com/feed/...`)

---

## 📈 Next Steps

**Immediate (Today):**
1. ✅ Test comment generation: `testCommentGeneration()`
2. ✅ Set up API key: `setupApiKey()`
3. ✅ Create trigger: `createDailyTrigger()`

**This Week (Phase 2A):**
1. Create Apify account
2. Test LinkedIn scraper manually in Apify UI
3. Integrate code into `fetchInfluencerPosts()`
4. Run `dailyInfluencerCommentRun()` test
5. Review output quality

**Next Week (Phase 2B):**
1. Upgrade Apify to paid (if satisfied)
2. Run full automation
3. Track engagement

---

**Questions? Check the main Setup Guide for troubleshooting.**
