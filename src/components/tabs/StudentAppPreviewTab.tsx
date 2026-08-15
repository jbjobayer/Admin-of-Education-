import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Radio,
  BookOpen,
  HelpCircle,
  FileCheck,
  CheckCircle2,
  Lock,
  Flame,
  CreditCard,
  Send,
  Sparkles,
  ArrowRight,
  Clock,
  Award,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import { Exam, Question, SubscriptionPackage } from "../../types";

interface StudentAppPreviewTabProps {
  initialExam?: Exam | null;
}

export const StudentAppPreviewTab: React.FC<StudentAppPreviewTabProps> = ({ initialExam }) => {
  const {
    appSettings,
    exams,
    subjects,
    courses,
    jobCirculars,
    subscriptionPackages = [],
    submitPayment,
    showToast,
  } = useAdminData();

  const packages = subscriptionPackages.length > 0 
    ? subscriptionPackages 
    : appSettings?.subscription_packages || [];

  const [activeMobileTab, setActiveMobileTab] = useState<"home" | "exams" | "courses" | "premium">("home");
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);

  // Active exam session state
  const [takingExam, setTakingExam] = useState<Exam | null>(initialExam || null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examScore, setExamScore] = useState(0);
  const [examRank, setExamRank] = useState(1);

  // Payment simulator state
  const [paymentName, setPaymentName] = useState("আব্দুল্লাহ আল মামুন");
  const [paymentPhone, setPaymentPhone] = useState("01712345678");
  const [paymentGateway, setPaymentGateway] = useState<"bKash" | "Nagad" | "Rocket">("bKash");
  const [paymentTrxId, setPaymentTrxId] = useState("");
  const [paymentPlan, setPaymentPlan] = useState<SubscriptionPackage | null>(packages[0] || null);

  useEffect(() => {
    if (!paymentPlan && packages.length > 0) {
      setPaymentPlan(packages[0]);
    }
  }, [packages, paymentPlan]);

  const activeBanners = appSettings?.home_banners?.filter((b) => b.is_active) || [];

  useEffect(() => {
    if (initialExam) {
      setTakingExam(initialExam);
      setSelectedAnswers({});
      setExamSubmitted(false);
    }
  }, [initialExam]);

  // Rotate banners every 4s
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % activeBanners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const handleStartExam = (exam: Exam) => {
    setTakingExam(exam);
    setSelectedAnswers({});
    setExamSubmitted(false);
  };

  const handleSelectOption = (qIdx: number, optIdx: number) => {
    if (examSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmitExam = () => {
    if (!takingExam) return;
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;

    takingExam.questions.forEach((q, idx) => {
      const ans = selectedAnswers[idx];
      if (ans !== undefined) {
        if (ans === q.correct_index) {
          score += 1;
          correctCount++;
        } else {
          score -= takingExam.negative_marking;
          wrongCount++;
        }
      }
    });

    setExamScore(Math.max(0, score));
    setExamRank(Math.floor(Math.random() * 45) + 3);
    setExamSubmitted(true);
  };

  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTrxId.trim()) {
      showToast("দয়া করে TrxID প্রদান করুন", "error");
      return;
    }

    const plan = paymentPlan || packages[0];
    if (!plan) {
      showToast("প্যাকেজ পাওয়া যায়নি।", "error");
      return;
    }

    submitPayment({
      user_id: "usr-preview",
      user_name: paymentName,
      user_phone: paymentPhone,
      sender_number: paymentPhone,
      gateway: paymentGateway,
      trx_id: paymentTrxId.toUpperCase(),
      amount: plan.price,
      plan_id: plan.id,
      plan_name: plan.name_bn,
      screenshot_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400",
    });

    setPaymentTrxId("");
    showToast("পেমেন্ট সাবমিশন সম্পন্ন হয়েছে! অ্যাডমিন প্যানেলে রিয়েল-টাইমে নোটিফিকেশন যুক্ত হয়েছে।", "success");
    setActiveMobileTab("home");
  };

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-6 sm:gap-8 py-2 sm:py-4 w-full">
      {/* Phone Mockup Frame */}
      <div className="w-full max-w-[380px] h-[680px] sm:h-[760px] bg-slate-900 rounded-[36px] sm:rounded-[50px] p-2.5 sm:p-4 shadow-2xl border-4 border-slate-700 relative flex flex-col flex-shrink-0">
        {/* Phone Notch & Speaker */}
        <div className="w-36 h-4 bg-slate-800 rounded-full mx-auto mb-2 flex items-center justify-center gap-2 flex-shrink-0">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-950"></div>
          <div className="w-10 h-1 bg-slate-900 rounded-full"></div>
        </div>

        {/* Screen Container */}
        <div className="flex-1 bg-slate-50 text-slate-900 rounded-[36px] overflow-hidden flex flex-col relative font-sans">
          {/* Top Status Bar */}
          <div className="h-6 bg-emerald-950 text-white text-[10px] px-5 flex items-center justify-between flex-shrink-0 font-mono">
            <span>৯:৪১</span>
            <div className="flex items-center gap-1.5">
              <span>5G</span>
              <span>100%</span>
            </div>
          </div>

          {/* Top App Header */}
          <div className="bg-emerald-900 text-white p-3.5 flex items-center justify-between flex-shrink-0 shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-amber-400 flex items-center justify-center font-bold text-xs text-white">
                ت
              </div>
              <span className="font-bold text-sm tracking-tight">তামরীন (Tamreen)</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                মাদ্রাসা হাব
              </span>
            </div>
          </div>

          {/* Running Ticker / Marquee */}
          {appSettings.marquee_active && (
            <div className="bg-emerald-950 text-amber-300 text-[11px] py-1 px-3 flex items-center gap-2 overflow-hidden whitespace-nowrap flex-shrink-0 border-b border-emerald-800/60">
              <span className="bg-amber-400 text-emerald-950 px-1 rounded text-[9px] font-bold">ঘোষণা</span>
              <div className="animate-marquee font-medium">
                {appSettings.marquee_text}
              </div>
            </div>
          )}

          {/* Emergency Alert Banner */}
          {appSettings.emergency_notice.enabled && (
            <div className="bg-rose-600 text-white text-xs p-2.5 flex items-center justify-between gap-2 flex-shrink-0 animate-pulse">
              <div className="flex items-center gap-1.5 min-w-0">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-[11px] font-bold truncate">
                  {appSettings.emergency_notice.message}
                </span>
              </div>
              {appSettings.emergency_notice.action_btn_text && (
                <span className="text-[10px] bg-white text-rose-700 px-1.5 py-0.5 rounded font-bold flex-shrink-0">
                  {appSettings.emergency_notice.action_btn_text}
                </span>
              )}
            </div>
          )}

          {/* Mobile Screen Content Area */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
            {/* Taking Exam Simulator Mode */}
            {takingExam ? (
              <div className="space-y-3 pb-6">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <button
                    onClick={() => setTakingExam(null)}
                    className="text-xs text-emerald-700 font-bold"
                  >
                    ← ফিরে যান
                  </button>
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[180px]">
                    {takingExam.title}
                  </span>
                </div>

                {!examSubmitted ? (
                  <div className="space-y-4">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {takingExam.duration_minutes} মিনিট
                      </span>
                      <span>নম্বর: {takingExam.total_marks} (নেগেটিভ -{takingExam.negative_marking})</span>
                    </div>

                    {takingExam.questions.map((q, qIdx) => (
                      <div key={q.id} className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-bold text-emerald-700">{qIdx + 1}.</span>
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">{q.question}</h4>
                        </div>

                        {q.arabic_text && (
                          <div className="p-2 bg-emerald-50/50 rounded-xl font-arabic text-base text-emerald-950">
                            {q.arabic_text}
                          </div>
                        )}

                        <div className="space-y-1.5 pt-1">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = selectedAnswers[qIdx] === optIdx;
                            return (
                              <button
                                key={optIdx}
                                onClick={() => handleSelectOption(qIdx, optIdx)}
                                className={`w-full text-left p-2 rounded-xl text-xs flex items-center gap-2 border transition-colors ${
                                  isSelected
                                    ? "bg-emerald-600 text-white font-bold border-emerald-600"
                                    : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                                }`}
                              >
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                                  isSelected ? "bg-white text-emerald-700 font-bold" : "bg-slate-200"
                                }`}>
                                  {["ক", "খ", "গ", "ঘ"][optIdx]}
                                </span>
                                <span className="truncate">{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={handleSubmitExam}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                    >
                      পরীক্ষা সাবমিট করুন
                    </button>
                  </div>
                ) : (
                  /* Exam Result Card */
                  <div className="p-4 bg-white rounded-3xl border border-emerald-200 text-center space-y-3 shadow-lg animate-in zoom-in-95">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                      <Award className="w-6 h-6" />
                    </div>

                    <h3 className="font-bold text-base text-slate-900">পরীক্ষা সম্পন্ন হয়েছে!</h3>

                    <div className="p-3 bg-emerald-50 rounded-2xl space-y-1">
                      <span className="text-xs text-slate-500">আপনার প্রাপ্ত নম্বর</span>
                      <div className="text-2xl font-extrabold text-emerald-700">
                        {examScore} / {takingExam.total_marks}
                      </div>
                    </div>

                    <div className="flex items-center justify-around text-xs text-slate-600 pt-1">
                      <div>
                        <span className="block text-slate-400">মেধা ক্রম</span>
                        <strong className="text-amber-600 text-sm">#{examRank}</strong>
                      </div>
                      <div>
                        <span className="block text-slate-400">সঠিক উত্তর</span>
                        <strong className="text-emerald-600 text-sm">
                          {Object.entries(selectedAnswers).filter(([idx, ans]) => takingExam.questions[Number(idx)]?.correct_index === ans).length} টি
                        </strong>
                      </div>
                    </div>

                    <button
                      onClick={() => setTakingExam(null)}
                      className="w-full py-2 rounded-xl bg-slate-900 text-white text-xs font-bold mt-2"
                    >
                      হোমে ফিরে যান
                    </button>
                  </div>
                )}
              </div>
            ) : activeMobileTab === "home" ? (
              /* Mobile Home Tab */
              <>
                {/* Carousel Banner */}
                {activeBanners.length > 0 && (
                  <div className="relative rounded-2xl overflow-hidden shadow-sm aspect-[16/9] border border-slate-200">
                    <img
                      src={activeBanners[activeBannerIdx]?.image_url}
                      alt="Banner"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2.5">
                      <span className="text-white font-bold text-xs">
                        {activeBanners[activeBannerIdx]?.title}
                      </span>
                    </div>
                  </div>
                )}

                {/* Daily Live Exam Card */}
                {exams.find((e) => e.status === "live") && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-900 text-white shadow-md">
                    <div className="flex items-center gap-1.5 text-[10px] text-amber-300 font-bold mb-1">
                      <Radio className="w-3 h-3 animate-pulse" />
                      <span>লাইভ পরীক্ষা চলছে</span>
                    </div>
                    <h4 className="font-bold text-xs">{exams.find((e) => e.status === "live")?.title}</h4>
                    <button
                      onClick={() => handleStartExam(exams.find((e) => e.status === "live")!)}
                      className="mt-2 w-full py-1.5 rounded-lg bg-amber-500 text-emerald-950 font-bold text-[11px]"
                    >
                      এখনই পরীক্ষা দিন →
                    </button>
                  </div>
                )}

                {/* Subjects Grid */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-800">বিষয়ভিত্তিক প্রস্তুতি</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">সকল বিষয়</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {subjects.slice(0, 4).map((sub) => (
                      <div
                        key={sub.id}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-bold text-[11px] text-slate-800 leading-tight">
                            {sub.name_bn}
                          </span>
                          {sub.is_premium_only && <Lock className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                        </div>
                        <span className="text-[9px] text-slate-400 mt-2 font-mono">
                          {sub.question_count}টি প্রশ্ন
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hot Job Circular */}
                {jobCirculars.filter((j) => j.is_hot)[0] && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-1 text-rose-600 font-bold text-[10px]">
                      <Flame className="w-3 h-3" />
                      <span>হট নিয়োগ বিজ্ঞপ্তি</span>
                    </div>
                    <h5 className="font-bold text-xs text-slate-900 mt-0.5">
                      {jobCirculars.filter((j) => j.is_hot)[0].title}
                    </h5>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      পদসংখ্যা: {jobCirculars.filter((j) => j.is_hot)[0].vacancies} • শেষ তারিখ: {jobCirculars.filter((j) => j.is_hot)[0].deadline}
                    </span>
                  </div>
                )}
              </>
            ) : activeMobileTab === "exams" ? (
              /* Mobile Exams Tab */
              <div className="space-y-3">
                <h3 className="font-bold text-xs text-slate-800">মডেল টেস্ট ও পরীক্ষা</h3>
                {exams.map((ex) => (
                  <div key={ex.id} className="p-3 bg-white rounded-2xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-700 px-1.5 py-0.2 bg-emerald-50 rounded">
                        {ex.subject}
                      </span>
                      <span className="text-[10px] text-slate-400">{ex.duration_minutes} মিনিট</span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900">{ex.title}</h4>
                    <button
                      onClick={() => handleStartExam(ex)}
                      className="w-full mt-1 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[11px]"
                    >
                      পরীক্ষা শুরু করুন
                    </button>
                  </div>
                ))}
              </div>
            ) : activeMobileTab === "courses" ? (
              /* Mobile Courses Tab */
              <div className="space-y-3">
                <h3 className="font-bold text-xs text-slate-800">কোর্স ও স্পেশাল ব্যাচ</h3>
                {courses.map((c) => (
                  <div key={c.id} className="p-3 bg-white rounded-2xl border border-slate-200 space-y-2">
                    <img src={c.cover_image} alt={c.title} className="w-full h-24 object-cover rounded-xl" />
                    <h4 className="font-bold text-xs text-slate-900">{c.title}</h4>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-emerald-600">৳{c.discount_price}</span>
                      <span className="text-[10px] text-slate-500">মেন্টর: {c.mentor}</span>
                    </div>

                    {/* Course Buttons */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {c.custom_buttons.filter((b) => b.is_active).map((b) => (
                        <button
                          key={b.id}
                          onClick={() => {
                            if (b.action_type === "payment_drawer") {
                              setActiveMobileTab("premium");
                            } else {
                              window.open(b.action_value, "_blank");
                            }
                          }}
                          className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200"
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Mobile Premium & Payment Tab */
              <div className="space-y-3">
                <div className="p-3 bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl text-center space-y-1">
                  <Sparkles className="w-5 h-5 text-amber-300 mx-auto" />
                  <h4 className="font-bold text-xs">তামরীন প্রিমিয়াম মেম্বারশিপ</h4>
                  <p className="text-[10px] text-emerald-200">সকল বিষয় ও আনলিমিটেড মডেল টেস্ট আনলক করুন</p>
                </div>

                <form onSubmit={handleSimulatePayment} className="space-y-2.5 text-xs bg-white p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5 text-[11px]">প্যাকেজ নির্বাচন</label>
                    <select
                      value={paymentPlan?.id || packages[0]?.id || ""}
                      onChange={(e) => {
                        const found = packages.find((p) => p.id === e.target.value);
                        if (found) setPaymentPlan(found);
                      }}
                      className="w-full p-2 rounded-lg border border-slate-200 text-xs font-bold bg-white text-slate-800"
                    >
                      {packages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name_bn} (৳{p.price})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5 text-[11px]">পেমেন্ট গেটওয়ে</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["bKash", "Nagad", "Rocket"] as const).map((gw) => (
                        <button
                          key={gw}
                          type="button"
                          onClick={() => setPaymentGateway(gw)}
                          className={`py-1.5 text-[11px] rounded-lg font-bold border cursor-pointer ${
                            paymentGateway === gw ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {gw}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-0.5 text-[11px]">ট্রানজেকশন আইডি (TrxID)</label>
                    <input
                      type="text"
                      value={paymentTrxId}
                      onChange={(e) => setPaymentTrxId(e.target.value)}
                      placeholder="যেমন: 9B7X4K2L"
                      className="w-full p-2 rounded-lg border border-slate-200 text-xs font-mono font-bold uppercase bg-white text-slate-900"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs mt-2 cursor-pointer shadow-md transition-colors"
                  >
                    পেমেন্ট ভেরিফিকেশন পাঠান {paymentPlan ? `(৳${paymentPlan.price})` : packages[0] ? `(৳${packages[0].price})` : ""}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Bottom Mobile Navigation Bar */}
          <div className="h-14 bg-white border-t border-slate-200 flex items-center justify-around flex-shrink-0 px-2">
            <button
              onClick={() => {
                setTakingExam(null);
                setActiveMobileTab("home");
              }}
              className={`flex flex-col items-center gap-0.5 ${activeMobileTab === "home" ? "text-emerald-700 font-bold" : "text-slate-400"}`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="text-[10px]">হোম</span>
            </button>

            <button
              onClick={() => {
                setTakingExam(null);
                setActiveMobileTab("exams");
              }}
              className={`flex flex-col items-center gap-0.5 ${activeMobileTab === "exams" ? "text-emerald-700 font-bold" : "text-slate-400"}`}
            >
              <FileCheck className="w-4 h-4" />
              <span className="text-[10px]">পরীক্ষা</span>
            </button>

            <button
              onClick={() => {
                setTakingExam(null);
                setActiveMobileTab("courses");
              }}
              className={`flex flex-col items-center gap-0.5 ${activeMobileTab === "courses" ? "text-emerald-700 font-bold" : "text-slate-400"}`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="text-[10px]">কোর্স</span>
            </button>

            <button
              onClick={() => {
                setTakingExam(null);
                setActiveMobileTab("premium");
              }}
              className={`flex flex-col items-center gap-0.5 ${activeMobileTab === "premium" ? "text-emerald-700 font-bold" : "text-slate-400"}`}
            >
              <CreditCard className="w-4 h-4" />
              <span className="text-[10px]">প্রিমিয়াম</span>
            </button>
          </div>
        </div>
      </div>

      {/* Simulator Guide & Quick Info */}
      <div className="max-w-md space-y-4 text-slate-700 dark:text-slate-300">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 font-bold">
            <Smartphone className="w-5 h-5" />
            <h3 className="text-base">রিয়েল-টাইম শিক্ষার্থী অ্যাপ সিমুলেটর</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            আপনি অ্যাডমিন প্যানেলে যে কোনো পরিবর্তন (যেমন: নতুন প্রশ্ন যুক্ত করা, পরীক্ষা লাইভ করা, হোম ব্যানার বদলানো, কোর্স বাটন তৈরি করা বা মারকুই নোটিশ লেখা) করার সাথে সাথে এই মোবাইল স্ক্রিনে তাৎক্ষণিকভাবে তা প্রতিফলিত হবে।
          </p>

          <div className="space-y-2 pt-2 text-xs">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>লাইভ পরীক্ষা নেওয়ার জন্য বামে "পরীক্ষা শুরু করুন" এ ক্লিক করুন।</span>
            </div>
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>পেমেন্ট পরীক্ষা করতে "প্রিমিয়াম" ট্যাবে গিয়ে TrxID সাবমিট করুন।</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
