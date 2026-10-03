import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Smartphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { loginWithOtp, sendLoginOtp } from '../../services/api';

export default function LoginOtpForm({ initialIdentifier = '' }) {
  const { setDirectSession } = useAuth();
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [sentTo, setSentTo] = useState('');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sendCount = useRef(0);
  useEffect(() => {
    if (!timer) return;
    const timeout = setTimeout(() => setTimer((value) => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timeout);
  }, [timer]);
  const send = async (e) => {
    e?.preventDefault();
    if (busy || timer > 0) return;
    if (!/^\d{10}$/.test(identifier.trim()) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())) {
      setError('Enter your registered 10-digit mobile number or email.'); return;
    }
    setBusy(true); setError('');
    try {
      const { data } = await sendLoginOtp({ identifier: identifier.trim() });
      if (!data.success) throw new Error(data.message || 'Unable to send OTP.');
      setSentTo(data.masked_to || identifier.trim()); setOtp('');
      setTimer(sendCount.current === 0 ? 60 : sendCount.current === 1 ? 120 : 300 + (sendCount.current - 2) * 300);
      sendCount.current += 1;
    } catch (err) { setError(err.response?.data?.message || err.message); }
    finally { setBusy(false); }
  };
  const verify = async (e) => {
    e.preventDefault(); if (busy) return;
    setBusy(true); setError('');
    try {
      const { data } = await loginWithOtp({ identifier: identifier.trim(), otp });
      if (!data.success || !data.token || !data.user) throw new Error(data.message || 'OTP verification failed.');
      if (data.user.role === 'super_admin') throw new Error('Super Admin: please use password login and complete 2-step verification.');
      setDirectSession(data.token, data.user);
    } catch (err) { setError(err.response?.data?.message || err.message); }
    finally { setBusy(false); }
  };
  return <form onSubmit={sentTo ? verify : send} className="space-y-4">
    <label className="block text-xs font-bold text-slate-700">Registered Mobile / Email
      <input aria-label="Registered Mobile / Email" required autoComplete="username" readOnly={Boolean(sentTo)} value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="10-digit mobile number or email" className="w-full px-3.5 py-3 mt-1 border border-slate-200 rounded-xl text-xs" />
    </label>
    {sentTo && <>
      <p role="status" className="text-xs text-emerald-700">OTP sent to {sentTo}</p>
      <label className="block text-xs font-bold text-slate-700">4-digit OTP
        <input aria-label="4-digit OTP" required type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={4} pattern="[0-9]{4}" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="w-full text-center tracking-widest p-3 mt-1 border border-slate-200 rounded-xl" />
      </label>
      <div className="flex justify-between text-xs font-bold">
        <button type="button" disabled={busy} onClick={() => { setSentTo(''); setOtp(''); setError(''); }} className="text-slate-500">Change mobile/email</button>
        <button type="button" disabled={busy || timer > 0} onClick={send} className="text-brand-blue-800 disabled:text-slate-400">{timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}</button>
      </div>
    </>}
    {error && <p role="alert" className="bg-rose-50 text-rose-600 rounded-xl p-3 text-xs">{error}</p>}
    <button disabled={busy || (!sentTo && timer > 0)} className="w-full bg-brand-orange-500 text-white p-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50">{busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}{busy ? 'Please wait...' : sentTo ? 'Verify OTP & Login' : timer > 0 ? `Send OTP in ${timer}s` : 'Send OTP'}</button>
  </form>;
}
