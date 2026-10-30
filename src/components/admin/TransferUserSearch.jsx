import { useEffect, useId, useRef, useState } from 'react';
import { searchAdminTransferUsers } from '../../services/api';

export default function TransferUserSearch({ label, role = 'all', excludeId, value, onChange, disabled }) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState({ data: [], total: 0 });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [active, setActive] = useState(-1);
  const revision = useRef(0);
  const term = query.trim();
  const canSearch = term.length >= 2 || /^#?\d+$/.test(term);

  useEffect(() => {
    const controller = new AbortController();
    let ignore = false;
    const current = revision.current;
    setResult({ data: [], total: 0 });
    setActive(-1);
    setError('');
    if (value || !canSearch) { setStatus('idle'); return; }
    setStatus('waiting');
    const timer = setTimeout(async () => {
      setStatus('loading');
      try {
        const { data } = await searchAdminTransferUsers({ search: term, role, exclude_id: excludeId || undefined }, { signal: controller.signal });
        if (ignore || revision.current !== current) return;
        if (!data.success) throw new Error(data.message || 'Unable to search users.');
        setResult(data.users);
        setStatus('ready');
      } catch (err) {
        if (ignore || revision.current !== current || controller.signal.aborted) return;
        setError(err.response?.data?.message || err.message || 'Unable to search users.');
        setStatus('error');
      }
    }, 450);
    return () => { ignore = true; clearTimeout(timer); controller.abort(); };
  }, [query, term, role, excludeId, value, retry, canSearch]);

  const select = (user) => {
    revision.current += 1;
    onChange(user);
    setQuery('');
    setResult({ data: [], total: 0 });
  };
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="font-bold text-slate-700 block">{label} *</label>
      {value ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex gap-2 items-start">
          <div className="min-w-0 flex-1 break-words"><p className="font-bold">{value.name}</p><p>{value.phone || 'No mobile'} · ID #{value.id} · {value.referral_code || 'No referral code'}</p><p className="text-slate-500 capitalize">{value.role.replaceAll('_', ' ')}{value.sponsor ? ` · Sponsor: ${value.sponsor.name} (${value.sponsor.referral_code})` : ''}</p></div>
          <button type="button" disabled={disabled} onClick={() => { revision.current += 1; onChange(null); setQuery(''); }} className="font-bold text-orange-600">Change</button>
        </div>
      ) : (
        <>
          <input id={id} type="search" autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={status === 'ready' && result.data.length > 0} aria-controls={`${id}-results`} aria-activedescendant={active >= 0 ? `${id}-${active}` : undefined}
            disabled={disabled} value={query} placeholder="Search mobile, user ID, referral ID or name"
            onChange={(e) => { revision.current += 1; setQuery(e.target.value); setResult({ data: [], total: 0 }); setStatus('idle'); setActive(-1); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); if (active >= 0 && result.data[active]) select(result.data[active]); }
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((n) => Math.min(n + 1, result.data.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive((n) => Math.max(n - 1, 0)); }
              if (e.key === 'Escape') { revision.current += 1; setQuery(''); }
            }} className="w-full px-3 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-orange-300 outline-none" />
          <div aria-live="polite" className="text-slate-500">
            {!canSearch && 'Type at least 2 characters, or enter a numeric user ID.'}
            {status === 'waiting' && 'Search starts when you stop typing…'}
            {status === 'loading' && 'Searching…'}
            {status === 'ready' && result.data.length === 0 && 'No matching users found. Try another mobile number or ID.'}
            {status === 'error' && <span className="text-red-600">{error} <button type="button" onClick={() => setRetry((n) => n + 1)} className="underline font-bold">Retry</button></span>}
          </div>
          {status === 'ready' && result.data.length > 0 && <>
            <ul id={`${id}-results`} role="listbox" aria-label={`${label} results`} className="max-h-44 overflow-y-auto border rounded-xl divide-y bg-white">
              {result.data.map((user, i) => <li key={user.id} id={`${id}-${i}`} role="option" aria-selected={active === i}>
                <button disabled={disabled} type="button" onClick={() => select(user)} className={`w-full text-left px-3 py-2 hover:bg-orange-50 focus:bg-orange-50 ${active === i ? 'bg-orange-50' : ''}`}>
                  <span className="font-bold block">{user.name}</span><span className="block break-words">{user.phone || 'No mobile'} · ID #{user.id} · {user.referral_code || 'No referral code'}</span><span className="text-slate-500 capitalize">{user.role.replaceAll('_', ' ')} · {user.status}</span>
                </button>
              </li>)}
            </ul>
            {result.total > result.data.length && <p className="text-slate-500">Showing {result.data.length} of {result.total}. Enter more digits or the full ID to narrow results.</p>}
          </>}
        </>
      )}
    </div>
  );
}
