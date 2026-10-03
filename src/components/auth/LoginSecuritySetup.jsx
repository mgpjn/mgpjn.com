import React, { useEffect, useState } from 'react';
import { Fingerprint, KeyRound, ShieldCheck, X } from 'lucide-react';
import { canUseDeviceLogin, clearQuickLogin, enableDeviceLogin, quickLoginState, saveLoginPin } from '../../services/quickLogin';

export default function LoginSecuritySetup({ user, token, onClose }) {
  const [state, setState] = useState(() => quickLoginState(user?.id));
  const [available, setAvailable] = useState(false);
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { let active = true; canUseDeviceLogin().then((value) => { if (active) setAvailable(value); }); return () => { active = false; }; }, []);
  if (!user || !token || user.role === 'super_admin') return null;
  const run = async (action, success) => {
    setBusy(true); setError(''); setMessage('');
    try { await action(); setState(quickLoginState(user.id)); setMessage(success); }
    catch (err) { setError(err.name === 'NotAllowedError' ? 'Device verification was cancelled. You can try again or use PIN.' : err.message); }
    finally { setBusy(false); }
  };
  const savePin = (e) => {
    e.preventDefault();
    if (pin !== confirm) { setError('PINs do not match.'); return; }
    run(async () => { await saveLoginPin(pin, token, user); setPin(''); setConfirm(''); }, 'Login PIN enabled for this browser.');
  };
  return <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4" aria-label="Login Security">
    <div className="flex items-center justify-between gap-3">
      <div><h3 className="font-extrabold text-slate-900 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-brand-blue-800" />Login Security</h3><p className="text-xs text-slate-500 mt-1">Set up PIN and fingerprint for faster login on this browser.</p></div>
      {onClose && <button type="button" onClick={onClose} disabled={busy} aria-label="Close login security" className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>}
    </div>
    <form onSubmit={savePin} className="space-y-3">
      <p className="text-xs font-bold flex items-center gap-2"><KeyRound className="w-4 h-4" />{state.pin ? 'Reset your 6-digit PIN' : 'Create your 6-digit PIN'}</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-slate-600">New PIN<input aria-label="New login PIN" type="password" inputMode="numeric" autoComplete="new-password" required pattern="[0-9]{6}" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} className="w-full border border-slate-200 rounded-xl p-3 mt-1" /></label>
        <label className="text-xs text-slate-600">Confirm PIN<input aria-label="Confirm login PIN" type="password" inputMode="numeric" autoComplete="new-password" required pattern="[0-9]{6}" maxLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value.replace(/\D/g, ''))} className="w-full border border-slate-200 rounded-xl p-3 mt-1" /></label>
      </div>
      <button disabled={busy} className="w-full bg-brand-blue-800 text-white rounded-xl p-3 text-xs font-bold disabled:opacity-50">{busy ? 'Saving...' : 'Save Login PIN'}</button>
    </form>
    <div className="bg-slate-50 rounded-xl p-3 space-y-2">
      <p className="text-xs font-bold flex items-center gap-2"><Fingerprint className="w-4 h-4" />Fingerprint / Device Lock {state.biometric ? '(Enabled)' : ''}</p>
      <p className="text-xs text-slate-500">{available ? 'Use the fingerprint, face verification or screen lock supported by your device.' : 'Device login is unavailable here. You can use a PIN instead.'}</p>
      {available && <button type="button" disabled={busy} onClick={() => run(() => enableDeviceLogin(token, user), 'Fingerprint/device login enabled.')} className="text-xs font-bold text-brand-blue-800 disabled:opacity-50">{state.biometric ? 'Set up again' : 'Enable Fingerprint / Device Lock'}</button>}
    </div>
    {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
    {message && <p role="status" className="text-xs text-emerald-700">{message}</p>}
    <p className="text-[11px] text-slate-500">Use on your personal device. App and website PINs are set up separately. Sign in again with OTP/password when the saved session expires.</p>
    {(state.pin || state.biometric) && <button type="button" disabled={busy} className="text-xs font-bold text-rose-600" onClick={() => { clearQuickLogin(); setState(quickLoginState()); setMessage('Quick login removed from this browser.'); }}>Turn off quick login on this browser</button>}
    {onClose && <button type="button" onClick={onClose} disabled={busy} className="block w-full text-xs font-bold text-slate-500 py-2">{state.pin || state.biometric ? 'Continue' : 'Set up later'}</button>}
  </section>;
}
