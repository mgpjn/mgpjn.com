import React from 'react';
import { Link } from 'react-router-dom';
import policies from '../../data/legalPolicies.json';

const emailFor = (id) => `mailto:${policies.operator.email}?subject=${encodeURIComponent(id === 'account-deletion' ? 'Account Deletion Request' : id === 'return-and-refund-policy' ? 'Damaged Delivery Complaint' : 'MediGlaxo Support Request')}`;

export default function LegalPolicyPage({ policyId }) {
  const policy = policies.policies.find((item) => item.id === policyId);
  return (
    <article className="max-w-5xl mx-auto px-4 py-10 sm:py-14 text-slate-700">
      <header className="space-y-3 mb-8">
        <Link to="/policies" className="text-sm font-semibold text-brand-blue-800 underline">Policies &amp; Help</Link>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900">{policy?.title || 'Policies & Help'}</h1>
        <p className="text-sm leading-6">{policy?.summary || 'Terms, privacy and practical help for the MediGlaxo website and mobile app.'}</p>
        <p className="text-xs text-slate-500">Updated {policies.updated} · {policies.version}</p>
      </header>
      {policy ? <>
        <nav aria-label="On this page" className="rounded-2xl bg-slate-100 p-5 mb-6">
          <p className="font-bold text-sm mb-3">On this page</p>
          <ul className="space-y-2 text-sm">{policy.sections.map((section, index) => <li key={section.heading}><a className="underline text-brand-blue-800" href={`#section-${index + 1}`}>{section.heading}</a></li>)}</ul>
        </nav>
        <div className="space-y-5">{policy.sections.map((section, index) => <section id={`section-${index + 1}`} key={section.heading} className="scroll-mt-24 bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 space-y-3">
          <h2 className="font-bold text-lg text-slate-900">{index + 1}. {section.heading}</h2>
          {section.paragraphs.map((paragraph) => <p className="text-sm leading-7 break-words" key={paragraph}>{paragraph}</p>)}
        </section>)}</div>
        <aside className="mt-6 rounded-2xl bg-brand-blue-50 border border-brand-blue-100 p-5 space-y-3">
          <h2 className="font-bold text-slate-900">Need help?</h2>
          <div className="flex flex-wrap gap-4 text-sm"><a href={emailFor(policy.id)} className="font-semibold underline text-brand-blue-800">{policy.id === 'account-deletion' ? 'Open account deletion email' : 'Email support'}</a><a className="underline text-brand-blue-800" href="tel:+919650582703">{policies.operator.phone}</a></div>
          <p className="text-xs leading-5">The email link opens a draft in your email app. Add your details and any evidence, then send it. If no email app opens, use webmail to write to {policies.operator.email}.</p>
          {policy.id === 'grievance-policy' && <a className="inline-block text-sm underline text-brand-blue-800" href="https://consumerhelpline.gov.in/" target="_blank" rel="noreferrer">National Consumer Helpline</a>}
        </aside>
      </> : null}
      <nav aria-label="All policies" className="mt-8 grid gap-3 sm:grid-cols-2">
        {policies.policies.filter((item) => item.id !== policyId).map((item) => <Link key={item.id} to={`/${item.id}`} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-brand-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue-800"><h2 className="font-bold text-sm text-brand-blue-900">{item.title}</h2><p className="text-xs leading-5 mt-2">{item.summary}</p></Link>)}
      </nav>
    </article>
  );
}
