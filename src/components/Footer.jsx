import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, ShieldCheck, Truck, Headphones, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top Trust Features */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 border-b border-slate-800">
          <div className="flex items-start space-x-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-brand-blue-900/80 text-brand-blue-400 flex items-center justify-center flex-shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Free Express Delivery</h4>
              <p className="text-xs text-slate-400 mt-0.5">On all medicine orders above ₹500 across India.</p>
            </div>
          </div>

          <div className="flex items-start space-x-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/80 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">100% Genuine Pharma</h4>
              <p className="text-xs text-slate-400 mt-0.5">Sourced directly from verified licensed manufacturers.</p>
            </div>
          </div>

          <div className="flex items-start space-x-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-brand-orange-950/80 text-brand-orange-400 flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Secure Payment</h4>
              <p className="text-xs text-slate-400 mt-0.5">UPI, QR Code, Net Banking & Cash on Delivery.</p>
            </div>
          </div>

          <div className="flex items-start space-x-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-purple-950/80 text-purple-400 flex items-center justify-center flex-shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">Pharmacist Support</h4>
              <p className="text-xs text-slate-400 mt-0.5">24/7 dedicated support & prescription verification.</p>
            </div>
          </div>
        </div>

        {/* Middle Footer Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 py-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="bg-white p-2.5 rounded-2xl inline-block shadow-md">
              <img src="/logo.png" alt="MediGlaxo Pharma Junction" className="h-12 w-auto" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India's trusted online pharmacy and digital healthcare platform (Pharma Junction). Delivering affordable, high-quality generic and branded prescription medicines with temperature-controlled cold chain logistics.
            </p>
            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <p><strong>Legal Name:</strong> MEDIGLAXO PHARMA</p>
              <p><strong>GSTIN:</strong> 24ABVFM0075D1ZA</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4">Quick Links</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/shop" className="hover:text-brand-orange-400 transition-colors">Browse Medicines</Link></li>
              <li><Link to="/shop?category=tablets" className="hover:text-brand-orange-400 transition-colors">Tablets & Capsules</Link></li>
              <li><Link to="/shop?category=ayurvedic" className="hover:text-brand-orange-400 transition-colors">Ayurvedic Healthcare</Link></li>
              <li><Link to="/shop?category=fitness-health" className="hover:text-brand-orange-400 transition-colors">Fitness Supplements</Link></li>
              <li><Link to="/track-order" className="hover:text-brand-orange-400 transition-colors">Track Your Order</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4">Customer Care</h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/privacy-policy" className="hover:text-brand-orange-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-brand-orange-400 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/returns" className="hover:text-brand-orange-400 transition-colors">Return & Refund Policy</Link></li>
              <li><Link to="/shipping" className="hover:text-brand-orange-400 transition-colors">Shipping Information</Link></li>
              <li><Link to="/faq" className="hover:text-brand-orange-400 transition-colors">Frequently Asked Questions</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4">Contact Us</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start space-x-3">
                <Phone className="w-4 h-4 text-brand-orange-400 flex-shrink-0 mt-0.5" />
                <span>+91 9650582703 (Customer Support & Orders)</span>
              </li>
              <li className="flex items-start space-x-3">
                <Mail className="w-4 h-4 text-brand-orange-400 flex-shrink-0 mt-0.5" />
                <span>support@mediglaxo.com</span>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-brand-orange-400 flex-shrink-0 mt-0.5" />
                <span>MEDIGLAXO PHARMA, Sachin GIDC, Surat, Gujarat - 394230</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 MediGlaxo Pharma Junction (mgpjn.com). All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <span className="text-[11px] bg-slate-800 px-3 py-1 rounded-full text-slate-400 font-medium">
              WHO-GMP Certified Products • ISO 9001:2015 Licensed Pharma Portal
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
