const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const y = await page.evaluate(() => {
    const el = document.querySelector('.experience-panel.lion');
    return el.getBoundingClientRect().top + window.scrollY - 300;
  });
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.waitForTimeout(500);
  await page.screenshot({ path: process.argv[2] });
  await browser.close();
})();
