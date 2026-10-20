import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDirectReferrals, getTeamMembers } from '../../services/api';
import { formatMemberDate } from '../../utils/memberDate';

export default function ReferralsPage() {
  const [members, setMembers] = useState({ data: [], total: 0, last_page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scope, setScope] = useState('direct');
  const [filters, setFilters] = useState({ search: '', joined_from: '', joined_to: '', sort: 'newest', page: 1 });
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    const timeout = setTimeout(() => {
      const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));
      (scope === 'direct' ? getDirectReferrals : getTeamMembers)(params)
        .then(({ data }) => {
          if (!data.success) throw new Error('Unable to load members.');
          if (active) setMembers(data.referrals || data.members);
        })
        .catch(() => { if (active) setError('Unable to load members. Please try again.'); })
        .finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; clearTimeout(timeout); };
  }, [filters, scope, reload]);
  const update = (key, value) => setFilters((old) => ({ ...old, [key]: value, page: 1 }));
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <Link to="/mlm" className="text-xs font-bold text-brand-blue-800">← Referral Income Dashboard</Link>
      <div><h1 className="text-2xl font-black text-slate-900">Member joining activity</h1><p className="text-sm text-slate-500 mt-1">Registration dates and times are shown in Asia/Kolkata (IST). Sponsor is the direct parent in your referral network.</p></div>
      <div className="flex flex-wrap gap-3 items-end text-xs">
        <label className="space-y-1">Members<select aria-label="Member scope" value={scope} onChange={(e) => { setScope(e.target.value); update('page', 1); }} className="block border rounded-xl p-2"><option value="direct">Direct referrals</option><option value="team">All downline members</option></select></label>
        <label className="space-y-1">Search<input aria-label="Search members" value={filters.search} onChange={(e) => update('search', e.target.value)} placeholder="Name or member ID" className="block border rounded-xl p-2" /></label>
        <label className="space-y-1">From (IST)<input aria-label="Joined from" type="date" value={filters.joined_from} onChange={(e) => update('joined_from', e.target.value)} className="block border rounded-xl p-2" /></label>
        <label className="space-y-1">To (IST)<input aria-label="Joined to" type="date" value={filters.joined_to} min={filters.joined_from} onChange={(e) => update('joined_to', e.target.value)} className="block border rounded-xl p-2" /></label>
        <label className="space-y-1">Order<select aria-label="Member sort" value={filters.sort} onChange={(e) => update('sort', e.target.value)} className="block border rounded-xl p-2"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label>
        <button onClick={() => setReload((n) => n + 1)} className="border rounded-xl p-2">Refresh</button>
      </div>
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm overflow-x-auto" aria-busy={loading}>
        {error ? <p role="alert" className="p-6 text-rose-700">{error} <button className="underline" onClick={() => setReload((n) => n + 1)}>Retry</button></p> : <table className="w-full text-xs text-left min-w-[700px]">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]"><tr>{['Member', 'Member ID', 'Role', 'Registered (IST)', 'Direct sponsor / parent', 'Joining status'].map((heading) => <th className="p-3" key={heading}>{heading}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan="6" className="p-6 text-center">Loading members...</td></tr> : !members.data.length ? <tr><td colSpan="6" className="p-6 text-center text-slate-500">No members found for these filters.</td></tr> : members.data.map((member) => <tr key={member.id}>
              <td className="p-3 font-bold">{member.name}</td><td className="p-3 font-mono">{member.referral_code || `#${member.id}`}<span className="block text-slate-400">#{member.id}</span></td>
              <td className="p-3 capitalize">{member.role?.replaceAll('_', ' ')}</td><td className="p-3 whitespace-nowrap">{formatMemberDate(member.created_at)}</td>
              <td className="p-3">{member.sponsor?.name || 'Not assigned'}<span className="block text-slate-500 font-mono">{member.sponsor?.referral_code || member.sponsor_id || '—'}</span></td>
              <td className="p-3 capitalize">{member.status || 'Not recorded'}</td>
            </tr>)}
          </tbody>
        </table>}
      </div>
      <div className="flex items-center justify-between gap-3 text-xs"><span>{members.total} members · Page {filters.page} of {members.last_page}</span><div className="flex gap-3">
        <button disabled={loading || filters.page <= 1} className="border rounded-xl p-2 disabled:opacity-40" onClick={() => setFilters((old) => ({ ...old, page: old.page - 1 }))}>Previous</button>
        <button disabled={loading || filters.page >= members.last_page} className="border rounded-xl p-2 disabled:opacity-40" onClick={() => setFilters((old) => ({ ...old, page: old.page + 1 }))}>Next</button>
      </div></div>
    </div>
  );
}
