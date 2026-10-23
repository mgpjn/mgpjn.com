import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Smartphone, ArrowRight, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { referralCodeFromSearch, referralDestinations } from '../utils/referralLinks';

export default function ReferralInvitePage() {
  const { search } = useLocation();
  const { code, playUrl, websiteUrl, androidIntentUrl } = referralDestinations(referralCodeFromSearch(search));
  const isAndroid = /Android/i.test(navigator.userAgent);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Referral code copied');
    } catch {
      toast.error('Select and copy the referral code below.');
    }
  }

  return (
    <section className="bg-slate-50 px-4 py-12 sm:py-20">
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-9 shadow-sm">
        <Smartphone className="h-10 w-10 text-brand-blue-800" aria-hidden="true" />
        <h1 className="mt-5 text-2xl sm:text-3xl font-black text-slate-900">Join MediGlaxo with a referral</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Open the Android app or install it from Google Play, then create your account.
          The latest app can fill your referral code automatically after installation.
        </p>
        {code ? (
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-bold text-slate-600">Your referral code</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <strong data-testid="referral-code" className="break-all text-xl text-brand-blue-900">{code}</strong>
              <button onClick={copyCode} aria-label="Copy referral code" className="rounded-xl bg-white p-3 text-brand-blue-800">
                <Copy className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <p role="status" className="mt-5 text-sm text-amber-800">This link has no valid referral code. Ask your inviter for their code before registering.</p>
        )}
        <a data-testid="open-referral-app" href={isAndroid ? androidIntentUrl : playUrl}
          className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-brand-orange-500 px-4 py-4 text-center text-sm font-bold text-white hover:bg-brand-orange-600">
          <Smartphone className="h-5 w-5 shrink-0" /> Open or install Android app
        </a>
        <a data-testid="referral-play-store" href={playUrl} className="mt-4 block text-center text-sm font-bold text-brand-blue-800 underline">
          Download from Google Play
        </a>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          If the code is not filled in, enter it in the referral field during signup.
          Existing accounts keep their current sponsor.
        </p>
        <Link data-testid="website-referral-signup" to={websiteUrl}
          className="mt-6 flex items-center justify-center gap-2 border-t border-slate-100 pt-5 text-sm font-bold text-brand-blue-800">
          Continue registration on website <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
