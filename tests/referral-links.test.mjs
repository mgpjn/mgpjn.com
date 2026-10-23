import test from 'node:test';
import assert from 'node:assert/strict';
import { referralCodeFromSearch, referralDestinations, normalizeReferralCode } from '../src/utils/referralLinks.js';

test('Play Store URL preserves code inside its referrer parameter', () => {
  const links = referralDestinations(' MG1001 ');
  const store = new URL(links.playUrl);
  assert.equal(store.searchParams.get('id'), 'com.mgpjn.app');
  assert.equal(new URLSearchParams(store.searchParams.get('referrer')).get('ref'), 'MG1001');
  assert.equal(links.inviteUrl, 'https://www.mgpjn.com/invite?ref=MG1001');
  assert.equal(links.websiteUrl, '/register?ref=MG1001');
});
test('Android intent addresses same app and fallback retains exact referrer', () => {
  const links = referralDestinations('MG_Friend-12');
  assert.match(links.androidIntentUrl, /^intent:\/\/www.mgpjn.com\/invite\?ref=MG_Friend-12#Intent;scheme=https;package=com.mgpjn.app;/);
  const fallback = links.androidIntentUrl.split('S.browser_fallback_url=')[1].split(';end')[0];
  assert.equal(decodeURIComponent(fallback), links.playUrl);
});
test('legacy aliases remain supported and malformed codes cannot modify intent', () => {
  for (const alias of ['ref', 'sponsor', 'sponsor_code', 'referral', 'code']) {
    assert.equal(referralCodeFromSearch(`?${alias}=MG1001`), 'MG1001');
  }
  for (const value of ['#Intent;package=other', 'https://evil.example', '<script>', '', 'a'.repeat(65)]) {
    assert.equal(normalizeReferralCode(value), null);
    assert.equal(referralDestinations(value).playUrl.includes('referrer='), false);
  }
});
