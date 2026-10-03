import React, { useState } from 'react';
import { Fingerprint, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { quickLoginState } from '../../services/quickLogin';

export default function QuickLoginPanel({ onUseOtp }) {
  const { loginWithPin, loginWithDevice } = useAuth();
  const [state, setState] = useState(quickLoginState);
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const unlock = async (action) => {
    if (busy) return;
    setBusy(true); setError('');
    try { await action(); }
    catch (err) { setError(err.name === 'NotAllowedError' ? 'Device verification cancelled. Try PIN or OTP.' : err.message); setState(quickLoginState()); }
    finally { setBusy(false); }
  };
  return <section className="bg-brand-blue-50 border border-brand-blue-100 rounded-2xl p-4 space-y-3" aria-label="Quick login">
    <h3 className="text-sm font-extrabold text-brand-blue-800 flex items-center gap-2"><KeyRound className="w-5 h-5" />Login with PIN</h3>
    <form onSubmit={(e) => { e.preventDefault(); unlock(() => loginWithPin(pin, phone)); }} className="space-y-3">
      <label className="text-xs font-bold text-slate-700 block">Registered Mobile Number
        <input aria-label="PIN login mobile number" type="tel" inputMode="numeric" autoComplete="tel-national" required maxLength={10} pattern="[0-9]{10}" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} placeholder="10-digit registered mobile number" className="w-full border border-slate-200 bg-white rounded-xl p-3 mt-1 text-xs" />
      </label>
      <label className="text-xs font-bold text-slate-700 block">6-digit Login PIN
        <input aria-label="6-digit Login PIN" type="password" inputMode="numeric" autoComplete="off" required maxLength={6} pattern="[0-9]{6}" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="Enter your 6-digit PIN" className="w-full border border-slate-200 bg-white rounded-xl p-3 mt-1 text-center tracking-widest" />
      </label>
      <button disabled={busy} className="w-full rounded-xl bg-brand-blue-800 text-white p-3 text-xs font-bold disabled:opacity-50">{busy ? 'Signing In...' : 'Login with PIN'}</button>
    </form>
    {!state.pin && <div className="space-y-2"><p className="text-xs text-slate-600">First time on this browser? Sign in once with OTP/password, then create your website PIN. Your app PIN is separate.</p>
      {onUseOtp && <button type="button" disabled={busy} onClick={() => onUseOtp(phone)} className="text-xs font-bold text-brand-blue-800">Use OTP to set up PIN</button>}
    </div>}
    {state.biometric && <button type="button" disabled={busy} onClick={() => unlock(loginWithDevice)} className="w-full flex items-center justify-center gap-2 bg-white border border-brand-blue-200 rounded-xl p-3 text-xs font-bold text-brand-blue-800 disabled:opacity-50"><Fingerprint className="w-5 h-5" />Fingerprint / Device Lock</button>}
    {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
  </section>;
}
