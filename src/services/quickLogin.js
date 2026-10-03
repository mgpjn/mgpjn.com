// Device-local quick login. Only encrypted session tokens are persisted.
const STORAGE_KEY = 'mediglaxo_quick_login_v1';
const MAX_AGE = 48 * 60 * 60 * 1000;
const encoder = new TextEncoder();
const bytes = (size) => crypto.getRandomValues(new Uint8Array(size));
const encode = (value) => btoa(String.fromCharCode(...new Uint8Array(value)));
const decode = (value) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
const read = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; }
};
const write = (value) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
export const quickLoginState = (userId) => {
  const vault = read();
  const valid = vault?.version === 1 && vault.expiresAt > Date.now() && (!userId || String(vault.userId) === String(userId));
  return { pin: Boolean(valid && vault.pin), biometric: Boolean(valid && vault.biometric) };
};
export const clearQuickLogin = () => localStorage.removeItem(STORAGE_KEY);
export const keepQuickLoginForAccount = (userId) => {
  const vault = read();
  if (vault && String(vault.userId) !== String(userId)) clearQuickLogin();
};
export const isStrongPin = (pin) => /^\d{6}$/.test(pin) && !/^(\d)\1{5}$/.test(pin)
  && !['123456', '654321', '112233', '123123', '111222', '121212', '101010'].includes(pin)
  && ![1, -1].some((step) => [...pin].slice(1).every((digit, i) => Number(digit) === Number(pin[i]) + step));
const pinKey = async (pin, salt) => {
  const material = await crypto.subtle.importKey('raw', encoder.encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 600000 }, material,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
};
const encrypt = async (token, key) => {
  const iv = bytes(12);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(token));
  return { iv: encode(iv), ciphertext: encode(ciphertext) };
};
const decrypt = async (record, key) => new TextDecoder().decode(await crypto.subtle.decrypt(
  { name: 'AES-GCM', iv: decode(record.iv) }, key, decode(record.ciphertext)));
const sessionVault = (user) => {
  const old = read();
  return old?.expiresAt > Date.now() && String(old.userId) === String(user.id) ? old
    : { version: 1, userId: user.id, expiresAt: Date.now() + MAX_AGE };
};
export const saveLoginPin = async (pin, token, user) => {
  if (!isStrongPin(pin)) throw new Error('Use a strong 6-digit PIN. Avoid repeated or simple numbers.');
  const salt = bytes(16);
  const vault = sessionVault(user);
  vault.pin = { ...(await encrypt(token, await pinKey(pin, salt))), salt: encode(salt), attempts: 0, lockedUntil: 0 };
  write(vault);
};
export const unlockLoginPin = async (pin) => {
  const vault = read();
  if (!quickLoginState().pin) throw new Error('Sign in with OTP or password once, then create your PIN.');
  if (vault.pin.lockedUntil > Date.now()) throw new Error('Too many attempts. Try again in 5 minutes or use OTP/password.');
  try {
    const token = await decrypt(vault.pin, await pinKey(pin, decode(vault.pin.salt)));
    vault.pin.attempts = 0;
    vault.pin.lockedUntil = 0;
    write(vault);
    return { token, userId: vault.userId };
  } catch {
    vault.pin.attempts = (vault.pin.attempts || 0) + 1;
    if (vault.pin.attempts >= 5) { vault.pin.lockedUntil = Date.now() + 5 * 60 * 1000; vault.pin.attempts = 0; }
    write(vault);
    throw new Error('Incorrect PIN. Please try again or use OTP/password.');
  }
};
export const canUseDeviceLogin = async () => {
  try {
    return Boolean(window.isSecureContext && window.PublicKeyCredential && crypto.subtle
      && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
  } catch { return false; }
};
const deviceKey = (output) => crypto.subtle.importKey('raw', output, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
const getDeviceCredential = (credentialId, salt) => navigator.credentials.get({ publicKey: {
  challenge: bytes(32), allowCredentials: [{ type: 'public-key', id: decode(credentialId) }],
  userVerification: 'required', timeout: 60000, extensions: { prf: { eval: { first: salt } } },
} });
export const enableDeviceLogin = async (token, user) => {
  if (!await canUseDeviceLogin()) throw new Error('Fingerprint/device lock is unavailable in this browser. Use a login PIN.');
  const salt = bytes(32);
  const credential = await navigator.credentials.create({ publicKey: {
    challenge: bytes(32), rp: { name: 'MediGlaxo Pharma' },
    user: { id: encoder.encode(String(user.id)), name: user.email || user.phone || String(user.id), displayName: user.name || 'MediGlaxo Customer' },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
    authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'preferred', userVerification: 'required' },
    timeout: 60000, attestation: 'none', extensions: { prf: { eval: { first: salt } } },
  } });
  let output = credential?.getClientExtensionResults()?.prf?.results?.first;
  if (!output && credential?.getClientExtensionResults()?.prf?.enabled) {
    output = (await getDeviceCredential(encode(credential.rawId), salt))?.getClientExtensionResults()?.prf?.results?.first;
  }
  if (!output) throw new Error('This browser cannot securely save device login. Please use your 6-digit PIN.');
  const vault = sessionVault(user);
  vault.biometric = { ...(await encrypt(token, await deviceKey(output))), credentialId: encode(credential.rawId), salt: encode(salt) };
  write(vault);
};
export const unlockDeviceLogin = async () => {
  const vault = read();
  if (!quickLoginState().biometric) throw new Error('Enable fingerprint/device lock after signing in once.');
  const credential = await getDeviceCredential(vault.biometric.credentialId, decode(vault.biometric.salt));
  const output = credential?.getClientExtensionResults()?.prf?.results?.first;
  if (!output) throw new Error('Device verification unavailable. Use PIN, OTP or password.');
  return { token: await decrypt(vault.biometric, await deviceKey(output)), userId: vault.userId };
};
