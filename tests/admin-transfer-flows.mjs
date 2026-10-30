import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Uses an isolated SQLite backend on :8187. Never forwards an API call to production.
const auth = JSON.parse(fs.readFileSync('/tmp/mgpjn-transfer-browser-auth.json', 'utf8'));
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const errors = [], searches = [], posts = [];
let failSearch = false;
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const click = (text) => page.evaluate((value) => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === value)?.click(), text);
const waitText = (text) => page.waitForFunction((value) => document.body.innerText.includes(value), {}, text);
const waitResult = (text) => page.waitForFunction((value) => document.querySelector('[role="listbox"]')?.textContent.includes(value), {}, text);
const fill = async (selector, value) => {
  await page.$eval(selector, (el) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '');
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.type(selector, value, { delay: 30 });
};
page.on('pageerror', (err) => errors.push(err.message));
await page.setRequestInterception(true);
page.on('request', async (req) => {
  if (!req.url().includes('/api/v1/')) return req.continue();
  const u = new URL(req.url());
  const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' };
  try {
    if (req.method() === 'OPTIONS') return await req.respond({ status: 204, headers });
    if (u.pathname.endsWith('/transfers/users')) {
      searches.push({ query: u.searchParams.get('search'), role: u.searchParams.get('role'), at: Date.now() });
      if (failSearch) return await req.respond({ status: 503, headers, contentType: 'application/json', body: JSON.stringify({ message: 'Search temporarily unavailable' }) });
      if (u.searchParams.get('search') === 'stale') await pause(1200);
    }
    if (req.method() !== 'GET') {
      assert.equal(u.pathname, '/api/v1/admin/transfers', 'Unexpected API write');
      posts.push(JSON.parse(req.postData()));
      await pause(250);
    }
    const response = await fetch(`http://127.0.0.1:8187${u.pathname}${u.search}`, {
      method: req.method(), headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
      ...(req.postData() ? { body: req.postData() } : {}),
    });
    await req.respond({ status: response.status, headers, contentType: 'application/json', body: await response.text() });
  } catch (err) { if (!req.isInterceptResolutionHandled()) await req.abort().catch(() => {}); }
});
fs.mkdirSync('/tmp/mgpjn-transfer-proof', { recursive: true });
try {
  await page.setViewport({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0' });
  await page.evaluate(({ token, user }) => { sessionStorage.setItem('mediglaxo_session_token', token); sessionStorage.setItem('mediglaxo_session_user', JSON.stringify(user)); }, auth);
  await page.goto('http://127.0.0.1:5173/admin/transfers', { waitUntil: 'networkidle0' });
  await click('Create Transfer'); await page.waitForSelector('[role="dialog"]');
  await page.type('[role="combobox"]', '9876543210', { delay: 40 });
  const finished = Date.now();
  assert.equal(searches.length, 0, 'No search while typing');
  await pause(200); assert.equal(searches.length, 0, 'Debounce must wait');
  await waitResult('Customer Search Target');
  assert.equal(searches.length, 1); assert.equal(searches[0].query, '9876543210');
  assert(searches[0].at - finished >= 300); assert.equal(searches[0].role, 'customer');
  await page.screenshot({ path: '/tmp/mgpjn-transfer-proof/mobile-search.png' });
  await page.click('[role="listbox"] button');
  await page.type('[role="combobox"]', 'PARENT902'); await waitResult('New Sponsor'); await page.click('[role="listbox"] button');
  await page.type('input[placeholder="Reason for this transfer"]', 'Browser migration check');
  await page.screenshot({ path: '/tmp/mgpjn-transfer-proof/mobile-selected.png' });
  await click('Execute Transfer'); await click('Execute Transfer');
  await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
  assert.equal(posts.length, 1); assert.equal(posts[0].mode, 'tree_migration'); assert.equal(posts[0].user_id, 901); assert.equal(posts[0].new_parent_id, 902);
  await waitText('Browser migration check');
  await click('Create Transfer');
  await page.type('[role="combobox"]', '#901'); await waitResult('Customer Search Target'); await page.click('[role="listbox"] button');
  await page.type('[role="combobox"]', 'CHILD903'); await waitResult('Existing Child'); await page.click('[role="listbox"] button');
  await click('Execute Transfer'); await waitText('Cannot move a user under themselves or their downline.');
  assert(await page.$('[role="dialog"]'), 'Validation preserves form');
  await click('Wallet Fund Transfer');
  failSearch = true;
  await page.type('[role="combobox"]', 'CUSTOMER901'); await waitText('Search temporarily unavailable');
  failSearch = false; await click('Retry'); await waitResult('Customer Search Target');
  await fill('[role="combobox"]', 'stale'); await pause(600);
  await fill('[role="combobox"]', '9876543210'); await waitResult('Customer Search Target'); await pause(1300);
  assert.equal(await page.$eval('[role="listbox"]', (e) => e.textContent.includes('Customer Search Target')), true, 'Stale response cannot replace new results');
  await page.click('[role="listbox"] button');
  await page.type('input[type="number"]', '25');
  await click('Execute Transfer'); await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
  assert.equal(posts.at(-1).mode, 'wallet_transfer'); assert.equal(posts.at(-1).receiver_code, 'CUSTOMER901'); assert(!('user_id' in posts.at(-1)));
  await click('Create Transfer'); await click('Wallet Fund Transfer');
  await page.type('[role="combobox"]', '901'); await waitResult('Customer Search Target'); await page.click('[role="listbox"] button');
  await page.type('input[type="number"]', '100'); await page.select('[role="dialog"] select', 'admin_debit');
  await click('Execute Transfer'); await waitText('Insufficient wallet balance.');
  await fill('input[type="number"]', '10'); await click('Execute Transfer'); await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
  await click('Create Transfer'); await page.type('[role="combobox"]', 'missing-member'); await waitText('No matching users found.');
  await fill('[role="combobox"]', '9876543210'); await waitResult('Customer Search Target'); await page.click('[role="listbox"] button');
  await page.select('[role="dialog"] select', 'Distributor');
  assert.equal(await page.$eval('[role="combobox"]', (el) => el.value), '');
  assert.equal(await page.$eval('[role="dialog"] button[type="submit"]', (el) => el.disabled), true);
  await page.setViewport({ width: 1440, height: 1000 });
  await page.select('[role="dialog"] select', 'Customer');
  await page.type('[role="combobox"]', 'CUSTOMER901'); await waitResult('Customer Search Target');
  await page.screenshot({ path: '/tmp/mgpjn-transfer-proof/desktop-search.png' });
  assert.deepEqual(errors, []);
  console.log('PASS: real isolated API/SQLite; 450ms debounce, mobile/ID/referral search, role reset, stale response, retry/empty state, migration/history, cycle refusal, wallet credit/debit, duplicate-submit guard, mobile/desktop layout.');
} catch (err) { console.log(JSON.stringify({ searches, fields: await page.$$eval('[role="combobox"]', es => es.map(e=>e.value)), dialog: await page.$eval('[role="dialog"]', e=>e.innerText).catch(()=>null) })); await page.screenshot({path:'/tmp/mgpjn-transfer-proof/failure.png'}); throw err; } finally { await browser.close(); }
