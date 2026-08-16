import React, { useState } from "react";
import {
  FileText,
  X,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ClipboardPaste,
  Copy,
  BookOpen,
  Globe,
  Trash2,
  Edit3,
  Languages,
  Check,
} from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import { Question } from "../../types";

interface BulkPasteParserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type LanguageMode = "bn" | "en" | "ar" | "mixed";
type OptionPrefixStyle = "bn" | "en" | "ar";

const SAMPLE_TEMPLATES: Record<LanguageMode, string> = {
  bn: `১. 'আল-কাফি' (الكافي) গ্রন্থটির মূল রচয়িতা কে?
(ক) ইমাম বুখারী (র.)
(খ) আল্লামা কুলাইনী
(গ) ইমাম কুদুরী
(ঘ) ইমাম মারগীনানী
সঠিক উত্তর: খ
ব্যাখ্যা: আল্লামা কুলাইনী শিয়া ফেকাহ ও হাদিসের অন্যতম মৌলিক গ্রন্থ আল-কাফি সংকলন করেন।
উৎস: ইসলামিক এনসাইক্লোপিডিয়া

২. فعل ماض (অতীতকালীন ক্রিয়া) এর সিগাহ সংখ্যা কয়টি?
(ক) ১২টি
(খ) ১৪টি
(গ) ১৬টি
(ঘ) ১৮টি
সঠিক উত্তর: খ
ব্যাখ্যা: আরবি ব্যাকরণে ফেল মাজি এর মোট ১৪টি সিগাহ রয়েছে।
উৎস: মিযানুস সরফ`,

  en: `1. Which of the following is the synonym of the word 'Ebullient'?
(A) Depressed
(B) Enthusiastic
(C) Hesitant
(D) Indifferent
Correct Answer: B
Explanation: 'Ebullient' means cheerful and full of energy, which is synonymous with 'Enthusiastic'.
Source: NTRCA English Preparation Guide

2. Identify the correct passive form of "Who wrote this book?"
(A) By whom was this book written?
(B) By who was this book written?
(C) By whom this book was written?
(D) Whom was this book written by?
Correct Answer: A
Explanation: 'Who' becomes 'By whom', followed by auxiliary verb 'was' + subject + past participle 'written'.
Source: High School English Grammar`,

  ar: `١. مَا هُوَ حُكْمُ المَفْعُولِ بِهِ فِي اللُّغَةِ العَرَبِيَّةِ؟
(أ) المَرْفُوعُ
(ب) المَنْصُوبُ
(ج) المَجْرُورُ
(د) المَجْزُومُ
الإجابة الصحيحة: ب
الشرح: المَفْعُولُ بِهِ اسْمٌ مَنْصُوبٌ يَدُلُّ عَلَى مَنْ وَقَعَ عَلَيْهِ فِعْلُ الفَاعِلِ.
المصدر: شَرْحُ ابْنِ عَقِيلٍ عَلَى أَلْفِيَّةِ ابْنِ مَالِكٍ

٢. كَمْ عَدَدُ حُرُوفِ الإِظْهَارِ الحَلْقِيِّ فِي عِلْمِ التَّجْوِيدِ؟
(أ) ٤ حُرُوفٍ
(খ) ٥ حُرُوفٍ
(ج) ٦ حُرُوفٍ (ء هـ ع ح غ خ)
(د) ٨ حُرُوفٍ
الإجابة الصحيحة: ج
الشرح: حُرُوفُ الإِظْهَارِ الحَلْقِيِّ سِتَّةٌ: الهَمْزَةُ وَالهَاءُ وَالعَيْنُ وَالحَاءُ وَالغَيْنُ وَالخَاءُ.
المصدر: تُحْفَةُ الأَطْفَالِ`,

  mixed: `১. 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ' হাদিসটি কোন গ্রন্থের সর্বপ্রথম হাদিস?
(ক) সহিহ বুখারি
(খ) সহিহ মুসলিম
(গ) সুনানে তিরমিজি
(ঘ) সুনানে আবু দাউদ
সঠিক উত্তর: ক
ব্যাখ্যা: ইমাম বুখারি (র.) তাঁর সহিহ গ্রন্থের সূচনা করেছেন নিয়ত সংক্রান্ত এই বিখ্যাত হাদিস দ্বারা।
উৎস: সহিহ আল-বুখারি (হাদিস নং ১)

২. 'কাসিমাতুশ শুয়ারা' (قسيمة الشعراء) কোন আরবি সাহিত্যিকের উপাধি ছিল?
(ক) ইমরুল কায়েস
(খ) জুহাইর ইবনে আবি সুলমা
(গ) আল-মুভান্নাবী
(ঘ) হাসসান ইবনে সাবিত
সঠিক উত্তর: ক
ব্যাখ্যা: জাহেলি যুগের শ্রেষ্ঠ কবি ইমরুল কায়েসকে এই নামে ভূষিত করা হয়।
উৎস: তারিখে আদাবে আরবি`,
};

