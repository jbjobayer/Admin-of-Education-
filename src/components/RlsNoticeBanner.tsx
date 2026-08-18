import React, { useState } from "react";
import { ShieldCheck, Copy, CheckCircle2, X, Database, ExternalLink, Zap, AlertTriangle } from "lucide-react";
import { useAdminData } from "../context/AdminDataContext";
import { SUPABASE_FIX_RLS_SQL } from "../lib/supabase";

export const RlsNoticeBanner: React.FC = () => {
  const { hasRlsNotice, dismissRlsNotice, setActiveTab, showToast } = useAdminData();
  const [copied, setCopied] = useState(false);

  if (!hasRlsNotice) return null;

  const handleCopyFix = () => {
    navigator.clipboard.writeText(SUPABASE_FIX_RLS_SQL);
    setCopied(true);
    showToast("⚡ RLS সিকিউরিটি ফিক্স SQL কপি হয়েছে! এটি Supabase SQL Editor-এ পেস্ট করে Run করুন।", "success");
    setTimeout(() => setCopied(false), 4000);
  };

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-orange-500/10 dark:from-amber-950/50 dark:via-amber-900/40 dark:to-orange-950/40 border border-amber-400/40 dark:border-amber-700/60 rounded-3xl p-4 sm:p-5 shadow-lg shadow-amber-500/5 mb-6 animate-in fade-in slide-in-from-top duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-amber-200">
                Supabase ক্লাউড ডাটাবেজ RLS পারমিশন ফিক্স (Error 42501)
              </h4>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100">
                অ্যাকশন প্রয়োজন
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-3xl leading-relaxed">
              আপনার পরীক্ষা/প্রশ্নটি লোকাল মেমরিতে পুরোপুরি সংরক্ষিত আছে। তবে Supabase ডাটাবেজে <strong>Row-Level Security (RLS)</strong> সক্রিয় থাকায় ক্লাউডে সিঙ্ক হতে বাধা পেয়েছে। নিচে ক্লিক করে ১-ক্লিকে SQL ফিক্স স্ক্রিপ্ট কপি করুন এবং Supabase ড্যাশবোর্ডে <strong>SQL Editor</strong>-এ পেস্ট করে <strong>Run</strong> করুন।
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end md:self-center flex-shrink-0">
          <button
            onClick={handleCopyFix}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold shadow-md shadow-amber-500/25 transition-all cursor-pointer"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "কপি সম্পন্ন!" : "RLS ফিক্স SQL কপি করুন"}</span>
          </button>

          <button
            onClick={() => setActiveTab("supabase_studio")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>SQL স্টুডিও</span>
          </button>

          <button
            onClick={dismissRlsNotice}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer"
            title="নোটিশ বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
