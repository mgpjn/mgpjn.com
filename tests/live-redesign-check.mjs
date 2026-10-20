import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const base = 'https://www.mgpjn.com';
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const errors = []; page.on('pageerror', (error) => errors.push(error.message));
try {
 for (const width of [390, 768, 1440]) {
   await page.setViewport({ width, height: 1000 });
   await page.goto(base, { waitUntil: 'networkidle0' });
   await page.waitForFunction(() => document.body.innerText.includes('Care for every part of your day'), { timeout: 30000 });
   assert.doesNotMatch(await page.evaluate(() => document.body.innerText), /navratri|navaratri|festive|vrat|jai mata/i);
   await page.waitForFunction(() => [...document.querySelectorAll('img[src*="/images/healthcare/"]')].length >= 2 && [...document.querySelectorAll('img[src*="/images/healthcare/"]')].every((img) => img.complete && img.naturalWidth > 0));
   assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Page overflow at ${width}`);
   await page.screenshot({ path: `/tmp/mgpjn-redesign/live-${width}.png`, fullPage: false });
 }
 for (const path of ['/mlm/referrals','/mlm/tree','/hierarchy']) {
   await page.goto(base + path, { waitUntil: 'networkidle0' });
   assert(new URL(page.url()).pathname === '/login', `Unprotected route ${path}`);
 }
 const banners = await (await fetch('https://api.mgpjn.com/api/v1/banners')).json();
 assert(banners.banners.every((banner) => banner.image.includes('/images/healthcare/')));
 const coupons = await (await fetch('https://api.mgpjn.com/api/v1/coupons/active')).json();
 assert.doesNotMatch(JSON.stringify(coupons), /navratri/i);
 for (const path of ['team-members','referrals','dashboard','tree']) {
   const response = await fetch(`https://api.mgpjn.com/api/v1/mlm/${path}`, { headers: { Accept: 'application/json' } });
   assert.equal(response.status, 401, `Unauthenticated ${path}`);
 }
 assert.deepEqual(errors, []);
 console.log('PASS live: healthcare homepage at 390/768/1440px, medical images loaded, no festival text/page overflow/browser errors; private pages redirect to login; member APIs reject guests; active coupons exclude retired campaign. No production data written.');
} finally { await browser.close(); }
