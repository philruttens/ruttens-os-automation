# LinkedIn Phase 2: Quick Start (5 minutes)

## What Just Happened
✅ Tested Apify's LinkedIn Profile Posts Scraper  
✅ Successfully fetched 5 real posts from a public profile in **8.3 seconds**  
✅ Created production-ready Google Apps Script code  
✅ Verified all required data fields (URL, content, engagement, author)

---

## Your Next 5 Steps

### 1️⃣ Create Apify Token (2 min)
```
1. Go to https://apify.com → Sign Up (free)
2. Settings → Integrations → API tokens → Create
3. Copy token
```

### 2️⃣ Add Token to Apps Script (1 min)
```
1. Open your "LinkedIn Daily Post Queue" Apps Script
2. Project Settings (gear, bottom-left)
3. Script Properties → Add:
   - Key: APIFY_TOKEN
   - Value: (paste your token)
   - Save
```

### 3️⃣ Paste the Code (2 min)
In your Apps Script, paste the `fetchLinkedInPostsViaApify()` function from:  
📄 **Artifacts/LinkedHelper_Apify_Post_Fetcher_Implementation.md** (Section 2)

### 4️⃣ Run One Test (1 min)
```javascript
// Run this in Apps Script console:
testSingleProfile()

// Check Execution → View logs for output
```

### 5️⃣ Set Up Daily Trigger (1 min)
```
Apps Script → Triggers (clock icon)
- Function: dailyFetchInfluencerPosts
- Type: Daily, 9:00 AM
- Save
```

---

## What You Get

Every morning at 9 AM:
- ✅ Fetches latest 3 posts from all 57 influencers
- ✅ Returns: URL, content, author, engagement, date
- ✅ Ready for your Claude comment generator
- ✅ Cost: ~$0.34/day ($10/month)

---

## Real Data Example

Test run returned posts like:
```javascript
{
  url: "https://www.linkedin.com/posts/satyanadella_azure-sets...",
  content: "New Azure milestone. The fastest time to train yet...",
  publishedDate: "2026-06-16T23:01:08.318Z",
  authorName: "Satya Nadella",
  engagement: {
    likes: 2020,
    comments: 156,
    shares: 167
  }
}
```

✅ **Ready to paste into your comment generation pipeline**

---

## Docs Reference

| Document | Use For |
|----------|---------|
| **LinkedHelper_Apify_Post_Fetcher_Implementation.md** | Full setup, code, testing, troubleshooting |
| **Apify_Phase2_TestResults.json** | Real data proof (5 test posts) |
| **Phase2_Quick_Start.md** | This file — fast overview |

---

## Cost Breakdown

| Item | Cost |
|------|------|
| Apify free tier | Free (up to 10 runs/month) |
| Per post | $0.002 (0.2¢) |
| 57 profiles × 3 posts/day | $0.34/day |
| Monthly (30 days) | ~$10/month |

**Free tier includes:** 1 run/month of 171 posts = covered!

---

## One-Line Summary

**Automated LinkedIn post fetching from 57 profiles, 3 posts/day, ready to integrate with your Claude comment generator. No manual URL copying needed.**

---

**Questions?** See Section 8 (Troubleshooting) in the full implementation guide.
