const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function generateBadgeScreenshot() {
    const userId = process.env.THM_USER_ID;
    const apiUrl = `https://tryhackme.com/api/v2/badges/public-profile?userPublicId=${userId}`;
    
    console.log('🚀 Starting TryHackMe badge generation...');
    console.log(`📡 Fetching badge from: ${apiUrl}`);
    
    let browser;
    try {
        // Launch browser
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });
        
        const page = await browser.newPage();
        
        // Set viewport to match badge size
        await page.setViewport({
            width: 400,
            height: 150,
            deviceScaleFactor: 2 // For better quality
        });
        
        console.log('🌐 Loading TryHackMe badge...');
        
        // Navigate to the badge URL
        await page.goto(apiUrl, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        // Wait for the badge to be fully loaded
        await page.waitForSelector('#thm-badge', { timeout: 10000 });
        
        // Additional wait to ensure all resources (fonts, images) are loaded
        await page.evaluate(() => {
            return new Promise((resolve) => {
                // Wait for fonts to load
                if (document.fonts) {
                    document.fonts.ready.then(resolve);
                } else {
                    setTimeout(resolve, 1000);
                }
            });
        });
        
        // Get the badge element
        const badgeElement = await page.$('#thm-badge');
        
        if (!badgeElement) {
            throw new Error('Badge element not found on page');
        }
        
        console.log('📸 Taking screenshot...');
        
        // Create assets directory if it doesn't exist
        const assetsDir = path.join(process.cwd(), 'assets');
        if (!fs.existsSync(assetsDir)) {
            fs.mkdirSync(assetsDir, { recursive: true });
        }
        
        // Take screenshot of the badge element
        const screenshotPath = path.join(assetsDir, 'tryhackme-badge.png');
        await badgeElement.screenshot({
            path: screenshotPath,
            omitBackground: true
        });
        
        console.log('✅ Badge screenshot saved successfully!');
        console.log(`📁 Location: ${screenshotPath}`);
        
        // Get some stats for logging
        const stats = await page.evaluate(() => {
            const username = document.querySelector('.user_name')?.textContent;
            const rank = document.querySelector('.rank-title')?.textContent;
            const trophies = document.querySelectorAll('.details-text')[0]?.textContent;
            const streak = document.querySelectorAll('.details-text')[1]?.textContent;
            
            return { username, rank, trophies, streak };
        });
        
        console.log('📊 Badge Stats:');
        console.log(`   Username: ${stats.username}`);
        console.log(`   Rank: ${stats.rank}`);
        console.log(`   Trophies: ${stats.trophies}`);
        console.log(`   Streak: ${stats.streak}`);
        
    } catch (error) {
        console.error('❌ Error generating badge:', error.message);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the function
generateBadgeScreenshot().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});