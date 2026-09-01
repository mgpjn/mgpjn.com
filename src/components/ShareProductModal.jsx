import React, { useState } from 'react';
import {
  Share2, Copy, Check, X, MessageCircle, Send,
  Facebook, Twitter, ExternalLink, Sparkles, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ShareProductModal({ isOpen, onClose, product }) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !product) return null;

  const origin = window.location.origin;
  const productPath = `/product/${product.slug || product.id}`;
  const referralParam = user?.referral_code ? `?ref=${encodeURIComponent(user.referral_code)}` : '';
  const shareUrl = `${origin}${productPath}${referralParam}`;

  const price = Number(product.retail_price || product.price || 0).toFixed(2);
  const mrp = product.mrp ? Number(product.mrp).toFixed(2) : null;
  const discountText = mrp && Number(mrp) > Number(price)
    ? ` (${Math.round(((Number(mrp) - Number(price)) / Number(mrp)) * 100)}% OFF)`
    : '';

  const shareTitle = `Buy ${product.name} Online - Genuine Medicine at Best Price`;
  const shareText = `Check out *${product.name}* on MGPJN at just ₹${price}${discountText}!\n100% Genuine WHO-GMP Certified Medicine with Express Home Delivery.\n\nOrder now: ${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTelegramShare = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Buy ${product.name} at ₹${price} on MGPJN!`)}`;
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
  };

  const handleFacebookShare = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(fbUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTwitterShare = () => {
    const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${product.name} at ₹${price} on MGPJN!`)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Buy ${product.name} at ₹${price} on MGPJN`,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 text-white p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Share Medicine</h3>
              <p className="text-xs text-teal-100 font-medium">Share this genuine product with friends & patients</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Preview Card */}
        <div className="p-5 space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
            <img
              src={product.image || (Array.isArray(product.images) ? product.images[0] : null) || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300'}
              alt={product.name}
              className="w-14 h-14 object-cover rounded-xl border border-slate-200 bg-white flex-shrink-0"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300';
              }}
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-black text-slate-900 truncate">{product.name}</h4>
              <p className="text-[11px] text-slate-500 truncate">{product.composition || product.subtitle || product.dosage_form || 'Medicine'}</p>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-sm font-black text-emerald-700">₹{price}</span>
                {mrp && Number(mrp) > Number(price) && (
                  <span className="text-[11px] text-slate-400 line-through">₹{mrp}</span>
                )}
                {discountText && (
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                    {discountText}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Referral Badge if Logged in Partner */}
          {user?.referral_code && (
            <div className="flex items-center space-x-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
              <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                Your referral code <strong>({user.referral_code})</strong> is attached. You will earn commission when shared contacts order!
              </span>
            </div>
          )}

          {/* Social Share Grid */}
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2.5">
              Share directly to:
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {/* WhatsApp */}
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex flex-col items-center justify-center p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl transition-all group cursor-pointer hover:scale-105 active:scale-95"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-5 h-5 fill-current" />
                </div>
                <span className="text-[11px] font-bold text-emerald-900 mt-1.5">WhatsApp</span>
              </button>

              {/* Telegram */}
              <button
                type="button"
                onClick={handleTelegramShare}
                className="flex flex-col items-center justify-center p-3 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-2xl transition-all group cursor-pointer hover:scale-105 active:scale-95"
              >
                <div className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/30 group-hover:scale-110 transition-transform">
                  <Send className="w-5 h-5 fill-current" />
                </div>
                <span className="text-[11px] font-bold text-sky-900 mt-1.5">Telegram</span>
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={handleFacebookShare}
                className="flex flex-col items-center justify-center p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl transition-all group cursor-pointer hover:scale-105 active:scale-95"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30 group-hover:scale-110 transition-transform">
                  <Facebook className="w-5 h-5 fill-current" />
                </div>
                <span className="text-[11px] font-bold text-blue-900 mt-1.5">Facebook</span>
              </button>

              {/* Twitter / X */}
              <button
                type="button"
                onClick={handleTwitterShare}
                className="flex flex-col items-center justify-center p-3 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-2xl transition-all group cursor-pointer hover:scale-105 active:scale-95"
              >
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <Twitter className="w-4 h-4 fill-current" />
                </div>
                <span className="text-[11px] font-bold text-slate-800 mt-1.5">Twitter</span>
              </button>
            </div>
          </div>

          {/* Native Mobile Share Sheet Button (if supported) */}
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-slate-600" />
              <span>Open Phone Share Options (Instagram, SMS, etc.)</span>
            </button>
          )}

          {/* Copy Direct Link Box */}
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
              Copy Direct Link:
            </label>
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 pl-3 focus-within:border-teal-500 transition-colors">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-transparent text-xs text-slate-700 font-mono focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-4 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-teal-700 hover:bg-teal-800 text-white shadow-sm'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
