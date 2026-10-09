import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  ShieldCheck,
  Smartphone,
  Wifi,
} from 'lucide-react';

const apkUrl = 'https://api.mgpjn.com/api/v1/app/download';
const directApkUrl = 'https://api.mgpjn.com/downloads/MediGlaxo-latest.apk';

export default function AppDownloadPage() {
  const installSteps = [
    'Tap Download APK and wait for the file to finish downloading.',
    'Open the APK from browser downloads or file manager.',
    'If Android asks, allow install from this browser once.',
    'Install MediGlaxo, then open the app and login with your registered mobile number.',
  ];

  return (
    <main className="bg-slate-50 min-h-screen">
      <section className="bg-gradient-to-br from-brand-blue-950 via-brand-blue-900 to-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:py-16 lg:py-20 grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-100">
              <Smartphone className="h-4 w-4 text-emerald-300" />
              Latest Android App
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Download MediGlaxo Pharma Junction App
              </h1>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl">
                Use the direct APK download while the store update is pending. The website download is hosted from MediGlaxo's official server for the latest app build.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={apkUrl}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-orange-500 px-5 py-3 text-sm font-black text-white shadow-xl shadow-orange-500/20 transition hover:bg-brand-orange-600"
              >
                <Download className="h-5 w-5" />
                Download APK
              </a>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 pt-2">
              {[
                ['Official Source', 'Hosted by MediGlaxo'],
                ['Package', 'com.mgpjn.app'],
                ['Works On', 'Android phones'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-300">{label}</p>
                  <p className="mt-1 text-sm font-black text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-cyan-400/20 blur-3xl" />
            <div className="relative rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
              <div className="rounded-[1.5rem] bg-white p-5 text-slate-900 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-brand-blue-50 flex items-center justify-center">
                      <Smartphone className="h-6 w-6 text-brand-blue-800" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black">MediGlaxo App</h2>
                      <p className="text-xs font-semibold text-slate-500">Orders, wallet, referral and medicines</p>
                    </div>
                  </div>
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                </div>

                <div className="space-y-3 py-5">
                  {installSteps.map((step, index) => (
                    <div key={step} className="flex gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-black text-emerald-700">
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold leading-relaxed text-slate-700">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <Wifi className="mt-0.5 h-4 w-4 text-brand-blue-800" />
                    <p>
                      If your phone blocks APK install, choose settings from the prompt and allow this browser only for this installation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-10 sm:py-14 grid lg:grid-cols-3 gap-5">
        {[
          ['Latest Website Build', 'Direct APK download is available immediately from the official MediGlaxo server.'],
          ['Direct APK Download', 'Use the website APK while the Play Store update is pending.'],
          ['Safe Installation', 'The app package remains com.mgpjn.app, so it installs as the MediGlaxo Android app.'],
        ].map(([title, body]) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <h3 className="mt-4 text-base font-black text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{body}</p>
          </div>
        ))}
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-14">
        <div className="rounded-3xl bg-white border border-slate-200 p-5 sm:p-7 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Need medicines now?</h2>
            <p className="text-sm text-slate-600 mt-1">Continue shopping on website or install the app for faster repeat orders.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-blue-800 px-4 py-3 text-sm font-black text-white hover:bg-brand-blue-900"
            >
              Browse Medicines
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={directApkUrl}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-50"
            >
              Direct APK Link
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
