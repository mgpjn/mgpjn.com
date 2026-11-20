import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Phone, Mail, ShieldCheck } from 'lucide-react';

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'Where can I find medicine details?',
      a: 'Check the product page for available medicine details. For questions about a specific product, batch or expiry date, contact MediGlaxo support before ordering.',
    },
    {
      q: 'What is MEDIGLAXO PHARMA\'s legal entity and registration status?',
      a: 'MEDIGLAXO PHARMA lists GSTIN 24ABVFM0075D1ZA and its business location as Sachin GIDC, Surat, Gujarat 394230, India. Contact support for current business and licensing details. A GST registration is not itself a drug licence.',
    },
    {
      q: 'How does the Doctor Prescription (Rx) verification work?',
      a: 'Where required, provide a clear, valid prescription from a registered medical practitioner. Supply is subject to prescription review, stock and applicable licensing requirements. Uploading a prescription does not itself confirm an order.',
    },
    {
      q: 'What is the difference between Retail and Wholesale Partner pricing?',
      a: 'Customer accounts show the applicable retail selling price and product packing. Authorised business accounts may have separate trade pricing. Review the final checkout quote; no blanket discount applies to every item.',
    },
    {
      q: 'How does the three-level referral program work?',
      a: 'The referral program has three reward levels: 10%, 3% and 2% of the recorded eligible product line totals. Payment must be verified as paid and the order must not be cancelled. Genuine-sale eligibility and adjustments apply; registration alone does not earn commission.',
    },
    {
      q: 'How do I withdraw my distributor wallet earnings?',
      a: 'Use Wallet & Payouts to request a bank withdrawal with accurate account details. A request reserves the gross amount and passes through pending, approved, processing and success. It is not an instant transfer. The current 5% deduction and net amount are shown in the payout record; see the Referral, Wallet & Withdrawal Policy for tax-treatment details.',
    },
    {
      q: 'What are the delivery charges and timelines?',
      a: 'Standard delivery is ₹50 below a ₹500 item subtotal and ₹0 at ₹500 or above; takeaway has no delivery charge. Coupons and separately displayed platform/COD charges may affect the final quote. Coverage and delivery estimates depend on the address, item and order checks.',
    },
    {
      q: 'What payment methods are supported?',
      a: 'Available payment methods are shown at checkout and may include online payments, wallet and COD. Use the final order/payment confirmation; never share a payment or account OTP with support.',
    },
    {
      q: 'What is the Return & Replacement Policy?',
      a: 'For a product received damaged, contact support within 7 calendar days and email the order details with clear photos and/or video to support@mgpjn.com. Support reviews the evidence and confirms replacement/refund instructions. General change-of-mind returns are not promised; mandatory rights for wrong, expired or defective goods remain available.',
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
            href="mailto:support@mgpjn.com"
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
