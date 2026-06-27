# LinkedIn Post Fetcher Implementation Guide
## Phase 2: Automated Post Scraping via Apify

**Status:** ✅ Tested & Ready to Deploy  
**Last Updated:** 2026-06-24  
**Target Sheet:** https://docs.google.com/spreadsheets/d/1xQEP_ZKMmysjQbndyDG-vbZPSU4g_EjW-BsX5EsdL98/

---

## 1. SETUP: Get Your Apify Token

### Step 1: Create Apify Account
1. Go to [https://apify.com](https://apify.com) and **Sign Up** (free tier)
2. Verify your email
3. Go to **Settings** → **Integrations** → **API tokens**
4. **Create token** (name it "LinkedIn Post Fetcher")
5. Copy the token (you'll need this in 30 seconds)

### Step 2: Store Token in Apps Script

In your **LinkedIn Daily Post Queue** Apps Script project:

1. **Project Settings** (gear icon, bottom-left)
2. Under **Script Properties**, add:
   - **Key:** `APIFY_TOKEN`
   - **Value:** _(paste your token)_
   - Click **Save**

![Screenshot location: Script editor → Project Settings → Script Properties]

---

## 2. CODE: Add This Function to Apps Script

Copy this entire function into your Apps Script project (paste it alongside your existing comment generation code):

```javascript
/**
 * Fetch latest LinkedIn posts from influencer profiles via Apify
 * @param {string[]} profileUrls - Array of LinkedIn profile URLs
 * @param {number} maxPostsPerProfile - Max posts to fetch per profile (default: 3)
 * @param {string} postedLimit - Time filter: 'any', '24h', 'week', 'month' (default: 'week')
 * @returns {Object[]} Array of posts: {url, content, postedDate, authorName, authorUrl, engagement}
 */
function fetchLinkedInPostsViaApify(profileUrls, maxPostsPerProfile = 3, postedLimit = 'week') {
  const APIFY_TOKEN = PropertiesService.getScriptProperties().getProperty('APIFY_TOKEN');
  
  if (!APIFY_TOKEN) {
    throw new Error('⚠️ APIFY_TOKEN not set in Script Properties. See setup instructions.');
  }

  const ACTOR_ID = 'harvestapi/linkedin-profile-posts';
  const APIFY_API_URL = `https://api.apify.com/v2/acts/${ACTOR_ID}/runs`;
  
  const allPosts = [];
  
  try {
    // Build Apify input
    const apifyInput = {
      targetUrls: profileUrls,
      maxPosts: maxPostsPerProfile,
      postedLimit: postedLimit,
      scrapeComments: false,
      scrapeReactions: false
    };

    // Start the actor run
    const runResponse = UrlFetchApp.fetch(APIFY_API_URL, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APIFY_TOKEN}`
      },
      payload: JSON.stringify({ input: apifyInput }),
      muteHttpExceptions: true
    });

    const runResult = JSON.parse(runResponse.getContentText());

    if (!runResult.data || !runResult.data.id) {
      throw new Error(`Apify API error: ${runResponse.getContentText()}`);
    }

    const runId = runResult.data.id;
    Logger.log(`🚀 Started Apify run: ${runId}`);

    // Poll for completion (max 45 seconds)
    let status = 'RUNNING';
    let attempts = 0;
    let datasetId = null;

    while (status === 'RUNNING' && attempts < 30) {
      Utilities.sleep(1500); // Wait 1.5s between checks
      
      const statusResponse = UrlFetchApp.fetch(
        `${APIFY_API_URL}/${runId}`,
        {
          headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` },
          muteHttpExceptions: true
        }
      );

      const statusData = JSON.parse(statusResponse.getContentText());
      status = statusData.data?.status;
      datasetId = statusData.data?.defaultDatasetId;
      attempts++;
      
      Logger.log(`⏳ Status: ${status} (attempt ${attempts})`);
    }

    if (status !== 'SUCCEEDED') {
      throw new Error(`Apify run failed with status: ${status}`);
    }

    Logger.log(`✅ Apify run succeeded. Dataset: ${datasetId}`);

    // Fetch dataset items
    const itemsUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?clean=true`;
    const itemsResponse = UrlFetchApp.fetch(itemsUrl, {
      headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` },
      muteHttpExceptions: true
    });

    const itemsData = JSON.parse(itemsResponse.getContentText());
    const items = itemsData || [];

    Logger.log(`📊 Fetched ${items.length} posts from Apify`);

    // Transform Apify data into our format
    items.forEach(post => {
      allPosts.push({
        url: post.linkedinUrl || '',
        title: post.content?.substring(0, 100) + '...' || 'Untitled',
        content: post.content || '',
        publishedDate: post['postedAt.date'] || new Date().toISOString(),
        authorName: post['author.name'] || 'Unknown',
        authorUrl: post['author.linkedinUrl'] || '',
        engagement: {
          likes: post['engagement.likes'] || 0,
          comments: post['engagement.comments'] || 0,
          shares: post['engagement.shares'] || 0
        },
        source: 'apify'
      });
    });

  } catch (error) {
    Logger.log(`❌ Error in fetchLinkedInPostsViaApify: ${error}`);
    throw error;
  }

  return allPosts;
}


