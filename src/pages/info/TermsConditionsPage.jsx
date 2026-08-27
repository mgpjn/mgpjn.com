import React from 'react';
import { FileCheck, ShieldAlert, Scale, AlertTriangle, Pill, Building2, MapPin } from 'lucide-react';

export default function TermsConditionsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10 text-slate-700">
      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-brand-blue-50 text-brand-blue-800 border border-brand-blue-200 px-3.5 py-1 rounded-full text-xs font-bold">
          <Scale className="w-4 h-4 text-brand-blue-600" />
          <span>Legally Binding User Agreement</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Terms &amp; Conditions</h1>
        <p className="text-xs text-slate-500">
          Last Updated: February 2026 • Issued by MEDIGLAXO PHARMA (Pharma Junction)
        </p>
      </div>

      {/* Intro Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4 text-xs sm:text-sm leading-relaxed">
        <p>
          These Terms &amp; Conditions govern your access to and use of the website, mobile applications, and online digital pharmacy marketplace operated by <strong>MEDIGLAXO PHARMA</strong> (Registration: Form GST REG-06, GSTIN: <strong>24ABVFM0075D1ZA</strong>, having its principal place of business at Surat, Gujarat, India).
        </p>
        <p>
          By creating an account, browsing medicines, uploading doctor prescriptions, or placing an order, you agree to be legally bound by these terms. If you do not agree, please do not use the platform.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-6 text-xs sm:text-sm leading-relaxed">
        {/* 1. Eligibility & Platform Nature */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center space-x-3 text-brand-blue-900">
            <FileCheck className="w-5 h-5 text-brand-blue-800 flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">1. Eligibility &amp; Account Responsibility</h2>
          </div>
          <p className="text-slate-600">
            You must be at least 18 years of age to register an account and place orders for pharmaceutical products. You are solely responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.
          </p>
        </section>

        {/* 2. Prescription Medicine Dispensation (Rx) */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center space-x-3 text-brand-blue-900">
            <Pill className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">2. Prescription (Rx) Verification &amp; Dispensation</h2>
          </div>
          <p className="text-slate-600">
            Under the Drugs and Cosmetics Act, 1940 and Pharmacy Practice Regulations:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>Any order containing Schedule H, H1, or X prescription medications requires a valid digital prescription written by a licensed Registered Medical Practitioner (RMP).</li>
            <li>All uploaded prescriptions are thoroughly verified by our registered in-house pharmacists prior to packaging and dispatch.</li>
            <li>We reserve the right to decline or cancel any prescription order if the prescription is found to be illegible, altered, expired, or medically contradictory.</li>
          </ul>
        </section>

        {/* 3. Pricing, Payments & Dual Wholesale Rates */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center space-x-3 text-brand-blue-900">
            <Scale className="w-5 h-5 text-brand-orange-500 flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">3. Pricing, Discounts &amp; Wholesale B2B Terms</h2>
          </div>
          <p className="text-slate-600">
            All prices and discounts displayed on MediGlaxo are in Indian Rupees (INR) inclusive of applicable Goods and Services Tax (GST).
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li><strong>Retail Pricing:</strong> End-consumer rates applicable to single-unit orders.</li>
            <li><strong>Wholesale Tier Pricing:</strong> Available to verified B2B partners (Stockists, Super Distributors, Distributors, Sub-Distributors, Retailers, Sub-Retailers) or bulk orders meeting minimum wholesale quantity criteria.</li>
            <li>Prices and MRPs are subject to statutory batch revisions determined by manufacturers in accordance with NPPA/DPCO pricing directives.</li>
          </ul>
        </section>

        {/* 4. Refer & Earn Partner Code of Conduct */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center space-x-3 text-brand-blue-900">
            <ShieldAlert className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">4. Refer &amp; Earn Affiliate Code of Conduct</h2>
          </div>
          <p className="text-slate-600">
            Members participating in the MediGlaxo 8-tier community referral program agree to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>Represent pharmaceutical and wellness products truthfully without making unverified curative claims or diagnosing diseases.</li>
            <li>Earn commission strictly from genuine product consumption and retail sales volume.</li>
            <li>Refrain from spamming, deceptive advertising, or fraudulent account generation. Violations will result in immediate wallet forfeiture and account termination.</li>
          </ul>
        </section>

        {/* 5. Medical Disclaimer */}
        <section className="bg-amber-50 rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-sm space-y-3">
          <div className="flex items-center space-x-3 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-amber-950">5. Medical Disclaimer</h2>
          </div>
          <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
            The content, medicine descriptions, active ingredient information, and health blogs published on MediGlaxo are strictly for educational and informational purposes. They do NOT constitute medical advice, diagnosis, or treatment recommendations. Always seek the advice of your physician or qualified healthcare provider with any questions regarding a medical condition.
          </p>
        </section>

        {/* 6. Jurisdiction & Governing Law */}
        <section className="bg-gradient-to-r from-brand-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-emerald-400">6. Governing Law &amp; Jurisdiction</h2>
          <p className="text-xs sm:text-sm text-slate-300">
            These Terms &amp; Conditions are governed by and construed in accordance with the laws of the Republic of India. Any disputes arising out of or related to the use of MediGlaxo shall be subject to the exclusive jurisdiction of the competent courts in <strong>Surat, Gujarat, India</strong>.
          </p>
          <div className="pt-2 text-xs text-slate-400">
            <p><strong>Operating Entity:</strong> MEDIGLAXO PHARMA</p>
            <p><strong>Principal Place:</strong> ICE FACTORY, 280, Somnath Nagar, Gabhani, Sachin, Surat, Gujarat - 394230</p>
          </div>
        </section>
      </div>
    </div>
  );
}
