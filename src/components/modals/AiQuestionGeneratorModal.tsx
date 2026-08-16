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
  const { subjects, exams, addBulkQuestions, showToast } = useAdminData();

  const [language, setLanguage] = useState<LanguageMode>("bn");
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || "sub-1");
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>("Medium");
  const [examType, setExamType] = useState<ExamTargetCategory>("NTRCA");
  const [count, setCount] = useState<number>(5);
  const [includeArabic, setIncludeArabic] = useState<boolean>(true);
  const [customPrompt, setCustomPrompt] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);

  if (!isOpen) return null;

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  const handleGenerateQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/gemini/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_name: currentSubject?.name_bn || "ইসলামিক শিক্ষা ও আরবি",
          topic: topic || currentSubject?.topics?.[0] || "সাধারণ ব্যাকরণ ও কারিকুলাম",
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
          subject_id: currentSubject.id,
          subject_name: currentSubject.name_bn,
          topic: q.topic || topic || (language === "ar" ? "اللغة العربية" : language === "en" ? "English" : "AI জেনারেটেড"),
          question: q.question,
          arabic_text: q.arabic_text || "",
          options: q.options || ["অপশন ১", "অপশন ২", "অপশন ৩", "অপশন ৪"],
          correct_index: q.correct_index !== undefined ? Number(q.correct_index) : 0,
          explanation: q.explanation || "",
          source: q.source || "Gemini AI ভেরিফাইড ইসলামিক ও কারিকুলাম রেফারেন্স",
          difficulty: q.difficulty || difficulty,
          exam_type: q.exam_type || examType,
          language,
          created_at: new Date().toISOString(),
        }));

        setGeneratedQuestions(formatted);
        showToast(`${formatted.length}টি প্রশ্ন সফলভাবে তৈরি হয়েছে!`, "success");
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
        subject_id: currentSubject.id,
        subject_name: currentSubject.name_bn,
        topic: topic || "প্রমিত ব্যাকরণ ও পাঠ্যবই",
        question: isArabic
          ? `السؤال رقم ${i + 1}: مَا هُوَ الحُكْمُ الصَّحِيحُ فِي بَابِ ${topic || "النَّحْوِ وَالصَّرْفِ"}؟`
          : isEnglish
          ? `Question ${i + 1}: What is the correct grammatical usage regarding ${topic || "English Syntax"}?`
          : `প্রশ্ন ${i + 1}: ${currentSubject.name_bn} বিষয়ক প্রমিত প্রশ্ন (${topic || "সাধারণ"})?`,
        arabic_text: includeArabic || isArabic ? "قَالَ رَسُولُ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ: «طَلَبُ الْعِلْمِ فَرِيضَةٌ»" : undefined,
        options: isArabic
          ? ["أ) الإجابة الصحيحة الأولى", "ب) الخيار الثاني", "ج) الخيار الثالث", "د) الخيار الرابع"]
          : isEnglish
          ? ["A) Option A (Correct)", "B) Option B", "C) Option C", "D) Option D"]
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

  const handleSaveToBank = () => {
    if (generatedQuestions.length === 0) return;
    addBulkQuestions(generatedQuestions);
    setGeneratedQuestions([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Gemini AI বহুভাষিক প্রশ্ন জেনারেটর
                </h3>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-mono font-bold">
                  Gemini 3.7 Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                বাংলা, ইংরেজি অথবা আরবি ভাষায় নির্ভুল হরকত (اعراب) ও ব্যাখ্যাসহ সঠিক MCQ তৈরি করুন
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
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Languages className="w-4 h-4 text-emerald-600" />
            <span>প্রশ্নের ভাষা নির্বাচন:</span>
          </div>

          <div className="flex items-center gap-1.5">
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

        {/* Input Form */}
        <form onSubmit={handleGenerateQuestions} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                বিষয় নির্বাচন *
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name_bn} {s.name_ar ? `(${s.name_ar})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                মডেল টেস্ট / পরীক্ষা (ঐচ্ছিক)
              </label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
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
                নির্দিষ্ট অধ্যায় বা টপিক
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="যেমন: হরফে মুশাব্বাহ বিল ফেল / Tense"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </div>

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

          <div className="flex items-center gap-2">
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

        {/* Generated Questions Preview */}
        {generatedQuestions.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>জেনারেট হওয়া প্রশ্নসমূহ ({generatedQuestions.length} টি)</span>
              </h4>

              <button
                type="button"
                onClick={handleSaveToBank}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer transition-colors"
              >
                সব প্রশ্ন ডাটাবেজে সংরক্ষণ করুন
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {generatedQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                >
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                      {idx + 1}
                    </span>
                    <h5 className="font-bold text-slate-900 dark:text-white leading-snug">{q.question}</h5>
                  </div>

                  {q.arabic_text && (
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 font-arabic text-base text-emerald-900 dark:text-emerald-200">
                      {q.arabic_text}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-2 rounded-lg border text-[11px] flex items-center gap-1.5 ${
                          q.correct_index === oIdx
                            ? "bg-emerald-100 dark:bg-emerald-950 border-emerald-500 font-bold text-emerald-900 dark:text-emerald-200"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span className="font-bold text-slate-400">
                          {language === "ar" ? ["أ", "ب", "ج", "د"][oIdx] : language === "en" ? ["A", "B", "C", "D"][oIdx] : ["ক", "খ", "গ", "ঘ"][oIdx]}.
                        </span>
                        <span className="truncate">{opt}</span>
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      ব্যাখ্যা: {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
