import React, { useState } from 'react';
import { Phone, Mail, MapPin, MessageSquare, Send, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ContactUsPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-brand-orange-500 uppercase tracking-widest">Get In Touch</span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Contact MediGlaxo Support</h1>
        <p className="text-xs text-slate-500">We are here to assist with medicine inquiries, orders, and distributor partnerships.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Contact Information */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Registered Office &amp; Hub</h3>
            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-brand-orange-500 flex-shrink-0 mt-0.5" />
                <span><strong>MEDIGLAXO PHARMA</strong><br />Sachin GIDC, Surat, Gujarat - 394230</span>
              </div>
              <div className="flex items-start space-x-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>GSTIN: <strong className="text-slate-800">24ABVFM0075D1ZA</strong> (Govt. of India)</span>
              </div>
              <div className="flex items-start space-x-3">
                <Phone className="w-4 h-4 text-brand-blue-800 flex-shrink-0 mt-0.5" />
                <span>+91 9650582703 (Customer Helpline &amp; WhatsApp)</span>
              </div>
              <div className="flex items-start space-x-3">
                <Mail className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>support@mediglaxo.com</span>
              </div>
            </div>
          </div>

          <div className="bg-brand-blue-50 p-6 rounded-3xl border border-brand-blue-100 space-y-2">
            <h4 className="font-bold text-xs text-brand-blue-900">Pharmacist Desk Hours:</h4>
            <p className="text-xs text-slate-600">Monday - Saturday: 8:00 AM - 10:00 PM</p>
            <p className="text-xs text-slate-600">Sunday: 9:00 AM - 6:00 PM</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-7 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-slate-900">Send Us a Direct Message</h3>

          {submitted ? (
            <div className="p-6 bg-emerald-50 text-emerald-800 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-sm">Message Sent Successfully!</h4>
              <p className="text-xs text-slate-500">Our customer care pharmacist will get back to you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Your Name *</label>
                  <input type="text" required placeholder="Full Name" className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number *</label>
                  <input type="tel" required placeholder="Mobile Number" className="w-full px-3 py-2 border rounded-xl" />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                <input type="email" placeholder="you@example.com" className="w-full px-3 py-2 border rounded-xl" />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Subject / Nature of Inquiry</label>
                <input type="text" placeholder="e.g. Medicine Availability, Order Status, Refer & Earn Query" className="w-full px-3 py-2 border rounded-xl" />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Message *</label>
                <textarea rows="4" required placeholder="Please describe how we can assist you..." className="w-full px-3 py-2 border rounded-xl"></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-orange-500 hover:bg-brand-orange-600 text-white py-3 rounded-xl font-bold shadow-md shadow-brand-orange-500/20 flex items-center justify-center space-x-2 transition-all"
              >
                <span>Send Message</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
