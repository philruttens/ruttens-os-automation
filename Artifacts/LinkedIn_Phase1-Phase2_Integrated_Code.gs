/**
 * INTEGRATED LINKEDIN AUTOMATION: Phase 1 (Comment Generation) + Phase 2 (Post Fetching)
 *
 * This script combines:
 * - Apify MCP for automated post fetching from 57 influencers
 * - Claude API for brand-aligned comment generation
 * - Google Sheets for queue management
 *
 * Setup:
 * 1. Add APIFY_TOKEN to Script Properties
 * 2. Add CLAUDE_API_KEY to Script Properties
 * 3. Paste all functions below into your Apps Script project
 * 4. Create daily trigger for dailyLinkedInWorkflow() at 9:00 AM
 */

// ============================================================================
// PHASE 2: APIFY POST FETCHING
// ============================================================================

/**
 * Fetch latest LinkedIn posts from influencer profiles via Apify
 * @param {string[]} profileUrls - Array of LinkedIn profile URLs
 * @param {number} maxPostsPerProfile - Max posts per profile (default: 3)
 * @param {string} postedLimit - Time filter: 'any', '24h', 'week', 'month'
 * @returns {Object[]} Array of posts: {url, content, postedDate, authorName, authorUrl, engagement}
 */
function fetchLinkedInPostsViaApify(profileUrls, maxPostsPerProfile = 3, postedLimit = 'week') {
  const APIFY_TOKEN = PropertiesService.getScriptProperties().getProperty('APIFY_TOKEN');

  if (!APIFY_TOKEN) {
    throw new Error('⚠️ APIFY_TOKEN not set in Script Properties.');
  }

  const ACTOR_ID = 'harvestapi/linkedin-profile-posts';
  const APIFY_API_URL = `https://api.apify.com/v2/acts/${ACTOR_ID}/runs`;

  const allPosts = [];

  try {
    const apifyInput = {
      targetUrls: profileUrls,
      maxPosts: maxPostsPerProfile,
      postedLimit: postedLimit,
      scrapeComments: false,
      scrapeReactions: false
    };

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
    Logger.log(`🚀 Apify run started: ${runId}`);

    let status = 'RUNNING';
    let attempts = 0;
    let datasetId = null;

    while (status === 'RUNNING' && attempts < 30) {
      Utilities.sleep(1500);

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
    }

    if (status !== 'SUCCEEDED') {
      throw new Error(`Apify run failed with status: ${status}`);
    }

    Logger.log(`✅ Apify succeeded. Dataset: ${datasetId}`);

    const itemsUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?clean=true`;
    const itemsResponse = UrlFetchApp.fetch(itemsUrl, {
      headers: { 'Authorization': `Bearer ${APIFY_TOKEN}` },
      muteHttpExceptions: true
    });

    const itemsData = JSON.parse(itemsResponse.getContentText());
    const items = itemsData || [];

    Logger.log(`📊 Fetched ${items.length} posts from Apify`);

    items.forEach(post => {
      allPosts.push({
        url: post.linkedinUrl || '',
        content: post.content || '',
        postedDate: post['postedAt.date'] || new Date().toISOString(),
        authorName: post['author.name'] || 'Unknown',
        authorUrl: post['author.linkedinUrl'] || '',
        engagement: {
          likes: post['engagement.likes'] || 0,
          comments: post['engagement.comments'] || 0,
          shares: post['engagement.shares'] || 0
        }
      });
    });

  } catch (error) {
    Logger.log(`❌ Error in Apify fetch: ${error}`);
    throw error;
  }

  return allPosts;
}

// ============================================================================
// PHASE 1: CLAUDE COMMENT GENERATION
// ============================================================================

/**
 * Generate an insightful comment using Claude API
 * @param {string} postContent - The LinkedIn post content
 * @param {string} authorName - Author's name
 * @returns {string} Generated comment text
 */
function generateInsightfulComment(postContent, authorName) {
  const CLAUDE_API_KEY = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');

  if (!CLAUDE_API_KEY) {
    throw new Error('⚠️ CLAUDE_API_KEY not set in Script Properties.');
  }

  const prompt = `You are Phil Ruttens, a revenue operations and GTM consultant (ruttens.com).

Generate a 2-3 sentence LinkedIn comment on this post by ${authorName}.

Style:
- Direct, data-driven, confident
- Reference specific metrics when relevant (% impact, benchmarks, case studies)
- Actionable, not generic praise
- Mention ruttens.com subtly if relevant for diagnostic/baseline checks
- European B2B focus (SME challenges, €-based examples)
- Focus on revenue impact, unit economics, or GTM strategy

Post content:
"${postContent}"

Generate ONLY the comment text, no preamble.`;

  const payload = {
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 150,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  };

  try {
    const response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const result = JSON.parse(response.getContentText());

    if (result.error) {
      throw new Error(`Claude API error: ${result.error.message}`);
    }

    const comment = result.content[0].text.trim();
    Logger.log(`✅ Generated comment for ${authorName}`);
    return comment;

  } catch (error) {
    Logger.log(`❌ Error generating comment: ${error}`);
    throw error;
  }
}

// ============================================================================
// INTEGRATION: COMBINED WORKFLOW
// ============================================================================

/**
 * Main daily workflow: Fetch posts → Generate comments → Save to sheet
 * This is your PRIMARY DAILY TRIGGER (9:00 AM)
 */
function dailyLinkedInWorkflow() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet1 = spreadsheet.getSheetByName('Sheet1');

  try {
    // Step 1: Get all profile URLs from Sheet1 Column B
    Logger.log('📋 Step 1: Reading influencer profiles...');
    const data = sheet1.getRange('B:B').getValues();
    const profileUrls = data
      .flat()
      .filter(url => url && url.includes('linkedin.com/in/'));

    Logger.log(`Found ${profileUrls.length} influencer profiles`);

    if (profileUrls.length === 0) {
      Logger.log('⚠️ No LinkedIn profiles found');
      return;
    }

    // Step 2: Fetch posts from all profiles
    Logger.log('🚀 Step 2: Fetching posts via Apify...');
    const posts = fetchLinkedInPostsViaApify(profileUrls, 3, 'week');
    Logger.log(`✅ Fetched ${posts.length} posts`);

    if (posts.length === 0) {
      Logger.log('⚠️ No posts found');
      return;
    }

    // Step 3: Generate comments for each post
    Logger.log('💬 Step 3: Generating comments...');
    const postsWithComments = posts.map(post => {
      try {
        const comment = generateInsightfulComment(post.content, post.authorName);
        return {
          ...post,
          comment: comment,
          status: '✅ Ready to Post'
        };
      } catch (error) {
        Logger.log(`⚠️ Failed to generate comment for ${post.authorName}: ${error}`);
        return {
          ...post,
          comment: '[Comment generation failed]',
          status: '❌ Error'
        };
      }
    });

    // Step 4: Save to sheet
    Logger.log('📝 Step 4: Saving to sheet...');
    saveResultsToSheet(postsWithComments);

    Logger.log(`✅ Daily workflow complete. ${postsWithComments.length} posts processed.`);

  } catch (error) {
    Logger.log(`❌ Daily workflow failed: ${error}`);
    // Optional: Send email alert
    // GmailApp.sendEmail('your-email@gmail.com', 'LinkedIn Automation Failed', error);
  }
}

/**
 * Save fetched posts and generated comments to sheet
 * @param {Object[]} postsWithComments - Array of posts with comments
 */
function saveResultsToSheet(postsWithComments) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let resultsSheet = spreadsheet.getSheetByName('Comments Ready');

  // Create sheet if it doesn't exist
  if (!resultsSheet) {
    resultsSheet = spreadsheet.insertSheet('Comments Ready');
    // Add headers
    resultsSheet.getRange(1, 1, 1, 7).setValues([
      ['Date', 'Author', 'Post URL', 'Post Preview', 'Generated Comment', 'Status', 'Posted?']
    ]);
  }

  const today = new Date().toLocaleDateString();
  const existingUrls = new Set(
    resultsSheet.getRange(2, 3, Math.max(0, resultsSheet.getLastRow() - 1)).getValues().flat()
  );

  postsWithComments.forEach(post => {
    // Skip duplicates
    if (existingUrls.has(post.url)) {
      Logger.log(`⏭️ Skipped duplicate: ${post.url}`);
      return;
    }

    const lastRow = resultsSheet.getLastRow() + 1;
    const preview = post.content.substring(0, 100) + '...';

    resultsSheet.getRange(lastRow, 1, 1, 7).setValues([[
      today,
      post.authorName,
      post.url,
      preview,
      post.comment,
      post.status,
      'NO'
    ]]);

    Logger.log(`➕ Added: ${post.authorName}`);
  });

  Logger.log(`📊 Saved ${postsWithComments.length} results to "Comments Ready" sheet`);
}

// ============================================================================
// TESTING FUNCTIONS
// ============================================================================

/**
 * Test 1: Verify API keys are set
 */
function testApiKeys() {
  const apifyToken = PropertiesService.getScriptProperties().getProperty('APIFY_TOKEN');
  const claudeKey = PropertiesService.getScriptProperties().getProperty('CLAUDE_API_KEY');

  Logger.log(`APIFY_TOKEN set: ${apifyToken ? '✅' : '❌'}`);
  Logger.log(`CLAUDE_API_KEY set: ${claudeKey ? '✅' : '❌'}`);
}

/**
 * Test 2: Fetch posts from a single profile
 */
function testFetchPosts() {
  const testUrl = 'https://www.linkedin.com/in/satyanadella/';
  try {
    const posts = fetchLinkedInPostsViaApify([testUrl], 3, 'week');
    Logger.log(`✅ Fetched ${posts.length} posts`);
    posts.forEach((p, i) => {
      Logger.log(`Post ${i + 1}: "${p.content.substring(0, 60)}..." (${p.engagement.likes}L, ${p.engagement.comments}C)`);
    });
  } catch (error) {
    Logger.log(`❌ Fetch failed: ${error}`);
  }
}

/**
 * Test 3: Generate a comment
 */
function testGenerateComment() {
  const samplePost = "New AI breakthrough in enterprise automation. The future is agents, not just chatbots.";
  const author = "Test Author";

  try {
    const comment = generateInsightfulComment(samplePost, author);
    Logger.log(`✅ Generated comment:\n${comment}`);
  } catch (error) {
    Logger.log(`❌ Generation failed: ${error}`);
  }
}

/**
 * Test 4: Full integration (small test)
 */
function testFullIntegration() {
  const urls = ['https://www.linkedin.com/in/satyanadella/'];

  try {
    Logger.log('Fetching posts...');
    const posts = fetchLinkedInPostsViaApify(urls, 1, 'week');

    if (posts.length === 0) {
      Logger.log('No posts found');
      return;
    }

    Logger.log(`Generating comment for: ${posts[0].authorName}`);
    const comment = generateInsightfulComment(posts[0].content, posts[0].authorName);

    Logger.log(`✅ Success!\nPost: ${posts[0].content.substring(0, 100)}...\nComment: ${comment}`);
  } catch (error) {
    Logger.log(`❌ Test failed: ${error}`);
  }
}

// ============================================================================
// SETUP HELPERS
// ============================================================================

/**
 * Verify sheet structure and create missing sheets
 */
function verifySheetStructure() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // Check Sheet1
  const sheet1 = spreadsheet.getSheetByName('Sheet1');
  if (!sheet1) {
    Logger.log('⚠️ Sheet1 not found. Add your influencer profiles there.');
    return;
  }

  // Create "Comments Ready" if missing
  if (!spreadsheet.getSheetByName('Comments Ready')) {
    Logger.log('Creating "Comments Ready" sheet...');
    spreadsheet.insertSheet('Comments Ready');
  }

  Logger.log('✅ Sheet structure verified');
}

/**
 * Create daily trigger at 9 AM (manual setup required)
 * This function documents what needs to be done:
 * 1. Go to Triggers (clock icon in editor)
 * 2. Create new trigger
 * 3. Function: dailyLinkedInWorkflow
 * 4. Event type: Time-driven
 * 5. Frequency: Daily
 * 6. Time: 9:00 AM - 10:00 AM
 * 7. Save & authorize
 */
function setupDailyTrigger() {
  Logger.log('📌 Manual Setup Required:');
  Logger.log('1. Click Triggers (clock icon, left sidebar)');
  Logger.log('2. Create new trigger');
  Logger.log('3. Function: dailyLinkedInWorkflow');
  Logger.log('4. Event: Time-driven');
  Logger.log('5. Type: Daily');
  Logger.log('6. Time: 9:00 AM');
  Logger.log('7. Save and authorize');
}
