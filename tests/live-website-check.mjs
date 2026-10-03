// Read-only production smoke test in an isolated browser; no login, signup, order or payment is submitted.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox'], defaultViewport: { width: 1440, height: 1000 } });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (err) => errors.push(err.message));
page.on('requestfailed', (req) => console.log('FAILED REQUEST', req.url(), req.failure()?.errorText));
try {
  const login = await page.goto('https://mgpjn.com/login', { waitUntil: 'networkidle2' });
  assert.equal(login.status(), 200);
  await page.waitForSelector('[aria-label="Quick login"]');
  assert(await page.$('[aria-label="PIN login mobile number"]'));
  assert(await page.$('[aria-label="6-digit Login PIN"]'));
  assert(await page.evaluate(() => document.body.innerText.includes('Login with PIN')));
  const bundle = await page.$eval('script[type="module"]', (el) => el.getAttribute('src'));
  assert.match(bundle, /^\/assets\/index-.*\.js$/);
  await page.screenshot({ path: '/tmp/mgpjn-verification/live-login.png', fullPage: true });
  const signup = await page.goto('https://mgpjn.com/register', { waitUntil: 'networkidle2' });
  assert.equal(signup.status(), 200);
  assert.equal(await page.$eval('[name="email"]', (el) => el.required), true);
  assert(await page.evaluate(() => document.body.innerText.includes('Set up your login PIN after signup.')));
  await page.evaluate(() => localStorage.setItem('mediglaxo_cart', JSON.stringify([{ id: 7, name: 'Browser Review Item', retail_price: 150, price: 150, mrp: 180, quantity: 2, stock: 100 }])));
  const checkout = await page.goto('https://mgpjn.com/checkout', { waitUntil: 'networkidle2' });
  assert.equal(checkout.status(), 200); await page.waitForSelector('#coupon-code');
  await page.type('#coupon-code', 'FREEDEL');
  await page.evaluate(() => [...document.querySelectorAll('button')].find((el) => el.textContent.trim() === 'Apply').click());
  await page.waitForFunction(() => document.body.innerText.includes('Sign in to apply a coupon to your order.'));
  await page.setViewport({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: '/tmp/mgpjn-verification/live-checkout-mobile.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log('PASS: live login/signup/checkout HTTP 200, expected published bundle, PIN + email/mobile OTP UI, signup PIN notice, coupon sign-in gate, mobile layout; no browser errors. No real forms submitted.');
} catch (err) {
  console.log('Published page', page.url()); console.log('Runtime errors', errors);
  console.log('Loaded bundle', await page.$eval('script[type="module"]', (el) => el.src));
  console.log('Page text', (await page.evaluate(() => document.body.innerText)).slice(0, 1800));
  await page.screenshot({ path: '/tmp/mgpjn-verification/live-failure.png', fullPage: true });
  throw err;
} finally { await browser.close(); }
