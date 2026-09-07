import React, { useState, useEffect, useRef } from 'react';
import { Printer, Download, X, FileText, CheckCircle2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { getOrderInvoice } from '../../services/api';

export default function GstInvoiceModal({ orderId, onClose }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    if (orderId) {
      setLoading(true);
      getOrderInvoice(orderId)
        .then((res) => {
          if (res.data.success) {
            setInvoice(res.data.invoice);
          }
        })
        .catch((err) => console.error('Error fetching invoice:', err))
        .finally(() => setLoading(false));
    }
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current || !invoice) return;
    setDownloadingPdf(true);
    try {
      const orderNo = invoice.invoice?.order_no || invoice.invoice?.invoice_no || 'invoice';
      const opt = {
        margin: [4, 4, 4, 4],
        filename: `GST-Invoice-${orderNo}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false, 
          scrollY: 0,
          windowWidth: 794
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      await html2pdf().set(opt).from(printRef.current).save();
    } catch (err) {
      console.error('Error generating PDF:', err);
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (!orderId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:rounded-none">
        
        {/* Modal Action Bar (Hidden on Print) */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between print:hidden shrink-0">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-black tracking-tight">GST Tax Invoice (MediGlaxo Pharma)</h3>
              <p className="text-[10px] text-slate-400">Official GST Compliance Bill • Form 20B/21B • 1-Page Printable Format</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {downloadingPdf ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body Container (with horizontal scroll on tiny mobile screens, but 760px fixed on PDF/print) */}
        <div className="p-2 sm:p-4 overflow-x-auto overflow-y-auto print:p-0 print:overflow-visible text-slate-900 bg-white">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-500">Generating Official GST Tax Invoice...</p>
            </div>
          ) : !invoice ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              Unable to load invoice data. Please try again.
            </div>
          ) : (
            <div 
              ref={printRef} 
              className="w-[740px] min-w-[740px] mx-auto bg-white border border-slate-300 p-3 rounded-lg print:border-none print:p-0 print:w-full print:min-w-0 text-[9.5px] leading-tight space-y-1.5 font-sans"
            >
              
              {/* 1. Header: Company Info (Left) + Logo (Right) */}
              <div className="flex flex-row justify-between items-start gap-2 pb-1 border-b border-slate-200">
                <div className="space-y-0.5 max-w-[74%]">
                  <h1 className="text-base font-black text-slate-900 tracking-tight uppercase">
                    {invoice.company?.legal_name || 'MEDIGLAXO PHARMA'}
                  </h1>
                  <p className="text-[9px] text-slate-700 leading-tight">
                    {invoice.company?.address || '280 SOMNATH NAGAR, GABHENI, SACHIN, SURAT, GUJARAT, Pin-394230'}
                  </p>
                  <p className="text-[9px] text-slate-700 font-bold">
                    D.L. NO. {invoice.company?.dl_no || 'GJ-SUR-215010 / GJ-SUR-215011'}
                  </p>
                  <p className="text-[9px] text-slate-700">
                    <span className="font-semibold">{invoice.company?.website || 'www.mgpjn.com'}</span>
                    {' | '}Phone: <span className="font-semibold">{invoice.company?.phone || '+91-9650582703'}</span>
                    {' | '}Email: <span className="font-semibold">{invoice.company?.email || 'support@mgpjn.com'}</span>
                  </p>
                  <p className="text-[9.5px] text-slate-900 font-bold pt-0.5">
                    GSTIN: <span className="font-mono">{invoice.company?.gstin || '24ABVFM0075D1ZA'}</span>
                    {' | '}State: <span>{invoice.company?.state || '24-Gujarat'}</span>
                  </p>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <div className="w-24 h-auto flex items-center justify-end">
                    <img
                      src="/logo.png"
                      alt="MediGlaxo Pharma"
                      className="max-h-11 w-auto object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Blue Ribbon Banner: Tax Invoice / Credit Note */}
              {invoice.invoice?.credit_note_number ? (
                <div className="bg-rose-700 text-white py-1 px-3 text-center rounded-xs space-y-0.5">
                  <h2 className="text-[11px] font-black tracking-wider uppercase">GST CREDIT NOTE (CANCELLED INVOICE)</h2>
                  <p className="text-[9px] font-mono font-bold">
                    Credit Note No: {invoice.invoice.credit_note_number} • Original Inv: {invoice.invoice.invoice_no} • Cancelled on: {invoice.invoice.cancelled_at || 'Recently'}
                  </p>
                </div>
              ) : (
                <div className="bg-[#2563eb] text-white py-0.5 px-3 text-center rounded-xs">
                  <h2 className="text-[11px] font-black tracking-wider uppercase">Tax Invoice</h2>
                </div>
              )}

              {/* 3. Fixed 3-Column Details Block (Never collapses vertically) */}
              <div className="grid grid-cols-3 gap-1.5">
                {/* Column 1: Bill To */}
                <div className="border border-slate-300 rounded p-1.5 space-y-0.5 text-[8.5px] leading-tight">
                  <h3 className="text-[9px] font-black text-[#2563eb] pb-0.5 border-b border-slate-200 uppercase tracking-tight">
                    Bill To
                  </h3>
                  <p className="font-bold text-slate-900 text-[9px]">
                    {invoice.customer?.business_name || invoice.customer?.name}
                  </p>
                  <p className="text-slate-600">
                    {invoice.customer?.address}
                  </p>
                  <p className="text-slate-600">
                    {invoice.customer?.city ? `${invoice.customer.city}, ` : ''}{invoice.customer?.state || 'Gujarat'} - {invoice.customer?.pincode}
                  </p>
                  <p className="text-slate-700">
                    <strong>D.L. No.:</strong> {invoice.customer?.dl_no || 'N/A'}
                  </p>
                  <p className="text-slate-700">
                    <strong>Contact No.:</strong> {invoice.customer?.phone}
                  </p>
                  <p className="text-slate-700">
                    <strong>State:</strong> {invoice.customer?.state_display || (invoice.customer?.state ? `24-${invoice.customer.state}` : '24-Gujarat')}
                  </p>
                </div>

                {/* Column 2: Transportation Details */}
                <div className="border border-slate-300 rounded p-1.5 space-y-0.5 text-[8.5px] leading-tight">
                  <h3 className="text-[9px] font-black text-[#2563eb] pb-0.5 border-b border-slate-200 uppercase tracking-tight">
                    Transportation Details
                  </h3>
                  <div className="space-y-0.5 pt-0.5">
                    <p className="text-slate-800">
                      <strong>Vehicle No.:</strong> <span className="font-mono">{invoice.transport?.vehicle_no || 'GJ05RT5221'}</span>
                    </p>
                    <p className="text-slate-800">
                      <strong>E-Way Bill No.:</strong> <span className="font-mono">{invoice.transport?.eway_no || 'EWAY-2026-0891'}</span>
                    </p>
                    <p className="text-slate-800">
                      <strong>Supply Type:</strong> Intra-State Supply
                    </p>
                    {invoice.assigned_hub && (
                      <p className="text-slate-700">
                        <strong>Dispatch Hub:</strong> {invoice.assigned_hub.city} ({invoice.assigned_hub.pincode})
                      </p>
                    )}
                  </div>
                </div>

                {/* Column 3: Invoice Details */}
                <div className="border border-slate-300 rounded p-1.5 space-y-0.5 text-[8.5px] leading-tight">
                  <h3 className="text-[9px] font-black text-[#2563eb] pb-0.5 border-b border-slate-200 uppercase tracking-tight">
                    Invoice Details
                  </h3>
                  <div className="space-y-0.5 pt-0.5">
                    <p className="text-slate-900 flex justify-between">
                      <strong>Invoice No.:</strong>
                      <span className="font-bold font-mono">{invoice.invoice?.invoice_no}</span>
                    </p>
                    <p className="text-slate-800 flex justify-between">
                      <strong>Date:</strong>
                      <span>{invoice.invoice?.invoice_date}</span>
                    </p>
                    <p className="text-slate-800 flex justify-between">
                      <strong>Time:</strong>
                      <span>{invoice.invoice?.invoice_time}</span>
                    </p>
                    <p className="text-slate-800 flex justify-between">
                      <strong>Place of Supply:</strong>
                      <span className="font-medium">{invoice.invoice?.place_of_supply || '24-Gujarat'}</span>
                    </p>
                    <p className="text-slate-800 flex justify-between">
                      <strong>Order Ref:</strong>
                      <span className="font-mono">{invoice.invoice?.order_no}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. Medicine Items & GST Table */}
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-left text-[8.5px] border-collapse leading-tight">
                  <thead className="bg-[#2563eb] text-white font-bold uppercase text-[8px]">
                    <tr>
                      <th className="py-1 px-1 text-center border-r border-blue-400 w-6">SL.</th>
                      <th className="py-1 px-1.5 border-r border-blue-400">Item name</th>
                      <th className="py-1 px-1 text-center border-r border-blue-400">HSN</th>
                      <th className="py-1 px-1 text-right border-r border-blue-400">MRP</th>
                      <th className="py-1 px-1 text-center border-r border-blue-400">Qty</th>
                      <th className="py-1 px-1 text-center border-r border-blue-400">Unit</th>
                      <th className="py-1 px-1 text-right border-r border-blue-400">Rate</th>
                      <th className="py-1 px-1 text-right border-r border-blue-400">GST</th>
                      <th className="py-1 px-1 text-right border-r border-blue-400">Final</th>
                      <th className="py-1 px-1.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoice.items.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                        <td className="py-1 px-1 text-center font-bold text-slate-600 border-r border-slate-200">
                          {item.sr_no || idx + 1}
                        </td>
                        <td className="py-1 px-1.5 font-bold text-slate-900 border-r border-slate-200 max-w-[180px]">
                          <div>{item.product_name}</div>
                          {item.batch_no && (
                            <div className="text-[7.5px] text-slate-500 font-normal font-mono">
                              Batch: {item.batch_no} | Exp: {item.expiry_date}
                            </div>
                          )}
                        </td>
                        <td className="py-1 px-1 text-center font-mono text-slate-700 border-r border-slate-200">
                          {item.hsn_code || '30049099'}
                        </td>
                        <td className="py-1 px-1 text-right font-mono text-slate-600 border-r border-slate-200">
                          ₹ {item.mrp ? item.mrp.toFixed(2) : (item.final_rate || item.rate).toFixed(2)}
                        </td>
                        <td className="py-1 px-1 text-center font-black text-slate-900 border-r border-slate-200">
                          {item.quantity}
                        </td>
                        <td className="py-1 px-1 text-center text-slate-700 border-r border-slate-200">
                          {item.unit || 'Box (10*10)'}
                        </td>
                        <td className="py-1 px-1 text-right font-mono text-slate-700 border-r border-slate-200">
                          ₹ {(item.price_per_box !== undefined ? item.price_per_box : (item.taxable_rate || item.rate)).toFixed(2)}
                        </td>
                        <td className="py-1 px-1 text-right font-mono text-slate-700 border-r border-slate-200">
                          {item.gst_display || `₹ ${(item.gst_amount !== undefined ? item.gst_amount : (item.cgst_amount + item.sgst_amount + item.igst_amount)).toFixed(2)} (${item.gst_rate || 12}%)`}
                        </td>
                        <td className="py-1 px-1 text-right font-mono font-bold text-slate-800 border-r border-slate-200">
                          ₹ {(item.final_rate !== undefined ? item.final_rate : item.rate).toFixed(2)}
                        </td>
                        <td className="py-1 px-1.5 text-right font-mono font-black text-slate-900">
                          ₹ {(item.total_amount || (item.final_rate * item.quantity)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Table Total Row */}
                  <tfoot>
                    <tr className="bg-slate-100 font-black text-slate-900 border-t border-slate-300">
                      <td colSpan={4} className="py-1 px-1 text-right uppercase text-[8px] border-r border-slate-200">
                        Total
                      </td>
                      <td className="py-1 px-1 text-center border-r border-slate-200">
                        {invoice.tax_summary?.total_qty || invoice.items.reduce((s, i) => s + (i.quantity || 1), 0)}
                      </td>
                      <td className="py-1 px-1 border-r border-slate-200"></td>
                      <td className="py-1 px-1 border-r border-slate-200"></td>
                      <td className="py-1 px-1 text-right font-mono border-r border-slate-200">
                        ₹ {(invoice.tax_summary?.total_tax_amount || 0).toFixed(2)}
                      </td>
                      <td className="py-1 px-1 border-r border-slate-200"></td>
                      <td className="py-1 px-1.5 text-right font-mono text-[#2563eb]">
                        ₹ {(invoice.financials?.grand_total || 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* 5. Fixed Side-by-Side Summary & Breakdown Block (Never collapses) */}
              <div className="grid grid-cols-12 gap-1.5 pt-0.5">
                {/* Left (Words & Terms): 7 Cols */}
                <div className="col-span-7 space-y-1">
                  <div className="border border-slate-300 rounded p-1.5">
                    <span className="font-bold block text-[7.5px] uppercase tracking-wider text-slate-500">
                      Invoice Amount In Words
                    </span>
                    <p className="font-bold text-slate-900 text-[9px] mt-0.5 capitalize">
                      {invoice.financials?.amount_in_words || 'Three Hundred Rupees only'}
                    </p>
                  </div>

                  <div className="border border-slate-300 rounded p-1.5 space-y-0.5">
                    <span className="font-bold block text-[7.5px] uppercase tracking-wider text-slate-500">
                      Terms And Conditions
                    </span>
                    <ol className="list-decimal list-inside text-[8px] text-slate-600 space-y-0.5">
                      <li>Goods once sold will not be taken back or exchanged.</li>
                      <li>All disputes subject to SURAT jurisdiction only.</li>
                      <li>Thank you for doing business with us.</li>
                    </ol>
                  </div>
                </div>

                {/* Right (Tax Breakdown & Totals): 5 Cols */}
                <div className="col-span-5">
                  <div className="border border-slate-300 rounded overflow-hidden text-[8.5px]">
                    <div className="divide-y divide-slate-200">
                      <div className="flex justify-between py-0.5 px-1.5 bg-slate-50">
                        <span className="text-slate-700 font-medium">Sub Total</span>
                        <span className="font-mono font-bold text-slate-900">
                          ₹ {(invoice.tax_summary?.total_taxable_value || invoice.financials?.taxable_subtotal || invoice.financials?.subtotal || 0).toFixed(2)}
                        </span>
                      </div>

                      {/* SGST & CGST (Intra-state) */}
                      {(invoice.tax_summary?.total_sgst > 0 || !invoice.tax_summary?.total_igst) && (
                        <>
                          <div className="flex justify-between py-0.5 px-1.5">
                            <span className="text-slate-700">
                              SGST@{(invoice.items[0]?.gst_rate ? (invoice.items[0].gst_rate / 2) : 2.5).toFixed(1)}%
                            </span>
                            <span className="font-mono text-slate-900">
                              ₹ {(invoice.tax_summary?.total_sgst !== undefined ? invoice.tax_summary.total_sgst : (invoice.tax_summary?.total_tax_amount ? invoice.tax_summary.total_tax_amount / 2 : 0)).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between py-0.5 px-1.5">
                            <span className="text-slate-700">
                              CGST@{(invoice.items[0]?.gst_rate ? (invoice.items[0].gst_rate / 2) : 2.5).toFixed(1)}%
                            </span>
                            <span className="font-mono text-slate-900">
                              ₹ {(invoice.tax_summary?.total_cgst !== undefined ? invoice.tax_summary.total_cgst : (invoice.tax_summary?.total_tax_amount ? invoice.tax_summary.total_tax_amount / 2 : 0)).toFixed(2)}
                            </span>
                          </div>
                        </>
                      )}

                      {/* IGST (Inter-state) */}
                      {invoice.tax_summary?.total_igst > 0 && (
                        <div className="flex justify-between py-0.5 px-1.5">
                          <span className="text-slate-700">
                            IGST@{(invoice.items[0]?.gst_rate || 5.0).toFixed(1)}%
                          </span>
                          <span className="font-mono text-slate-900">
                            ₹ {invoice.tax_summary.total_igst.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {invoice.financials?.delivery_charge > 0 && (
                        <div className="flex justify-between py-0.5 px-1.5">
                          <span className="text-slate-700">Delivery Charge</span>
                          <span className="font-mono text-slate-900">
                            ₹ {invoice.financials.delivery_charge.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {invoice.financials?.platform_fee > 0 && (
                        <div className="flex justify-between py-0.5 px-1.5">
                          <span className="text-slate-700">Platform Service Fee</span>
                          <span className="font-mono text-slate-900">
                            ₹ {invoice.financials.platform_fee.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {invoice.financials?.cod_charge > 0 && (
                        <div className="flex justify-between py-0.5 px-1.5">
                          <span className="text-slate-700">COD Handling Fee</span>
                          <span className="font-mono text-slate-900">
                            ₹ {invoice.financials.cod_charge.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {invoice.financials?.discount_amount > 0 && (
                        <div className="flex justify-between py-0.5 px-1.5 text-emerald-700">
                          <span>Discount</span>
                          <span className="font-mono font-bold">
                            -₹ {invoice.financials.discount_amount.toFixed(2)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between py-0.5 px-1.5 bg-[#2563eb]/10 font-black text-[9.5px] text-slate-900 border-t border-slate-300">
                        <span>Total</span>
                        <span className="font-mono text-[#2563eb] text-[11px]">
                          ₹ {(invoice.financials?.grand_total || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between py-0.5 px-1.5 bg-slate-50 text-slate-700">
                        <span>Received</span>
                        <span className="font-mono font-bold text-emerald-700">
                          ₹ {(invoice.financials?.received !== undefined ? invoice.financials.received : invoice.financials?.grand_total || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between py-0.5 px-1.5 bg-slate-50 text-slate-700">
                        <span>Balance</span>
                        <span className="font-mono font-bold text-slate-900">
                          ₹ {(invoice.financials?.balance || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex justify-between py-0.5 px-1.5 bg-white text-slate-700">
                        <span>Payment Mode</span>
                        <span className="font-bold text-slate-900">
                          {invoice.invoice?.payment_mode === 'BANK TRANSFER' || invoice.invoice?.payment_mode === 'BANK_TRANSFER'
                            ? (invoice.company?.bank_name || 'Union Bank Of India')
                            : (invoice.invoice?.payment_mode || 'Online UPI')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Fixed 2-Column Footer: Pay To (Left) + For MEDIGLAXO PHARMA (Right) */}
              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-300 print-page-break-avoid">
                {/* Pay To Bank Info */}
                <div className="border border-slate-300 rounded p-1.5 space-y-0.5 text-[8px] leading-tight">
                  <h4 className="font-black text-slate-900 uppercase tracking-wider text-[8px] text-[#2563eb]">
                    Pay To:
                  </h4>
                  <div className="space-y-0.5 text-slate-800">
                    <p><strong>Bank Name:</strong> {invoice.company?.bank_name || 'Union Bank Of India, Sachin'}</p>
                    <p><strong>Bank Account No.:</strong> <span className="font-mono font-bold">{invoice.company?.bank_account_no || '136921010000304'}</span></p>
                    <p><strong>Bank IFSC code:</strong> <span className="font-mono font-bold">{invoice.company?.bank_ifsc || 'UBIN0913693'}</span></p>
                    <p><strong>Account Holder:</strong> <span className="font-bold">{invoice.company?.account_holder || 'MEDIGLAXO PHARMA'}</span></p>
                  </div>
                </div>

                {/* Authorized Signatory & Digital Stamp */}
                <div className="border border-slate-300 rounded p-1.5 flex flex-col justify-between items-end text-[8px] text-right">
                  <span className="font-bold text-slate-900">
                    For: {invoice.company?.legal_name || 'MEDIGLAXO PHARMA'}
                  </span>
                  
                  {/* Digital Stamp / Signature Mark */}
                  <div className="my-0.5 py-0.5 px-1.5 border border-emerald-500 bg-emerald-50/70 rounded flex items-center space-x-1 text-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <div className="text-left leading-tight">
                      <div className="font-black text-[7.5px] uppercase tracking-wider">MEDIGLAXO PHARMA</div>
                      <div className="text-[7px] text-emerald-700 font-semibold">DIGITALLY VERIFIED INVOICE</div>
                    </div>
                  </div>

                  <span className="font-bold text-slate-700 text-[8px]">
                    Authorized Signatory (Digitally Verified)
                  </span>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