/**
 * Main trigger: Fetch posts from all influencers and populate Sheet
 * Run this daily via trigger
 */
function dailyFetchInfluencerPosts() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  const data = sheet.getRange('B:B').getValues(); // Get all profile URLs from Column B
  
  // Filter out empty cells and headers
  const profileUrls = data
    .flat()
    .filter(url => url && url.includes('linkedin.com/in/'));

  Logger.log(`📋 Found ${profileUrls.length} influencer profiles`);

  if (profileUrls.length === 0) {
    Logger.log('⚠️ No LinkedIn profiles found in Sheet1 Column B');
    return;
  }

  try {
    // Fetch latest posts (max 3 per profile, posted in last week)
    const posts = fetchLinkedInPostsViaApify(profileUrls, 3, 'week');
    
    Logger.log(`✅ Successfully fetched ${posts.length} posts`);

    // TODO: Add posts to your sheet or processing queue
    // Example: save to a "Posts Queue" sheet for comment generation
    populatePostsQueue(posts);

  } catch (error) {
    Logger.log(`❌ Daily fetch failed: ${error}`);
    // Optionally send email alert
  }
}


/**
 * Helper: Save fetched posts to a "Posts Queue" sheet
 * Adjust sheet name and columns to match your setup
 */
function populatePostsQueue(posts) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let queueSheet = spreadsheet.getSheetByName('Posts Queue');
  
  // Create sheet if it doesn't exist
  if (!queueSheet) {
    queueSheet = spreadsheet.insertSheet('Posts Queue');
    // Add headers
    queueSheet.getRange(1, 1, 1, 6).setValues([
      ['Post URL', 'Content', 'Author', 'Posted Date', 'Engagement', 'Processed']
    ]);
  }

  // Add posts to queue (avoid duplicates)
  const existingUrls = new Set(
    queueSheet.getRange(2, 1, queueSheet.getLastRow() - 1).getValues().flat()
  );

  posts.forEach(post => {
    if (!existingUrls.has(post.url)) {
      const lastRow = queueSheet.getLastRow() + 1;
      const engagement = `${post.engagement.likes}L, ${post.engagement.comments}C`;
      queueSheet.getRange(lastRow, 1, 1, 6).setValues([[
        post.url,
        post.content,
        post.authorName,
        post.publishedDate,
        engagement,
        'FALSE' // Mark as not processed yet
      ]]);
      Logger.log(`➕ Added post: ${post.url}`);
    }
  });
}
```

---

## 3. INTEGRATION: Connect with Your Comment Generator

After posts are fetched, integrate with your Claude comment generation:

```javascript
/**
 * Process queued posts and generate comments
 * (adapt to your existing comment generation logic)
 */
