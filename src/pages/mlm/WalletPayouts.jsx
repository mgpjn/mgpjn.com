import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getWalletTransactions, getPayoutRequests, previewPayout, requestPayout, getProfile } from '../../services/api';
import { exportPassbookReport } from '../../utils/excelExport';
const money = (v) => `₹${Number(v || 0).toFixed(2)}`;
const errorText = (e) => Object.values(e.response?.data?.errors || {}).flat()[0] || e.response?.data?.message || 'Unable to complete this request. Please try again.';
export default function WalletPayouts() {
  const { user, setUser } = useAuth();
  const [wallet, setWallet] = useState({ transactions: { data: [] }, balance: 0 });
  const [payouts, setPayouts] = useState({ data: [] });
  const [page, setPage] = useState(1); const [payoutPage, setPayoutPage] = useState(1);
  const [filter, setFilter] = useState('all'); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const [form, setForm] = useState({ amount: '', payment_method: 'bank_transfer', account_holder: user?.name || '', bank_name: user?.bank_name || '', bank_account: user?.account_number || '', bank_ifsc: user?.ifsc_code || '', account_details: user?.upi_id || '' });
  const [summary, setSummary] = useState(null); const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  const load = async () => {
    try {
      const [w,p] = await Promise.all([getWalletTransactions(page, filter), getPayoutRequests(payoutPage)]);
      setWallet(w.data); setPayouts(p.data.payouts);
    } catch (e) { setError(errorText(e)); }
  };
  useEffect(() => {
    load();
    const refresh = () => { if (document.visibilityState === 'visible') load(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    const interval = window.setInterval(refresh, 15000);
    return () => { window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); window.clearInterval(interval); };
  }, [page, payoutPage, filter]);
  const change = (key,value) => { setForm((f) => ({ ...f, [key]: value })); setSummary(null); setRequestKey(crypto.randomUUID()); };
  const submit = async (e) => {
    e.preventDefault(); if (busy) return; setBusy(true); setError(''); setMessage('');
    try {
      if (!summary) { const r = await previewPayout({ amount: Number(form.amount) }); setSummary(r.data.summary); }
      else {
        const payload = form.payment_method === 'bank_transfer' ? { ...form, account_details: undefined } : { amount: form.amount, payment_method: 'upi', account_details: form.account_details };
        await requestPayout({ ...payload, amount: summary.amount, request_key: requestKey });
        setMessage('Withdrawal requested. Your gross amount is reserved; follow its status below.'); setSummary(null); setForm((f) => ({ ...f, amount: '' })); setRequestKey(crypto.randomUUID());
        await load(); const profile = await getProfile(); setUser(profile.data.user);
      }
    } catch (err) { setError(errorText(err)); } finally { setBusy(false); }
  };
  return <main className="max-w-6xl mx-auto p-4 sm:p-8 space-y-6">
    <h1 className="text-2xl font-black">My Wallet & Withdrawals</h1>
    <section className="rounded-2xl bg-brand-blue-800 text-white p-6 flex flex-wrap justify-between gap-4">
      <div><p>Available to spend</p><strong className="text-3xl">{money(wallet.balance)}</strong><p className="text-sm mt-2">Medicine purchases have no TDS. Bank withdrawals have 5% TDS.</p></div>
      <Link to="/shop" className="bg-white text-brand-blue-800 rounded-xl p-3 h-fit font-bold">Buy medicines with wallet</Link>
    </section>
    {error && <p role="alert" className="text-rose-700 bg-rose-50 p-3 rounded-xl">{error}</p>}
    {message && <p role="status" className="text-emerald-700 bg-emerald-50 p-3 rounded-xl">{message}</p>}
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={submit} className="bg-white border rounded-2xl p-5 space-y-4">
        <h2 className="font-extrabold text-lg">Request a withdrawal</h2><p className="text-sm text-slate-500">Minimum ₹500. Admin reviews and transfers your payout.</p>
        <fieldset disabled={busy} className="space-y-3">
          <label className="block text-sm">Amount (₹)<input aria-label="Withdrawal amount" required type="number" min="500" step="0.01" max={wallet.balance} value={form.amount} onChange={(e)=>change('amount',e.target.value)} className="block border rounded-xl p-3 w-full mt-1" /></label>
          <label className="block text-sm">Transfer method<select value={form.payment_method} onChange={(e)=>change('payment_method',e.target.value)} className="block border rounded-xl p-3 w-full"><option value="bank_transfer">Bank transfer</option><option value="upi">UPI</option></select></label>
          {form.payment_method === 'bank_transfer' ? ['account_holder','bank_name','bank_account','bank_ifsc'].map((key) => <label key={key} className="block text-sm">{{account_holder:'Account holder',bank_name:'Bank name',bank_account:'Account number',bank_ifsc:'IFSC code'}[key]}<input name={key} required value={form[key]} inputMode={key==='bank_account'?'numeric':undefined} pattern={key==='bank_account'?'[0-9]{9,18}':key==='bank_ifsc'?'[A-Z]{4}0[A-Z0-9]{6}':undefined} maxLength={key==='bank_ifsc'?11:key==='bank_account'?18:100} onChange={(e)=>change(key,key==='bank_ifsc'?e.target.value.toUpperCase():e.target.value)} className="block border rounded-xl p-3 w-full mt-1" /></label>) : <label className="block text-sm">UPI ID<input required value={form.account_details} onChange={(e)=>change('account_details',e.target.value)} className="block border rounded-xl p-3 w-full" /></label>}
        </fieldset>
        {summary && <div aria-label="Withdrawal review" className="bg-blue-50 rounded-xl p-4 text-sm space-y-2"><p>Requested: <b>{money(summary.amount)}</b></p><p>TDS (5%): <b>{money(summary.tds_amount)}</b></p><p>Bank payout: <b>{money(summary.net_payable)}</b></p><p>Remaining wallet: {money(summary.remaining_balance)}</p><p>Confirm your amount and destination before submitting.</p></div>}
        <button disabled={busy || Number(wallet.balance)<500} className="w-full bg-brand-blue-800 text-white rounded-xl p-3 font-bold disabled:opacity-40">{busy?'Please wait…':summary?'Confirm withdrawal request':'Review withdrawal'}</button>
      </form>
      <section className="bg-white border rounded-2xl p-5 space-y-3"><h2 className="font-extrabold text-lg">Withdrawal history</h2>
        {!payouts.data?.length && <p className="text-slate-500">No withdrawal requests yet.</p>}
        {payouts.data?.map((p)=><article key={p.id} className="border rounded-xl p-4 text-sm space-y-2"><div className="flex justify-between font-bold"><span>Request #{p.id}</span><span className="capitalize">{p.status==='pending'?'Requested':p.status}</span></div><p>{money(p.amount)} · TDS {money(p.admin_fee)} · Net {money(p.net_payable)}</p><p>{p.account_details}</p>{p.transaction_ref && <p>Bank reference: {p.transaction_ref}</p>}{p.admin_note && <p>{p.admin_note}</p>}<ol className="text-xs text-slate-500 space-y-1">{p.events?.map((ev)=><li key={ev.id}>{new Date(ev.created_at).toLocaleString()} · {ev.status} {ev.note && `— ${ev.note}`}</li>)}</ol></article>)}
        <Pagination data={payouts} setPage={setPayoutPage}/>
      </section>
    </div>
    <section className="bg-white border rounded-2xl p-5 space-y-4"><h2 className="font-extrabold text-lg">Wallet credit / debit history</h2><button onClick={()=>exportPassbookReport(wallet.transactions?.data||[],wallet.balance,user)} className="border rounded-xl p-2 text-sm">Export this history page</button><select aria-label="Wallet history filter" value={filter} onChange={(e)=>{setFilter(e.target.value);setPage(1);}} className="border rounded-xl p-2">{['all','credit','debit','referral_income','order_payment','payout_withdrawal','payout_refund','commission_reversal'].map((c)=><option key={c} value={c}>{c.replaceAll('_',' ')}</option>)}</select>
      <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr><th>Date</th><th>Description / Status</th><th>Credit / Debit</th><th>Balance</th></tr></thead><tbody>{wallet.transactions?.data?.map((t)=><tr key={t.id} className="border-t"><td className="py-3 pr-3">{new Date(t.created_at).toLocaleDateString()}</td><td className="py-3 pr-3">{t.description}<p className="text-xs text-slate-500">{t.status} · {t.category?.replaceAll('_',' ')}</p></td><td className={t.type==='credit'?'text-emerald-700':'text-rose-700'}>{t.type==='credit'?'+':'−'}{money(t.amount)}</td><td>{money(t.balance_after)}</td></tr>)}</tbody></table></div><Pagination data={wallet.transactions} setPage={setPage}/>
    </section>
  </main>;
}
function Pagination({data,setPage}) { return data?.last_page>1 && <div className="flex gap-4 text-sm"><button disabled={data.current_page<=1} onClick={()=>setPage(data.current_page-1)}>Previous</button><span>{data.current_page} / {data.last_page}</span><button disabled={data.current_page>=data.last_page} onClick={()=>setPage(data.current_page+1)}>Next</button></div>; }
