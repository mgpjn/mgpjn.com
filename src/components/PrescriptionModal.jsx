import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, ShieldCheck, Sparkles, Image, Trash2, Camera } from 'lucide-react';
import { uploadPrescription } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PrescriptionModal({ isOpen, onClose, orderId = null }) {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [patientName, setPatientName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (file) => {
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError('File size exceeds 15MB limit. Please upload a smaller image or document.');
      return;
    }

    setSelectedFile(file);
    setError('');

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientName.trim() || !phone.trim()) {
      setError('Please provide patient name and contact number.');
      return;
    }

    if (!selectedFile && !fileUrl.trim()) {
      setError('Please upload a prescription image/PDF or provide a document link.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('patient_name', patientName.trim());
      formData.append('phone', phone.trim());
      if (user?.email) formData.append('email', user.email);
      if (notes.trim()) formData.append('notes', notes.trim());
      if (orderId) formData.append('order_id', orderId);

      if (selectedFile) {
        formData.append('file', selectedFile);
        if (filePreview && typeof filePreview === 'string' && filePreview.startsWith('data:')) {
          formData.append('file_base64', filePreview);
        }
      } else if (fileUrl.trim()) {
        formData.append('file_url', fileUrl.trim());
      }

      const res = await uploadPrescription(formData);

      if (res.data?.success) {
        setSuccess(true);
      } else {
        setError(res.data?.message || 'Failed to upload prescription. Please try again.');
      }
    } catch (err) {
      console.error('Prescription upload error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to upload prescription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-blue-800 to-brand-blue-600 p-5 sm:p-6 text-white relative flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">Upload Doctor's Prescription</h3>
              <p className="text-[11px] sm:text-xs text-blue-100">Get authentic medicines verified by registered pharmacists.</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Prescription Received Successfully!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Our registered pharmacist is reviewing your prescription. We will call you on <strong className="text-slate-900 font-black">{phone}</strong> within 15 minutes to confirm dosage and delivery details.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSuccess(false);
                  setSelectedFile(null);
                  setFilePreview(null);
                  onClose();
                }}
                className="bg-brand-blue-800 hover:bg-brand-blue-900 text-white px-7 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-transform hover:scale-105"
              >
                Back to Shopping
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                  {error}
                </div>
              )}

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,application/pdf"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                }}
                className="hidden"
              />

              {/* Upload Box / Image Preview */}
              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer bg-slate-50/70 hover:bg-slate-50 ${
                    isDragOver ? 'border-[#ff5722] bg-orange-50/50' : 'border-slate-300 hover:border-brand-blue-500'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-brand-blue-50 text-brand-blue-700 flex items-center justify-center mx-auto mb-2">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Click to upload prescription or take camera photo
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, JPEG or PDF (Max 15MB)</p>

                  <div className="flex items-center justify-center space-x-2 mt-3 pt-2 border-t border-slate-200/80">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-2xs hover:bg-slate-50"
                    >
                      <Camera className="w-3.5 h-3.5 text-brand-blue-600" />
                      <span>Browse / Camera</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Or paste prescription image/document URL..."
                    value={fileUrl}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setFileUrl(e.target.value)}
                    className="mt-3 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-blue-600"
                  />
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl relative space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                        {filePreview ? <Image className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{selectedFile.name}</p>
                        <p className="text-[10px] text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB • Ready to submit</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {filePreview && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 max-h-48 flex items-center justify-center bg-slate-900/5">
                      <img src={filePreview} alt="Prescription preview" className="max-h-48 w-auto object-contain" />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <label className="text-xs font-bold text-slate-700 block mb-1">Specific Instructions / Dosage Duration (Optional)</label>
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
                <span>Your medical records &amp; prescription are encrypted and confidential under HIPAA standards.</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-blue-800 hover:bg-brand-blue-900 active:bg-brand-blue-950 text-white py-3 rounded-xl font-bold text-xs shadow-lg shadow-brand-blue-800/20 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Submitting Prescription...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-orange-400" />
                    <span>Submit &amp; Request Callback</span>
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

