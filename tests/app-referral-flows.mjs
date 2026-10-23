import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base = process.env.BASE_URL || 'http://127.0.0.1:5190';
const live = base.startsWith('https:');
const out = '/tmp/mgpjn-app-referrals';
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
if (!live) {
 await page.setRequestInterception(true);
 page.on('request', request => {
  if (!request.url().includes('/api/v1/')) return request.continue();
  assert.equal(request.method(), 'GET', 'Browser verification must not write any data');
  const data = request.url().includes('/verify-sponsor/')
   ? { success: true, sponsor: { name: 'Test Inviter', referral_code: 'MGREFTEST', role: 'customer' } }
   : { success: true, data: [], categories: [], products: [], banners: [], coupons: [] };
  return request.respond({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(data) });
 });
}
try {
 for (const width of [390, 768, 1440]) {
  await page.setViewport({ width, height: 1000 });
  await page.setUserAgent(width === 390 ? 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36');
  await page.goto(base + '/invite?ref=MGREFTEST', { waitUntil: 'networkidle0' });
  assert.equal(await page.$eval('[data-testid="referral-code"]', e => e.textContent), 'MGREFTEST');
  const allPlayLinks = await page.$$eval('a[href^="https://play.google.com/"]', nodes => nodes.map(e => e.href));
  assert(allPlayLinks.length > 0);
  for (const href of allPlayLinks) assert.equal(new URLSearchParams(new URL(href).searchParams.get('referrer')).get('ref'), 'MGREFTEST', 'Every invite-page download link must retain the code');
  const playUrl = await page.$eval('[data-testid="referral-play-store"]', e => e.href);
  assert.equal(new URLSearchParams(new URL(playUrl).searchParams.get('referrer')).get('ref'), 'MGREFTEST');
  const target = await page.$eval('[data-testid="open-referral-app"]', e => e.getAttribute('href'));
  assert.equal(target.startsWith('intent://'), width === 390);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Overflow at ${width}`);
  await page.screenshot({ path: `${out}/${live ? 'live' : 'local'}-${width}.png`, fullPage: true });
 }
 await page.click('[data-testid="website-referral-signup"]');
 await page.waitForFunction(() => location.pathname === '/register' && document.querySelector('input[name="name"]'));
 assert.equal(new URL(page.url()).searchParams.get('ref'), 'MGREFTEST');
 assert.equal(await page.evaluate(() => localStorage.getItem('mediglaxo_sponsor_code')), 'MGREFTEST');
 if (!live) await page.waitForFunction(() => document.body.innerText.includes('Test Inviter'));
 await page.goto(base + '/register?ref=MGREFTEST', { waitUntil: 'networkidle0' });
 assert.equal(new URL(page.url()).pathname, '/register');
 assert(await page.$('input[name="name"]'));
 await page.goto(base + '/login', { waitUntil: 'networkidle0' });
 assert(await page.$('[aria-label="PIN login mobile number"]'));
 await page.goto(base + '/app', { waitUntil: 'networkidle0' });
 assert(await page.evaluate(() => [...document.querySelectorAll('a[href*="play.google.com"]')].some(a => !new URL(a.href).searchParams.has('referrer'))));
 await page.goto(base + '/invite?ref=%3Cscript%3E', { waitUntil: 'networkidle0' });
 assert.equal(await page.$('[data-testid="referral-code"]'), null);
 assert.equal(await page.evaluate(() => localStorage.getItem('mediglaxo_sponsor_code')), 'MGREFTEST');
 assert.match(await page.$eval('[role="status"]', e => e.textContent), /no valid referral code/);
 assert.deepEqual(errors, []);
 console.log(`PASS ${base}: Android intent and Play referrer, 390/768/1440px, website continuation, old register URL, PIN login, ordinary download link, invalid-code handling; no production writes.`);
} finally { await browser.close(); }
