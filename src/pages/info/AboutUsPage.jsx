import React from 'react';
import { ShieldCheck, Award, Users, HeartPulse, Building2, CheckCircle2 } from 'lucide-react';

export default function AboutUsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-bold text-brand-orange-500 uppercase tracking-widest">About MediGlaxo</span>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          Your Trusted Healthcare &amp; Pharma Junction
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          MEDIGLAXO PHARMA (Pharma Junction) is a registered pharmaceutical partnership enterprise committed to making premium, authentic medicines accessible and affordable with direct community empowerment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-blue-50 text-brand-blue-800 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900">Our Medicine Catalog</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Browse product-specific medicine and healthcare information, including available composition, packing, batch and expiry details. Contact support about a particular item before ordering.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-orange-50 text-brand-orange-500 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900">Affordable Healthcare</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Review the retail selling price, MRP where shown, available offers and final checkout quote for your selected product and quantity.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-base text-slate-900">Community Empowerment</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Our three-level referral program offers eligible genuine-sale commissions at 10%, 3% and 2%, subject to the published Referral & Wallet Policy. Earnings are not guaranteed.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-brand-blue-900 to-slate-900 rounded-3xl p-8 md:p-12 text-white space-y-4">
        <h2 className="text-2xl font-black">Business Information</h2>
        <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
          MEDIGLAXO PHARMA lists its GST registration and business contact information below. Medicine supply remains subject to applicable licensing requirements, prescription review and suitable handling for the selected product.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs font-mono">
          <div className="bg-white/10 p-3 rounded-xl border border-white/10">
            <span className="text-slate-400 block text-[10px]">Legal Entity</span>
            <strong className="text-white text-[11px]">MEDIGLAXO PHARMA</strong>
          </div>
          <div className="bg-white/10 p-3 rounded-xl border border-white/10">
            <span className="text-slate-400 block text-[10px]">GSTIN (Govt of India)</span>
            <strong className="text-emerald-400 text-[11px]">24ABVFM0075D1ZA</strong>
          </div>
          <div className="bg-white/10 p-3 rounded-xl border border-white/10">
            <span className="text-slate-400 block text-[10px]">Managing Partner</span>
            <strong className="text-white text-[11px]">UPENDAR U. PATEL</strong>
          </div>
          <div className="bg-white/10 p-3 rounded-xl border border-white/10">
            <span className="text-slate-400 block text-[10px]">Principal Place</span>
            <strong className="text-white text-[11px]">Surat, Gujarat - 394230</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
