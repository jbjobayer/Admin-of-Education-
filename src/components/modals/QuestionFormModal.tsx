import React, { useState, useEffect } from "react";
import { X, CheckCircle2, BookOpen, Sparkles, Layers, Languages } from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import { Question, QuestionDifficulty, ExamTargetCategory } from "../../types";

interface QuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionToEdit?: Question | null;
}

type LanguageMode = "bn" | "en" | "ar" | "mixed";
type OptionPrefixStyle = "bn" | "en" | "ar";

const ARABIC_HARAKAT = [
  { label: "َ (ফাতহা/জবর)", char: "َ" },
  { label: "ُ (দম্মা/পেশ)", char: "ُ" },
  { label: "ِ (কাসরা/জের)", char: "ِ" },
  { label: "ً (তানভীন ফাতহা)", char: "ً" },
  { label: "ٌ (তানভীন দম্মা)", char: "ٌ" },
  { label: "ٍ (তানভীন কাসরা)", char: "ٍ" },
  { label: "ّ (তাশদীদ)", char: "ّ" },
  { label: "ْ (সুকুন/জযম)", char: "ْ" },
  { label: "ـ (কাশীদা/টান)", char: "ـ" },
  { label: "ٰ (খাড়া জবর)", char: "ٰ" },
];

