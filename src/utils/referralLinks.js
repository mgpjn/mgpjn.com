export const APP_PACKAGE = 'com.mgpjn.app';
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${APP_PACKAGE}`;

export function normalizeReferralCode(value) {
  const clean = typeof value === 'string' ? value.trim() : '';
  return /^[a-zA-Z0-9_-]{2,64}$/.test(clean) ? clean : null;
}

export function referralCodeFromSearch(search) {
  const params = new URLSearchParams(search);
  return normalizeReferralCode(params.get('ref') || params.get('sponsor') ||
    params.get('sponsor_code') || params.get('referral') || params.get('code'));
}

export function referralDestinations(value) {
  const code = normalizeReferralCode(value);
  const query = code ? new URLSearchParams({ ref: code }).toString() : '';
  const inviteUrl = `https://www.mgpjn.com/invite${query ? `?${query}` : ''}`;
  const store = new URL(PLAY_STORE_URL);
  if (query) store.searchParams.set('referrer', query);
  const playUrl = store.toString();
  return {
    code, inviteUrl, playUrl,
    websiteUrl: `/register${query ? `?${query}` : ''}`,
    // A user-tapped intent can open an installed app even before domain verification.
    androidIntentUrl: `intent://www.mgpjn.com/invite${query ? `?${query}` : ''}` +
      `#Intent;scheme=https;package=${APP_PACKAGE};S.browser_fallback_url=${encodeURIComponent(playUrl)};end`,
  };
}