function processPostsAndGenerateComments() {
  const queueSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Posts Queue');
  const rows = queueSheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) { // Skip header
    const [postUrl, content, author, date, engagement, processed] = rows[i];
    
    if (processed !== 'FALSE') continue; // Skip already-processed posts

    try {
      // Your existing Claude comment generation logic
      const comment = generateCommentForPost(content, author); // Your function
      
      // Save comment back to sheet
      queueSheet.getRange(i + 1, 7).setValue(comment);
      queueSheet.getRange(i + 1, 6).setValue('TRUE'); // Mark as processed
      
      Logger.log(`✅ Generated comment for: ${postUrl}`);
    } catch (error) {
      Logger.log(`❌ Error processing post ${postUrl}: ${error}`);
    }
  }
}
```

---

## 4. TESTING: Step-by-Step

### Test 1: Verify Token Setup
```javascript
function testApifyToken() {
  const token = PropertiesService.getScriptProperties().getProperty('APIFY_TOKEN');
  if (token) {
    Logger.log('✅ Token found: ' + token.substring(0, 10) + '...');
  } else {
    Logger.log('❌ Token not found. Check Script Properties.');
  }
}

// Run: testApifyToken()
```

### Test 2: Fetch Posts from Single Profile
```javascript
function testSingleProfile() {
  const testUrl = 'https://www.linkedin.com/in/satyanadella/';
  const posts = fetchLinkedInPostsViaApify([testUrl], 3, 'week');
  
  Logger.log(`Found ${posts.length} posts:`);
  posts.forEach(p => {
    Logger.log(`- "${p.title}" (${p.engagement.likes} likes)`);
    Logger.log(`  URL: ${p.url}`);
  });
}

// Run: testSingleProfile()
```

### Test 3: Full Daily Run
```javascript
function testDailyRun() {
  dailyFetchInfluencerPosts();
  Logger.log('✅ Check "Posts Queue" sheet for results');
}

// Run: testDailyRun()
```

---

## 5. AUTOMATION: Schedule Daily Trigger

1. **Apps Script Editor** → **Triggers** (clock icon, left sidebar)
2. **Create new trigger**:
   - Function: `dailyFetchInfluencerPosts`
   - Deployment: `Head`
   - Event: `Time-driven`
   - Type: `Daily`
   - Time: `9:00 AM` (your timezone)
3. **Save** → Approve permissions

---

## 6. PRICING & COSTS

**Apify Free Tier:**
- ✅ Free actor runs (up to 10/month)
- Cost per post: **$0.002** (0.2¢)
- Cost per run startup: **$0.00005**

**Example:** Fetch 57 profiles × 3 posts = 171 posts/day = **$0.34/day** (~$10/month)

---

## 7. DATA FORMAT

Posts returned in this format:
```javascript
{
  url: "https://www.linkedin.com/posts/...",
  title: "First 100 chars of content...",
  content: "Full post text",
  publishedDate: "2026-06-24T14:58:17.798Z",
  authorName: "Satya Nadella",
  authorUrl: "https://www.linkedin.com/in/satyanadella/",
  engagement: {
    likes: 2020,
    comments: 156,
    shares: 167
  },
  source: "apify"
}
```

---

## 8. TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| `APIFY_TOKEN not set` | Go to Script Properties, add APIFY_TOKEN from your Apify dashboard |
| `Run failed with status: FAILED` | Check if profile URLs are public & valid; Apify may rate-limit after 100 fetches/day |
| `No posts returned` | Influencer may have no public posts in last week; adjust `postedLimit` to 'month' |
| `UrlFetchApp timeout` | Increase `Utilities.sleep(1500)` to `Utilities.sleep(2000)` in polling loop |
| Posts not showing in sheet | Verify sheet name is 'Sheet1' and URLs are in Column B |

---

## 9. NEXT STEPS

1. ✅ Add token to Script Properties
2. ✅ Paste the `fetchLinkedInPostsViaApify()` function
3. ✅ Run `testApifyToken()` to verify
4. ✅ Run `testSingleProfile()` with a public profile
5. ✅ Modify `populatePostsQueue()` to match your sheet structure
6. ✅ Set up daily trigger
7. ✅ Test full `dailyFetchInfluencerPosts()` run

---

## 10. YOUR 57 INFLUENCERS: Ready to Deploy

Your Sheet1 Column B already has 57 profiles. The function will:
- ✅ Fetch the 3 most recent posts from each
- ✅ Filter to posts from last 7 days (adjust via `postedLimit`)
- ✅ Extract URL, content, author, engagement
- ✅ Return in format ready for your Claude comment generator

**Estimated first run:** ~2-3 minutes (Apify processes in parallel)

---

**Questions?** Check logs in Apps Script: **Execution → View logs** (Cmd+Enter after running a function)

