import React, { useState, useEffect } from 'react';
import { FileText, Plus, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { getUserPrescriptions } from '../../services/api';

export default function MyPrescriptionsPage({ onOpenModal }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserPrescriptions()
      .then((res) => {
        if (res.data.success) {
          setPrescriptions(res.data.prescriptions.data || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Uploaded Prescriptions</h1>
          <p className="text-xs text-slate-500">Track doctor prescription reviews by our certified pharmacists.</p>
        </div>
        <button
          onClick={onOpenModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Upload New Rx</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-xs text-slate-400">Loading prescriptions...</div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center space-y-4 border border-slate-100 shadow-sm">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-slate-800 text-base">No Prescriptions Uploaded</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Upload your prescription photo or PDF and our registered pharmacists will verify it to prepare your medicine order.
          </p>
          <button
            onClick={onOpenModal}
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs"
          >
            Upload Prescription Photo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx) => (
            <div key={rx.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div className="flex items-start space-x-4">
                <a href={rx.file_path} target="_blank" rel="noreferrer" className="block w-16 h-16 rounded-2xl overflow-hidden border bg-slate-50 flex-shrink-0">
                  <img src={rx.file_path} alt="Prescription" className="w-full h-full object-cover" />
                </a>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{rx.patient_name}</h4>
                  <p className="text-slate-500">Contact: {rx.phone}</p>
                  {rx.notes && <p className="text-[11px] text-slate-400 italic mt-0.5">Notes: "{rx.notes}"</p>}
                  <span className="text-[10px] text-slate-400 block mt-1">Uploaded on {new Date(rx.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase ${
                  rx.status === 'verified' || rx.status === 'approved'
                    ? 'bg-emerald-50 text-emerald-700'
                    : rx.status === 'rejected'
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {rx.status}
                </span>
                <a
                  href={rx.file_path}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-bold"
                >
                  View File
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
