import React from "react";
import {
  Users,
  FileCheck2,
  TrendingUp,
  CreditCard,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Megaphone,
  Radio,
  PlusCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAdminData } from "../../context/AdminDataContext";
import { RlsNoticeBanner } from "../RlsNoticeBanner";

interface DashboardOverviewProps {
  onOpenAiGenerator: () => void;
  onOpenEmergencyNotice: () => void;
  onOpenNewQuestion: () => void;
  onOpenNewExam: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onOpenAiGenerator,
  onOpenEmergencyNotice,
  onOpenNewQuestion,
  onOpenNewExam,
}) => {
  const {
    profiles,
    questions,
    exams,
    submissions,
    payments,
    courses,
    subjects,
    setActiveTab,
    approvePayment,
    appSettings,
    toggleLiveExamBanner,
  } = useAdminData();

  // Metrics calculations from real database state
  const totalStudents = profiles.length;
  const premiumCount = profiles.filter((p) => p.is_premium || p.role === "admin").length;
  const pendingPayments = payments.filter((p) => p.status === "pending");
  const approvedPayments = payments.filter((p) => p.status === "approved");
  const todayRevenue = payments
    .filter((p) => p.status === "approved")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const totalExamsSubmitted = submissions.length;
  const liveExams = exams.filter((e) => e.status === "live");

  // Chart data for daily participation trend
  const examParticipationData = [
    { day: "শনিবার", participants: 3200, passRate: 78 },
    { day: "রবিবার", participants: 4100, passRate: 82 },
    { day: "সোমবার", participants: 3850, passRate: 75 },
    { day: "মঙ্গলবার", participants: 4900, passRate: 84 },
    { day: "বুধবার", participants: 5200, passRate: 88 },
    { day: "বৃহস্পতিবার", participants: 6100, passRate: 91 },
    { day: "শুক্রবার", participants: 7850, passRate: 86 },
  ];

  // Revenue by Gateway
  const gatewayData = [
    { name: "bKash (বিকাশ)", amount: 14850, color: "#e2136e" },
    { name: "Nagad (নগদ)", amount: 8900, color: "#f7941d" },
    { name: "Rocket (রকেট)", amount: 3200, color: "#8c3494" },
    { name: "Upay (উপায়)", amount: 1100, color: "#0084ff" },
  ];

  // Subject Question Distribution
  const subjectChartData = subjects.slice(0, 6).map((s) => ({
    name: s.name_bn.split(" ")[0] + " " + (s.name_bn.split(" ")[1] || ""),
    count: s.question_count,
  }));

  // Top Madrasahs
  const topMadrasahs = [
    { name: "দারুল উলুম দেওবন্দ কামিল মাদ্রাসা, ঢাকা", students: 1280, avgScore: "৮৬.৫%" },
    { name: "সরকারি আলিয়া মাদ্রাসা, ঢাকা", students: 950, avgScore: "৮৪.২%" },
    { name: "জামিয়া আরাবিয়া ইমদাদুল উলুম ফরিদাবাদ", students: 840, avgScore: "৮৮.১%" },
    { name: "সরকারি আলিয়া মাদ্রাসা, সিলেট", students: 720, avgScore: "৮১.৮%" },
    { name: "মাদ্রাসা-ই-আলিয়া, চট্টগ্রাম", students: 680, avgScore: "৮২.৩%" },
  ];

  return (
    <div className="space-y-6 pb-12">
      <RlsNoticeBanner />

      {/* 1-Click Quick Action Hero Bar */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 text-white shadow-xl shadow-emerald-950/20 border border-emerald-700/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/80 text-amber-300 text-xs font-semibold border border-emerald-600/60">
              <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
              <span>তামরীন সেন্ট্রাল কমান্ড সেন্টার • অ্যাডমিন প্যানেল</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">
              স্বাগতম, অ্যাডমিনিস্ট্রেটর!
            </h2>
            <p className="text-sm text-emerald-200/90 max-w-2xl leading-relaxed">
              মাদ্রাসা ও ইসলামিক শিক্ষা প্রতিযোগিতামূলক পরীক্ষা ইকোসিস্টেমের পূর্ণাঙ্গ সেন্ট্রাল সিএমএস।
              প্রশ্ন তৈরি, মডেল টেস্ট প্রকাশ, কোর্স রুটিন ও পেমেন্ট ভেরিফিকেশন এক নজরে নিয়ন্ত্রণ করুন।
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenAiGenerator}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-lg shadow-amber-500/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-100" />
              <span>AI প্রশ্ন জেনারেটর</span>
            </button>

            <button
              onClick={onOpenEmergencyNotice}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
            >
              <Megaphone className="w-4 h-4" />
              <span>জরুরি ব্রডকাস্ট</span>
            </button>

            <button
              onClick={onOpenNewExam}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs border border-emerald-500/40 transition-all cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4 text-emerald-200" />
              <span>নতুন পরীক্ষা চালু</span>
            </button>
          </div>
        </div>

        {/* Live Broadcast Status Ribbon */}
        {appSettings.emergency_notice.enabled && (
          <div className="mt-5 pt-4 border-t border-emerald-700/60 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-rose-200">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="font-semibold">সক্রিয় জরুরি নোটিশ:</span>
              <span className="truncate text-white font-medium">{appSettings.emergency_notice.message}</span>
            </div>
            <button
              onClick={() => setActiveTab("app_customizer")}
              className="text-amber-300 hover:text-white underline font-semibold flex-shrink-0 cursor-pointer"
            >
              এডিট নোটিশ
            </button>
          </div>
        )}
      </div>

      {/* Primary Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">নিবন্ধিত শিক্ষার্থী</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white">
              {totalStudents.toLocaleString("bn-BD")} জন
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+১২.৪% এই সপ্তাহে বৃদ্ধি</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">মোট পরীক্ষা সাবমিশন</span>
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white">
              {totalExamsSubmitted.toLocaleString("bn-BD")} টি
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-600 font-semibold">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>{liveExams.length}টি লাইভ পরীক্ষা রানিং</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">আজকের সংগৃহীত রেভিনিউ</span>
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white">
              ৳ {todayRevenue.toLocaleString("bn-BD")}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-teal-600 font-semibold">
              <span>{premiumCount.toLocaleString("bn-BD")} প্রিমিয়াম মেম্বার</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">পেন্ডিং পেমেন্ট যাচাই</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              pendingPayments.length > 0
                ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 animate-pulse"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}>
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="text-2xl font-extrabold text-slate-800 dark:text-white">
              {pendingPayments.length} টি
            </div>
            {pendingPayments.length > 0 && (
              <button
                onClick={() => setActiveTab("payments")}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
              >
                অনুমোদন করুন →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart: Exam Participation Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                দৈনিক মডেল টেস্টে শিক্ষার্থীদের অংশগ্রহণ ট্রেন্ড
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                গত ৭ দিনের প্রতিদিনের লাইভ ও সাপ্তাহিক মডেল টেস্টের উপস্থিতি
              </p>
            </div>
            <span className="text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full">
              সাপ্তাহিক গড়: ৫,০২০ জন/দিন
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={examParticipationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorParticipants" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`${val} জন পরীক্ষার্থী`, "অংশগ্রহণকারী"]}
                />
                <Area
                  type="monotone"
                  dataKey="participants"
                  stroke="#059669"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorParticipants)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Gateways Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              পেমেন্ট গেটওয়ে বিশ্লেষণ
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              বিকাশ, নগদ ও রকেটে সাবস্ক্রিপশন ফি সংগ্রহ
            </p>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gatewayData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="amount"
                  >
                    {gatewayData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "10px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(val: any) => [`৳ ${val}`, "মোট সংগ্রহ"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 mt-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            {gatewayData.map((gw) => (
              <div key={gw.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: gw.color }}></span>
                  <span className="text-slate-600 dark:text-slate-300 font-medium">{gw.name}</span>
                </div>
                <span className="font-bold text-slate-800 dark:text-white">৳ {gw.amount.toLocaleString("bn-BD")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Column Grid: Pending Payments Approvals & Top Madrasahs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Payments Action Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center font-bold">
                ৳
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  পেন্ডিং পেমেন্ট দ্রুত অনুমোদন
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {pendingPayments.length}টি লেনদেন যাচাইয়ের অপেক্ষায়
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab("payments")}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              সব দেখুন →
            </button>
          </div>

          <div className="space-y-3">
            {pendingPayments.length > 0 ? (
              pendingPayments.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800 dark:text-white truncate">
                        {p.user_name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold font-mono">
                        {p.gateway}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      TrxID: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{p.trx_id}</span> • {p.plan_name}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-extrabold text-emerald-600">৳{p.amount}</span>
                    <button
                      onClick={() => approvePayment(p.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                      title="অনুমোদন ও এক্টিভেট করুন"
                    >
                      অনুমোদন
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                কোনো পেন্ডিং পেমেন্ট নেই! সমস্ত লেনদেন ক্লিয়ার করা হয়েছে।
              </div>
            )}
          </div>
        </div>

        {/* Top Ranking Madrasahs Leaderboard */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  শীর্ষ অংশগ্রহণকারী মাদ্রাসাসমূহ
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  মডেল টেস্ট স্কোরের ভিত্তিতে শীর্ষ র‍্যাঙ্কিং
                </span>
              </div>
            </div>

            <button
              onClick={() => setActiveTab("exams")}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
            >
              পরীক্ষা তালিকা →
            </button>
          </div>

          <div className="space-y-2.5">
            {topMadrasahs.map((m, idx) => (
              <div
                key={m.name}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                      idx === 0
                        ? "bg-amber-400 text-amber-950"
                        : idx === 1
                        ? "bg-slate-300 text-slate-900"
                        : idx === 2
                        ? "bg-amber-700 text-amber-100"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {m.name}
                  </span>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {m.students} জন
                  </span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                    {m.avgScore}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
