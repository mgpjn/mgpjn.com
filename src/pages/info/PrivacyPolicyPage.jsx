import React from 'react';
import { ShieldCheck, Lock, Eye, FileText, Database, UserCheck, Mail, Phone, MapPin } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10 text-slate-700">
      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1 rounded-full text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>DPDP Act 2023 &amp; IT Act 2000 Compliant</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-slate-500">
          Last Updated: February 2026 • Effective for MEDIGLAXO PHARMA (Pharma Junction)
        </p>
      </div>

      {/* Introduction Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4 text-xs sm:text-sm leading-relaxed">
        <p>
          Welcome to <strong>MEDIGLAXO PHARMA</strong> (operating under brand name "<strong>MediGlaxo - Pharma Junction</strong>"). We are committed to safeguarding the confidentiality, integrity, and security of all personal, medical, and financial data entrusted to us by our customers, patients, healthcare partners, and registered distributors.
        </p>
        <p>
          This Privacy Policy describes our policies and procedures on the collection, storage, use, processing, and disclosure of information when you use our website (<span className="text-brand-blue-800 font-semibold">mediglaxo.com</span>), mobile applications, and online digital pharmacy services.
        </p>
      </div>

      {/* Policy Sections */}
      <div className="space-y-6 text-xs sm:text-sm leading-relaxed">
        {/* Section 1 */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center space-x-3 text-brand-blue-900">
            <Database className="w-5 h-5 text-brand-blue-800 flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">1. Information We Collect</h2>
          </div>
          <p className="text-slate-600">
            To provide safe pharmaceutical dispensation and order fulfilment, we collect:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li><strong>Personal Identity Data:</strong> Full Name, Mobile Phone Number, Email Address, Billing and Shipping Delivery Address, Pin Code.</li>
            <li><strong>Health &amp; Prescription Records:</strong> Doctor prescriptions (Rx files/photos), dosage instructions, prescribing doctor’s details, and patient name for prescription verification under the Drugs and Cosmetics Act, 1940.</li>
            <li><strong>Transaction &amp; Billing Data:</strong> Order history, invoice details, payment mode records (we do NOT store credit card CVV or net banking passwords).</li>
            <li><strong>B2B Partner &amp; Hierarchy Records:</strong> GSTIN (for wholesale buyers), Drug License copies (where applicable), bank account details (for Refer &amp; Earn commission payouts).</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center space-x-3 text-brand-blue-900">
            <Lock className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">2. Medical &amp; Prescription Data Confidentiality</h2>
          </div>
          <p className="text-slate-600">
            Medical prescriptions uploaded to MediGlaxo are treated as <strong>Sensitive Personal Data or Information (SPDI)</strong> under Indian law:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>Prescription images are stored on 256-bit encrypted storage and are accessible strictly to our registered pharmacists and licensed dispensing chemists.</li>
            <li>We do not sell, rent, monetize, or disclose your medical history or prescriptions to insurance brokers, advertisers, or third-party marketing companies.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center space-x-3 text-brand-blue-900">
            <Eye className="w-5 h-5 text-brand-orange-500 flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">3. Purpose of Data Processing</h2>
          </div>
          <p className="text-slate-600">
            We use your data solely for lawful business operations:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>Processing, packing, and delivering genuine pharmaceuticals to your doorstep.</li>
            <li>Pharmacist validation and dosage safety verification.</li>
            <li>Sending SMS / WhatsApp updates regarding order tracking, dispatch, and delivery.</li>
            <li>Calculating and disbursing multi-tier affiliate referral rewards and distributor wholesale margins.</li>
            <li>Complying with statutory reporting requirements under the GST Act and Pharmacy regulations.</li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center space-x-3 text-brand-blue-900">
            <UserCheck className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">4. Data Security &amp; User Rights</h2>
          </div>
          <p className="text-slate-600">
            We implement industry-grade technical and organizational safeguards including HTTPS/TLS 1.3 encryption, role-based access control (RBAC), and tokenized authentication sessions.
          </p>
          <p className="text-slate-600">
            You retain the right to review, update, download, or request the deletion of your account and personal profile data by reaching out to our Grievance Officer.
          </p>
        </section>

        {/* Section 5 - Grievance Officer */}
        <section className="bg-gradient-to-r from-brand-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-emerald-400">5. Grievance Redressal &amp; Contact Details</h2>
          <p className="text-xs text-slate-300">
            In accordance with the Information Technology Act 2000 and the Digital Personal Data Protection Act 2023, the details of our designated Grievance Officer are provided below:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium pt-2">
            <div className="space-y-1 bg-white/10 p-4 rounded-2xl border border-white/10">
              <h4 className="font-extrabold text-white">MEDIGLAXO PHARMA</h4>
              <p className="text-emerald-300 font-mono">GSTIN: 24ABVFM0075D1ZA</p>
            </div>
            <div className="space-y-2 bg-white/10 p-4 rounded-2xl border border-white/10">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-brand-orange-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">Sachin GIDC, Surat, Gujarat - 394230</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-brand-orange-400 flex-shrink-0" />
                <span className="text-slate-300">support@mediglaxo.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-brand-orange-400 flex-shrink-0" />
                <span className="text-slate-300">+91 9650582703</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
