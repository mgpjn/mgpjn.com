import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, ArrowLeft, Download, ShieldCheck } from 'lucide-react';
import { getOrderInvoice } from '../services/api';

export default function InvoiceView() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getOrderInvoice(id)
        .then((res) => {
          if (res.data.success) {
            setInvoice(res.data.invoice);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center space-y-3">
        <div className="w-10 h-10 border-3 border-brand-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-slate-500">Loading Official GST Tax Invoice...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-lg font-black text-slate-800">Invoice Not Found</h2>
        <p className="text-xs text-slate-500">The requested invoice ID does not exist or has been archived.</p>
        <Link to="/" className="inline-block bg-brand-blue-800 text-white text-xs font-bold px-4 py-2 rounded-xl">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 print:p-0 print:m-0 print:max-w-none">
      {/* Top Action Bar (Hidden on print) */}
      <div className="flex items-center justify-between print:hidden">
        <Link to="/my-orders" className="text-xs font-bold text-brand-blue-800 hover:underline flex items-center space-x-1">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Orders</span>
        </Link>

        <button
          onClick={handlePrint}
          className="bg-brand-orange-500 hover:bg-brand-orange-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-md cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Official Tax Invoice Container */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 space-y-6 text-[11px] leading-relaxed text-slate-800">
        
        {/* Header Title & Tax Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b-2 border-slate-900 gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-black text-brand-blue-900 tracking-tight">MEDIGLAXO PHARMA</span>
              <span className="bg-brand-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                Junction
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">{invoice.company.legal_name}</p>
          </div>
          
          <div className="text-right">
            <span className="text-sm font-black uppercase text-slate-900 bg-slate-100 px-3.5 py-1.5 rounded-lg border border-slate-300 inline-block">
              TAX INVOICE (ORIGINAL FOR RECIPIENT)
            </span>
            <p className="text-[10px] text-slate-500 mt-1">Under Section 31 of CGST Act, 2017</p>
          </div>
        </div>

        {/* Company & Drug License Details Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="space-y-1">
            <span className="font-bold text-slate-900 block text-xs">Registered &amp; Dispatch Facility:</span>
            <p className="text-slate-600">{invoice.company.address}</p>
            <p className="font-mono text-slate-700"><strong>GSTIN:</strong> {invoice.company.gstin} | <strong>PAN:</strong> {invoice.company.pan}</p>
            <p className="text-slate-600"><strong>Email:</strong> {invoice.company.email} | <strong>Helpline:</strong> {invoice.company.phone}</p>
          </div>
          
          <div className="space-y-1 md:text-right">
            <span className="font-bold text-slate-900 block text-xs">Pharma Licenses &amp; Standards:</span>
            <p className="font-mono text-slate-700"><strong>D.L. No. (Form 20B):</strong> {invoice.company.dl_number_20b}</p>
            <p className="font-mono text-slate-700"><strong>D.L. No. (Form 21B):</strong> {invoice.company.dl_number_21b}</p>
            <p className="font-mono text-slate-700"><strong>FSSAI Lic. No.:</strong> {invoice.company.fssai_lic}</p>
            <p className="text-emerald-700 font-bold text-[10px]">✓ WHO-GMP Certified • ISO 9001:2015 Approved</p>
          </div>
        </div>

        {/* Invoice & Buyer Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-200 rounded-2xl overflow-hidden">
          <div className="p-4 space-y-1 border-b md:border-b-0 md:border-r border-slate-200">
            <span className="font-black text-slate-900 uppercase text-[10px] tracking-wider block text-brand-blue-900">
              Billed To / Patient Consignee:
            </span>
            <h4 className="font-bold text-slate-900 text-xs">{invoice.customer.name}</h4>
            <p className="text-slate-600">{invoice.customer.address}</p>
            <p className="text-slate-600">{invoice.customer.city}, {invoice.customer.state} - <strong>{invoice.customer.pincode}</strong></p>
            <p className="text-slate-600"><strong>Phone:</strong> {invoice.customer.phone} {invoice.customer.email ? `| Email: ${invoice.customer.email}` : ''}</p>
            <p className="text-slate-600"><strong>Place of Supply:</strong> {invoice.customer.place_of_supply} (State Code: 24)</p>
          </div>

          <div className="p-4 space-y-1.5 bg-slate-50/50">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Invoice Number:</span>
              <span className="font-black font-mono text-slate-900">{invoice.invoice.invoice_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Invoice Date &amp; Time:</span>
              <span className="font-semibold text-slate-900">{invoice.invoice.invoice_date} {invoice.invoice.invoice_time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Order Number:</span>
              <span className="font-mono font-bold text-brand-blue-800">{invoice.invoice.order_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Payment Mode &amp; Status:</span>
              <span className="font-bold text-emerald-700">{invoice.invoice.payment_mode} ({invoice.invoice.payment_status})</span>
            </div>
            {invoice.assigned_hub && (
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Local Sub-Retailer Hub:</span>
                <span className="font-bold text-slate-800">{invoice.assigned_hub.executive_name} ({invoice.assigned_hub.pincode})</span>
              </div>
            )}
          </div>
        </div>

        {/* Medicine Items & Tax Calculation Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-[10px]">
            <thead className="bg-slate-900 text-white uppercase text-[9px] font-bold">
              <tr>
                <th className="p-2.5 text-center w-8">#</th>
                <th className="p-2.5">Product &amp; Salt Composition</th>
                <th className="p-2.5">HSN</th>
                <th className="p-2.5">Batch</th>
                <th className="p-2.5">Exp</th>
                <th className="p-2.5 text-right">MRP</th>
                <th className="p-2.5 text-center">Qty</th>
                <th className="p-2.5 text-right">Rate</th>
                <th className="p-2.5 text-right">Taxable</th>
                <th className="p-2.5 text-right">GST %</th>
                <th className="p-2.5 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoice.items.map((item) => (
                <tr key={item.sr_no} className="hover:bg-slate-50">
                  <td className="p-2.5 text-center font-bold text-slate-500">{item.sr_no}</td>
                  <td className="p-2.5 font-bold text-slate-900 max-w-[200px]">
                    {item.product_name}
                  </td>
                  <td className="p-2.5 font-mono text-slate-600">{item.hsn_code}</td>
                  <td className="p-2.5 font-mono text-slate-700 font-semibold">{item.batch_no}</td>
                  <td className="p-2.5 font-mono text-slate-600">{item.expiry_date}</td>
                  <td className="p-2.5 text-right font-mono text-slate-500">₹{item.mrp.toFixed(2)}</td>
                  <td className="p-2.5 text-center font-black text-slate-900">{item.quantity}</td>
                  <td className="p-2.5 text-right font-mono text-slate-700">₹{item.rate.toFixed(2)}</td>
                  <td className="p-2.5 text-right font-mono text-slate-700">₹{(item.taxable_value || item.total_amount).toFixed(2)}</td>
                  <td className="p-2.5 text-right font-semibold text-slate-600">{item.gst_rate}%</td>
                  <td className="p-2.5 text-right font-black text-slate-900 font-mono">₹{item.total_amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total & Tax Summary Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* Tax Summary Table */}
          <div className="border border-slate-200 rounded-2xl p-4 space-y-2 bg-slate-50/60">
            <span className="font-bold text-slate-900 text-xs block">GST Tax Summary (in INR):</span>
            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Taxable Value:</span>
                <span className="font-mono font-semibold">₹{(invoice.tax_summary.total_taxable_value || invoice.financials.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">CGST (Central Tax @ 6%):</span>
                <span className="font-mono font-semibold">₹{(invoice.tax_summary.total_cgst || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">SGST (State Tax @ 6%):</span>
                <span className="font-mono font-semibold">₹{(invoice.tax_summary.total_sgst || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">IGST (Integrated Tax @ 12%):</span>
                <span className="font-mono font-semibold">₹{(invoice.tax_summary.total_igst || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-300 font-bold text-slate-900">
                <span>Total Tax Charged:</span>
                <span className="font-mono">₹{(invoice.tax_summary.total_tax_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Grand Financials */}
          <div className="border border-slate-200 rounded-2xl p-4 space-y-2 bg-slate-900 text-white">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal:</span>
              <span className="font-mono font-bold">₹{invoice.financials.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Delivery / Shipping Charge:</span>
              <span className="font-mono font-bold">
                {invoice.financials.delivery_charge > 0 ? `₹${invoice.financials.delivery_charge.toFixed(2)}` : 'FREE (₹0.00)'}
              </span>
            </div>
            {invoice.financials.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Promotional Discount:</span>
                <span className="font-mono font-bold">-₹{invoice.financials.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-white/20 text-base font-black text-white">
              <span>Grand Total:</span>
              <span className="font-mono text-brand-orange-400">₹{invoice.financials.grand_total.toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-slate-300 italic pt-1">
              Amount in Words: <strong className="text-white">{invoice.financials.amount_in_words}</strong>
            </p>
          </div>
        </div>

        {/* Legal Declaration & Signatory Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-[10px]">
          <div className="space-y-1 text-slate-500">
            <span className="font-bold text-slate-700 block">Terms &amp; Conditions / Declaration:</span>
            <p>1. {invoice.declaration}</p>
            <p>2. Goods once sold will not be taken back without original purchase invoice.</p>
            <p>3. Storage: Store in a cool, dry place away from direct sunlight.</p>
            <p>4. Subject to Surat (Gujarat) Jurisdiction only.</p>
          </div>

          <div className="text-center md:text-right flex flex-col justify-between items-center md:items-end space-y-2">
            <span className="font-bold text-slate-800">For MEDIGLAXO PHARMA PRIVATE LIMITED</span>
            <div className="w-32 h-10 border border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400 uppercase tracking-widest font-mono">
              [Digitally Signed]
            </div>
            <span className="font-bold text-slate-900 block text-[10px]">Authorized Registered Pharmacist</span>
          </div>
        </div>

      </div>
    </div>
  );
}
