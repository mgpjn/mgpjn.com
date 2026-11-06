import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import * as api from '../../services/api';

const money = p => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((p || 0) / 100);
const date = value => value ? new Date(value.length === 10 ? `${value}T00:00:00+05:30` : value).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const errorText = e => Object.values(e.response?.data?.errors || {}).flat().join(' ') || e.response?.data?.message || e.message || 'Unable to complete request.';
const key = () => crypto.randomUUID();
const input = 'w-full border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-900';
const button = 'rounded-xl bg-[#004E89] text-white px-4 py-2 font-semibold disabled:opacity-50';
const box = 'rounded-2xl border border-slate-200 bg-white p-5 space-y-4';

function Field({ label, ...props }) { return <label className="block text-sm space-y-1"><span>{label}</span><input className={input} {...props} /></label>; }
function Progress({ title, value, required, percentage, pending }) { return <div className="space-y-2"><div className="flex justify-between gap-3"><strong>{title}</strong><span>{value} / {required}</span></div><div role="progressbar" aria-label={title} aria-valuenow={Math.min(value, required)} aria-valuemin={0} aria-valuemax={required} className="h-3 rounded-full bg-slate-100 overflow-hidden"><div className="h-full bg-emerald-600" style={{ width: `${percentage}%` }} /></div><p className="text-sm text-slate-600">{title === 'Repayment progress' ? `${percentage}% repaid` : pending > 0 ? `${pending} more members needed` : 'Condition complete'}</p></div>; }
function Pages({ data, setPage }) { return <div className="flex items-center gap-3"><button className={button} disabled={data.current_page <= 1} onClick={() => setPage(data.current_page - 1)}>Previous</button><span>Page {data.current_page} / {data.last_page}</span><button className={button} disabled={data.current_page >= data.last_page} onClick={() => setPage(data.current_page + 1)}>Next</button></div>; }

function RequestForm({ eligibility, busy, run }) {
  const [requestKey, setRequestKey] = useState(key);
  return <form className={box} onChange={() => setRequestKey(key())} onSubmit={e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.currentTarget)); run(() => api.requestEmergencyFund({ ...d, request_key: requestKey, accept_terms: true, terms_version: eligibility.terms_version })); }}>
    <h2 className="text-lg font-bold">Request ₹5,000 Emergency Fund</h2>
    <p className="text-sm text-slate-600">Subject to fund availability and Super Admin approval. Confirm the bank account where you want to receive support.</p>
    <fieldset disabled={busy} className="space-y-3">
      <label className="block text-sm">Emergency reason<textarea name="reason" required minLength={10} maxLength={1000} className={input} /></label>
      <Field label="Account holder" name="account_holder" required maxLength={150} />
      <Field label="Bank name" name="bank_name" required maxLength={120} />
      <Field label="Bank account number" name="bank_account" required pattern="[0-9]{9,18}" inputMode="numeric" autoComplete="off" />
      <Field label="IFSC" name="bank_ifsc" required pattern="[A-Z]{4}0[A-Z0-9]{6}" placeholder="Uppercase IFSC" />
      <p className="text-sm bg-blue-50 p-3 rounded-xl">{eligibility.terms}</p>
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" required />I accept these repayment terms and confirm my bank details are correct.</label>
      <button className={button}>Submit fund request</button>
    </fieldset>
  </form>;
}

