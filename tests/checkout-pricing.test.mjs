import test from 'node:test';
import assert from 'node:assert/strict';
import { buildQuotePayload, verifyQuote } from '../src/services/checkoutPricing.js';
import { saveLoginPin, unlockLoginPin, quickLoginState, clearQuickLogin, keepQuickLoginForAccount } from '../src/services/quickLogin.js';
const storage = new Map();
globalThis.localStorage = { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: (key) => storage.delete(key) };
const quote = (overrides = {}) => ({ success: true, payment_summary: {
  subtotal: 300, delivery_charge: 50, platform_fee: 5, cod_charge: 10,
  coupon_discount: 30, delivery_discount: 0, total_amount: 335, wallet_used: 100, payable_now: 235, ...overrides,
} });
test('server coupon, fees and wallet split reconcile; free delivery is not double discounted', () => {
  assert.equal(verifyQuote(quote()).payment_summary.payable_now, 235);
  assert.equal(verifyQuote(quote({ delivery_charge: 0, delivery_discount: 50, total_amount: 285, wallet_used: 100, payable_now: 185 })).payment_summary.total_amount, 285);
});
test('invalid or mismatched payment summaries cannot proceed', () => {
  for (const overrides of [{ payable_now: 250 }, { total_amount: null }, { subtotal: 'NaN' }, { wallet_used: -1 }]) assert.throws(() => verifyQuote(quote(overrides)));
  assert.throws(() => verifyQuote({ success: false }));
});
test('wallet pickup retains delivery mode, coupon and exact product quantities', () => {
  const result = buildQuotePayload({ items: [{ id: 7, quantity: 3 }], state: 'Gujarat', pincode: '394230', paymentMethod: 'takeaway', useWallet: true, walletBalance: 1000, couponCode: 'SAVE10' });
  assert.equal(result.payment_method, 'wallet_split'); assert.equal(result.other_payment_method, 'takeaway');
  assert.equal(result.delivery_type, 'takeaway'); assert.equal(result.coupon_code, 'SAVE10'); assert.deepEqual(result.items, [{ product_id: 7, quantity: 3 }]);
});
test('PIN vault encrypts token, rejects wrong/weak PIN and locks repeated attempts', async () => {
  await assert.rejects(saveLoginPin('123456', 'private-token', { id: 8 }));
  await saveLoginPin('739285', 'private-token', { id: 8 });
  assert.equal(quickLoginState(8).pin, true);
  assert.equal(JSON.stringify([...storage.values()]).includes('private-token'), false);
  assert.equal((await unlockLoginPin('739285')).token, 'private-token');
  for (let i = 0; i < 5; i++) await assert.rejects(unlockLoginPin('827394'));
  await assert.rejects(unlockLoginPin('739285'), /Too many attempts/);
  keepQuickLoginForAccount(9); assert.equal(quickLoginState().pin, false);
  clearQuickLogin();
});
