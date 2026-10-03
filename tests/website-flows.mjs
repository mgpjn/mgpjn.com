import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const user = { id: 99, name: 'Browser Test Customer', email: 'test@example.test', phone: '9876543210', role: 'customer', status: 'active', wallet_balance: 100, address: 'Test Street', city: 'Surat', state: 'Gujarat', pincode: '394230' };
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--no-sandbox'], defaultViewport: { width: 1440, height: 1000 } });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (err) => errors.push(err.message));
let orderPayload, gatewayPayload, expired = false, failQuote = false, priceChange = false;
const summaryFor = (payload) => {
  const delivery = payload.delivery_type === 'takeaway' || payload.coupon_code === 'FREEDEL' ? 0 : 50;
  const cod = (payload.other_payment_method || payload.payment_method) === 'cod' ? 10 : 0;
  const discount = payload.coupon_code === 'SAVE30' ? 30 : 0;
  const total = 300 + delivery + 5 + cod - discount + (priceChange ? 5 : 0);
  const wallet = Math.min(total, payload.wallet_amount_used || 0);
  return { subtotal: 300, delivery_charge: delivery, platform_fee: 5 + (priceChange ? 5 : 0), cod_charge: cod,
    coupon_discount: discount, delivery_discount: payload.coupon_code === 'FREEDEL' ? 50 : 0,
    total_amount: total, wallet_used: wallet, payable_now: total - wallet,
    payment_method: wallet >= total ? 'wallet' : wallet > 0 ? 'wallet_split' : payload.payment_method,
    other_method: wallet >= total ? null : payload.other_payment_method, payment_status: 'pending' };
};
const response = (data, status = 200) => ({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' }, body: JSON.stringify(data) });
await page.setRequestInterception(true);
page.on('request', async (req) => {
  if (req.url().includes('checkout.razorpay.com/v1/checkout.js')) return req.respond({ status: 200, contentType: 'text/javascript', body: 'window.Razorpay = class { constructor(options) { window.testRazorpayOptions = options; } open() {} };' });
  if (!req.url().includes('/api/v1/')) return req.continue();
  if (req.method() === 'OPTIONS') return req.respond(response({}));
  const path = new URL(req.url()).pathname.replace('/api/v1', '');
  const payload = req.postData() ? JSON.parse(req.postData()) : {};
  let data = { success: true, products: [], categories: [], data: [] }, status = 200;
  if (path === '/auth/profile') { data = expired ? { success: false, message: 'Unauthenticated' } : { success: true, user }; if (expired) status = 401; }
  if (path === '/auth/register' || path === '/auth/login' || path === '/auth/login-otp') data = { success: true, token: 'browser-test-token', user };
  if (path === '/auth/send-login-otp') data = { success: true, masked_to: 'te***@example.test', channel: 'email' };
  if (path === '/mlm/wallet') data = { success: true, balance: 100, transactions: [] };
  if (path === '/coupons/active') data = { success: true, coupons: [{ code: 'SAVE30', title: 'Save ₹30' }] };
  if (path === '/orders/quote') {
    if (failQuote || (payload.coupon_code && !['SAVE30', 'FREEDEL'].includes(payload.coupon_code))) { data = { success: false, message: 'Invalid coupon', errors: { coupon_code: ['Coupon code is not valid or has expired.'] } }; status = 422; }
    else data = { success: true, payment_summary: summaryFor(payload), items: [{ product_id: 7, name: 'Test Medicine', unit_price: 150, quantity: 2, total_price: 300 }] };
  }
  if (path === '/orders') { orderPayload = payload; data = { success: true, order: { id: 101, order_number: 'TEST101', items: [] }, payment_summary: summaryFor(payload) }; }
  if (path === '/payment/create-razorpay-order') { gatewayPayload = payload; data = { success: true, amount: Math.round(payload.amount * 100), key_id: 'test', razorpay_order_id: 'order_test', currency: 'INR' }; }
  await req.respond(response(data, status));
});
const clickText = async (text) => {
  const clicked = await page.evaluate((label) => { const el = [...document.querySelectorAll('button,a')].find((node) => node.textContent.trim() === label); if (el) el.click(); return Boolean(el); }, text);
  assert.equal(clicked, true, `Missing action: ${text}`);
};
const waitText = (text) => page.waitForFunction((label) => document.body.innerText.includes(label), {}, text);
const cart = [{ id: 7, name: 'Test Medicine', retail_price: 150, price: 150, mrp: 180, stock: 100, quantity: 2 }];
fs.mkdirSync('/tmp/mgpjn-verification', { recursive: true });
try {
  await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'networkidle0' });
  assert.equal(await page.$('vite-error-overlay'), null);
  await waitText('Login with PIN');
  assert(await page.$('[aria-label="PIN login mobile number"]'));
  assert(await page.$('[aria-label="6-digit Login PIN"]'));
  await page.type('[aria-label="PIN login mobile number"]', user.phone);
  await clickText('Use OTP to set up PIN');
  assert.equal(await page.$eval('[aria-label="Registered Mobile / Email"]', (el) => el.value), user.phone);
  await page.screenshot({ path: '/tmp/mgpjn-verification/login-desktop.png', fullPage: true });
  await page.goto('http://127.0.0.1:5173/register?redirect=/checkout', { waitUntil: 'networkidle0' });
  await page.evaluate((items) => localStorage.setItem('mediglaxo_cart', JSON.stringify(items)), cart);
  await page.reload({ waitUntil: 'networkidle0' });
  for (const [name, value] of Object.entries({ name: user.name, email: user.email, phone: user.phone, password: 'Example987!' })) await page.type(`[name="${name}"]`, value);
  await page.$eval('[name="password"]', (el) => el.form.requestSubmit());
  await waitText('Login Security');
  await page.type('[aria-label="New login PIN"]', '739285'); await page.type('[aria-label="Confirm login PIN"]', '739285');
  await clickText('Save Login PIN'); await waitText('Login PIN enabled'); await clickText('Continue');
  await waitText('Apply Coupon Code');
  await page.evaluate(() => { localStorage.removeItem('mediglaxo_token'); localStorage.removeItem('mediglaxo_user'); localStorage.removeItem('mediglaxo_login_time'); });
  await page.goto('http://127.0.0.1:5173/login?redirect=/checkout', { waitUntil: 'networkidle0' });
  await page.type('[aria-label="PIN login mobile number"]', user.phone);
  await page.type('[aria-label="6-digit Login PIN"]', '827394');
  await page.click('[aria-label="Quick login"] button'); await waitText('Incorrect PIN');
  await page.$eval('[aria-label="6-digit Login PIN"]', (el) => { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.click('[aria-label="6-digit Login PIN"]', { clickCount: 3 }); await page.type('[aria-label="6-digit Login PIN"]', '739285');
  await page.locator('[aria-label="PIN login mobile number"]').fill('9876543211');
  assert.equal(await page.$eval('[aria-label="PIN login mobile number"]', (el) => el.value), '9876543211');
  await page.click('[aria-label="Quick login"] button'); await waitText('This mobile number does not match');
  await page.locator('[aria-label="PIN login mobile number"]').fill(user.phone);
  await page.click('[aria-label="Quick login"] button'); await waitText('Order amount verified');
  await page.type('#coupon-code', 'save30'); await clickText('Apply'); await waitText('SAVE30 applied');
  const amount = () => page.evaluate(() => [...document.querySelectorAll('div')].find((el) => el.children.length === 2 && el.firstElementChild.textContent === 'Total Payable Now')?.lastElementChild.textContent);
  assert.equal(await amount(), '₹235.00');
  await page.click('#coupon-code', { clickCount: 3 }); await page.type('#coupon-code', 'EXPIRED'); await clickText('Apply'); await waitText('Coupon code is not valid or has expired.');
  assert.equal(await amount(), '₹235.00');
  await clickText('Remove'); await waitText('Order amount verified'); assert.equal(await amount(), '₹265.00');
  await page.click('[name="payment_method"][value="takeaway"]'); await waitText('Order amount verified'); assert.equal(await amount(), '₹205.00');
  await page.click('#coupon-code', { clickCount: 3 }); await page.type('#coupon-code', 'FREEDEL'); await clickText('Apply'); await waitText('FREEDEL applied');
  await page.click('[name="payment_method"][value="cod"]'); await waitText('Order amount verified'); assert.equal(await amount(), '₹215.00');
  await clickText('Remove'); await waitText('Order amount verified');
  await page.click('[name="payment_method"][value="online"]'); await waitText('Order amount verified'); assert.equal(await amount(), '₹255.00');
  await page.click('#coupon-code', { clickCount: 3 }); await page.type('#coupon-code', 'SAVE30'); await clickText('Apply'); await waitText('SAVE30 applied'); assert.equal(await amount(), '₹225.00');
  await page.setViewport({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: '/tmp/mgpjn-verification/checkout-mobile.png', fullPage: true });
  await page.setViewport({ width: 1440, height: 1000 });
  failQuote = true; await page.click('[name="payment_method"][value="upi_qr"]'); await waitText('Coupon code is not valid or has expired.');
  assert.equal(await page.$eval('form.grid button[type="submit"]', (el) => el.disabled), true);
  failQuote = false; await clickText('Retry verification'); await waitText('Order amount verified');
  priceChange = true; await page.click('form.grid button[type="submit"]'); await waitText('Your order amount has changed.'); assert.equal(orderPayload, undefined);
  priceChange = false; await page.click('[name="payment_method"][value="online"]'); await waitText('Order amount verified');
  await page.click('form.grid button[type="submit"]'); await page.waitForFunction(() => window.testRazorpayOptions);
  assert.equal(orderPayload.coupon_code, 'SAVE30'); assert.equal(orderPayload.wallet_amount_used, 100);
  assert.equal(gatewayPayload.amount, 225); assert.equal(await page.evaluate(() => window.testRazorpayOptions.amount), 22500);
  await page.evaluate(() => { localStorage.removeItem('mediglaxo_token'); localStorage.removeItem('mediglaxo_user'); localStorage.removeItem('mediglaxo_login_time'); });
  await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'networkidle0' });
  await page.type('[aria-label="PIN login mobile number"]', user.phone);
  expired = true; await page.type('[aria-label="6-digit Login PIN"]', '739285'); await page.click('[aria-label="Quick login"] button'); await waitText('Saved login expired.');
  assert(await page.$('[aria-label="6-digit Login PIN"]'));
  expired = false; await clickText('Mobile / Email OTP'); await page.type('[aria-label="Registered Mobile / Email"]', user.email); await clickText('Send OTP'); await waitText('OTP sent to');
  await page.type('[aria-label="4-digit OTP"]', '4829'); await clickText('Verify OTP & Login'); await waitText('Login Security');
  assert.deepEqual(errors, []);
  console.log('PASS: visible mobile+PIN on first visit, OTP prefill, signup/PIN setup, wrong+correct PIN, mismatched account, coupon apply/remove/invalid/free delivery, wallet/takeaway, quote failure/stale amount, gateway amount, expired session, email OTP, mobile layout, no browser errors. All auth/orders/payments mocked.');
} catch (err) {
  await page.screenshot({ path: '/tmp/mgpjn-verification/failure.png', fullPage: true });
  console.log('Failure URL', page.url()); console.log((await page.evaluate(() => document.body.innerText)).slice(-5500));
  throw err;
} finally { await browser.close(); }
