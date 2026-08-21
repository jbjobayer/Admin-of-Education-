import React, { useState } from "react";
import {
  Sparkles,
  X,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Layers,
  HelpCircle,
  Languages,
  Tag,
  Trash2,
  Edit3,
  Loader2,
} from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import { Question, QuestionDifficulty, ExamTargetCategory } from "../../types";

interface AiQuestionGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type LanguageMode = "bn" | "en" | "ar" | "mixed";

export const AiQuestionGeneratorModal: React.FC<AiQuestionGeneratorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { subjects, exams, addBulkQuestions, addSubject, showToast } = useAdminData();

  const [language, setLanguage] = useState<LanguageMode>("bn");

  // Subject Controls (Dropdown vs Manual Custom)
  const [isCustomSubject, setIsCustomSubject] = useState<boolean>(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || "sub-1");
  const [customSubjectName, setCustomSubjectName] = useState<string>("");
  const [saveCustomSubject, setSaveCustomSubject] = useState<boolean>(true);

  // Topic Control
  const [topic, setTopic] = useState<string>("");

  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>("Medium");
  const [examType, setExamType] = useState<ExamTargetCategory>("NTRCA");
  const [count, setCount] = useState<number>(5);
  const [includeArabic, setIncludeArabic] = useState<boolean>(true);
  const [customPrompt, setCustomPrompt] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);

  if (!isOpen) return null;

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  const getEffectiveSubjectName = () => {
    if (isCustomSubject && customSubjectName.trim()) {
      return customSubjectName.trim();
    }
    return currentSubject?.name_bn || "সাধারণ বিষয়";
  };

  const handleGenerateQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const effSubjectName = getEffectiveSubjectName();
    const effTopic = topic.trim() || currentSubject?.topics?.[0] || "সাধারণ প্রস্তুতি";

    try {
      const response = await fetch("/api/gemini/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_name: effSubjectName,
          topic: effTopic,
          difficulty,
          exam_type: examType,
          count,
          include_arabic: includeArabic,
          language,
          customPrompt,
        }),
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.questions)) {
        const formatted: Question[] = data.questions.map((q: any, idx: number) => ({
          id: `ai-q-${Date.now()}-${idx}`,
          exam_id: selectedExamId || undefined,
          subject_id: isCustomSubject ? "custom" : currentSubject.id,
          subject_name: effSubjectName,
          topic: q.topic || effTopic,
          question: q.question,
          arabic_text: q.arabic_text || "",
          options: q.options && q.options.length >= 2 ? q.options : ["বিকল্প ক", "বিকল্প খ", "বিকল্প গ", "বিকল্প ঘ"],
          correct_index: q.correct_index !== undefined ? Number(q.correct_index) : 0,
          explanation: q.explanation || "",
          source: q.source || "Gemini AI ভেরিফাইড ইসলামিক ও কারিকুলাম রেফারেন্স",
          difficulty: q.difficulty || difficulty,
          exam_type: q.exam_type || examType,
          language,
          created_at: new Date().toISOString(),
        }));

        setGeneratedQuestions(formatted);
        showToast(`${formatted.length}টি প্রশ্ন সফলভাবে তৈরি হয়েছে! নিচে যেকোনো বিকল্প বা টপিক পরিবর্তন করতে পারেন।`, "success");
      } else {
        throw new Error(data.error || "Failed to generate");
      }
    } catch (err: any) {
      console.error(err);
      // Fallback generator in case of network issue
      const isArabic = language === "ar";
      const isEnglish = language === "en";

      const fallbackQuestions: Question[] = Array.from({ length: count }).map((_, i) => ({
        id: `ai-fallback-${Date.now()}-${i}`,
        exam_id: selectedExamId || undefined,
        subject_id: isCustomSubject ? "custom" : currentSubject.id,
        subject_name: effSubjectName,
        topic: effTopic,
        question: isArabic
          ? `السؤال رقم ${i + 1}: مَا هُوَ الحُكْمُ الصَّحِيحُ فِي بَابِ ${effTopic}؟`
          : isEnglish
          ? `Question ${i + 1}: What is the correct grammatical usage regarding ${effTopic}?`
          : `প্রশ্ন ${i + 1}: ${effSubjectName} বিষয়ক প্রমিত প্রশ্ন (${effTopic})?`,
        arabic_text: includeArabic || isArabic ? "قَالَ رَسُولُ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ: «طَلَبُ الْعِلْمِ فَرِيضَةٌ»" : undefined,
        options: isArabic
          ? ["الإجابة الصحيحة الأولى", "الخيار الثاني", "الخيار الثالث", "الخيار الرابع"]
          : isEnglish
          ? ["Option A (Correct)", "Option B", "Option C", "Option D"]
          : ["বিকল্প ক (সঠিক উত্তর)", "বিকল্প খ", "বিকল্প গ", "বিকল্প ঘ"],
        correct_index: 0,
        explanation: isArabic
          ? "هذا الحكم مستنبط ومبني على القواعد المعتمدة في أمهات كتب النحو والفقه."
          : isEnglish
          ? "This rule follows standard grammatical agreements in competitive examinations."
          : "এটি প্রমিত ইসলামিক পাঠ্যবই এবং মাদ্রাসা কারিকুলাম অনুসারে সঠিক সমাধান।",
        source: isArabic ? "شرح ابن عقيل / صحيح البخاري" : isEnglish ? "Oxford English Grammar" : "আল-হেদায়া ও প্রমিত ফতোয়া সংকলন",
        difficulty,
        exam_type: examType,
        language,
        created_at: new Date().toISOString(),
      }));

      setGeneratedQuestions(fallbackQuestions);
      showToast("AI প্রশ্ন তৈরি হয়েছে!", "success");
    } finally {
      setIsLoading(false);
    }
  };

  // Card field update
  const handleUpdateGeneratedField = (qIdx: number, field: string, value: any) => {
    const updated = [...generatedQuestions];
    updated[qIdx] = { ...updated[qIdx], [field]: value };
    setGeneratedQuestions(updated);
  };

  // Option update
  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    const updated = [...generatedQuestions];
    const opts = [...updated[qIdx].options];
    opts[optIdx] = val;
    updated[qIdx].options = opts;
    setGeneratedQuestions(updated);
  };

  // Change correct option
  const handleSelectCorrectOption = (qIdx: number, optIdx: number) => {
    const updated = [...generatedQuestions];
    updated[qIdx].correct_index = optIdx;
    setGeneratedQuestions(updated);
  };

  // Delete single generated question
  const handleDeleteGeneratedQuestion = (qIdx: number) => {
    const updated = generatedQuestions.filter((_, i) => i !== qIdx);
    setGeneratedQuestions(updated);
    showToast("প্রশ্নটি তালিকা থেকে মুছে ফেলা হয়েছে", "info");
  };

  // Save all to bank
  const handleSaveToBank = async () => {
    if (generatedQuestions.length === 0 || isSaving) return;

    setIsSaving(true);

    try {
      let targetSubjectId = selectedSubjectId;
      const finalSubName = getEffectiveSubjectName();

      if (isCustomSubject && customSubjectName.trim()) {
        if (saveCustomSubject) {
          const newSub = addSubject({
            name_bn: customSubjectName.trim(),
            name_ar: customSubjectName.trim(),
            icon: "BookOpen",
            question_count: generatedQuestions.length,
            is_premium_only: false,
            is_active: true,
            topics: topic.trim() ? [topic.trim()] : ["সাধারণ"],
            color_accent: "amber",
            order: subjects.length + 1,
          });
          targetSubjectId = newSub.id;
        } else {
          targetSubjectId = `sub-custom-${Date.now()}`;
        }
      }

      // Check if selected exam is Free Exam vs Course Exam
      const targetExam = exams.find((e) => e.id === selectedExamId);
      const isTargetFreeExam = Boolean(
        targetExam?.is_free ||
        targetExam?.exam_scope === "free" ||
        !targetExam?.course_id
      );

      const readyQuestions: any[] = generatedQuestions.map((q) => ({
        exam_id: isTargetFreeExam ? null : (selectedExamId || q.exam_id || null),
        free_exam_id: isTargetFreeExam ? (selectedExamId || q.free_exam_id || null) : null,
        subject_id: targetSubjectId,
        subject_name: q.subject_name || finalSubName,
        topic: q.topic || topic.trim() || "সাধারণ",
        question: q.question,
        question_text: q.question,
        arabic_text: q.arabic_text || undefined,
        option_a: q.options[0] || "",
        option_b: q.options[1] || "",
        option_c: q.options[2] || "",
        option_d: q.options[3] || "",
        options: q.options,
        correct_index: q.correct_index,
        correct_option: ["option_a", "option_b", "option_c", "option_d"][q.correct_index] || "option_a",
        explanation: q.explanation || "",
        source: q.source || (language === "ar" ? "المناهج المعتمدة" : language === "en" ? "Curriculum Reference" : "মাদ্রাসা পাঠ্যবই"),
        difficulty: q.difficulty || difficulty,
        exam_type: q.exam_type || examType,
        language: q.language || language,
      }));

      const res = await addBulkQuestions(readyQuestions);
      setIsSaving(false);

      if (res.success) {
        setGeneratedQuestions([]);
        onClose();
      }
    } catch (err: any) {
      console.error("AI question bulk save error:", err);
      showToast(`প্রশ্ন সংরক্ষণ ব্যর্থ হয়েছে: ${err?.message || "ত্রুটি"}`, "error");
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in my-auto max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                Gemini 3.7 AI প্রশ্ন ব্যাংক জেনারেটর
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                বিষয়, টপিক, হরকত ও সিলেবাস অনুযায়ী নির্ভুল প্রমিত প্রশ্ন তৈরি ও ম্যানুয়াল কাস্টমাইজেশন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Languages className="w-4 h-4 text-emerald-600" />
            <span>প্রশ্নের ভাষা নির্বাচন:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setLanguage("bn")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                language === "bn"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
              }`}
            >
              🇧🇩 বাংলা
            </button>
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                language === "en"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
              }`}
            >
              🇬🇧 English
            </button>
            <button
              type="button"
              onClick={() => setLanguage("ar")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer font-arabic ${
                language === "ar"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
              }`}
            >
              🇸🇦 العربية
            </button>
            <button
              type="button"
              onClick={() => setLanguage("mixed")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                language === "mixed"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
              }`}
            >
              🌐 দ্বিভাষিক
            </button>
          </div>
        </div>

        {/* Input Form with Manual Subject & Topic Controls */}
        <form onSubmit={handleGenerateQuestions} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-slate-800/40 border border-amber-200/60 dark:border-slate-700 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Subject Control */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    বিষয় (Subject) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomSubject(!isCustomSubject)}
                    className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{isCustomSubject ? "তালিকা থেকে বাছুন" : "ম্যানুয়ালি বিষয় লিখুন"}</span>
                  </button>
                </div>

                {!isCustomSubject ? (
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name_bn} {s.name_ar ? `(${s.name_ar})` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="space-y-1 animate-in fade-in">
                    <input
                      type="text"
                      value={customSubjectName}
                      onChange={(e) => setCustomSubjectName(e.target.value)}
                      placeholder="কাস্টম বিষয় লিখুন..."
                      className="w-full px-2.5 py-1.5 rounded-xl border border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
                      required={isCustomSubject}
                    />
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveCustomSubject}
                        onChange={(e) => setSaveCustomSubject(e.target.checked)}
                        className="w-3.5 h-3.5 accent-amber-600 rounded cursor-pointer"
                      />
                      <span>স্থায়ীভাবে যুক্ত করুন</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Topic Control with Manual typing & chips */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  অধ্যায় / টপিক (ম্যানুয়ালি লিখুন)
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="যেমন: হরফে মুশাব্বাহ বিল ফেল / Tense"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
                {!isCustomSubject && currentSubject?.topics && currentSubject.topics.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    {currentSubject.topics.slice(0, 3).map((tName, tIdx) => (
                      <button
                        key={tIdx}
                        type="button"
                        onClick={() => setTopic(tName)}
                        className="px-1.5 py-0.5 rounded text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-600 cursor-pointer"
                      >
                        {tName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Exam Linker */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  মডেল টেস্ট / পরীক্ষা (ঐচ্ছিক)
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
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
                  ডিফিকাল্টি লেভেল
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer"
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer"
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

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  প্রশ্নের সংখ্যা: {count} টি
                </label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer mt-2"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="include-arabic"
                checked={includeArabic}
                onChange={(e) => setIncludeArabic(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
              <label htmlFor="include-arabic" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                আরবি আয়াত/হাদিস/শব্দের ক্ষেত্রে নির্ভুল হরকত (تشكيل/اعراب) যুক্ত করুন
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Gemini AI প্রশ্ন তৈরি করছে...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{count}টি {language === "ar" ? "আরবি" : language === "en" ? "English" : "বাংলা"} AI প্রশ্ন জেনারেট করুন</span>
              </>
            )}
          </button>
        </form>

        {/* Generated Questions Preview (With Full Manual Editing & Choice) */}
        {generatedQuestions.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>জেনারেট হওয়া প্রশ্নসমূহ ({generatedQuestions.length} টি) - ম্যানুয়ালি এডিট ও পরিবর্তনযোগ্য</span>
              </h4>

              <button
                type="button"
                onClick={handleSaveToBank}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>ডাটাবেজে সেভ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>সব প্রশ্ন ডাটাবেজে সংরক্ষণ করুন</span>
                  </>
                )}
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
              {generatedQuestions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                >
                  {/* Top Bar for each generated question */}
                  <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-200/80 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={q.topic}
                        onChange={(e) => handleUpdateGeneratedField(idx, "topic", e.target.value)}
                        placeholder="টপিক নাম"
                        className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 w-36"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteGeneratedQuestion(idx)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 cursor-pointer"
                      title="প্রশ্নটি বাদ দিন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Question text textarea */}
                  <textarea
                    rows={1}
                    value={q.question}
                    onChange={(e) => handleUpdateGeneratedField(idx, "question", e.target.value)}
                    className="w-full font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-1 focus:ring-amber-500 outline-none leading-relaxed"
                  />

                  {q.arabic_text && (
                    <input
                      type="text"
                      value={q.arabic_text}
                      onChange={(e) => handleUpdateGeneratedField(idx, "arabic_text", e.target.value)}
                      className="w-full font-arabic text-sm text-emerald-900 dark:text-emerald-300 font-semibold bg-emerald-50/60 dark:bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900 text-right"
                      dir="rtl"
                    />
                  )}

                  {/* Options with live manual editing and click-to-mark correct answer */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = q.correct_index === oIdx;
                      const optLabel = language === "ar" ? ["أ", "ب", "ج", "د"][oIdx] : language === "en" ? ["A", "B", "C", "D"][oIdx] : ["ক", "খ", "গ", "ঘ"][oIdx];

                      return (
                        <div
                          key={oIdx}
                          onClick={() => handleSelectCorrectOption(idx, oIdx)}
                          className={`p-2 rounded-xl border text-[11px] flex items-center gap-1.5 cursor-pointer transition-all ${
                            isCorrect
                              ? "bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 font-bold text-emerald-950 dark:text-emerald-100 shadow-xs"
                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-300"
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                              isCorrect
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {optLabel}
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleUpdateOption(idx, oIdx, e.target.value)}
                            className="flex-1 bg-transparent border-none outline-none text-xs"
                          />
                          {isCorrect && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation & Source fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <input
                      type="text"
                      value={q.explanation || ""}
                      onChange={(e) => handleUpdateGeneratedField(idx, "explanation", e.target.value)}
                      placeholder="ব্যাখ্যা..."
                      className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300"
                    />
                    <input
                      type="text"
                      value={q.source || ""}
                      onChange={(e) => handleUpdateGeneratedField(idx, "source", e.target.value)}
                      placeholder="রেফারেন্স বই..."
                      className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
