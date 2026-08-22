import React, { useState } from "react";
import {
  CheckCircle2,
  Layers,
  Trash2,
  Eye,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowLeft,
  Edit3,
  Save,
  MoveUp,
  MoveDown,
  FileText,
  Clock,
  Award,
  AlertCircle,
  Plus,
  BookOpen,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { Question, QuestionDifficulty, ExamStatus, ExamCategory } from "../../types";

interface ExamPreviewStepProps {
  title: string;
  examTargetType: "course_exam" | "free_exam";
  selectedCourseId?: string;
  courseTitle?: string;
  category: ExamCategory;
  subject: string;
  syllabus: string;
  durationMinutes: number;
  totalMarks: number;
  negativeMarking: number;
  status: ExamStatus;
  examQuestions: Question[];
  isSaving: boolean;
  isEditMode: boolean;
  onBackToForm: () => void;
  onPublish: (e: React.FormEvent) => void;
  onUpdateQuestion: (updatedQuestion: Question) => void;
  onRemoveQuestion: (qId: string) => void;
  onMoveQuestion: (index: number, direction: "up" | "down") => void;
  onClearAll: () => void;
}

export const ExamPreviewStep: React.FC<ExamPreviewStepProps> = ({
  title,
  examTargetType,
  selectedCourseId,
  courseTitle,
  category,
  subject,
  syllabus,
  durationMinutes,
  totalMarks,
  negativeMarking,
  status,
  examQuestions,
  isSaving,
  isEditMode,
  onBackToForm,
  onPublish,
  onUpdateQuestion,
  onRemoveQuestion,
  onMoveQuestion,
  onClearAll,
}) => {
  // Inline editing state for a specific question
  const [editingQId, setEditingQId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editArabic, setEditArabic] = useState("");
  const [editOptions, setEditOptions] = useState<string[]>(["", "", "", ""]);
  const [editCorrectIdx, setEditCorrectIdx] = useState<number>(0);
  const [editExplanation, setEditExplanation] = useState("");
  const [editTopic, setEditTopic] = useState("");
  const [editDifficulty, setEditDifficulty] = useState<QuestionDifficulty>("Medium");

  // Harakat Toolbar items
  const harakatList = [
    { label: "َ", name: "ফাতহাহ", char: "َ" },
    { label: "ِ", name: "কাসরাহ", char: "ِ" },
    { label: "ُ", name: "দাম্মাহ", char: "ُ" },
    { label: "ً", name: "তানভীন ফাতহাহ", char: "ً" },
    { label: "ٍ", name: "তানভীন কাসরাহ", char: "ٍ" },
    { label: "ٌ", name: "তানভীন দাম্মাহ", char: "ٌ" },
    { label: "ّ", name: "তাশদীদ", char: "ّ" },
    { label: "ْ", name: "সুকুন", char: "ْ" },
    { label: "ٰ", name: "খাড়া যবর", char: "ٰ" },
  ];

  const handleStartEdit = (q: Question) => {
    setEditingQId(q.id);
    setEditText(q.question || q.question_text || "");
    setEditArabic(q.arabic_text || "");
    const opts =
      q.options && q.options.length >= 4
        ? [...q.options]
        : [q.option_a || "", q.option_b || "", q.option_c || "", q.option_d || ""];
    while (opts.length < 4) opts.push("");
    setEditOptions(opts.slice(0, 4));

    const cIdx =
      q.correct_index !== undefined
        ? q.correct_index
        : q.correct_option === "option_b" || q.correct_option === "b" || q.correct_option === "B"
        ? 1
        : q.correct_option === "option_c" || q.correct_option === "c" || q.correct_option === "C"
        ? 2
        : q.correct_option === "option_d" || q.correct_option === "d" || q.correct_option === "D"
        ? 3
        : 0;
    setEditCorrectIdx(cIdx);
    setEditExplanation(q.explanation || "");
    setEditTopic(q.topic || "");
    setEditDifficulty(q.difficulty || "Medium");
  };

  const handleSaveInlineEdit = (originalQ: Question) => {
    if (!editText.trim()) {
      alert("প্রশ্নের মূল টেক্সট খালি রাখা যাবে না");
      return;
    }
    if (editOptions.some((opt) => !opt.trim())) {
      alert("দয়া করে ৪টি অপশনই পূরণ করুন");
      return;
    }

    const optArr = editOptions.map((o) => o.trim());
    const correctOptStr =
      ["option_a", "option_b", "option_c", "option_d"][editCorrectIdx] || "a";

    const updated: Question = {
      ...originalQ,
      question: editText.trim(),
      question_text: editText.trim(),
      arabic_text: editArabic.trim() || undefined,
      options: optArr,
      option_a: optArr[0],
      option_b: optArr[1],
      option_c: optArr[2],
      option_d: optArr[3],
      correct_index: editCorrectIdx,
      correct_option: correctOptStr,
      explanation: editExplanation.trim(),
      topic: editTopic.trim() || originalQ.topic,
      difficulty: editDifficulty,
    };

    onUpdateQuestion(updated);
    setEditingQId(null);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Exam Configuration Overview Summary Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50/40 to-slate-50 dark:from-slate-800/90 dark:via-slate-800/60 dark:to-slate-900 border border-emerald-200/80 dark:border-slate-700 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 dark:border-slate-700 pb-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                examTargetType === "free_exam"
                  ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
                  : "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
              }`}
            >
              {examTargetType === "free_exam"
                ? "🎁 ফ্রি মডেল টেস্ট (free_exams)"
                : "🎓 কোর্স পরীক্ষা (course_exams)"}
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
              {subject || "বিষয় নির্ধারিত নয়"}
            </span>
          </div>

          <button
            type="button"
            onClick={onBackToForm}
            className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-emerald-600 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>বিবরণ এডিট করুন</span>
          </button>
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
            {title || "শিরোনামহীন মডেল টেস্ট"}
          </h3>
          {courseTitle && (
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
              📚 সংযুক্ত কোর্স: {courseTitle}
            </p>
          )}
          {syllabus && (
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 bg-white/60 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              📌 <strong>সিলেবাস / নির্দেশনা:</strong> {syllabus}
            </p>
          )}
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-slate-500 font-medium">সময়কাল</p>
              <p className="font-bold text-xs text-slate-800 dark:text-white">
                {durationMinutes} মিনিট
              </p>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-slate-500 font-medium">মোট নম্বর</p>
              <p className="font-bold text-xs text-slate-800 dark:text-white">
                {totalMarks} নম্বর
              </p>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-slate-500 font-medium">যুক্ত প্রশ্ন</p>
              <p className="font-bold text-xs text-slate-800 dark:text-white">
                {examQuestions.length} টি
              </p>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-slate-500 font-medium">নেগেটিভ মার্ক</p>
              <p className="font-bold text-xs text-slate-800 dark:text-white">
                {negativeMarking > 0 ? `-${negativeMarking}` : "নাই"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Questions Preview and Inline Editing List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <h4 className="font-black text-slate-800 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                প্রশ্ন ও অপশন প্রিভিউ ({examQuestions.length} টি প্রশ্ন)
              </span>
            </h4>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
              সরাসরি এডিট করুন
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onBackToForm}
              className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-100 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>আরও প্রশ্ন যোগ করুন</span>
            </button>
          </div>
        </div>

        {examQuestions.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-slate-600 dark:text-slate-400 font-bold text-xs">
              পরীক্ষায় এখনো কোনো প্রশ্ন যুক্ত করা হয়নি!
            </p>
            <button
              type="button"
              onClick={onBackToForm}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs cursor-pointer shadow-md hover:bg-emerald-700"
            >
              ⬅ প্রশ্ন যোগ করতে ফিরে যান
            </button>
          </div>
        ) : (
          <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
            {examQuestions.map((q, qIdx) => {
              const isCurrentlyEditing = editingQId === q.id;

              return (
                <div
                  key={q.id || qIdx}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                    isCurrentlyEditing
                      ? "bg-amber-50/40 dark:bg-slate-800/90 border-amber-400 dark:border-amber-500 shadow-md ring-2 ring-amber-400/30"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 shadow-xs"
                  }`}
                >
                  {/* Top Bar of each Question Card */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        {qIdx + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                        {q.subject_name || subject}
                      </span>
                      {q.topic && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-semibold text-[10px] border border-amber-200/60 dark:border-amber-800/60">
                          {q.topic}
                        </span>
                      )}
                      {q.difficulty && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                          {q.difficulty === "Easy"
                            ? "সহজ"
                            : q.difficulty === "Hard"
                            ? "কঠিন"
                            : "মাঝারি"}
                        </span>
                      )}
                    </div>

                    {/* Action Controls for this question */}
                    <div className="flex items-center gap-1">
                      {/* Move Up */}
                      <button
                        type="button"
                        disabled={qIdx === 0}
                        onClick={() => onMoveQuestion(qIdx, "up")}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="উপরে নিন"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        disabled={qIdx === examQuestions.length - 1}
                        onClick={() => onMoveQuestion(qIdx, "down")}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="নিচে নিন"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Button */}
                      {!isCurrentlyEditing ? (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(q)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>এডিট করুন</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingQId(null)}
                          className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] cursor-pointer"
                        >
                          বাতিল
                        </button>
                      )}

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => onRemoveQuestion(q.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer"
                        title="প্রশ্নটি পরীক্ষা থেকে বাদ দিন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Mode A: Normal Preview Display */}
                  {!isCurrentlyEditing ? (
                    <div className="space-y-2.5">
                      {/* Arabic Text if any */}
                      {q.arabic_text && (
                        <p
                          className="font-arabic text-emerald-800 dark:text-emerald-300 text-sm font-semibold text-right leading-relaxed bg-emerald-50/50 dark:bg-emerald-950/30 p-2 rounded-xl"
                          dir="rtl"
                        >
                          {q.arabic_text}
                        </p>
                      )}

                      {/* Bengali Question Text */}
                      <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm leading-snug">
                        {q.question || q.question_text}
                      </p>

                      {/* 4 Options Grid with Correct Option Highlighted */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {["ক", "খ", "গ", "ঘ"].map((label, optIdx) => {
                          const optionText =
                            (q.options && q.options[optIdx]) ||
                            (optIdx === 0
                              ? q.option_a
                              : optIdx === 1
                              ? q.option_b
                              : optIdx === 2
                              ? q.option_c
                              : q.option_d) ||
                            "";

                          const isCorrect =
                            q.correct_index === optIdx ||
                            (optIdx === 0 &&
                              (q.correct_option === "option_a" ||
                                q.correct_option === "a" ||
                                q.correct_option === "A")) ||
                            (optIdx === 1 &&
                              (q.correct_option === "option_b" ||
                                q.correct_option === "b" ||
                                q.correct_option === "B")) ||
                            (optIdx === 2 &&
                              (q.correct_option === "option_c" ||
                                q.correct_option === "c" ||
                                q.correct_option === "C")) ||
                            (optIdx === 3 &&
                              (q.correct_option === "option_d" ||
                                q.correct_option === "d" ||
                                q.correct_option === "D"));

                          return (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 text-xs ${
                                isCorrect
                                  ? "bg-emerald-500/15 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs ring-1 ring-emerald-500/30"
                                  : "bg-slate-50/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                                    isCorrect
                                      ? "bg-emerald-600 text-white"
                                      : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                                  }`}
                                >
                                  {label}
                                </span>
                                <span className="truncate">{optionText}</span>
                              </div>

                              {isCorrect && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white font-black text-[10px] flex items-center gap-0.5 flex-shrink-0">
                                  <Check className="w-3 h-3" />
                                  <span>সঠিক উত্তর</span>
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation box if any */}
                      {q.explanation && (
                        <div className="p-2 rounded-xl bg-blue-50/70 dark:bg-slate-800 border border-blue-200/70 dark:border-slate-700 text-[11px] text-blue-900 dark:text-blue-300 flex items-start gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <p>
                            <strong>ব্যাখ্যা:</strong> {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Mode B: Live Inline Question Editor */
                    <div className="space-y-3 pt-1 animate-in fade-in">
                      <div>
                        <label className="font-bold text-slate-800 dark:text-white block mb-1 text-xs">
                          প্রশ্নের মূল বিষয় / টেক্সট *
                        </label>
                        <textarea
                          rows={2}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          placeholder="প্রশ্নের মূল বিবরণ লিখুন..."
                          className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                      </div>

                      {/* Arabic Text & Harakat */}
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
                          আরবি ইবারত / আয়াত / হাদিস (ঐচ্ছিক)
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          value={editArabic}
                          onChange={(e) => setEditArabic(e.target.value)}
                          placeholder="نَصَرَ زَيْدٌ عَمْرًا"
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-arabic text-sm text-right"
                        />
                        {/* Harakat quick bar */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {harakatList.map((h, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setEditArabic((prev) => prev + h.char)}
                              className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 text-slate-800 dark:text-slate-200 font-arabic text-xs font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                              title={h.name}
                            >
                              {h.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 4 Options Editor with Radio Select for Correct Answer */}
                      <div className="space-y-1.5">
                        <label className="font-bold text-slate-800 dark:text-white block text-xs">
                          ৪টি বিকল্প অপশন ও সঠিক উত্তর নির্বাচন করুন *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {["ক", "খ", "গ", "ঘ"].map((label, optIdx) => {
                            const isSelected = editCorrectIdx === optIdx;

                            return (
                              <div
                                key={optIdx}
                                className={`p-2 rounded-xl border transition-all flex items-center gap-2 ${
                                  isSelected
                                    ? "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500"
                                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => setEditCorrectIdx(optIdx)}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 cursor-pointer transition-all ${
                                    isSelected
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 hover:bg-emerald-200"
                                  }`}
                                  title="সঠিক উত্তর হিসেবে চিহ্নিত করতে ক্লিক করুন"
                                >
                                  {isSelected ? <Check className="w-3.5 h-3.5" /> : label}
                                </button>

                                <input
                                  type="text"
                                  value={editOptions[optIdx]}
                                  onChange={(e) => {
                                    const next = [...editOptions];
                                    next[optIdx] = e.target.value;
                                    setEditOptions(next);
                                  }}
                                  placeholder={`বিকল্প ${label} এর টেক্সট`}
                                  className="w-full px-2 py-1 rounded-lg border-0 bg-transparent text-slate-900 dark:text-white font-semibold text-xs outline-none"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Explanation & Topic */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-[11px]">
                            টপিক / অধ্যায়
                          </label>
                          <input
                            type="text"
                            value={editTopic}
                            onChange={(e) => setEditTopic(e.target.value)}
                            placeholder="যেমন: সন্ধি / কারক"
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-[11px]">
                            ডিফিকাল্টি লেভেল
                          </label>
                          <select
                            value={editDifficulty}
                            onChange={(e) =>
                              setEditDifficulty(e.target.value as QuestionDifficulty)
                            }
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold cursor-pointer"
                          >
                            <option value="Easy">সহজ (Easy)</option>
                            <option value="Medium">মাঝারি (Medium)</option>
                            <option value="Hard">কঠিন (Hard)</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-[11px]">
                            ব্যাখ্যা (Explanation)
                          </label>
                          <textarea
                            rows={2}
                            value={editExplanation}
                            onChange={(e) => setEditExplanation(e.target.value)}
                            placeholder="সঠিক উত্তরের যুক্তি ও বিস্তারিত ব্যাখ্যা..."
                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                          />
                        </div>
                      </div>

                      {/* Save / Cancel Inline Action */}
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => setEditingQId(null)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-200"
                        >
                          বাতিল
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveInlineEdit(q)}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>✓ সংশোধন সংরক্ষণ করুন</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Action Footer for Step 2 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={onBackToForm}
          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>⬅ পূর্ববর্তী ধাপে ফিরে যান (তথ্য পরিবর্তন)</span>
        </button>

        <button
          type="button"
          onClick={onPublish}
          disabled={isSaving || examQuestions.length === 0}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs cursor-pointer shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all transform active:scale-95"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>সংরক্ষণ ও প্রকাশ হচ্ছে...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isEditMode
                  ? "মডেল টেস্ট আপডেট ও প্রকাশ করুন"
                  : "🚀 মডেল টেস্ট প্রকাশ করুন (Publish)"}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
