import React from 'react';
import { Truck, ShieldCheck, Clock, ThermometerSnowflake, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ShippingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10 text-slate-700">
      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-brand-blue-50 text-brand-blue-800 border border-brand-blue-200 px-3.5 py-1 rounded-full text-xs font-bold">
          <Truck className="w-4 h-4 text-brand-blue-600" />
          <span>Pan-India Express Cold-Chain Delivery</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Shipping &amp; Delivery Policy
        </h1>
        <p className="text-xs text-slate-500">
          Last Updated: February 2026 • Issued by MEDIGLAXO PHARMA
        </p>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <Truck className="w-6 h-6 text-brand-orange-500" />
          <h3 className="font-bold text-sm text-slate-900">Free Delivery &gt; ₹500</h3>
          <p className="text-xs text-slate-500">Free shipping on all eligible pharmaceutical orders across India.</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <Clock className="w-6 h-6 text-brand-blue-800" />
          <h3 className="font-bold text-sm text-slate-900">24-48h Express Transit</h3>
          <p className="text-xs text-slate-500">Rapid doorstep dispatch in major metro areas and urban hubs.</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <ThermometerSnowflake className="w-6 h-6 text-sky-600" />
          <h3 className="font-bold text-sm text-slate-900">Cold Chain Thermal Pack</h3>
          <p className="text-xs text-slate-500">Insulated gel-ice packs for heat-sensitive syrups and injections.</p>
        </div>
      </div>

      {/* Policy Details */}
      <div className="space-y-6 text-xs sm:text-sm leading-relaxed">
        {/* 1. Delivery Rates & Free Shipping Threshold */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">1. Shipping Charges &amp; Free Delivery</h2>
          <p className="text-slate-600">
            <strong>MEDIGLAXO PHARMA</strong> strives to keep medicine delivery affordable for every Indian family:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li><strong>Orders of ₹500 and Above:</strong> 100% <strong>FREE Express Delivery</strong> nationwide.</li>
            <li><strong>Orders below ₹500:</strong> A nominal convenience and handling charge of <strong>₹50</strong> applies.</li>
            <li><strong>Wholesale / B2B Bulk Shipments:</strong> Dedicated freight &amp; cargo dispatch available at negotiated partner rates.</li>
          </ul>
        </section>

        {/* 2. Delivery Timelines */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">2. Estimated Delivery Timeframes</h2>
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-800 font-bold border-b border-slate-200">
                  <th className="p-3">Region / Destination</th>
                  <th className="p-3">Estimated Timeline</th>
                  <th className="p-3">Packaging Standard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr>
                  <td className="p-3 font-semibold text-slate-800">Surat, Gujarat &amp; West Zone</td>
                  <td className="p-3">Same Day / 24 Hours</td>
                  <td className="p-3">Direct Local Express</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-800">Tier 1 Metros (Mumbai, Delhi NCR, Bengaluru, Hyderabad, Chennai, Kolkata)</td>
                  <td className="p-3">24 to 48 Hours</td>
                  <td className="p-3">Tamper-Proof Corrugated Seal</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-800">Tier 2 &amp; Tier 3 Cities</td>
                  <td className="p-3">2 to 4 Business Days</td>
                  <td className="p-3">Multi-Layer Bubble Cushioning</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-800">Remote &amp; North East Regions</td>
                  <td className="p-3">4 to 6 Business Days</td>
                  <td className="p-3">Air Cargo Priority Pack</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Cold-Chain Logistics Standard */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-sky-900">
            <ThermometerSnowflake className="w-5 h-5 text-sky-600 flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">3. Temperature-Controlled Cold-Chain Standards</h2>
          </div>
          <p className="text-slate-600">
            Certain medications (e.g. insulin vials, vaccines, specific probiotics) require storage between 2°C and 8°C. MediGlaxo dispatches such items in specialized thermal-insulated containers packed with medical-grade refrigerant gel packs to preserve biological potency from our hub to your doorstep.
          </p>
        </section>

        {/* 4. Live Tracking & Delivery Confirmation */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">4. Order Tracking &amp; Delivery Verification</h2>
          <p className="text-slate-600">
            Once your order is verified by our pharmacist and packed, you will receive an automated SMS and WhatsApp update with your tracking ID. You can also track live shipment milestones anytime via <span className="font-semibold text-brand-blue-800">Track Order</span> on our website.
          </p>
        </section>
      </div>
    </div>
  );
}
