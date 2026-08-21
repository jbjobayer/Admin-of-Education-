import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  BookOpen,
  Sparkles,
  Layers,
  Languages,
  Plus,
  Trash2,
  Edit3,
  FolderPlus,
  HelpCircle,
  Tag,
  RotateCcw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import { Question, QuestionDifficulty, ExamTargetCategory } from "../../types";
import { isValidUuid } from "../../lib/supabaseService";

interface QuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionToEdit?: Question | null;
  initialExamId?: string;
}

type LanguageMode = "bn" | "en" | "ar" | "mixed";
type OptionPrefixStyle = "bn" | "en" | "ar" | "num";

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
  initialExamId,
}) => {
  const { subjects, exams, addQuestion, updateQuestion, addSubject, showToast } = useAdminData();

  // Language & Option styling
  const [language, setLanguage] = useState<LanguageMode>("bn");
  const [optionStyle, setOptionStyle] = useState<OptionPrefixStyle>("bn");

  // Exam / Model test linking (Mandatory)
  const [examId, setExamId] = useState<string>("");

  // Subject state (Dropdown vs Manual custom subject)
  const [isCustomSubject, setIsCustomSubject] = useState<boolean>(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || "sub-1");
  const [customSubjectNameBn, setCustomSubjectNameBn] = useState<string>("");
  const [customSubjectNameAr, setCustomSubjectNameAr] = useState<string>("");
  const [saveCustomSubjectPermanently, setSaveCustomSubjectPermanently] = useState<boolean>(true);

  // Topic state (Manual input with quick suggestions)
  const [topic, setTopic] = useState<string>("");

  // Question & Arabic content
  const [questionText, setQuestionText] = useState<string>("");
  const [arabicText, setArabicText] = useState<string>("");

  // Options state (Dynamic list of options)
  const [optionsList, setOptionsList] = useState<string[]>(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState<number>(0);

  // Metadata
  const [explanation, setExplanation] = useState<string>("");
  const [source, setSource] = useState<string>("");
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>("Medium");
  const [examType, setExamType] = useState<ExamTargetCategory>("NTRCA");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialize or reset form
  useEffect(() => {
    setSaveError(null);
    setIsSaving(false);
    if (questionToEdit) {
      setLanguage((questionToEdit.language as LanguageMode) || "bn");
      setExamId(questionToEdit.free_exam_id || questionToEdit.exam_id || initialExamId || (exams[0]?.id || ""));

      // Check if subject exists in subjects list
      const existingSub = subjects.find((s) => s.id === questionToEdit.subject_id);
      if (existingSub) {
        setIsCustomSubject(false);
        setSelectedSubjectId(existingSub.id);
        setCustomSubjectNameBn("");
        setCustomSubjectNameAr("");
      } else {
        setIsCustomSubject(true);
        setCustomSubjectNameBn(questionToEdit.subject_name || "");
        setCustomSubjectNameAr("");
      }

      setTopic(questionToEdit.topic || "");
      setQuestionText(questionToEdit.question || questionToEdit.question_text || "");
      setArabicText(questionToEdit.arabic_text || "");

      const loadedOptions = questionToEdit.options && questionToEdit.options.length >= 2
        ? [...questionToEdit.options]
        : [
            questionToEdit.option_a || "",
            questionToEdit.option_b || "",
            questionToEdit.option_c || "",
            questionToEdit.option_d || "",
          ];
      setOptionsList(loadedOptions.length >= 2 ? loadedOptions : ["", "", "", ""]);
      setCorrectIndex(questionToEdit.correct_index !== undefined ? questionToEdit.correct_index : 0);
      setExplanation(questionToEdit.explanation || "");
      setSource(questionToEdit.source || "");
      setDifficulty(questionToEdit.difficulty || "Medium");
      setExamType(questionToEdit.exam_type || "NTRCA");
    } else {
      setLanguage("bn");
      setOptionStyle("bn");
      setIsCustomSubject(false);
      setSelectedSubjectId(subjects[0]?.id || "sub-1");
      setCustomSubjectNameBn("");
      setCustomSubjectNameAr("");
      setSaveCustomSubjectPermanently(true);
      setTopic("");
      setExamId(initialExamId || (exams[0]?.id || ""));
      setQuestionText("");
      setArabicText("");
      setOptionsList(["", "", "", ""]);
      setCorrectIndex(0);
      setExplanation("");
      setSource("");
      setDifficulty("Medium");
      setExamType("NTRCA");
    }
  }, [questionToEdit, initialExamId, subjects, exams, isOpen]);

  if (!isOpen) return null;

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  // Helper for option labels
  const getOptionLabel = (idx: number) => {
    if (optionStyle === "ar") {
      const arLabels = ["أ", "ب", "ج", "د", "هـ", "و"];
      return arLabels[idx] || `خيار ${idx + 1}`;
    }
    if (optionStyle === "en") {
      const enLabels = ["A", "B", "C", "D", "E", "F"];
      return enLabels[idx] || `Option ${idx + 1}`;
    }
    if (optionStyle === "num") {
      const numLabels = ["১", "২", "৩", "৪", "৫", "৬"];
      return numLabels[idx] || `${idx + 1}`;
    }
    const bnLabels = ["ক", "খ", "গ", "ঘ", "ঙ", "চ"];
    return bnLabels[idx] || `বিকল্প ${idx + 1}`;
  };

  // Harakat insert helper
  const handleInsertHarakat = (char: string) => {
    setArabicText((prev) => prev + char);
  };

  // Option list updates
  const handleUpdateOption = (index: number, val: string) => {
    const updated = [...optionsList];
    updated[index] = val;
    setOptionsList(updated);
  };

  const handleAddOption = () => {
    if (optionsList.length >= 6) {
      showToast("সর্বোচ্চ ৬টি অপশন যুক্ত করা যায়", "info");
      return;
    }
    setOptionsList([...optionsList, ""]);
  };

  const handleRemoveOption = (index: number) => {
    if (optionsList.length <= 2) {
      showToast("কমপক্ষে ২টি বিকল্প থাকা বাধ্যতামূলক", "error");
      return;
    }
    const updated = optionsList.filter((_, i) => i !== index);
    setOptionsList(updated);
    if (correctIndex >= updated.length) {
      setCorrectIndex(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    // 1. Validate exam selection
    if (!examId || !isValidUuid(examId)) {
      showToast("অনুগ্রহ করে একটি পরীক্ষা নির্বাচন করুন।", "error");
      return;
    }

    const targetExam = exams.find((e) => e.id === examId);
    const isTargetFreeExam = Boolean(
      targetExam?.is_free ||
      targetExam?.exam_scope === "free" ||
      !targetExam?.course_id
    );

    // 2. Validate question text
    if (!questionText.trim()) {
      showToast("দয়া করে মূল প্রশ্নটি লিখুন", "error");
      return;
    }

    // 3. Validate options (All 4 options required)
    const validOptions = optionsList.map((o) => o.trim());
    if (!validOptions[0] || !validOptions[1] || !validOptions[2] || !validOptions[3]) {
      showToast("দয়া করে ৪টি বিকল্প (ক, খ, গ, ঘ) অবশ্যই পূরণ করুন", "error");
      return;
    }

    setIsSaving(true);

    try {
      // Determine Subject ID & Subject Name
      let finalSubjectId = selectedSubjectId;
      let finalSubjectName = currentSubject?.name_bn || "সাধারণ বিষয়";

      if (isCustomSubject) {
        const customName = customSubjectNameBn.trim();
        if (!customName) {
          showToast("দয়া করে বিষয়ের নাম ম্যানুয়ালি লিখুন অথবা তালিকা থেকে বিষয় বাছাই করুন", "error");
          setIsSaving(false);
          return;
        }
        finalSubjectName = customName;

        // If user opted to save to Subject Hub permanently
        if (saveCustomSubjectPermanently) {
          const createdSub = addSubject({
            name_bn: customName,
            name_ar: customSubjectNameAr.trim() || customName,
            icon: "BookOpen",
            question_count: 1,
            is_premium_only: false,
            is_active: true,
            topics: topic.trim() ? [topic.trim()] : ["সাধারণ"],
            color_accent: "emerald",
            order: subjects.length + 1,
          });
          finalSubjectId = createdSub.id;
        } else {
          finalSubjectId = `sub-custom-${Date.now()}`;
        }
      }

      const optMap: Record<number, string> = {
        0: "option_a",
        1: "option_b",
        2: "option_c",
        3: "option_d",
      };

      // Strict payload mapping based on exam type:
      // Course Exam: exam_id = examId, free_exam_id = null
      // Free Exam / Model Test: exam_id = null, free_exam_id = examId
      const qData: any = {
        exam_id: isTargetFreeExam ? null : examId,
        free_exam_id: isTargetFreeExam ? examId : null,
        subject_id: finalSubjectId,
        subject_name: finalSubjectName,
        topic: topic.trim() || "সাধারণ",
        question: questionText.trim(),
        question_text: questionText.trim(),
        arabic_text: arabicText.trim() || undefined,
        option_a: validOptions[0],
        option_b: validOptions[1],
        option_c: validOptions[2],
        option_d: validOptions[3],
        options: validOptions,
        correct_index: correctIndex < validOptions.length ? correctIndex : 0,
        correct_option: optMap[correctIndex] || "option_a",
        explanation: explanation.trim(),
        source:
          source.trim() ||
          (language === "ar"
            ? "المناهج المعتمدة"
            : language === "en"
            ? "Curriculum Reference"
            : "মাদ্রাসা পাঠ্যবই ও রেফারেন্স"),
        difficulty,
        exam_type: examType,
        language,
        marks: 1,
        negative_marks: 0.25,
      };

      if (questionToEdit) {
        const res = await updateQuestion(questionToEdit.id, qData);
        if (!res.success) {
          setSaveError(`আপডেট ব্যর্থ হয়েছে: ${res.error || "অজানা ত্রুটি"}`);
          setIsSaving(false);
          return;
        }
      } else {
        const res = await addQuestion(qData);
        if (!res.success) {
          setSaveError(`সংরক্ষণ ব্যর্থ হয়েছে: ${res.error || "অজানা ত্রুটি"}`);
          setIsSaving(false);
          return;
        }
      }

      setIsSaving(false);
      onClose();
    } catch (err: any) {
      console.error("Save question error:", err);
      setSaveError(err?.message || "প্রশ্ন সংরক্ষণে ত্রুটি ঘটেছে।");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in my-auto max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>{questionToEdit ? "প্রশ্ন সম্পাদনা করুন (Edit Question)" : "নতুন প্রশ্ন তৈরি ও ম্যানুয়াল এন্ট্রি (Create MCQ)"}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ম্যানুয়ালি বিষয়, টপিক, বাংলা/ইংরেজি/আরবি হরকত ও সব বিকল্প কাস্টমাইজ করুন
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {saveError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Supabase সংরক্ষণ ব্যর্থ হয়েছে:</span>
              <p className="mt-0.5">{saveError}</p>
            </div>
          </div>
        )}

        {/* Language & Option Style Selector Bar */}
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
                🇧🇩 বাংলা
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
                🇬🇧 English
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
                🇸🇦 العربية
              </button>
            </div>

            {/* Option Style Selector */}
            <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
              <span className="text-[10px] text-slate-500 font-semibold">অপশন:</span>
              <button
                type="button"
                onClick={() => setOptionStyle("bn")}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all cursor-pointer ${
                  optionStyle === "bn"
                    ? "bg-amber-100 dark:bg-amber-950 border-amber-500 text-amber-900 dark:text-amber-200"
                    : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                }`}
              >
                ক-ঘ
              </button>
              <button
                type="button"
                onClick={() => setOptionStyle("en")}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all cursor-pointer ${
                  optionStyle === "en"
                    ? "bg-amber-100 dark:bg-amber-950 border-amber-500 text-amber-900 dark:text-amber-200"
                    : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                }`}
              >
                A-D
              </button>
              <button
                type="button"
                onClick={() => setOptionStyle("ar")}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all cursor-pointer font-arabic ${
                  optionStyle === "ar"
                    ? "bg-amber-100 dark:bg-amber-950 border-amber-500 text-amber-900 dark:text-amber-200"
                    : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                }`}
              >
                أ-د
              </button>
              <button
                type="button"
                onClick={() => setOptionStyle("num")}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all cursor-pointer ${
                  optionStyle === "num"
                    ? "bg-amber-100 dark:bg-amber-950 border-amber-500 text-amber-900 dark:text-amber-200"
                    : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                }`}
              >
                ১-৪
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* SECTION 0: MANDATORY EXAM SELECTION (Target Exam UUID for Supabase questions.exam_id or questions.free_exam_id) */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5 text-xs">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>টার্গেট পরীক্ষা বা মডেল টেস্ট নির্বাচন করুন * (course_exams বা free_exams)</span>
              </label>
              {examId && (
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold truncate max-w-[220px]">
                  UUID: {examId}
                </span>
              )}
            </div>
            <select
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">-- পরীক্ষা বা মডেল টেস্ট নির্বাচন করুন (বাধ্যতামূলক) --</option>
              <optgroup label="🎓 কোর্স পরীক্ষা (course_exams -> questions.exam_id)">
                {exams.filter((ex) => ex.course_id && !ex.is_free).map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    🎓 {ex.title} (ID: {ex.id.substring(0, 8)}...)
                  </option>
                ))}
              </optgroup>
              <optgroup label="🎁 ফ্রি পরীক্ষা ও মডেল টেস্ট (free_exams -> questions.free_exam_id)">
                {exams.filter((ex) => !ex.course_id || ex.is_free).map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    🎁 {ex.title} (ID: {ex.id.substring(0, 8)}...)
                  </option>
                ))}
              </optgroup>
            </select>
            {exams.length === 0 ? (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                ⚠️ কোনো পরীক্ষা পাওয়া যায়নি। প্রথমে 'মডেল টেস্ট' বা 'কোর্স' ট্যাব থেকে একটি পরীক্ষা তৈরি করুন।
              </p>
            ) : !examId ? (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                ⚠️ প্রশ্ন সুপাবেজ ডাটাবেজে সংরক্ষণ করতে অবশ্যই একটি পরীক্ষা নির্বাচন করুন।
              </p>
            ) : null}
          </div>

          {/* SECTION 1: Subject (বিষয়) & Topic (টপিক) - Manual & Dropdown options */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-slate-800/40 border border-emerald-200/60 dark:border-slate-700 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 dark:border-slate-700/60 pb-2">
              <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>বিষয় ও অধ্যায়/টপিক কনফিগারেশন (Subject & Topic)</span>
              </span>

              {/* Subject Mode Switcher Button */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setIsCustomSubject(false)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    !isCustomSubject
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-emerald-600"
                  }`}
                >
                  বিদ্যমান বিষয় নির্বাচন
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomSubject(true)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    isCustomSubject
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-amber-600"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ম্যানুয়ালি নতুন বিষয়</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Subject Field */}
              <div className="sm:col-span-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  বিষয় (Subject) *
                </label>
                {!isCustomSubject ? (
                  <div className="space-y-1">
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => {
                        setSelectedSubjectId(e.target.value);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name_bn} {s.name_ar ? `(${s.name_ar})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1.5 animate-in fade-in">
                    <input
                      type="text"
                      value={customSubjectNameBn}
                      onChange={(e) => setCustomSubjectNameBn(e.target.value)}
                      placeholder="কাস্টম বিষয় (যেমন: আল-কুরআন)"
                      className="w-full px-3 py-2 rounded-xl border border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                      required={isCustomSubject}
                    />
                    <input
                      type="text"
                      value={customSubjectNameAr}
                      onChange={(e) => setCustomSubjectNameAr(e.target.value)}
                      placeholder="আরবি/ইংরেজি নাম (ঐচ্ছিক)"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]"
                    />
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400 cursor-pointer pt-0.5">
                      <input
                        type="checkbox"
                        checked={saveCustomSubjectPermanently}
                        onChange={(e) => setSaveCustomSubjectPermanently(e.target.checked)}
                        className="w-3.5 h-3.5 accent-amber-600 rounded cursor-pointer"
                      />
                      <span>বিষয় তালিকায় স্থায়ীভাবে যুক্ত করুন</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Topic Field with Manual Input & Suggestions */}
              <div className="sm:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    অধ্যায় / টপিক (Topic) * (ম্যানুয়ালি লিখুন বা ক্লিকে নির্বাচন করুন)
                  </label>
                  {topic && (
                    <button
                      type="button"
                      onClick={() => setTopic("")}
                      className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                    >
                      ক্লিয়ার
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="যেকোনো টপিক ম্যানুয়ালি লিখুন (যেমন: নহুমীর / সুরা আল-ফাতিহা / Tense & Voice / কারক)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />

                {/* Subject Topic Suggestion Chips (if available) */}
                {!isCustomSubject && currentSubject?.topics && currentSubject.topics.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                      <Tag className="w-3 h-3 text-emerald-600" />
                      <span>প্রস্তাবিত টপিক:</span>
                    </span>
                    {currentSubject.topics.slice(0, 6).map((tName, tIdx) => (
                      <button
                        key={tIdx}
                        type="button"
                        onClick={() => setTopic(tName)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all cursor-pointer ${
                          topic === tName
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-600"
                        }`}
                      >
                        {tName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: Question Text & Harakat */}
          <div className="space-y-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                মূল প্রশ্ন ({language === "ar" ? "العربية" : language === "en" ? "English" : "বাংলা"}) *
              </label>
              <textarea
                rows={2}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="প্রশ্নটি এখানে সম্পূর্ণ ম্যানুয়ালি টাইপ করুন..."
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
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>আরবি মূল ইবারত বা আয়াত/হাদিস (হরকত সহ - ঐচ্ছিক)</span>
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
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-950 font-arabic text-base font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-center border border-slate-200 dark:border-slate-600 transition-colors shadow-2xs cursor-pointer"
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
                placeholder="مثال: إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-arabic text-base"
                dir="rtl"
              />
              {arabicText && (
                <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-right font-arabic text-lg text-emerald-900 dark:text-emerald-200 leading-loose">
                  {arabicText}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: Options (সব অপশনেই ম্যানুয়ালি ইনপুট করার সুবিধা) */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="font-bold text-slate-800 dark:text-white block">
                বিকল্পসমূহ (সব অপশন ম্যানুয়ালি লিখুন এবং সঠিক উত্তরে ক্লিক করুন) *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddOption}
                  disabled={optionsList.length >= 6}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>অতিরিক্ত বিকল্প যোগ (+১)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {optionsList.map((optVal, optIdx) => {
                const label = getOptionLabel(optIdx);
                const isCorrect = correctIndex === optIdx;

                return (
                  <div
                    key={optIdx}
                    className={`p-2.5 rounded-2xl border flex items-center gap-2 transition-all ${
                      isCorrect
                        ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 shadow-sm"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {/* Correct answer toggle button */}
                    <button
                      type="button"
                      onClick={() => setCorrectIndex(optIdx)}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 cursor-pointer transition-colors ${
                        isCorrect
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-emerald-100 hover:text-emerald-700"
                      }`}
                      title="ক্লিক করে এটিকে সঠিক উত্তর হিসেবে মার্ক করুন"
                    >
                      {label}
                    </button>

                    {/* Manual option text input */}
                    <input
                      type="text"
                      value={optVal}
                      onChange={(e) => handleUpdateOption(optIdx, e.target.value)}
                      placeholder={`অপশন ${label} লিখুন...`}
                      className={`w-full bg-transparent border-none focus:outline-none text-slate-900 dark:text-white font-medium text-xs ${
                        language === "ar" ? "font-arabic text-right text-sm" : ""
                      }`}
                      dir={language === "ar" ? "rtl" : "ltr"}
                      required={optIdx < 2}
                    />

                    {isCorrect && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>সঠিক</span>
                      </span>
                    )}

                    {optionsList.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(optIdx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 cursor-pointer flex-shrink-0"
                        title="এই বিকল্পটি বাদ দিন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: Difficulty & Exam Target */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                ডিফিকাল্টি লেভেল
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer"
              >
                <option value="Easy">সহজ (Easy)</option>
                <option value="Medium">মাঝারি (Medium)</option>
                <option value="Hard">উচ্চমান / কঠিন (Hard)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                টার্গেট পরীক্ষা
              </label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as ExamTargetCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer"
              >
                <option value="NTRCA">১৮/১৯তম NTRCA শিক্ষক নিবন্ধন</option>
                <option value="Dakhil">দাখিল পরীক্ষা (Dakhil)</option>
                <option value="Alim">আলিম পরীক্ষা (Alim)</option>
                <option value="Fazil">ফাজিল পরীক্ষা (Fazil)</option>
                <option value="Kamil">কামিল পরীক্ষা (Kamil)</option>
                <option value="Madrasah Directorate">মাদ্রাসা শিক্ষা অধিদপ্তর</option>
                <option value="BCS">বিসিএস ও অন্যান্য</option>
              </select>
            </div>
          </div>

          {/* SECTION 5: Explanation & Source */}
          <div className="space-y-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                ব্যাখ্যা ও বিশ্লেষণ (Explanation - ম্যানুয়ালি লিখুন)
              </label>
              <textarea
                rows={2}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="উত্তরের সঠিক কারণ ও নিয়মের ব্যাখ্যা লিখুন..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                উৎস বা রেফারেন্স বই (Source - ম্যানুয়ালি লিখুন)
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="যেমন: আল-হেদায়া / মিযানুস সরফ / NTRCA গাইড"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Supabase-এ সেভ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{questionToEdit ? "আপডেট করুন" : "প্রশ্ন ব্যাংকে সংরক্ষণ করুন"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
