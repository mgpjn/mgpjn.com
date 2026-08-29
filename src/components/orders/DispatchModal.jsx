import React, { useState, useEffect } from 'react';
import { X, Truck, ExternalLink, Hash, CheckCircle2, Building2 } from 'lucide-react';
import { updateAdminOrderStatus } from '../../services/api';

const COURIER_PARTNERS = [
  { name: 'Blue Dart', urlPattern: 'https://www.bluedart.com/tracking?trackId=' },
  { name: 'Delhivery', urlPattern: 'https://www.delhivery.com/track/package/' },
  { name: 'DTDC Express', urlPattern: 'https://www.dtdc.in/tracking/shipment-tracking.asp?trkType=AWB&strCnno=' },
  { name: 'India Post (Speed Post)', urlPattern: 'https://www.indiapost.gov.in/_layouts/15/dpt.cept.tracking/trackconsignment.aspx' },
  { name: 'Trackon Couriers', urlPattern: 'http://trackon.in/Tracking.aspx?awb=' },
  { name: 'Shree Tirupati Courier', urlPattern: 'https://www.shreetirupaticourier.net/' },
  { name: 'Xpressbees', urlPattern: 'https://www.xpressbees.com/track?tracking_id=' },
  { name: 'Ekart Logistics', urlPattern: 'https://ekartlogistics.com/track/' },
  { name: 'Professional Courier', urlPattern: 'https://www.tpcindia.com/' },
  { name: 'Local Delivery / Direct Van', urlPattern: '' },
  { name: 'Other Courier', urlPattern: '' },
];

export default function DispatchModal({ order, isOpen, onClose, onSuccess }) {
  const [courierName, setCourierName] = useState('');
  const [customCourier, setCustomCourier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (order) {
      const existingCourier = order.courier_name || 'Blue Dart';
      const isKnown = COURIER_PARTNERS.some((c) => c.name === existingCourier);
      if (isKnown) {
        setCourierName(existingCourier);
        setCustomCourier('');
      } else if (existingCourier) {
        setCourierName('Other Courier');
        setCustomCourier(existingCourier);
      } else {
        setCourierName('Blue Dart');
        setCustomCourier('');
      }

      setTrackingNumber(order.tracking_number || '');
      setTrackingUrl(order.tracking_url || '');
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleCourierChange = (e) => {
    const selected = e.target.value;
    setCourierName(selected);
    const partner = COURIER_PARTNERS.find((p) => p.name === selected);
    if (partner && partner.urlPattern && trackingNumber) {
      setTrackingUrl(partner.urlPattern + trackingNumber.trim());
    } else if (partner && partner.urlPattern) {
      setTrackingUrl(partner.urlPattern);
    }
  };

  const handleTrackingNumberChange = (e) => {
    const num = e.target.value;
    setTrackingNumber(num);
    const partner = COURIER_PARTNERS.find((p) => p.name === courierName);
    if (partner && partner.urlPattern) {
      setTrackingUrl(partner.urlPattern + num.trim());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      alert('Please enter Tracking ID / AWB Number.');
      return;
    }

    const finalCourier = courierName === 'Other Courier' ? customCourier.trim() || 'Other' : courierName;

    setIsSubmitting(true);
    try {
      await updateAdminOrderStatus(order.id, {
        order_status: 'dispatched',
        courier_name: finalCourier,
        tracking_number: trackingNumber.trim(),
        tracking_url: trackingUrl.trim() || undefined,
      });

      alert(`Order #${order.order_number} marked as Dispatched with tracking ID ${trackingNumber.trim()}!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to dispatch order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-150 border border-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Dispatch Order &amp; Add Tracking
              </h3>
              <p className="text-xs text-slate-500">
                Order #{order.order_number} • {order.customer_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Destination Info Card */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Destination:</span>
            <span className="font-bold text-slate-800">
              {order.city} ({order.pincode}), {order.state}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Total Amount:</span>
            <span className="font-extrabold text-slate-900">
              ₹{Number(order.total_amount).toFixed(2)} ({order.payment_method?.toUpperCase()})
            </span>
          </div>
        </div>

        {/* Dispatch Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Courier Company Name */}
          <div>
            <label className="font-bold text-slate-800 block mb-1 flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Courier / Transport Company Name *</span>
            </label>
            <select
              required
              value={courierName}
              onChange={handleCourierChange}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
            >
              {COURIER_PARTNERS.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Courier Input if Other selected */}
          {courierName === 'Other Courier' && (
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Enter Courier Company Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. VRL Logistics, Safechem Cargo, etc."
                value={customCourier}
                onChange={(e) => setCustomCourier(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-emerald-600 outline-none"
              />
            </div>
          )}

          {/* Tracking ID / AWB Number */}
          <div>
            <label className="font-bold text-slate-800 block mb-1 flex items-center space-x-1.5">
              <Hash className="w-3.5 h-3.5 text-emerald-700" />
              <span>Tracking ID / AWB / Docket Number *</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. BLR123456789 or 1438920194"
              value={trackingNumber}
              onChange={handleTrackingNumberChange}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-xs text-slate-900 focus:bg-white focus:border-emerald-600 outline-none"
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              Yeh tracking ID customer aur partner apne tracking dashboard par dekhenge.
            </span>
          </div>

          {/* Tracking Link / URL */}
          <div>
            <label className="font-bold text-slate-800 block mb-1 flex items-center space-x-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
              <span>Direct Tracking Link (URL)</span>
            </label>
            <input
              type="url"
              placeholder="https://www.bluedart.com/tracking?trackId=..."
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800 focus:bg-white focus:border-emerald-600 outline-none"
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              Customer "Track on Courier Website" par click karke direct live status dekh sakega.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-95 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Tracking...' : 'Confirm & Dispatch Order'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
