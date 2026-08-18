import React, { useState } from "react";
import {
  FileCheck,
  Plus,
  Radio,
  Clock,
  Award,
  AlertTriangle,
  Play,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit,
  Sliders,
  Users,
  Eye,
  Send,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import { Exam, ExamCategory, ExamStatus } from "../../types";
import { RlsNoticeBanner } from "../RlsNoticeBanner";

interface ExamModelTestManagerProps {
  onOpenExamForm: (examToEdit?: Exam) => void;
  onOpenLiveSimulatorForExam: (exam: Exam) => void;
}

export const ExamModelTestManager: React.FC<ExamModelTestManagerProps> = ({
  onOpenExamForm,
  onOpenLiveSimulatorForExam,
}) => {
  const {
    exams,
    deleteExam,
    toggleExamStatus,
    publishExamResult,
    toggleLiveExamBanner,
    appSettings,
    searchQuery,
  } = useAdminData();

  const [activeCategory, setActiveCategory] = useState<string>("all");

  const safeExams = exams || [];

  const categories: { id: string; labelBn: string; count: number }[] = [
    { id: "all", labelBn: "সকল পরীক্ষা", count: safeExams.length },
    {
      id: "daily_live",
      labelBn: "দৈনিক লাইভ পরীক্ষা",
      count: safeExams.filter((e) => e.category === "daily_live").length,
    },
    {
      id: "weekly_model_test",
      labelBn: "সাপ্তাহিক মেগা টেস্ট",
      count: safeExams.filter((e) => e.category === "weekly_model_test").length,
    },
    {
      id: "free_test",
      labelBn: "ফ্রি ট্রায়াল টেস্ট",
      count: safeExams.filter((e) => e.category === "free_test").length,
    },
    {
      id: "monthly_mega",
      labelBn: "মাসিক মেগা মডেল টেস্ট",
      count: safeExams.filter((e) => e.category === "monthly_mega").length,
    },
    {
      id: "premium_ntrca",
      labelBn: "NTRCA স্পেশাল",
      count: safeExams.filter((e) => e.category === "premium_ntrca").length,
    },
  ];

  const filteredExams = safeExams.filter((e) => {
    const matchesCategory = activeCategory === "all" || e.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      (e.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.subject || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.syllabus && e.syllabus.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      <RlsNoticeBanner />

      {/* Header & Create Exam Action */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-600" />
            <span>পরীক্ষা দিন কন্ট্রোলার (Exam & Model Test Management)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            লাইভ পরীক্ষা শিডিউল, নেগেটিভ মার্কিং অনুপাত ও রিয়েল-টাইম লিডারবোর্ড নিয়ন্ত্রণ
          </p>
        </div>

        <button
          onClick={() => onOpenExamForm()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন মডেল টেস্ট তৈরি</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                isActive
                  ? "bg-emerald-800 text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
              }`}
            >
              <span>{cat.labelBn}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? "bg-emerald-700 text-emerald-100" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Exam Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredExams.map((exam) => {
          const isLive = exam.status === "live";
          const isBroadcasting = appSettings.live_exam_broadcast_active && appSettings.active_broadcast_exam_id === exam.id;

          return (
            <div
              key={exam.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Status Badges & Quick Action */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                        isLive
                          ? "bg-rose-500 text-white animate-pulse"
                          : exam.status === "completed"
                          ? "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          : "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {isLive && <Radio className="w-3 h-3" />}
                      <span>{isLive ? "লাইভ চলছে" : exam.status === "completed" ? "সম্পন্ন" : "আসন্ন (Upcoming)"}</span>
                    </span>

                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/40">
                      {exam.subject}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleExamStatus(exam.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                        isLive
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300"
                          : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                      }`}
                      title="লাইভ টগল"
                    >
                      {isLive ? "পজ করুন" : "লাইভ করুন"}
                    </button>

                    <button
                      onClick={() => onOpenExamForm(exam)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 cursor-pointer"
                      title="এডিট"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm("আপনি কি নিশ্চিত এই পরীক্ষাটি মুছে ফেলতে চান?")) {
                          deleteExam(exam.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer"
                      title="মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Exam Title */}
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {exam.title}
                </h3>

                {exam.syllabus && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2">
                    <strong>সিলেবাস:</strong> {exam.syllabus}
                  </p>
                )}

                {/* Parameters Grid */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[10px] text-slate-400 block">সময়কাল</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {exam.duration_minutes} মিনিট
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[10px] text-slate-400 block">মোট নম্বর</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {exam.total_marks}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <span className="text-[10px] text-slate-400 block">নেগেটিভ মার্ক</span>
                    <span className="text-xs font-bold text-rose-600">
                      {exam.negative_marking > 0 ? `-${exam.negative_marking}` : "নাই"}
                    </span>
                  </div>
                </div>

                {/* Attached Questions Summary */}
                <div className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-emerald-600" />
                    <span>সংযুক্ত প্রশ্ন: <strong>{(exam.questions || []).length}</strong> টি</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-600" />
                    <span>অংশগ্রহণকারী: <strong>{(exam.participant_count || 0).toLocaleString("bn-BD")}</strong> জন</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <button
                  onClick={() => onOpenLiveSimulatorForExam(exam)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>শিক্ষার্থী হিসেবে পরীক্ষা দিন</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleLiveExamBanner(exam.id, !isBroadcasting)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isBroadcasting
                        ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                    title="হোম স্ক্রিনে ব্যানার হিসেবে ব্রডকাস্ট করুন"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>{isBroadcasting ? "ব্যানার সক্রিয়" : "হোম ব্যানার"}</span>
                  </button>

                  {!exam.result_published ? (
                    <button
                      onClick={() => publishExamResult(exam.id)}
                      className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                    >
                      রেজাল্ট প্রকাশ
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      রেজাল্ট লাইভ
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
