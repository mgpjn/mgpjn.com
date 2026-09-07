import React, { useEffect, useState } from 'react';
import { FileText, Download, Building2, CheckCircle2, XCircle, ArrowLeft, RefreshCw, Calendar, Tag, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import GstInvoiceModal from '../../components/invoice/GstInvoiceModal';

export default function MyB2bInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('received'); // 'received' | 'issued'
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/b2b-invoices?type=${tab}`);
      if (res.data?.success) {
        setInvoices(res.data.invoices?.data || []);
      }
    } catch (err) {
      console.error('Error fetching B2B invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [tab]);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center space-x-3">
            <Link to="/hierarchy" className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-blue-700" />
                <span>B2B Network Tax Invoices</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Official GST Invoices automatically generated across network supply hierarchy
              </p>
            </div>
          </div>

          {/* Tab Filter */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setTab('received')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'received' ? 'bg-white text-brand-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Received Invoices (Purchase)
            </button>
            <button
              type="button"
              onClick={() => setTab('issued')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === 'issued' ? 'bg-white text-brand-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Issued Invoices (Sales)
            </button>
          </div>
        </div>

        {/* Invoice List */}
        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-6 h-6 text-brand-blue-700 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">Loading B2B tax invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No B2B Invoices Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {tab === 'received'
                ? 'When downline orders are dispatched, your upstream B2B purchase invoices will appear here automatically.'
                : 'Your outgoing B2B invoices to downline network partners will appear here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invoices.map((inv) => {
              const otherParty = tab === 'received' ? inv.seller : inv.buyer;
              const partyLabel = tab === 'received' ? 'Supplier / Billed By' : 'Buyer / Billed To';

              return (
                <div
                  key={inv.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-brand-blue-300 shadow-2xs hover:shadow-sm transition-all space-y-3"
                >
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-mono font-black text-brand-blue-700 bg-brand-blue-50 px-2 py-0.5 rounded-md border border-brand-blue-100">
                        {inv.invoice_number}
                      </span>
                      <div className="text-[10px] text-slate-400 font-semibold mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(inv.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        {inv.parent_order && (
                          <>
                            <span>•</span>
                            <span className="font-mono">Order #{inv.parent_order.order_number}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {inv.status?.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">{partyLabel}:</span>
                      <strong className="text-slate-800 font-bold block truncate">{otherParty?.business_name || otherParty?.name || 'Company Hub'}</strong>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        GSTIN: {otherParty?.gst_number || '24ABVFM0075D1ZA'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Invoice Total:</span>
                      <div className="text-sm font-black text-slate-900 font-mono">
                        ₹ {Number(inv.total_amount || 0).toFixed(2)}
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        Tax: ₹ {Number((inv.cgst_amount || 0) + (inv.sgst_amount || 0) + (inv.igst_amount || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{inv.seller_state_code === inv.buyer_state_code ? 'Intra-State GST' : 'Inter-State IGST'}</span>
                    </span>

                    {inv.parent_order_id && (
                      <Link
                        to={`/invoice/${inv.parent_order_id}`}
                        target="_blank"
                        className="px-3 py-1.5 bg-brand-blue-50 hover:bg-brand-blue-100 text-brand-blue-700 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Tax Invoice</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
