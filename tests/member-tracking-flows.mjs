import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const errors = []; page.on('pageerror', (err) => errors.push(err.message));
const user = { id: 90, name: 'Test Sponsor', role: 'customer', status: 'active', referral_code: 'TEST90' };
const member = { id: 91, name: 'New Test Member', referral_code: 'TEST91', role: 'customer', status: 'active', created_at: '2026-10-20T06:15:00.000000Z', sponsor_id: 90, sponsor: { id: 90, name: 'Test Sponsor', referral_code: 'TEST90' } };
let fail = false, lastUrl;
await page.setRequestInterception(true);
page.on('request', async (req) => {
 if (!req.url().includes('/api/v1/')) return req.continue();
 const path = new URL(req.url()).pathname;
 const result = { success: true, products: [], categories: [], banners: [], data: [] };
 let status = 200;
 if (path.endsWith('/auth/profile')) result.user = user;
 if (path.endsWith('/mlm/referrals') || path.endsWith('/mlm/team-members')) {
   lastUrl = new URL(req.url());
   if (fail) status = 500;
   else result[path.endsWith('/referrals') ? 'referrals' : 'members'] = { data: lastUrl.searchParams.get('search') === 'empty' ? [] : [member, { ...member, id: 92, name: 'Historical member', created_at: null }], total: 22, last_page: 2 };
 }
 if (path.endsWith('/mlm/dashboard')) Object.assign(result, { stats: {}, recentJoins: [member], customer_orders: [] });
 if (path.endsWith('/mlm/tree')) result.tree = { ...user, created_at: member.created_at, children: [member] };
 await req.respond({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' }, body: JSON.stringify(result) });
});
const waitText = (text) => page.waitForFunction((value) => document.body.innerText.includes(value), {}, text);
const clickText = (text) => page.evaluate((value) => [...document.querySelectorAll('button')].find((el) => el.textContent.trim() === value)?.click(), text);
fs.mkdirSync('/tmp/mgpjn-redesign', { recursive: true });
try {
 for (const width of [390, 768, 1440]) {
   await page.setViewport({ width, height: 1000 });
   await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' });
   const body = await page.evaluate(() => document.body.innerText);
   assert.doesNotMatch(body, /navratri|festive|vrat|jai mata/i);
   const images = await page.$$eval('img[src*="/images/healthcare/"]', (items) => items.map((img) => ({ loaded: img.complete && img.naturalWidth > 0, width: img.getBoundingClientRect().width })));
   assert(images.length >= 2); assert(images.every((img) => img.loaded && img.width <= width));
   assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Overflow at ${width}`);
   await page.screenshot({ path: `/tmp/mgpjn-redesign/home-${width}.png`, fullPage: false });
 }
 await page.evaluate((value) => { sessionStorage.setItem('mediglaxo_session_token', 'isolated-test'); sessionStorage.setItem('mediglaxo_session_user', JSON.stringify(value)); }, user);
 await page.goto('http://127.0.0.1:5173/mlm/referrals', { waitUntil: 'networkidle0' });
 await waitText('11:45 am IST'); await waitText('Not recorded'); await waitText('TEST90');
 await page.select('[aria-label="Member scope"]', 'team'); await waitText('New Test Member');
 await page.waitForFunction(() => document.querySelector('[aria-busy]')?.getAttribute('aria-busy') === 'false');
 assert(lastUrl.pathname.endsWith('/team-members'));
 await clickText('Next'); await page.waitForFunction(() => document.body.innerText.includes('Page 2 of 2'));
 await page.waitForFunction(() => document.querySelector('[aria-busy]')?.getAttribute('aria-busy') === 'false');
 assert.equal(lastUrl.searchParams.get('page'), '2');
 await page.screenshot({ path: '/tmp/mgpjn-redesign/members-desktop.png', fullPage: false });
 fail = true; await clickText('Refresh'); await waitText('Unable to load members');
 fail = false; await clickText('Retry'); await waitText('New Test Member');
 await page.type('[aria-label="Search members"]', 'empty'); await waitText('No members found');
 await page.setViewport({ width: 390, height: 844 });
 await page.goto('http://127.0.0.1:5173/mlm', { waitUntil: 'networkidle0' }); await waitText('Recent team joins'); await waitText('11:45 am IST');
 await page.screenshot({ path: '/tmp/mgpjn-redesign/recent-joins-mobile.png', fullPage: false });
 await page.goto('http://127.0.0.1:5173/mlm/tree', { waitUntil: 'networkidle0' }); await waitText('11:45 am IST');
 assert.deepEqual(errors, []);
 console.log('PASS: healthcare banners at 390/768/1440px, no festival content, images loaded, no page overflow, member IST time/sponsor/status, missing-history label, team scope, pagination, empty/error/retry, recent joins and genealogy. APIs mocked.');
} finally { await browser.close(); }
