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
  Link,
  Copy,
  Zap,
  Search,
  CheckSquare,
  Square,
  X,
  Layers,
} from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import { Exam, ExamCategory, ExamStatus, Question } from "../../types";
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
    questions,
    courses,
    deleteExam,
    toggleExamStatus,
    publishExamResult,
    toggleLiveExamBanner,
    appSettings,
    searchQuery,
    openExamInSimulator,
    assignQuestionsToExam,
    autoPopulateExamQuestions,
    autoLinkAllEmptyExams,
    showToast,
  } = useAdminData();

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isLinkingAll, setIsLinkingAll] = useState(false);
  const [linkingExam, setLinkingExam] = useState<Exam | null>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [modalSearch, setModalSearch] = useState("");
  const [modalSubjectFilter, setModalSubjectFilter] = useState("all");

  const safeExams = exams || [];
  const emptyExamsCount = safeExams.filter((e) => {
    const attached = (e.questions && e.questions.length > 0)
      ? e.questions
      : questions.filter((q) => q.exam_id === e.id);
    return attached.length === 0;
  }).length;

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

  const handleAutoLinkAll = async () => {
    setIsLinkingAll(true);
    await autoLinkAllEmptyExams();
    setIsLinkingAll(false);
  };

  const handleOpenLinkModal = (exam: Exam) => {
    setLinkingExam(exam);
    // Pre-select questions already linked to this exam
    const alreadyLinked = questions.filter((q) => q.exam_id === exam.id).map((q) => q.id);
    if (alreadyLinked.length > 0) {
      setSelectedQuestionIds(alreadyLinked);
    } else {
      // If none linked, suggest subject-matching questions
      const matched = questions
        .filter(
          (q) =>
            (exam.subject && q.subject_name && exam.subject.toLowerCase().includes(q.subject_name.toLowerCase())) ||
            (exam.title && q.topic && exam.title.toLowerCase().includes(q.topic.toLowerCase()))
        )
        .map((q) => q.id);
      setSelectedQuestionIds(matched.slice(0, 10));
    }
  };

  const handleSaveAssignedQuestions = async () => {
    if (!linkingExam) return;
    await assignQuestionsToExam(linkingExam.id, selectedQuestionIds);
    setLinkingExam(null);
  };

  const toggleSelectQuestion = (qId: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const handleSelectAllVisibleQuestions = (visibleQs: Question[]) => {
    const visibleIds = visibleQs.map((q) => q.id);
    const allSelected = visibleIds.every((id) => selectedQuestionIds.includes(id));
    if (allSelected) {
      setSelectedQuestionIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedQuestionIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <RlsNoticeBanner />

      {/* Auto-Fix Alert if empty exams exist */}
      {emptyExamsCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-emerald-500/10 dark:from-amber-950/40 dark:to-emerald-950/40 border border-amber-300 dark:border-amber-700/60 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{emptyExamsCount} টি পরীক্ষায় কোনো প্রশ্ন লিংক করা নেই!</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                  সতর্কতা
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                শিক্ষার্থীরা যাতে মোবাইল অ্যাপে তাৎক্ষণিকভাবে মডেল টেস্ট দিতে পারে, নিচের বাটনে ক্লিক করে সকল খালি পরীক্ষায় স্বয়ংক্রিয়ভাবে প্রশ্ন সংযুক্ত ও Supabase-এ সিঙ্ক করুন।
              </p>
            </div>
          </div>

          <button
            onClick={handleAutoLinkAll}
            disabled={isLinkingAll}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-700 hover:to-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isLinkingAll ? "animate-spin" : ""}`} />
            <span>{isLinkingAll ? "সিঙ্ক হচ্ছে..." : "⚡ সকল খালি পরীক্ষায় অটো-প্রশ্ন লিংক করুন"}</span>
          </button>
        </div>
      )}

      {/* Header & Create Exam Action */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-600" />
            <span>পরীক্ষা দিন কন্ট্রোলার (Exam & Model Test Management)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            লাইভ পরীক্ষা শিডিউল, প্রশ্ন লিংকিং, নেগেটিভ মার্কিং অনুপাত ও রিয়েল-টাইম লিডারবোর্ড নিয়ন্ত্রণ
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleAutoLinkAll}
            disabled={isLinkingAll}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
            title="সকল খালি পরীক্ষায় প্রশ্ন স্বয়ংক্রিয়ভাবে সংযুক্ত করুন"
          >
            <Zap className={`w-4 h-4 text-amber-500 ${isLinkingAll ? "animate-spin" : ""}`} />
            <span>{isLinkingAll ? "প্রসেস হচ্ছে..." : "অটো-লিংক ফিক্স"}</span>
          </button>

          <button
            onClick={() => onOpenExamForm()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন মডেল টেস্ট তৈরি</span>
          </button>
        </div>
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

          // Calculate attached questions
          const attachedQuestions = (exam.questions && exam.questions.length > 0)
            ? exam.questions
            : questions.filter((q) => q.exam_id === exam.id);
          const qCount = attachedQuestions.length;

          // Find linked course
          const linkedCourse = courses.find((c) => c.id === exam.course_id);

          return (
            <div
              key={exam.id}
              className={`bg-white dark:bg-slate-900 rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                qCount === 0
                  ? "border-amber-300 dark:border-amber-800/80 shadow-sm"
                  : "border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md"
              }`}
            >
              <div>
                {/* Status Badges & Quick Action */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
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

                    {linkedCourse && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200">
                        📚 {linkedCourse.title}
                      </span>
                    )}
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

                {/* Exam Title & ID */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {exam.title}
                  </h3>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(exam.id);
                      showToast(`Exam ID কপি হয়েছে: ${exam.id}`);
                    }}
                    className="shrink-0 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded cursor-pointer"
                    title="Copy Exam ID for Supabase"
                  >
                    <Copy className="w-3 h-3" />
                    <span>ID</span>
                  </button>
                </div>

                {exam.syllabus && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2">
                    <strong>সিলেবাস:</strong> {exam.syllabus}
                  </p>
                )}

                {/* Question Status Banner if 0 questions */}
                {qCount === 0 && (
                  <div className="mt-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                        এই পরীক্ষায় কোনো প্রশ্ন যুক্ত নেই!
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => autoPopulateExamQuestions(exam.id, 10)}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <Zap className="w-3 h-3" />
                        <span>⚡ অটো ১০টি প্রশ্ন লোড</span>
                      </button>
                      <button
                        onClick={() => handleOpenLinkModal(exam)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Link className="w-3 h-3" />
                        <span>ব্যাংক থেকে বাছাই</span>
                      </button>
                    </div>
                  </div>
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
                    <HelpCircle className={`w-4 h-4 ${qCount > 0 ? "text-emerald-600" : "text-rose-500"}`} />
                    <span>
                      সংযুক্ত প্রশ্ন:{" "}
                      {qCount > 0 ? (
                        <strong className="text-emerald-700 dark:text-emerald-400">{qCount} টি</strong>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 font-bold">০ টি (প্রশ্ন যুক্ত করুন)</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-600" />
                    <span>অংশগ্রহণকারী: <strong>{(exam.participant_count || 0).toLocaleString("bn-BD")}</strong> জন</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (onOpenLiveSimulatorForExam) {
                        onOpenLiveSimulatorForExam(exam);
                      }
                      openExamInSimulator(exam);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>পরীক্ষা দিন</span>
                  </button>

                  <button
                    onClick={() => handleOpenLinkModal(exam)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                    title="প্রশ্ন লিঙ্ক বা ম্যানেজ করুন"
                  >
                    <Link className="w-3.5 h-3.5 text-emerald-600" />
                    <span>প্রশ্ন লিংক ({qCount})</span>
                  </button>
                </div>

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

      {/* Question Linker Modal */}
      {linkingExam && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  <Link className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    মডেল টেস্টে প্রশ্ন লিংক করুন
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    পরীক্ষা: <strong className="text-slate-800 dark:text-slate-200">{linkingExam.title}</strong> ({linkingExam.subject})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setLinkingExam(null)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Filters & Quick Pick */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={modalSearch}
                    onChange={(e) => setModalSearch(e.target.value)}
                    placeholder="প্রশ্ন বা বিষয় দিয়ে খুঁজুন..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <select
                  value={modalSubjectFilter}
                  onChange={(e) => setModalSubjectFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="all">সকল বিষয়</option>
                  {Array.from(new Set(questions.map((q) => q.subject_name).filter(Boolean))).map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">কুইক সিলেক্ট:</span>
                  <button
                    onClick={() => {
                      const matched = questions
                        .filter(
                          (q) =>
                            (linkingExam.subject && q.subject_name && linkingExam.subject.toLowerCase().includes(q.subject_name.toLowerCase())) ||
                            (linkingExam.title && q.topic && linkingExam.title.toLowerCase().includes(q.topic.toLowerCase()))
                        )
                        .map((q) => q.id);
                      setSelectedQuestionIds(matched.slice(0, 10));
                    }}
                    className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold cursor-pointer hover:bg-emerald-200"
                  >
                    বিষয় অনুযায়ী ১০টি
                  </button>
                  <button
                    onClick={() => setSelectedQuestionIds(questions.slice(0, 10).map((q) => q.id))}
                    className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer hover:bg-slate-300"
                  >
                    প্রথম ১০টি
                  </button>
                  <button
                    onClick={() => setSelectedQuestionIds(questions.slice(0, 25).map((q) => q.id))}
                    className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer hover:bg-slate-300"
                  >
                    ২৫টি
                  </button>
                </div>

                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  নির্বাচিত: {selectedQuestionIds.length} টি
                </span>
              </div>
            </div>

            {/* Questions List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800">
              {(() => {
                const modalFiltered = questions.filter((q) => {
                  const matchesSearch =
                    !modalSearch ||
                    (q.question || "").toLowerCase().includes(modalSearch.toLowerCase()) ||
                    (q.topic || "").toLowerCase().includes(modalSearch.toLowerCase());
                  const matchesSub = modalSubjectFilter === "all" || q.subject_name === modalSubjectFilter;
                  return matchesSearch && matchesSub;
                });

                if (modalFiltered.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      কোনো প্রশ্ন পাওয়া যায়নি। প্রশ্ন ব্যাংক ট্যাবে গিয়ে প্রশ্ন যোগ করুন।
                    </div>
                  );
                }

                return modalFiltered.map((q, idx) => {
                  const isSelected = selectedQuestionIds.includes(q.id);
                  return (
                    <div
                      key={q.id}
                      onClick={() => toggleSelectQuestion(q.id)}
                      className={`pt-2.5 flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <button className="mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0">
                        {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            #{idx + 1}
                          </span>
                          {q.subject_name && (
                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                              {q.subject_name}
                            </span>
                          )}
                          {q.topic && (
                            <span className="text-[10px] text-slate-400">
                              • {q.topic}
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                          {q.question || q.question_text}
                        </p>

                        {q.arabic_text && (
                          <p className="text-xs font-arabic text-emerald-800 dark:text-emerald-300 mt-0.5 line-clamp-1" dir="rtl">
                            {q.arabic_text}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <span className="text-xs text-slate-500">
                মোট নির্বাচিত: <strong className="text-emerald-700 dark:text-emerald-400">{selectedQuestionIds.length}</strong> টি প্রশ্ন
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLinkingExam(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  onClick={handleSaveAssignedQuestions}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  সংযুক্ত করুন ও Supabase-এ সেভ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