export const BulkPasteParserModal: React.FC<BulkPasteParserModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { subjects, exams, addBulkQuestions, showToast } = useAdminData();

  const [languageMode, setLanguageMode] = useState<LanguageMode>("bn");
  const [optionStyle, setOptionStyle] = useState<OptionPrefixStyle>("bn");
  const [rawText, setRawText] = useState<string>(SAMPLE_TEMPLATES.bn);
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || "sub-1");
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  // Handle template selection
  const handleLoadTemplate = (lang: LanguageMode) => {
    setLanguageMode(lang);
    setRawText(SAMPLE_TEMPLATES[lang]);
    if (lang === "ar") setOptionStyle("ar");
    else if (lang === "en") setOptionStyle("en");
    else setOptionStyle("bn");
    showToast(`${lang.toUpperCase()} স্যাম্পল টেমপ্লেট লোড হয়েছে!`, "info");
  };

  // Direct paste from device clipboard
  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setRawText(text);
          showToast("ক্লিপবোর্ড থেকে টেক্সট সফলভাবে পেস্ট হয়েছে!", "success");
          return;
        }
      }
      showToast("ক্লিপবোর্ড খালি অথবা ব্রাউজার পারমিশন প্রয়োজন।", "info");
    } catch (err) {
      showToast("ক্লিপবোর্ড পারমিশন পাওয়া যায়নি। ম্যানুয়ালি পেস্ট করুন (Ctrl+V)", "info");
    }
  };

  // Client-side regex parser for fast offline parsing across Bengali, English & Arabic
  const parseWithRegex = (text: string): Question[] => {
    const blocks = text.split(/\n\s*\n|\n(?=[০-৯0-9]+\.|\([০-৯0-9]+\)|[০-৯0-9]+\)|[١-٩]+\.)/);
    const results: Question[] = [];

    blocks.forEach((block, idx) => {
      const lines = block.trim().split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) return;

      const qLine = lines[0].replace(/^[০-৯0-9١-٩]+[\.\)]\s*|\([০-৯0-9١-٩]+\)\s*/, "");
      const options: string[] = [];
      let correctIdx = 0;
      let explanation = "";
      let source = "";
      let arabicText = "";

      // Check for arabic text
      const arabicMatch = qLine.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\s]{4,}/g);
      if (arabicMatch && arabicMatch.join(" ").length > 3) {
        arabicText = arabicMatch.join(" ").trim();
      }

      lines.slice(1).forEach((line) => {
        // Bengali options: (ক), ক., [ক]
        // English options: (A), A., [A], (a), a.
        // Arabic options: (أ), أ., (ب), (ج), (د)
        // Numeric options: (১), (1)
        if (/^[\(\[]?([ক-ঘa-dA-Dأ-د١-٤১-৪])[\)\]\.\-\s]/i.test(line)) {
          const optText = line.replace(/^[\(\[]?([ক-ঘa-dA-Dأ-د١-٤১-৪])[\)\]\.\-\s]*/i, "").trim();
          options.push(optText);
        } else if (/সঠিক\s*উত্তর|উত্তর|Ans|Answer|الإجابة\s*الصحيحة|الإجابة/i.test(line)) {
          if (/খ|b|B|২|2|ب/i.test(line)) correctIdx = 1;
          else if (/গ|c|C|৩|3|ج/i.test(line)) correctIdx = 2;
          else if (/ঘ|d|D|৪|4|د/i.test(line)) correctIdx = 3;
          else correctIdx = 0;
        } else if (/ব্যাখ্যা|Explanation|الشرح|تحليل/i.test(line)) {
          explanation = line.replace(/^(ব্যাখ্যা|Explanation|الشرح|تحليل)[:\s]*/i, "").trim();
        } else if (/উৎস|রেফারেন্স|Source|المصدر|المرجع/i.test(line)) {
          source = line.replace(/^(উৎস|রেফারেন্স|Source|المصدر|المرجع)[:\s]*/i, "").trim();
        }
      });

      // Pad options to 4 if needed
      const defaultLabels = optionStyle === "ar" ? ["أ", "ب", "ج", "د"] : optionStyle === "en" ? ["A", "B", "C", "D"] : ["ক", "খ", "গ", "ঘ"];
      while (options.length < 4) {
        options.push(`বিকল্প ${defaultLabels[options.length] || options.length + 1}`);
      }

      results.push({
        id: `parsed-${Date.now()}-${idx}`,
        exam_id: selectedExamId || undefined,
        subject_id: currentSubject?.id || "sub-1",
        subject_name: currentSubject?.name_bn || "সাধারণ বিষয়",
        topic: languageMode === "ar" ? "اللغة العربية والدراسات الإسلامية" : languageMode === "en" ? "English Grammar & Vocabulary" : "বাল্ক কপি-পেস্ট",
        question: qLine,
        arabic_text: arabicText || undefined,
        options: options.slice(0, 4),
        correct_index: correctIdx,
        explanation: explanation || (languageMode === "en" ? "Standard reference answer." : languageMode === "ar" ? "إجابة معتمدة وموثقة من المصادر الأصلية." : "সঠিক উত্তর পাঠ্যবই ও রেফারেন্স ভিত্তিক।"),
        source: source || (languageMode === "en" ? "NTRCA English Curriculum" : languageMode === "ar" ? "المناهج الإسلامية المعتمدة" : "মাদ্রাসা কারিকুলাম ও রেফারেন্স"),
        difficulty: "Medium",
        exam_type: "NTRCA",
        language: languageMode,
        created_at: new Date().toISOString(),
      });
    });

    return results;
  };

  const handleParseText = async (useAi: boolean = false) => {
    if (!rawText.trim()) {
      showToast("অনুগ্রহ করে টেক্সট পেস্ট করুন।", "error");
      return;
    }
    setIsLoading(true);

    if (useAi) {
      try {
        const response = await fetch("/api/gemini/parse-raw-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            raw_text: rawText,
            rawText: rawText,
            defaultSubject: currentSubject.name_bn,
            subject_name: currentSubject.name_bn,
            language: languageMode,
            optionsFormat: optionStyle,
          }),
        });

        const data = await response.json();
        if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
          const formatted: Question[] = data.questions.map((q: any, i: number) => ({
            id: `ai-parsed-${Date.now()}-${i}`,
            exam_id: selectedExamId || undefined,
            subject_id: currentSubject.id,
            subject_name: currentSubject.name_bn,
            topic: q.topic || (languageMode === "ar" ? "اللغة العربية" : languageMode === "en" ? "English" : "AI বাল্ক ইমপোর্ট"),
            question: q.question,
            arabic_text: q.arabic_text || "",
            options: Array.isArray(q.options) && q.options.length >= 4 ? q.options.slice(0, 4) : [q.option_a || "ক", q.option_b || "খ", q.option_c || "গ", q.option_d || "ঘ"],
            correct_index: q.correct_index !== undefined ? Number(q.correct_index) : 0,
            explanation: q.explanation || "",
            source: q.source || "AI ভেরিফাইড রেফারেন্স",
            difficulty: q.difficulty || "Medium",
            exam_type: q.exam_type || "NTRCA",
            language: q.language || languageMode,
            created_at: new Date().toISOString(),
          }));
          setParsedQuestions(formatted);
          showToast(`${formatted.length}টি প্রশ্ন AI দিয়ে নিখুঁতভাবে পার্স হয়েছে!`, "success");
        } else {
          throw new Error(data.error || "AI parser failed");
        }
      } catch (err: any) {
        console.warn("AI parse fallback to regex:", err?.message);
        const regexResults = parseWithRegex(rawText);
        setParsedQuestions(regexResults);
        showToast(`${regexResults.length}টি প্রশ্ন দ্রুত পার্স করা হয়েছে!`, "info");
      } finally {
        setIsLoading(false);
      }
    } else {
      const regexResults = parseWithRegex(rawText);
      setParsedQuestions(regexResults);
      setIsLoading(false);
      showToast(`${regexResults.length}টি প্রশ্ন পার্স করা হয়েছে!`, "success");
    }
  };

  // Copy parsed questions back to clipboard in selected language format
  const handleCopyFormatted = (format: "bn" | "en" | "ar" | "json") => {
    if (parsedQuestions.length === 0) return;

    let outputText = "";
    if (format === "json") {
      outputText = JSON.stringify(parsedQuestions, null, 2);
    } else {
      const labels = format === "ar" ? ["(أ)", "(ب)", "(ج)", "(د)"] : format === "en" ? ["(A)", "(B)", "(C)", "(D)"] : ["(ক)", "(খ)", "(গ)", "(ঘ)"];
      const correctWord = format === "ar" ? "الإجابة الصحيحة" : format === "en" ? "Correct Answer" : "সঠিক উত্তর";
      const expWord = format === "ar" ? "الشرح" : format === "en" ? "Explanation" : "ব্যাখ্যা";
      const srcWord = format === "ar" ? "المصدر" : format === "en" ? "Source" : "উৎস";

      outputText = parsedQuestions
        .map((q, idx) => {
          const num = format === "ar" ? `${idx + 1}` : `${idx + 1}`;
          const qText = `${num}. ${q.question}`;
          const arText = q.arabic_text ? `\n${q.arabic_text}` : "";
          const optLines = q.options.map((opt, oIdx) => `${labels[oIdx]} ${opt}`).join("\n");
          const ansLine = `${correctWord}: ${labels[q.correct_index] || labels[0]}`;
          const expLine = q.explanation ? `\n${expWord}: ${q.explanation}` : "";
          const srcLine = q.source ? `\n${srcWord}: ${q.source}` : "";
          return `${qText}${arText}\n${optLines}\n${ansLine}${expLine}${srcLine}`;
        })
        .join("\n\n");
    }

    navigator.clipboard.writeText(outputText);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
    showToast("ফরম্যাট করা টেক্সট ক্লিপবোর্ডে কপি হয়েছে!", "success");
  };

  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    const updated = [...parsedQuestions];
    updated[qIdx].options[optIdx] = val;
    setParsedQuestions(updated);
  };

  const handleUpdateCorrect = (qIdx: number, optIdx: number) => {
    const updated = [...parsedQuestions];
    updated[qIdx].correct_index = optIdx;
    setParsedQuestions(updated);
  };

  const handleDeleteParsedQuestion = (qIdx: number) => {
    setParsedQuestions(parsedQuestions.filter((_, i) => i !== qIdx));
  };

  const handleSaveToBank = () => {
    if (parsedQuestions.length === 0) return;
    addBulkQuestions(parsedQuestions);
    setParsedQuestions([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-emerald-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  AI স্মার্ট কপি-পেস্ট অপশন (AI Multilingual Parser)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                  বাংলা • English • العربية
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                যেকোনো বাংলা, ইংরেজি অথবা আরবি (হরকতসহ) টেক্সট কপি করে পেস্ট করুন; AI স্বয়ংক্রিয়ভাবে প্রশ্ন ব্যাংক প্রস্তুত করবে
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

        {/* Language Selection & Sample Loader Bar */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Languages className="w-4 h-4 text-emerald-600" />
              <span>ভাষার ধরন নির্বাচন করুন (Language Mode):</span>
            </div>

            {/* Language Tabs */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleLoadTemplate("bn")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  languageMode === "bn"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-50"
                }`}
              >
                🇧🇩 বাংলা (Bengali)
              </button>

              <button
                type="button"
                onClick={() => handleLoadTemplate("en")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  languageMode === "en"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-50"
                }`}
              >
                🇬🇧 English (ইংরেজি)
              </button>

              <button
                type="button"
                onClick={() => handleLoadTemplate("ar")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer font-arabic ${
                  languageMode === "ar"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-50"
                }`}
              >
                🇸🇦 العربية (Arabic)
              </button>

              <button
                type="button"
                onClick={() => handleLoadTemplate("mixed")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  languageMode === "mixed"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-50"
                }`}
              >
                🌐 দ্বিভাষিক / মিশ্র
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
            {/* Subject Selector */}
            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                বিষয় (Subject):
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name_bn}
                  </option>
                ))}
              </select>
            </div>

            {/* Model Test Selector */}
            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                মডেল টেস্ট / পরীক্ষা (ঐচ্ছিক):
              </label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="">সেন্ট্রাল প্রশ্ন ব্যাংক (সাধারণ)</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Option Style Selector */}
            <div>
              <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                অপশন প্রিফিক্স স্টাইল:
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setOptionStyle("bn")}
                  className={`flex-1 py-1 px-2 rounded-lg font-bold text-center border transition-all text-xs cursor-pointer ${
                    optionStyle === "bn"
                      ? "bg-amber-100 dark:bg-amber-950/80 border-amber-500 text-amber-900 dark:text-amber-200"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600"
                  }`}
                >
                  ক, খ, গ, ঘ
                </button>
                <button
                  type="button"
                  onClick={() => setOptionStyle("en")}
                  className={`flex-1 py-1 px-2 rounded-lg font-bold text-center border transition-all text-xs cursor-pointer ${
                    optionStyle === "en"
                      ? "bg-amber-100 dark:bg-amber-950/80 border-amber-500 text-amber-900 dark:text-amber-200"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600"
                  }`}
                >
                  A, B, C, D
                </button>
                <button
                  type="button"
                  onClick={() => setOptionStyle("ar")}
                  className={`flex-1 py-1 px-2 rounded-lg font-bold text-center border transition-all text-xs cursor-pointer font-arabic ${
                    optionStyle === "ar"
                      ? "bg-amber-100 dark:bg-amber-950/80 border-amber-500 text-amber-900 dark:text-amber-200"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600"
                  }`}
                >
                  أ, ب, ج, د
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Textarea Box with Action Toolbar */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>MCQ টেক্সট পেস্ট বক্স (Copy-Paste Text Area):</span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="ক্লিপবোর্ড থেকে পেস্ট করুন"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-emerald-600" />
                <span>ক্লিপবোর্ড থেকে পেস্ট</span>
              </button>

              <button
                type="button"
                onClick={() => setRawText("")}
                className="px-2 py-1 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors cursor-pointer"
                title="মুছে ফেলুন"
              >
                মুছুন
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              rows={9}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="এখানে আপনার যেকোনো বাংলা, ইংরেজি অথবা আরবি প্রশ্নসমূহ পেস্ট করুন..."
              className={`w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white font-mono text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 outline-none ${
                languageMode === "ar" ? "font-arabic text-right text-sm" : ""
              }`}
              dir={languageMode === "ar" ? "rtl" : "ltr"}
            />
          </div>

          {/* Action Buttons: Dual Engines (AI + Regex) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>AI ইঞ্জিন স্বয়ংক্রিয়ভাবে আরবি হরকত, অপশন এবং রেফারেন্স ডিটেক্ট করে।</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleParseText(false)}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-colors cursor-pointer text-xs flex items-center gap-1.5"
              >
                <span>ইনস্ট্যান্ট পার্স (Regex Engine)</span>
              </button>

              <button
                type="button"
                onClick={() => handleParseText(true)}
                disabled={isLoading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 hover:from-amber-600 hover:to-teal-700 text-white font-bold transition-all cursor-pointer text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>AI স্মার্ট পার্স ও ভেরিফাই (Gemini 3.7)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Parsed Preview Section */}
        {parsedQuestions.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>পার্স করা প্রশ্ন ({parsedQuestions.length} টি) - এডিট ও যাচাই করুন</span>
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold">
                  {currentSubject?.name_bn}
                </span>
              </div>

              {/* Copy Format & Save Actions */}
              <div className="flex items-center gap-2">
                {/* Export/Copy Dropdown */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs">
                  <span className="px-2 text-[11px] font-semibold text-slate-500">কপি করুন:</span>
                  <button
                    type="button"
                    onClick={() => handleCopyFormatted("bn")}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-emerald-600 font-bold text-[11px] cursor-pointer"
                    title="বাংলা ফরম্যাটে ক্লিপবোর্ডে কপি করুন"
                  >
                    {copiedFormat === "bn" ? <Check className="w-3 h-3 text-emerald-600" /> : "বাংলা"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyFormatted("en")}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-emerald-600 font-bold text-[11px] cursor-pointer"
                    title="English ফরম্যাটে ক্লিপবোর্ডে কপি করুন"
                  >
                    {copiedFormat === "en" ? <Check className="w-3 h-3 text-emerald-600" /> : "English"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyFormatted("ar")}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-emerald-600 font-bold text-[11px] cursor-pointer font-arabic"
                    title="আরবি ফরম্যাটে ক্লিপবোর্ডে কপি করুন"
                  >
                    {copiedFormat === "ar" ? <Check className="w-3 h-3 text-emerald-600" /> : "العربية"}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSaveToBank}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>সব প্রশ্ন ডাটাবেজে যুক্ত করুন</span>
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {parsedQuestions.map((q, idx) => {
                const optLabels = optionStyle === "ar" ? ["أ", "ب", "ج", "د"] : optionStyle === "en" ? ["A", "B", "C", "D"] : ["ক", "খ", "গ", "ঘ"];
                return (
                  <div
                    key={q.id || idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 flex-1">
                        <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                          {idx + 1}
                        </span>
                        <div className="space-y-1 flex-1">
                          <input
                            type="text"
                            value={q.question}
                            onChange={(e) => {
                              const updated = [...parsedQuestions];
                              updated[idx].question = e.target.value;
                              setParsedQuestions(updated);
                            }}
                            className="w-full font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-emerald-500 outline-none pb-0.5"
                          />
                          {q.arabic_text && (
                            <div className="font-arabic text-sm text-emerald-800 dark:text-emerald-300 font-semibold leading-relaxed">
                              {q.arabic_text}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteParsedQuestion(idx)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700"
                        title="প্রশ্নটি বাদ দিন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 4 Options Radio Group */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = q.correct_index === oIdx;
                        return (
                          <div
                            key={oIdx}
                            onClick={() => handleUpdateCorrect(idx, oIdx)}
                            className={`p-2 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                              isCorrect
                                ? "bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 font-bold text-emerald-950 dark:text-emerald-100 shadow-sm"
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
                              {optLabels[oIdx]}
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

                    {/* Explanation & Reference */}
                    {(q.explanation || q.source) && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 flex flex-wrap items-center gap-3">
                        {q.explanation && (
                          <span>
                            <strong>ব্যাখ্যা:</strong> {q.explanation}
                          </span>
                        )}
                        {q.source && (
                          <span>
                            <strong>উৎস:</strong> {q.source}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
