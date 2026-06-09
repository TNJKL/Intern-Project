const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });
  
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText);
  });

  try {
    await page.goto('http://localhost:5173/admin/users', { waitUntil: 'networkidle0', timeout: 10000 });
  } catch (e) {
    console.log('NAVIGATION ERROR:', e.message);
  }
  
  await browser.close();
})();