function RepaymentForm({ fund, busy, run, online, destination }) {
  const [method, setMethod] = useState('wallet');
  const [requestKey, setKey] = useState(key);
  const form = useRef();
  async function submit(e) {
    e.preventDefault(); const d = Object.fromEntries(new FormData(e.currentTarget));
    const payload = { ...d, method, request_key: requestKey, confirm_wallet: method === 'wallet' };
    if (method !== 'online') { if (await run(() => api.repayEmergencyFund(fund.id, payload))) { setKey(key()); form.current?.reset(); } return; }
    await run(async () => {
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => { const script = document.createElement('script'); script.src = 'https://checkout.razorpay.com/v1/checkout.js'; script.onload = resolve; script.onerror = () => reject(new Error('Payment gateway could not load.')); document.body.appendChild(script); });
      }
      const { data } = await api.createFundOnlinePayment(fund.id, payload);
      setKey(key());
      await new Promise((resolve, reject) => {
        const gateway = new window.Razorpay({ key: data.key_id, amount: data.amount, currency: data.currency, order_id: data.razorpay_order_id, name: 'MediGlaxo', description: `Emergency Fund #${fund.id} repayment`,
          handler: async response => { try { await api.verifyFundOnlinePayment(fund.id, response); resolve(); } catch (err) { reject(err); } },
          modal: { ondismiss: () => reject(new Error('Checkout closed. The amount is reserved for up to 30 minutes. If debited, use Check payment below.')) },
        });
        gateway.on('payment.failed', () => reject(new Error('Payment could not complete. If debited, use Check payment before paying again.'))); gateway.open();
      });
    });
  }
  const bankEnabled = !!(destination?.account_number || destination?.upi_id);
  return <form ref={form} onSubmit={submit} className="border-t pt-4 space-y-3" onChange={() => setKey(key())}>
    <h3 className="font-bold">Repay Emergency Fund</h3>
    <p className="text-sm">Available to repay: {money(fund.available_repayment_paise)}. Pending bank/online payments reserve their amount.</p>
    <fieldset disabled={busy || fund.available_repayment_paise <= 0} className="space-y-3">
      <label className="block text-sm">Payment method<select className={input} value={method} onChange={e => setMethod(e.target.value)}><option value="wallet">Wallet balance</option><option value="online" disabled={!online}>Pay online{!online ? ' — unavailable' : ''}</option><option value="bank" disabled={!bankEnabled}>Bank / UPI transfer{!bankEnabled ? ' — instructions pending' : ''}</option></select></label>
      <Field label="Repayment amount (₹)" name="amount" type="number" min={method === 'online' ? 1 : 0.01} max={fund.available_repayment_paise / 100} step="0.01" required />
      {method === 'bank' && <><div className="rounded-xl bg-blue-50 p-3 text-sm break-all"><p>Transfer only to these repayment details:</p><p>{destination.account_holder} · {destination.bank_name}</p><p>Account: {destination.account_number || '—'} · IFSC: {destination.ifsc || '—'}</p><p>UPI: {destination.upi_id || '—'}</p></div><Field label="Completed transfer UTR / reference" name="reference" required minLength={6} maxLength={100} pattern="[a-zA-Z0-9-]+" /><p className="text-sm">Outstanding reduces after admin verifies the bank receipt.</p></>}
      {method === 'wallet' && <label className="flex gap-2 items-start text-sm"><input type="checkbox" required />I confirm the entered amount can be debited from my available wallet balance for repayment.</label>}
      <button className={button}>{method === 'wallet' ? 'Confirm wallet repayment' : method === 'online' ? 'Continue to payment' : 'Submit transfer for verification'}</button>
    </fieldset>
  </form>;
}
function AdminAction({ fund, busy, run }) {
  const [action, setAction] = useState('');
  const options = { requested: ['approve', 'reject'], approved: ['process', 'reject'], processing: ['disburse', 'fail'], disbursed: ['extend'] }[fund.status] || [];
  if (!options.length) return null;
  return <form className="space-y-3 border-t pt-4" onSubmit={e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.currentTarget)); run(() => api.transitionEmergencyFund(fund.id, { ...d, confirm_payment: action === 'disburse' })); }}><fieldset disabled={busy} className="space-y-3">
    <select aria-label={`Action for fund ${fund.id}`} className={input} value={action} onChange={e => setAction(e.target.value)} required><option value="">Choose admin action</option>{options.map(o => <option value={o} key={o}>{o === 'disburse' ? 'Confirm amount sent' : o === 'extend' ? 'Extend due date' : o}</option>)}</select>
    <input type="hidden" name="action" value={action} />
    {action === 'disburse' && <><Field label="Confirmed bank transfer reference" name="reference" required minLength={6} maxLength={100} pattern="[a-zA-Z0-9-]+" /><label className="flex gap-2 text-sm"><input type="checkbox" required />I have verified that ₹5,000 was sent to the member's bank account.</label></>}
    {action === 'extend' && <Field label="New repayment due date" name="due_date" type="date" required min={fund.due_date?.slice(0, 10)} />}
    <Field label="Reason / admin note" name="note" required minLength={3} maxLength={1000} />
    <button className={button}>Save admin action</button>
  </fieldset></form>;
}
function BankReview({ fund, payment, busy, run }) {
  return <form className="space-y-2" onSubmit={e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.currentTarget)); run(() => api.verifyFundBankPayment(fund.id, payment.id, { ...d, confirm_receipt: true })); }}><fieldset disabled={busy} className="space-y-2"><select aria-label="Bank repayment decision" name="action" className={input}><option value="verify">Verify received transfer</option><option value="reject">Reject submission</option></select><Field label="Bank verification note / rejection reason" name="note" required minLength={3} maxLength={1000} /><label className="flex gap-2 text-sm"><input type="checkbox" required />I have checked the bank records for this decision.</label><button className={button}>Save repayment decision</button></fieldset></form>;
}
function RefundReview({ fund, payment, busy, run }) { return <form className="space-y-2" onSubmit={e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.currentTarget)); run(() => api.refundFundExcess(fund.id, payment.id, { ...d, confirm_refund: true })); }}><fieldset disabled={busy} className="space-y-2"><p>Excess repayment requiring refund: {money(payment.refund_due_paise)}. Refund through the gateway and Check payment, or confirm an actual bank refund below.</p><Field label="Completed bank refund reference" name="reference" required minLength={6} maxLength={100} pattern="[a-zA-Z0-9-]+" /><Field label="Refund verification note" name="note" required minLength={3} maxLength={1000} /><label className="flex gap-2"><input type="checkbox" required />I verified that this excess amount was returned.</label><button className={button}>Record completed bank refund</button></fieldset></form>; }
function Settings({ value, busy, run }) { return <details className={box}><summary className="font-bold cursor-pointer">Company repayment bank / UPI instructions</summary><form key={JSON.stringify(value)} className="space-y-3" onSubmit={e => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.currentTarget)); run(() => api.saveFundRepaymentSettings(Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v || null])))); }}><fieldset disabled={busy} className="space-y-3">{[['account_holder','Account holder'],['bank_name','Bank name'],['account_number','Account number'],['ifsc','IFSC'],['upi_id','UPI ID']].map(([name,label]) => <Field key={name} label={label} name={name} defaultValue={value?.[name] || ''} maxLength={150} />)}<p className="text-sm">These receiving details appear to members for fund repayments. Leave empty to keep manual bank submission unavailable.</p><button className={button}>Save repayment instructions</button></fieldset></form></details>; }

