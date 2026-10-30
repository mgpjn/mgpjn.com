import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { createAdminTransfer } from '../../services/api';
import TransferUserSearch from './TransferUserSearch';

const levels = ['Super Distributor', 'Distributor', 'Sub Distributor', 'Retailer', 'Sub Retailer', 'Member', 'Customer'];
export default function AdminTransferModal({ onClose, onSaved }) {
  const [mode, setMode] = useState('tree_migration');
  const [level, setLevel] = useState('Customer');
  const [source, setSource] = useState(null);
  const [parent, setParent] = useState(null);
  const [receiver, setReceiver] = useState(null);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('admin_credit');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const sending = useRef(false);
  const migration = mode === 'tree_migration';
  const valid = migration ? source && parent && source.id !== parent.id : receiver?.referral_code && Number(amount) > 0;
  async function submit(e) {
    e.preventDefault();
    if (!valid || sending.current) return;
    sending.current = true;
    setBusy(true); setError('');
    try {
      const payload = migration
        ? { mode, current_level: level, user_id: source.id, new_parent_id: parent.id, reason }
        : { mode, receiver_code: receiver.referral_code, amount, transfer_type: type, notes: reason };
      const { data } = await createAdminTransfer(payload);
      if (!data.success) throw new Error(data.message || 'Transfer failed.');
      toast.success(data.message || 'Transfer processed successfully.');
      onSaved(); onClose();
    } catch (err) {
      const errors = err.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(' ') : err.response?.data?.message || err.message || 'Transfer failed.');
    } finally { sending.current = false; setBusy(false); }
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
    <div role="dialog" aria-modal="true" aria-labelledby="transfer-title" className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 max-h-[90dvh] overflow-y-auto">
      <div className="flex items-center justify-between pb-3 border-b"><h3 id="transfer-title" className="text-base font-black text-slate-900">Create Transfer / Migration</h3><button type="button" disabled={busy} onClick={onClose} aria-label="Close transfer" className="p-1 text-slate-400"><X className="w-5 h-5" /></button></div>
      <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
        {[['tree_migration', 'Hierarchy Migration'], ['wallet_transfer', 'Wallet Fund Transfer']].map(([key, label]) => <button key={key} type="button" disabled={busy} onClick={() => { setMode(key); setError(''); }} className={`flex-1 py-2 rounded-lg ${mode === key ? 'bg-white text-[#ff5722] shadow-sm' : 'text-slate-600'}`}>{label}</button>)}
      </div>
      <form onSubmit={submit} className="space-y-3.5 text-xs">
        <fieldset disabled={busy} className="space-y-3.5">
          {migration ? <>
            <label className="font-bold text-slate-700 block">Current Level *<select value={level} onChange={(e) => { setLevel(e.target.value); setSource(null); setParent(null); setError(''); }} className="mt-1 w-full px-3 py-2 bg-slate-50 border rounded-xl">{levels.map((name) => <option key={name}>{name}</option>)}</select></label>
            <TransferUserSearch key={`source-${level}`} label="User to migrate" role={level.toLowerCase().replaceAll(' ', '_')} value={source} onChange={(user) => { setSource(user); setParent(null); setError(''); }} disabled={busy} />
            {source && <TransferUserSearch key={`parent-${source.id}`} label="New parent sponsor" excludeId={source.id} value={parent} onChange={(user) => { setParent(user); setError(''); }} disabled={busy} />}
          </> : <>
            <TransferUserSearch label="Wallet receiver" value={receiver} onChange={(user) => { setReceiver(user); setError(''); }} disabled={busy} />
            <label className="font-bold text-slate-700 block">Amount (₹) *<input required type="number" min="0.01" max="9999999999.99" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full px-3 py-2 bg-slate-50 border rounded-xl" /></label>
            <label className="font-bold text-slate-700 block">Transfer Type<select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 w-full px-3 py-2 bg-slate-50 border rounded-xl"><option value="admin_credit">Admin Credit (Add to Wallet)</option><option value="admin_debit">Admin Debit (Deduct from Wallet)</option></select></label>
          </>}
          <label className="font-bold text-slate-700 block">Transfer Reason<input maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for this transfer" className="mt-1 w-full px-3 py-2 bg-slate-50 border rounded-xl font-normal" /></label>
        </fieldset>
        {valid && <p className="rounded-xl bg-blue-50 p-3 text-slate-700 break-words">{migration ? `${source.name} (#${source.id}) and their existing downline will move under ${parent.name} (#${parent.id}).` : `${type === 'admin_credit' ? 'Credit' : 'Debit'} ₹${Number(amount).toFixed(2)} ${type === 'admin_credit' ? 'to' : 'from'} ${receiver.name} (#${receiver.id}).`}</p>}
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
        <div className="pt-2 flex justify-end gap-2"><button type="button" disabled={busy} onClick={onClose} className="px-4 py-2 bg-slate-100 rounded-xl font-bold">Cancel</button><button disabled={!valid || busy} type="submit" className="px-5 py-2 bg-[#ff5722] text-white rounded-xl font-bold disabled:opacity-50">{busy ? 'Processing…' : 'Execute Transfer'}</button></div>
      </form>
    </div>
  </div>;
}
