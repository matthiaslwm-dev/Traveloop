const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type()==='error') errors.push(m.text()); });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  const outDir = process.argv[2];
  const points = {
    'seam-hero-arrival': 850,
    'seam-intro-lion': 2850,
    'seam-lion-batik': 3750,
    'seam-batik-indian': 4650,
    'seam-indian-taste': 5550,
    'seam-faq-closing': 10450,
  };
  for (const [name, y] of Object.entries(points)) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${outDir}/${name}.png` });
  }
  console.log('ERRORS', JSON.stringify(errors));
  await browser.close();
})();
