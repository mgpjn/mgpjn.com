import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Phone, Mail, ShieldCheck } from 'lucide-react';

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'Are all medicines sold on MediGlaxo 100% authentic?',
      a: 'Yes, absolutely. All pharmaceuticals, generic tablets, syrups, capsules, and wellness formulations on MediGlaxo are sourced directly from licensed, WHO-GMP certified pharmaceutical manufacturers with verifiable batch certificate numbers, expiry dates, and tamper-proof seals.',
    },
    {
      q: 'What is MEDIGLAXO PHARMA\'s legal entity and registration status?',
      a: 'MEDIGLAXO PHARMA is a government-registered pharmaceutical partnership enterprise operating under Form GST REG-06 with GSTIN 24ABVFM0075D1ZA (Ghatak 63, Surat, Gujarat). Our registered principal hub is located in Sachin, Surat, Gujarat - 394230.',
    },
    {
      q: 'How does the Doctor Prescription (Rx) verification work?',
      a: 'When you order prescription drugs (Schedule H / H1), our registered in-house pharmacists inspect the uploaded doctor\'s prescription for correct dosage, patient details, and validity before the order is approved and dispatched.',
    },
    {
      q: 'What is the difference between Retail and Wholesale Partner pricing?',
      a: 'We offer dual pricing: Individual consumers enjoy competitive retail rates with flat 20-30% discounts. Verified B2B partners (Super Distributors, Distributors, Sub-Distributors, Retailers, Sub-Retailers) or bulk orders meeting minimum wholesale quantity criteria receive special bulk wholesale rates.',
    },
    {
      q: 'How does the MediGlaxo 8-Tier Community Network work?',
      a: 'Registered partners and promoters receive a unique referral link/code. When customers purchase medicines through your network, commissions are automatically distributed across the 8-tier hierarchy chain (Super Admin → Admin → Super Distributor → Distributor → Sub-Distributor → Retailer → Sub-Retailer → Customer).',
    },
    {
      q: 'How do I withdraw my distributor wallet earnings?',
      a: 'Once your withdrawable wallet balance reaches ₹500, go to your Refer & Earn Portal -> "Wallet & Payouts" and request an instant transfer directly to your Bank Account (NEFT/IMPS) or UPI ID.',
    },
    {
      q: 'What are the delivery charges and timelines?',
      a: 'Delivery is 100% FREE on all medicine and healthcare orders of ₹500 and above across India. For orders below ₹500, a nominal delivery charge of ₹50 applies. Standard delivery takes 24-48 hours in metro cities and 2-4 business days for other regions.',
    },
    {
      q: 'What payment methods are supported?',
      a: 'We accept instant UPI QR Code (Google Pay, PhonePe, Paytm, BHIM), Debit & Credit Cards, Net Banking, and Cash on Delivery (COD).',
    },
    {
      q: 'What is the Return & Replacement Policy?',
      a: 'We offer a 7-day hassle-free replacement or refund for damaged packs, near-expiry batches, or incorrect items delivered. Temperature-sensitive cold chain items and opened strips are non-returnable in compliance with drug safety laws.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 text-slate-700">
      {/* Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-brand-orange-50 text-brand-orange-600 border border-brand-orange-200 px-3 py-1 rounded-full text-xs font-bold">
          <HelpCircle className="w-4 h-4" />
          <span>Customer &amp; Partner Help Desk</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h1>
        <p className="text-xs text-slate-500">Quick answers about medicine orders, prescription verification, pricing, and partner payouts.</p>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full p-4 sm:p-5 text-left flex items-center justify-between font-bold text-xs sm:text-sm text-slate-800 hover:bg-slate-50 transition-colors"
            >
              <span className="pr-4">{faq.q}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${openIndex === i ? 'rotate-180 text-brand-blue-800' : ''}`} />
            </button>
            {openIndex === i && (
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/50">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Help Box */}
      <div className="bg-gradient-to-r from-brand-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm sm:text-base">Still have questions?</h3>
          <p className="text-xs text-slate-300">Our customer care and pharmacist helpline is available 7 days a week.</p>
        </div>
        <div className="flex items-center space-x-3">
          <a
            href="tel:+919650582703"
            className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md"
          >
            <Phone className="w-4 h-4" />
            <span>Call Helpline</span>
          </a>
          <a
            href="mailto:support@mediglaxo.com"
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all"
          >
            <Mail className="w-4 h-4" />
            <span>Email Us</span>
          </a>
        </div>
      </div>
    </div>
  );
}