export default function EmergencyFundPage({ admin = false }) {
  const { user } = useAuth();
  const [result, setResult] = useState(null), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [page, setPage] = useState(1), [search, setSearch] = useState(''), [term, setTerm] = useState(''), [status, setStatus] = useState('');
  const lock = useRef(false), revision = useRef(0);
  useEffect(() => { const timer = setTimeout(() => { setTerm(search.trim()); setPage(1); }, 450); return () => clearTimeout(timer); }, [search]);
  const load = useCallback(async (signal) => {
    const rev = ++revision.current;
    try { const { data } = await (admin ? api.getAdminEmergencyFunds({ page, search: term, status }, { signal }) : api.getEmergencyFunds({ page }, { signal })); if (rev === revision.current) { setResult(data); setError(''); } }
    catch (e) { if (e.code !== 'ERR_CANCELED' && rev === revision.current) setError(errorText(e)); }
    finally { if (rev === revision.current) setLoading(false); }
  }, [admin, page, term, status]);
  useEffect(() => { const controller = new AbortController(); setLoading(true); load(controller.signal); return () => { revision.current++; controller.abort(); }; }, [load]);
  useEffect(() => { const refresh = () => { if (document.visibilityState === 'visible' && !lock.current) load(); }; window.addEventListener('focus', refresh); return () => window.removeEventListener('focus', refresh); }, [load]);
  async function run(operation) {
    if (lock.current) return false; lock.current = true; setBusy(true); setError(''); setNotice('');
    let failed = '';
    try { await operation(); setNotice('Saved successfully.'); return true; }
    catch (e) { failed = errorText(e); return false; }
    finally { await load(); if (failed) { setError(failed); toast.error(failed); } lock.current = false; setBusy(false); }
  }
  if (admin && user?.role !== 'super_admin') return <main className="p-8">Only Super Admin can manage Emergency Funds.</main>;
  const e = result?.eligibility;
  return <main className="max-w-4xl mx-auto px-4 py-8 space-y-5 text-slate-900">
    <div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-black">{admin ? 'Emergency Fund Management' : 'Emergency Fund Eligibility'}</h1><p className="text-slate-600">MediGlaxo Family Emergency Fund · ₹5,000 · 0% interest</p></div><button className={button} disabled={busy || loading} onClick={() => load()}>Refresh</button></div>
    <Link className="text-[#004E89] underline" to={admin ? '/admin' : '/mlm'}>{admin ? 'Back to admin' : 'Back to Refer & Earn'}</Link>
    {error && <p role="alert" className="p-4 rounded-xl bg-red-50 text-red-800">{error}</p>}{notice && <p role="status" className="p-3 rounded-xl bg-green-50 text-green-800">{notice}</p>}
    {loading && !result && <p>Loading Emergency Fund…</p>}
    {admin && <><Settings value={result?.repayment_destination} busy={busy} run={run} /><div className="flex flex-wrap gap-3"><input aria-label="Search fund member" className={`${input} flex-1`} placeholder="Search name, mobile, referral code or fund ID" value={search} onChange={ev => setSearch(ev.target.value)} /><select aria-label="Filter fund status" className={input} value={status} onChange={ev => { setStatus(ev.target.value); setPage(1); }}><option value="">All requests</option>{['requested','approved','processing','disbursed','overdue','repaid','rejected','failed','refund_due'].map(s => <option key={s}>{s}</option>)}</select></div></>}
    {!admin && e && <><section className={box}><Progress title="Direct members — Level 1" value={e.direct} required={27} percentage={e.direct_progress} pending={e.direct_pending} /><Progress title="Total members — Levels 1 + 2 + 3" value={e.total} required={99} percentage={e.total_progress} pending={e.total_pending} /><p className="text-sm">27 direct members are included in the 99 total. Level counts: {e.levels.join(' + ')}. Only active non-staff members count; each member counts once.</p><strong>{e.can_request ? 'Eligible — you can request support' : e.active_request ? 'You already have an active fund request' : !e.member_allowed ? 'This account is not eligible for the member fund' : e.counts_eligible ? `Next request available: ${date(e.next_request_at)}` : 'Eligibility pending'}</strong></section>{e.can_request && <RequestForm eligibility={e} busy={busy} run={run} />}</>}
    <h2 className="text-xl font-bold">{admin ? 'Fund requests' : 'My fund requests & repayment history'}</h2>
    {result?.funds?.data?.length === 0 && <p>No fund requests yet.</p>}
    {result?.funds?.data?.map(f => <article key={f.id} className={box}>
      <div className="flex justify-between gap-3"><h3 className="font-bold">Fund #{f.id}{admin && ` · ${f.user?.name} · ${f.user?.phone}`}</h3><strong className={f.overdue ? 'text-red-700' : 'text-[#004E89]'}>{f.display_status.replaceAll('_', ' ')}</strong></div>
      <p className="text-sm">Requested {date(f.created_at)} · {f.bank_summary}</p><p className="text-sm whitespace-pre-wrap">Reason: {f.reason}</p>
      {admin && <details><summary>Beneficiary bank details</summary><div className="text-sm break-all">{Object.entries(f.bank_details || {}).map(([k, v]) => <p key={k}>{k.replaceAll('_', ' ')}: {v}</p>)}</div></details>}
      <div className="grid sm:grid-cols-3 gap-3"><p>Fund amount<br /><strong>{money(f.amount_paise)}</strong></p><p>Verified repayments<br /><strong>{money(f.repaid_paise)}</strong></p><p>Outstanding<br /><strong>{money(f.outstanding_paise)}</strong></p></div>
      {f.disbursed_at && <><p>Amount sent: {date(f.disbursed_at)} · Reference: {f.disbursement_ref}</p><p className={f.overdue ? 'text-red-700 font-bold' : ''}>Repayment due: {date(f.due_date)}</p><Progress title="Repayment progress" value={f.repayment_progress} required={100} percentage={f.repayment_progress} pending={0} /></>}
      {f.events?.filter(ev => ev.type === 'reminder').slice(-1).map(ev => <p key={ev.id} role="status" className="rounded-xl bg-amber-50 text-amber-900 p-3">{ev.note} Due: {date(f.due_date)} · Outstanding: {money(f.outstanding_paise)}</p>)}
      {admin ? <AdminAction key={`${f.id}-${f.status}`} fund={f} busy={busy} run={run} /> : f.status === 'disbursed' && <RepaymentForm fund={f} busy={busy} run={run} online={result.online_available} destination={result.repayment_destination} />}
      <details open={f.payments?.some(p => p.status === 'pending' || p.refund_due_paise > 0)}><summary className="font-bold cursor-pointer">Repayment records ({f.payments?.length || 0})</summary><div className="space-y-3 mt-3">{f.payments?.map(p => <div className="border rounded-xl p-3 space-y-2 text-sm" key={p.id}><p>#{p.id} · {p.method} · {money(p.amount_paise)} · {p.status}</p><p>Verified credit: {money(p.credited_paise)} {p.reference && `· Reference: ${p.reference}`}</p>{p.note && <p>{p.note}</p>}{p.refund_due_paise > 0 && <p role="alert" className="text-red-700">Excess payment refund pending: {money(p.refund_due_paise)}</p>}{p.method === 'online' && p.gateway_order_id && <button disabled={busy} className={button} onClick={() => run(() => api.checkFundOnlinePayment(f.id, p.id))}>Check payment / refund</button>}{p.method === 'bank' && p.status === 'pending' && (admin ? <BankReview fund={f} payment={p} busy={busy} run={run} /> : <button className={button} disabled={busy} onClick={() => run(() => api.cancelFundBankPayment(f.id, p.id))}>Cancel submission</button>)}{admin && p.refund_due_paise > 0 && <RefundReview fund={f} payment={p} busy={busy} run={run} />}</div>)}</div></details>
      <details><summary className="font-bold cursor-pointer">Status history & reminders</summary><ol className="text-sm mt-3 space-y-2">{f.events?.map(ev => <li key={ev.id}><strong>{date(ev.created_at)} · {ev.type.replaceAll('_', ' ')}</strong><p>{ev.note}</p>{ev.data?.old_due_date && <p>{ev.data.old_due_date} → {ev.data.new_due_date}</p>}</li>)}</ol></details>
    </article>)}
    {result?.funds && <Pages data={result.funds} setPage={setPage} />}
  </main>;
}