export const QuestionFormModal: React.FC<QuestionFormModalProps> = ({
  isOpen,
  onClose,
  questionToEdit,
}) => {
  const { subjects, exams, addQuestion, updateQuestion, showToast } = useAdminData();

  const [language, setLanguage] = useState<LanguageMode>("bn");
  const [optionStyle, setOptionStyle] = useState<OptionPrefixStyle>("bn");
  const [examId, setExamId] = useState<string>(exams[0]?.id || "");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || "sub-1");
  const [topic, setTopic] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [arabicText, setArabicText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctIndex, setCorrectIndex] = useState(0);
  const [explanation, setExplanation] = useState("");
  const [source, setSource] = useState("");
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>("Medium");
  const [examType, setExamType] = useState<ExamTargetCategory>("NTRCA");

  useEffect(() => {
    if (questionToEdit) {
      setLanguage((questionToEdit.language as LanguageMode) || "bn");
      setExamId(questionToEdit.exam_id || exams[0]?.id || "");
      setSubjectId(questionToEdit.subject_id);
      setTopic(questionToEdit.topic || "");
      setQuestionText(questionToEdit.question || questionToEdit.question_text || "");
      setArabicText(questionToEdit.arabic_text || "");
      setOptionA(questionToEdit.options?.[0] || questionToEdit.option_a || "");
      setOptionB(questionToEdit.options?.[1] || questionToEdit.option_b || "");
      setOptionC(questionToEdit.options?.[2] || questionToEdit.option_c || "");
      setOptionD(questionToEdit.options?.[3] || questionToEdit.option_d || "");
      setCorrectIndex(questionToEdit.correct_index !== undefined ? questionToEdit.correct_index : 0);
      setExplanation(questionToEdit.explanation || "");
      setSource(questionToEdit.source || "");
      setDifficulty(questionToEdit.difficulty || "Medium");
      setExamType(questionToEdit.exam_type || "NTRCA");
    } else {
      setLanguage("bn");
      setOptionStyle("bn");
      setExamId(exams[0]?.id || "");
      setSubjectId(subjects[0]?.id || "sub-1");
      setTopic("");
      setQuestionText("");
      setArabicText("");
      setOptionA("");
      setOptionB("");
      setOptionC("");
      setOptionD("");
      setCorrectIndex(0);
      setExplanation("");
      setSource("");
      setDifficulty("Medium");
      setExamType("NTRCA");
    }
  }, [questionToEdit, subjects, exams, isOpen]);

  if (!isOpen) return null;

  const currentSubject = subjects.find((s) => s.id === subjectId) || subjects[0];

  const handleInsertHarakat = (char: string) => {
    // Insert harakat to arabic text field
    setArabicText((prev) => prev + char);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !optionA.trim() || !optionB.trim()) {
      showToast("দয়া করে প্রশ্ন ও অন্তত দুটি বিকল্প পূরণ করুন", "error");
      return;
    }

    const optMap: Record<number, string> = { 0: "option_a", 1: "option_b", 2: "option_c", 3: "option_d" };

    const qData: any = {
      exam_id: examId || undefined,
      subject_id: subjectId,
      subject_name: currentSubject?.name_bn || "সাধারণ বিষয়",
      topic: topic.trim() || "সাধারণ",
      question: questionText.trim(),
      question_text: questionText.trim(),
      arabic_text: arabicText.trim() || undefined,
      option_a: optionA.trim(),
      option_b: optionB.trim(),
      option_c: optionC.trim() || "গ",
      option_d: optionD.trim() || "ঘ",
      options: [optionA.trim(), optionB.trim(), optionC.trim() || "গ", optionD.trim() || "ঘ"],
      correct_index: correctIndex,
      correct_option: optMap[correctIndex] || "option_a",
      explanation: explanation.trim(),
      source: source.trim() || (language === "ar" ? "المناهج المعتمدة" : language === "en" ? "Curriculum Reference" : "মাদ্রাসা পাঠ্যবই ও রেফারেন্স"),
      difficulty,
      exam_type: examType,
      language,
    };

    if (questionToEdit) {
      updateQuestion(questionToEdit.id, qData);
    } else {
      addQuestion(qData);
    }

    onClose();
  };

  const optLabels = optionStyle === "ar" ? ["أ", "ب", "ج", "د"] : optionStyle === "en" ? ["A", "B", "C", "D"] : ["ক", "খ", "গ", "ঘ"];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              {questionToEdit ? "প্রশ্ন সম্পাদনা করুন (Edit Question)" : "নতুন প্রশ্ন তৈরি (Create Question)"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              বাংলা, ইংরেজি ও আরবি অপশন এবং হরকতসহ নির্ভুল MCQ যুক্ত করুন
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language & Option Style Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Languages className="w-4 h-4 text-emerald-600" />
            <span>ভাষা ও অপশন শৈলী:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Language Selection */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setLanguage("bn");
                  setOptionStyle("bn");
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  language === "bn"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => {
                  setLanguage("en");
                  setOptionStyle("en");
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  language === "en"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => {
                  setLanguage("ar");
                  setOptionStyle("ar");
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer font-arabic ${
                  language === "ar"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                العربية
              </button>
            </div>

            {/* Option Style */}
            <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
              <span className="text-[10px] text-slate-500 font-semibold">অপশন:</span>
              <button
                type="button"
                onClick={() => setOptionStyle("bn")}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all ${
                  optionStyle === "bn" ? "bg-amber-100 dark:bg-amber-950 border-amber-500 text-amber-900" : "bg-white dark:bg-slate-700 border-slate-200 text-slate-600"
                }`}
              >
                ক-ঘ
              </button>
              <button
                type="button"
                onClick={() => setOptionStyle("en")}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all ${
                  optionStyle === "en" ? "bg-amber-100 dark:bg-amber-950 border-amber-500 text-amber-900" : "bg-white dark:bg-slate-700 border-slate-200 text-slate-600"
                }`}
              >
                A-D
              </button>
              <button
                type="button"
                onClick={() => setOptionStyle("ar")}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all font-arabic ${
                  optionStyle === "ar" ? "bg-amber-100 dark:bg-amber-950 border-amber-500 text-amber-900" : "bg-white dark:bg-slate-700 border-slate-200 text-slate-600"
                }`}
              >
                أ-د
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                বিষয় *
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name_bn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                মডেল টেস্ট / পরীক্ষা নির্বাচন
              </label>
              <select
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="">সেন্ট্রাল প্রশ্ন ব্যাংক (সাধারণ)</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                অধ্যায় / টপিক
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="যেমন: নহুমীর / Tense / ফিকহ"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              মূল প্রশ্ন ({language === "ar" ? "العربية" : language === "en" ? "English" : "বাংলা"}) *
            </label>
            <textarea
              rows={2}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="প্রশ্নটি এখানে টাইপ করুন..."
              className={`w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium leading-relaxed ${
                language === "ar" ? "font-arabic text-right text-sm" : ""
              }`}
              dir={language === "ar" ? "rtl" : "ltr"}
              required
            />
          </div>

          {/* Arabic Text (Optional) with live Harakat Toolbar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                আরবি মূল ইবারত বা আয়াত/হাদিস (হরকত সহ - ঐচ্ছিক)
              </label>
              <span className="text-[10px] text-emerald-600 font-semibold font-mono">
                UTF-8 Arabic Supported
              </span>
            </div>

            {/* Quick Harakat Toolbar */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-500 px-1">হরকত টুলবার:</span>
              {ARABIC_HARAKAT.map((h, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleInsertHarakat(h.char)}
                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-950 font-arabic text-base font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-center border border-slate-200 dark:border-slate-600 transition-colors shadow-xs"
                  title={h.label}
                >
                  {h.char}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={arabicText}
              onChange={(e) => setArabicText(e.target.value)}
              placeholder="مثال: إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-arabic text-base"
              dir="rtl"
            />
            {arabicText && (
              <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-right font-arabic text-lg text-emerald-900 dark:text-emerald-200 leading-loose">
                {arabicText}
              </div>
            )}
          </div>

          {/* 4 Options Grid */}
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              ৪টি বিকল্প ও সঠিক উত্তর নির্ধারণ করুন * (ক্লিক করে সঠিক উত্তর মার্ক করুন)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { label: optLabels[0], val: optionA, set: setOptionA, idx: 0 },
                { label: optLabels[1], val: optionB, set: setOptionB, idx: 1 },
                { label: optLabels[2], val: optionC, set: setOptionC, idx: 2 },
                { label: optLabels[3], val: optionD, set: setOptionD, idx: 3 },
              ].map((opt) => (
                <div
                  key={opt.idx}
                  className={`p-2.5 rounded-2xl border flex items-center gap-2 transition-all ${
                    correctIndex === opt.idx
                      ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 shadow-sm"
                      : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setCorrectIndex(opt.idx)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 cursor-pointer ${
                      correctIndex === opt.idx
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                    title="সঠিক উত্তর হিসেবে চিহ্নিত করুন"
                  >
                    {opt.label}
                  </button>

                  <input
                    type="text"
                    value={opt.val}
                    onChange={(e) => opt.set(e.target.value)}
                    placeholder={`অপশন ${opt.label}`}
                    className={`w-full bg-transparent border-none focus:outline-none text-slate-900 dark:text-white font-medium text-xs ${
                      language === "ar" ? "font-arabic text-right" : ""
                    }`}
                    dir={language === "ar" ? "rtl" : "ltr"}
                    required={opt.idx < 2}
                  />

                  {correctIndex === opt.idx && (
                    <span className="text-[10px] text-emerald-600 font-bold flex-shrink-0">
                      সঠিক
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                ডিফিকাল্টি
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="Easy">সহজ (Easy)</option>
                <option value="Medium">মাঝারি (Medium)</option>
                <option value="Hard">কঠিন (Hard)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                টার্গেট পরীক্ষা
              </label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as ExamTargetCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="NTRCA">NTRCA শিক্ষক নিবন্ধন</option>
                <option value="Dakhil">দাখিল (Dakhil)</option>
                <option value="Alim">আলিম (Alim)</option>
                <option value="Fazil">ফাজিল (Fazil)</option>
                <option value="Kamil">কামিল (Kamil)</option>
                <option value="Madrasah Directorate">মাদ্রাসা শিক্ষা অধিদপ্তর</option>
                <option value="BCS">বিসিএস ও অন্যান্য</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              ব্যাখ্যা ও প্রামাণিক রেফারেন্স (Explanation)
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="উত্তরের সঠিক কারণ ও বইয়ের রেফারেন্স লিখুন..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
            >
              {questionToEdit ? "আপডেট করুন" : "সংরক্ষণ করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
