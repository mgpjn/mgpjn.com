import React, { useState } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { uploadPrescription } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PrescriptionModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [patientName, setPatientName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientName || !phone) {
      setError('Please provide patient name and contact number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await uploadPrescription({
        patient_name: patientName,
        phone: phone,
        email: user?.email,
        file_url: fileUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800',
        notes: notes,
      });

      if (res.data.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload prescription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-blue-800 to-brand-blue-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
              <FileText className="w-6 h-6 text-brand-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">Upload Doctor's Prescription</h3>
              <p className="text-xs text-blue-100">Get authentic medicines verified by registered pharmacists.</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-bold text-slate-800">Prescription Received!</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Our registered pharmacist is reviewing your prescription. We will call you on <strong>{phone}</strong> within 15 minutes to confirm the medicine dosage and delivery address.
              </p>
              <button
                onClick={() => {
                  setSuccess(false);
                  onClose();
                }}
                className="bg-brand-blue-800 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-brand-blue-900"
              >
                Back to Shopping
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 text-rose-600 text-xs rounded-xl font-medium">
                  {error}
                </div>
              )}

              {/* Upload Box */}
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-brand-blue-500 transition-colors bg-slate-50/50">
                <UploadCloud className="w-10 h-10 text-brand-blue-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Click to upload or drag and drop prescription</p>
                <p className="text-[11px] text-slate-400 mt-1">PNG, JPG, JPEG or PDF (Max 10MB)</p>
                <input
                  type="text"
                  placeholder="Or enter image/document URL..."
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="mt-3 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Patient Name *</label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Specific Instructions / Duration (Optional)</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Provide 30 days dosage, please call in afternoon..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-blue-600"
                ></textarea>
              </div>

              <div className="flex items-center space-x-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Your medical records & prescription are encrypted and confidential under HIPAA standards.</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-blue-800 hover:bg-brand-blue-900 text-white py-3 rounded-xl font-bold text-xs shadow-lg shadow-brand-blue-800/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span>Submitting Prescription...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-brand-orange-400" />
                    <span>Submit & Request Callback</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
