import React from 'react';
import { Link } from 'react-router-dom';
import policies from '../../data/legalPolicies.json';
export default function ContactUsPage() {
  const business = policies.operator;
  return <article className="max-w-4xl mx-auto px-4 py-12 space-y-6">
    <h1 className="text-3xl font-black text-slate-900">Contact MediGlaxo Support</h1>
    <p className="text-sm text-slate-600 leading-7">For orders, delivery damage, prescriptions, payments, wallet or privacy enquiries, contact our support team directly.</p>
    <section className="bg-white border rounded-2xl p-6 space-y-3 text-sm leading-7"><h2 className="font-bold text-lg">{business.name}</h2><p>{business.address}<br />GSTIN: {business.gstin}</p><p><a className="underline text-brand-blue-800" href={`mailto:${business.email}?subject=MediGlaxo%20Support%20Request`}>{business.email}</a><br /><a className="underline text-brand-blue-800" href="tel:+919650582703">{business.phone}</a></p></section>
    <section className="bg-brand-blue-50 border border-brand-blue-100 rounded-2xl p-6 space-y-3 text-sm leading-7">
      <h2 className="font-bold text-lg">Send your enquiry or complaint</h2>
      <p>Include your name, registered contact and relevant order or request ID. For delivery damage, email within 7 calendar days and attach clear photos and/or video of the item, packaging and batch/expiry label. Do not send passwords, OTPs or card PINs.</p>
      <a className="inline-block rounded-xl bg-brand-blue-800 text-white px-5 py-3 font-semibold" href={`mailto:${business.email}?subject=MediGlaxo%20Support%20Request`}>Open email draft</a>
      <p className="text-xs">This opens your email app; add details/attachments and send the email yourself. If it does not open, send from your webmail to {business.email}. No message is sent merely by opening this page.</p>
      <p>Complaints are to be acknowledged within 48 hours and addressed within 30 days.</p>
    </section>
    <nav aria-label="Support policies" className="flex flex-wrap gap-4 text-sm text-brand-blue-800 underline"><Link to="/return-and-refund-policy">Damage, returns &amp; refunds</Link><Link to="/grievance-policy">Complaints &amp; escalation</Link><Link to="/account-deletion">Account deletion</Link><Link to="/policies">All policies</Link></nav>
  </article>;
}
