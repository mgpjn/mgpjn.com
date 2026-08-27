import React from 'react';
import { RotateCcw, CheckCircle2, AlertOctagon, Clock, CreditCard, HelpCircle, Phone, Mail } from 'lucide-react';

export default function ReturnRefundPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10 text-slate-700">
      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1 rounded-full text-xs font-bold">
          <RotateCcw className="w-4 h-4 text-emerald-600" />
          <span>Hassle-Free 7-Day Replacement &amp; Return</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Return, Refund &amp; Cancellation Policy
        </h1>
        <p className="text-xs text-slate-500">
          Last Updated: February 2026 • Issued by MEDIGLAXO PHARMA
        </p>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <Clock className="w-6 h-6 text-brand-blue-800" />
          <h3 className="font-bold text-sm text-slate-900">7-Day Window</h3>
          <p className="text-xs text-slate-500">Request replacement or return within 7 calendar days of delivery.</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <CreditCard className="w-6 h-6 text-emerald-600" />
          <h3 className="font-bold text-sm text-slate-900">100% Secure Refund</h3>
          <p className="text-xs text-slate-500">Refunds processed to original bank/UPI source within 3-5 business days.</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <CheckCircle2 className="w-6 h-6 text-brand-orange-500" />
          <h3 className="font-bold text-sm text-slate-900">Easy Verification</h3>
          <p className="text-xs text-slate-500">Quick batch verification &amp; instant doorstep pickup.</p>
        </div>
      </div>

      {/* Policy Details */}
      <div className="space-y-6 text-xs sm:text-sm leading-relaxed">
        {/* 1. Return Eligibility */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">1. Return Eligibility Criteria</h2>
          <p className="text-slate-600">
            At <strong>MEDIGLAXO PHARMA</strong>, patient safety and product authenticity are paramount. You can initiate a return or replacement under the following conditions:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li><strong>Damaged / Tampered Packaging:</strong> If the medicine strip, bottle seal, or outer packaging is physically damaged upon arrival.</li>
            <li><strong>Near Expiry / Expired Batch:</strong> If the delivered medication has less than 3 months of shelf life or has passed expiry.</li>
            <li><strong>Incorrect Product Delivered:</strong> If the item received does not match the prescribed medicine, strength, or invoice.</li>
            <li><strong>Defective Medical Device:</strong> If a medical accessory, thermometer, or monitor is functionally defective upon unboxing.</li>
          </ul>
        </section>

        {/* 2. Non-Returnable Categories */}
        <section className="bg-rose-50/70 rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-rose-900">
            <AlertOctagon className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-rose-950">2. Non-Returnable Items (Safety Compliance)</h2>
          </div>
          <p className="text-xs sm:text-sm text-rose-900">
            In compliance with strict pharmaceutical regulations and the Good Pharmacy Practice (GPP) standards, the following cannot be returned once delivered:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-rose-900">
            <li>Opened medicine strips, broken bottle seals, or partially consumed syrups.</li>
            <li>Refrigerated / Temperature-sensitive cold chain items (e.g. Injections, Insulins, Vaccines) once handed over.</li>
            <li>Personal intimate hygiene products, maternity goods, and sexual wellness items.</li>
          </ul>
        </section>

        {/* 3. Order Cancellation Policy */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">3. Order Cancellation Policy</h2>
          <p className="text-slate-600">
            You may cancel an order free of charge at any time <strong>before the package is dispatched</strong> from our central pharmacy hub.
          </p>
          <p className="text-slate-600">
            To cancel, visit <strong>My Orders</strong> in your dashboard or contact our customer support desk immediately via WhatsApp / Phone at <strong className="text-slate-900">+91 9650582703</strong>.
          </p>
        </section>

        {/* 4. Refund Methods & Timelines */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">4. Refund Processing &amp; Timelines</h2>
          <p className="text-slate-600">
            Once a returned item is received at our facility and verified by our pharmacist:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li><strong>Prepaid Orders (UPI / Card / Netbanking):</strong> Refund is credited back to your original source account within <strong>3 to 5 business days</strong>.</li>
            <li><strong>Cash on Delivery (COD) Orders:</strong> Refund is transferred directly to your bank account via NEFT / IMPS or instant UPI upon providing bank details.</li>
            <li><strong>MediGlaxo Wallet Credit:</strong> Instant credit to your MediGlaxo wallet for immediate reuse on upcoming medicine orders.</li>
          </ul>
        </section>

        {/* 5. Support & Return Helpdesk */}
        <section className="bg-gradient-to-r from-brand-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-emerald-400">5. Need Help with a Return?</h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Our pharmacist support team is available 7 days a week to ensure your health and satisfaction are completely protected.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs font-medium">
            <div className="flex items-center space-x-3 bg-white/10 p-3.5 rounded-2xl border border-white/10">
              <Phone className="w-5 h-5 text-brand-orange-400 flex-shrink-0" />
              <div>
                <p className="text-slate-400 text-[10px]">Pharmacist Support Helpline</p>
                <p className="text-white font-bold">+91 9650582703</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-white/10 p-3.5 rounded-2xl border border-white/10">
              <Mail className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-slate-400 text-[10px]">Email Support Desk</p>
                <p className="text-white font-bold">support@mediglaxo.com</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
