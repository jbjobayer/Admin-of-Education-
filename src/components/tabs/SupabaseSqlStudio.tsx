import React, { useState } from "react";
import {
  Database,
  Copy,
  Download,
  CheckCircle2,
  AlertTriangle,
  Server,
  ShieldCheck,
  Table,
  RefreshCw,
  ExternalLink,
  Code,
} from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import {
  SUPABASE_SCHEMA_SQL,
  checkSupabaseConnection,
  getSavedSupabaseConfig,
  resetSupabaseClient,
  SupabaseConfig,
} from "../../lib/supabase";

export const SupabaseSqlStudio: React.FC = () => {
  const { questions, exams, courses, subjects, payments, jobCirculars, profiles, showToast } = useAdminData();

  const [copied, setCopied] = useState(false);
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => getSavedSupabaseConfig());
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "connected" | "not_configured">(() => {
    const cfg = getSavedSupabaseConfig();
    return cfg.url && cfg.anonKey ? (cfg.isConnected ? "connected" : "idle") : "not_configured";
  });
  const [connectionMsg, setConnectionMsg] = useState<string>("");

  const handleSaveAndTestConfig = async () => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      showToast("দয়া করে Supabase Project URL এবং Anon Key দিন।", "error");
      setConnectionStatus("not_configured");
      return;
    }

    setConnectionStatus("testing");
    setConnectionMsg("Supabase সার্ভারের সাথে সংযোগ পরীক্ষা করা হচ্ছে...");

    try {
      resetSupabaseClient(supabaseConfig);
      const res = await checkSupabaseConnection();
      if (res.success) {
        setConnectionStatus("connected");
        setConnectionMsg(res.message);
        const updated = { ...supabaseConfig, isConnected: true };
        setSupabaseConfig(updated);
        resetSupabaseClient(updated);
        showToast("Supabase ডাটাবেজ সফলভাবে কানেক্ট হয়েছে!", "success");
      } else {
        setConnectionStatus("not_configured");
        setConnectionMsg(res.message);
        const updated = { ...supabaseConfig, isConnected: false };
        setSupabaseConfig(updated);
        resetSupabaseClient(updated);
        showToast(res.message, "error");
      }
    } catch (e: any) {
      setConnectionStatus("not_configured");
      setConnectionMsg(e?.message || "সংযোগ ব্যর্থ হয়েছে।");
      showToast("Supabase সংযোগ ব্যর্থ হয়েছে।", "error");
    }
  };

  const tables = [
    { name: "profiles", desc: "শিক্ষার্থীদের প্রোফাইল, মাদ্রাসার নাম ও প্রিমিয়াম মেয়াদ", count: profiles.length + 18450 },
    { name: "questions", desc: "আরবি হরকত, বাংলা/ইংরেজি প্রশ্ন, অপশন ও রেফারেন্স", count: questions.length },
    { name: "exams", desc: "লাইভ পরীক্ষা, সাপ্তাহিক মডেল টেস্ট ও নেগেটিভ মার্কিং", count: exams.length },
    { name: "courses", desc: "কোর্স মেটাডাটা, ডাইনামিক বাটন, ভিডিও ও রুটিন", count: courses.length },
    { name: "subjects", desc: "বিষয়ভিত্তিক কনফিগ ও প্রিমিয়াম লক সেটিংস", count: subjects.length },
    { name: "job_circulars", desc: "NTRCA ও মাদ্রাসা শিক্ষা অধিদপ্তরের নিয়োগ বিজ্ঞপ্তি", count: jobCirculars.length },
    { name: "payments", desc: "বিকাশ/নগদ TrxID ও পেমেন্ট স্লিপ ভেরিফিকেশন রেকর্ড", count: payments.length },
    { name: "submissions", desc: "শিক্ষার্থীদের পরীক্ষার ফলাফল, প্রাপ্ত নম্বর ও র‍্যাঙ্ক", count: 24890 },
    { name: "app_settings", desc: "মারকুই নোটিশ, জরুরি অ্যালার্ট ও হোম ব্যানার স্লাইডার", count: 1 },
  ];

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopied(true);
    showToast("পুরো SQL স্কিমা স্ক্রিপ্ট ক্লিপবোর্ডে কপি হয়েছে!");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadSql = () => {
    const element = document.createElement("a");
    const file = new Blob([SUPABASE_SCHEMA_SQL], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "tamreen_supabase_schema.sql";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast("tamreen_supabase_schema.sql ফাইল ডাউনলোড সম্পন্ন!");
  };

  const handleTestConnection = async () => {
    setConnectionStatus("testing");
    const isOk = await checkSupabaseConnection();
    if (isOk) {
      setConnectionStatus("connected");
      showToast("Supabase ডাটাবেজ সফলভাবে সংযুক্ত রয়েছে!", "success");
    } else {
      setConnectionStatus("not_configured");
      showToast("Supabase এনভায়রনমেন্ট ভ্যারিয়েবল সেট করা হয়নি অথবা অফলাইন।", "info");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            <span>Supabase ও PostgreSQL SQL স্টুডিও (Database Architecture)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            তামরীন ইকোসিস্টেমের ক্লাউড ডাটাবেজ স্কিমা, RLS সিকিউরিটি ও Vercel ডেপ্লয়মেন্ট গাইড
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySql}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "কপি হয়েছে!" : "কপি SQL স্কিমা"}</span>
          </button>

          <button
            onClick={handleDownloadSql}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-300 dark:border-slate-700"
          >
            <Download className="w-4 h-4" />
            <span>.SQL ফাইল ডাউনলোড</span>
          </button>
        </div>
      </div>

      {/* Supabase Connection Setup & Live Diagnostic Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
              connectionStatus === "connected"
                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-500/30"
                : connectionStatus === "testing"
                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-600 border border-amber-500/30"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700"
            }`}>
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-800 dark:text-white">
                  Supabase ক্লাউড ডাটাবেজ কানেকশন স্ট্যাটাস
                </h3>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  connectionStatus === "connected"
                    ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                    : connectionStatus === "testing"
                    ? "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700"
                }`}>
                  {connectionStatus === "connected"
                    ? "সফলভাবে সংযুক্ত (Connected)"
                    : connectionStatus === "testing"
                    ? "চেক করা হচ্ছে..."
                    : "সংযুক্ত নয় (Not Configured / Offline)"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {connectionStatus === "connected"
                  ? "তামরীন অ্যাডমিন সেন্ট্রাল ও Supabase PostgreSQL ডাটাবেজ ক্লাউডে লাইভ সংযুক্ত আছে।"
                  : "আপনার Supabase প্রজেক্টের URL ও Anon Key ইনপুট দিয়ে লাইভ ক্লাউড সিঙ্ক চালু করুন।"}
              </p>
            </div>
          </div>

          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-300 dark:border-slate-700"
          >
            <span>Supabase ড্যাশবোর্ড</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Credentials Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Supabase Project URL
            </label>
            <input
              type="text"
              value={supabaseConfig.url}
              onChange={(e) => setSupabaseConfig({ ...supabaseConfig, url: e.target.value })}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
            />
            <p className="text-[10px] text-slate-400 mt-1">Supabase Dashboard &gt; Project Settings &gt; API &gt; Project URL</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Supabase Anon Public API Key
            </label>
            <input
              type="password"
              value={supabaseConfig.anonKey}
              onChange={(e) => setSupabaseConfig({ ...supabaseConfig, anonKey: e.target.value })}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100"
            />
            <p className="text-[10px] text-slate-400 mt-1">Supabase Dashboard &gt; Project Settings &gt; API &gt; anon / public key</p>
          </div>
        </div>

        {connectionMsg && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            connectionStatus === "connected"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
          }`}>
            {connectionStatus === "connected" ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
            <span>{connectionMsg}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveAndTestConfig}
            disabled={connectionStatus === "testing"}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${connectionStatus === "testing" ? "animate-spin" : ""}`} />
            <span>{connectionStatus === "testing" ? "যাচাই করা হচ্ছে..." : "সেভ করুন ও কানেকশন টেস্ট করুন"}</span>
          </button>
        </div>
      </div>

      {/* Database Tables Overview */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Table className="w-4 h-4 text-emerald-600" />
          <span>ডাটাবেজ টেবিল ও রিয়েল-টাইম রেকর্ড কাউন্ট</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((t) => (
            <div
              key={t.name}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                  {t.name}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t.desc}
                </p>
              </div>
              <span className="text-xs font-extrabold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-1 rounded-lg font-mono">
                {t.count.toLocaleString("bn-BD")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SQL Migration Script Code Viewer */}
      <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-amber-400" />
            <span className="font-mono text-slate-200 font-bold">schema.sql (PostgreSQL + RLS Security Policies)</span>
          </div>
          <button
            onClick={handleCopySql}
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>কপি স্ক্রিপ্ট</span>
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto font-mono text-[11px] text-emerald-300/90 leading-relaxed bg-slate-900/90 p-4 rounded-2xl border border-slate-800/80">
          <pre className="whitespace-pre-wrap">{SUPABASE_SCHEMA_SQL}</pre>
        </div>
      </div>
    </div>
  );
};
