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
  Plus,
  Tag,
  FolderPlus,
} from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import { Question } from "../../types";

interface BulkPasteParserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type LanguageMode = "bn" | "en" | "ar" | "mixed";
type OptionPrefixStyle = "bn" | "en" | "ar" | "num";

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
(ب) ٥ حُرُوفٍ
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
  const { subjects, exams, addBulkQuestions, addSubject, showToast } = useAdminData();

  const [languageMode, setLanguageMode] = useState<LanguageMode>("bn");
  const [optionStyle, setOptionStyle] = useState<OptionPrefixStyle>("bn");
  const [rawText, setRawText] = useState<string>(SAMPLE_TEMPLATES.bn);

  // Subject configuration (Dropdown or Manual Custom)
  const [isCustomSubject, setIsCustomSubject] = useState<boolean>(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || "sub-1");
  const [customSubjectName, setCustomSubjectName] = useState<string>("");
  const [saveCustomSubject, setSaveCustomSubject] = useState<boolean>(true);

  // Topic configuration (Manual input with quick pills)
  const [defaultTopic, setDefaultTopic] = useState<string>("");

  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  // Helper for option labels
  const getOptPrefix = (idx: number, style: OptionPrefixStyle) => {
    if (style === "ar") return ["أ", "ب", "ج", "د", "هـ"][idx] || `خيار ${idx + 1}`;
    if (style === "en") return ["A", "B", "C", "D", "E"][idx] || `Option ${idx + 1}`;
    if (style === "num") return ["১", "২", "৩", "৪", "৫"][idx] || `${idx + 1}`;
    return ["ক", "খ", "গ", "ঘ", "ঙ"][idx] || `বিকল্প ${idx + 1}`;
  };

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
        } else {
          showToast("ক্লিপবোর্ডে কোনো টেক্সট পাওয়া যায়নি", "info");
        }
      } else {
        showToast("ব্রাউজারে ক্লিপবোর্ড অনুমতি প্রদান করুন", "info");
      }
    } catch (err) {
      showToast("ক্লিপবোর্ড থেকে পেস্ট করতে সমস্যা হয়েছে। সরাসরি পেস্ট (Ctrl+V) করুন।", "info");
    }
  };

  // Get active subject name
  const getEffectiveSubjectName = () => {
    if (isCustomSubject && customSubjectName.trim()) {
      return customSubjectName.trim();
    }
    return currentSubject?.name_bn || "সাধারণ বিষয়";
  };

  // Parsing logic (Dual: Regex + AI)
  const handleParseText = async (useAi: boolean = false) => {
    if (!rawText.trim()) {
      showToast("দয়া করে টেক্সট বক্সে কিছু প্রশ্ন পেস্ট করুন", "error");
      return;
    }

    setIsLoading(true);

    const effSubjectName = getEffectiveSubjectName();
    const effTopic = defaultTopic.trim() || "সাধারণ";

    if (useAi) {
      try {
        const response = await fetch("/api/gemini/parse-bulk-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            raw_text: rawText,
            language: languageMode,
            subject_name: effSubjectName,
            topic: effTopic,
          }),
        });

        const data = await response.json();
        if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
          const formatted: Question[] = data.questions.map((q: any, idx: number) => ({
            id: `bulk-ai-${Date.now()}-${idx}`,
            exam_id: selectedExamId || undefined,
            subject_id: isCustomSubject ? "custom" : currentSubject.id,
            subject_name: q.subject_name || effSubjectName,
            topic: q.topic || effTopic,
            question: q.question,
            arabic_text: q.arabic_text || "",
            options: q.options || ["অপশন ১", "অপশন ২", "অপশন ৩", "অপশন ৪"],
            correct_index: q.correct_index !== undefined ? Number(q.correct_index) : 0,
            explanation: q.explanation || "",
            source: q.source || (languageMode === "ar" ? "المناهج المعتمدة" : languageMode === "en" ? "Curriculum Reference" : "মাদ্রাসা পাঠ্যবই"),
            difficulty: "Medium",
            exam_type: "NTRCA",
            language: languageMode,
            created_at: new Date().toISOString(),
          }));

          setParsedQuestions(formatted);
          showToast(`AI দ্বারা ${formatted.length}টি প্রশ্ন সফলভাবে পার্স হয়েছে!`, "success");
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn("AI parse fallback to Regex:", err);
      }
    }

    // Fast Offline Multi-Lingual Regex Parser
    try {
      const blocks = rawText
        .split(/\n\s*\n|\n(?=[০-৯0-9\u0660-\u0669]+[\.\-\)\s])/g)
        .map((b) => b.trim())
        .filter(Boolean);

      const parsed: Question[] = [];

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length < 2) continue;

        let questionTitle = "";
        let arabicLine = "";
        let options: string[] = [];
        let correctIdx = 0;
        let explanationText = "";
        let sourceText = "";

        // Extract lines
        for (let j = 0; j < lines.length; j++) {
          const line = lines[j];

          // Option matcher (বাংলা ক-ঘ, ইংরেজি A-D, আরবি أ-د, বা সংখ্যা)
          const isOptionMatch = line.match(/^(\([ক-ঙA-Ea-eأ-هـ1-5]\)|[ক-ঙA-Ea-eأ-هـ1-5][\.\-\)\s])\s*(.*)/i);
          const isAnswerMatch = line.match(/(সঠিক উত্তর|উত্তরঃ?|উত্তর|Answer|Ans|Correct Answer|الإجابة الصحيحة|الجواب)\s*[:=\-]?\s*([ক-ঙA-Ea-eأ-هـ1-5]|\d)/i);
          const isExpMatch = line.match(/(ব্যাখ্যা|Explanation|الشرح|توضيح)\s*[:=\-]?\s*(.*)/i);
          const isSrcMatch = line.match(/(উৎস|রেফারেন্স|Source|المصدر|مرجع)\s*[:=\-]?\s*(.*)/i);

          if (isAnswerMatch) {
            const ansChar = isAnswerMatch[2].trim().toLowerCase();
            if (["ক", "a", "أ", "1", "১"].includes(ansChar)) correctIdx = 0;
            else if (["খ", "b", "ب", "2", "২"].includes(ansChar)) correctIdx = 1;
            else if (["গ", "c", "ج", "3", "৩"].includes(ansChar)) correctIdx = 2;
            else if (["ঘ", "d", "د", "4", "৪"].includes(ansChar)) correctIdx = 3;
            else if (["ঙ", "e", "هـ", "5", "৫"].includes(ansChar)) correctIdx = 4;
          } else if (isExpMatch) {
            explanationText = isExpMatch[2].trim();
          } else if (isSrcMatch) {
            sourceText = isSrcMatch[2].trim();
          } else if (isOptionMatch) {
            options.push(isOptionMatch[2].trim());
          } else {
            // Check if this is Arabic verse / text
            const hasArabicLetters = /[\u0600-\u06FF]/.test(line);
            if (!questionTitle) {
              questionTitle = line.replace(/^[০-৯0-9\u0660-\u0669]+[\.\-\)\s]*/, "").trim();
            } else if (hasArabicLetters && !arabicLine) {
              arabicLine = line;
            } else if (options.length === 0) {
              questionTitle += " " + line;
            }
          }
        }

        if (options.length < 2) {
          options = ["বিকল্প ক", "বিকল্প খ", "বিকল্প গ", "বিকল্প ঘ"];
        }

        while (options.length < 4) {
          options.push(`বিকল্প ${getOptPrefix(options.length, optionStyle)}`);
        }

        parsed.push({
          id: `bulk-rx-${Date.now()}-${i}`,
          exam_id: selectedExamId || undefined,
          subject_id: isCustomSubject ? "custom" : currentSubject.id,
          subject_name: effSubjectName,
          topic: effTopic,
          question: questionTitle || `প্রশ্ন ${i + 1}`,
          arabic_text: arabicLine || undefined,
          options: options.slice(0, 5),
          correct_index: correctIdx,
          explanation: explanationText,
          source: sourceText || (languageMode === "ar" ? "المناهج المعتمدة" : languageMode === "en" ? "Curriculum Reference" : "মাদ্রাসা পাঠ্যবই"),
          difficulty: "Medium",
          exam_type: "NTRCA",
          language: languageMode,
          created_at: new Date().toISOString(),
        });
      }

      setParsedQuestions(parsed);
      showToast(`${parsed.length}টি প্রশ্ন সফলভাবে পার্স হয়েছে! নিচে সব বিকল্প ও টপিক এডিট করতে পারেন।`, "success");
    } catch (e) {
      showToast("পার্সিং ত্রুটি। ফরম্যাট চেক করুন।", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Card updates
  const handleUpdateQuestionField = (idx: number, field: string, value: any) => {
    const updated = [...parsedQuestions];
    updated[idx] = { ...updated[idx], [field]: value };
    setParsedQuestions(updated);
  };

  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    const updated = [...parsedQuestions];
    const opts = [...updated[qIdx].options];
    opts[optIdx] = val;
    updated[qIdx].options = opts;
    setParsedQuestions(updated);
  };

  const handleUpdateCorrect = (qIdx: number, optIdx: number) => {
    const updated = [...parsedQuestions];
    updated[qIdx].correct_index = optIdx;
    setParsedQuestions(updated);
  };

  const handleDeleteParsedQuestion = (index: number) => {
    const updated = parsedQuestions.filter((_, i) => i !== index);
    setParsedQuestions(updated);
    showToast("প্রশ্নটি তালিকা থেকে বাদ দেওয়া হয়েছে", "info");
  };

  // Copy parsed questions back in custom format
  const handleCopyFormatted = (formatLang: LanguageMode) => {
    if (parsedQuestions.length === 0) return;

    const formattedText = parsedQuestions
      .map((q, idx) => {
        const isAr = formatLang === "ar";
        const isEn = formatLang === "en";

        const numPrefix = isAr
          ? `${(idx + 1).toLocaleString("ar-SA")}.`
          : isEn
          ? `${idx + 1}.`
          : `${(idx + 1).toLocaleString("bn-BD")}.`;

        const optLabels = isAr ? ["(أ)", "(ب)", "(ج)", "(د)", "(هـ)"] : isEn ? ["(A)", "(B)", "(C)", "(D)", "(E)"] : ["(ক)", "(খ)", "(গ)", "(ঘ)", "(ঙ)"];

        const correctAnsLabel = optLabels[q.correct_index] || optLabels[0];
        const ansTag = isAr ? "الإجابة الصحيحة:" : isEn ? "Correct Answer:" : "সঠিক উত্তর:";
        const expTag = isAr ? "الشرح:" : isEn ? "Explanation:" : "ব্যাখ্যা:";
        const srcTag = isAr ? "المصدر:" : isEn ? "Source:" : "উৎস:";

        let block = `${numPrefix} ${q.question}\n`;
        if (q.arabic_text) block += `${q.arabic_text}\n`;
        q.options.forEach((opt, oIdx) => {
          block += `${optLabels[oIdx]} ${opt}\n`;
        });
        block += `${ansTag} ${correctAnsLabel.replace(/[()]/g, "")}\n`;
        if (q.explanation) block += `${expTag} ${q.explanation}\n`;
        if (q.source) block += `${srcTag} ${q.source}\n`;

        return block;
      })
      .join("\n");

    navigator.clipboard.writeText(formattedText);
    setCopiedFormat(formatLang);
    showToast(`সব প্রশ্ন ${formatLang.toUpperCase()} ফরম্যাটে ক্লিপবোর্ডে কপি হয়েছে!`, "success");
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  // Save all to database
  const handleSaveToBank = () => {
    if (parsedQuestions.length === 0) return;

    let targetSubjectId = selectedSubjectId;
    const finalSubName = getEffectiveSubjectName();

    if (isCustomSubject && customSubjectName.trim()) {
      if (saveCustomSubject) {
        const newSub = addSubject({
          name_bn: customSubjectName.trim(),
          name_ar: customSubjectName.trim(),
          icon: "BookOpen",
          question_count: parsedQuestions.length,
          is_premium_only: false,
          is_active: true,
          topics: defaultTopic.trim() ? [defaultTopic.trim()] : ["সাধারণ"],
          color_accent: "emerald",
          order: subjects.length + 1,
        });
        targetSubjectId = newSub.id;
      } else {
        targetSubjectId = `sub-custom-${Date.now()}`;
      }
    }

    const readyQuestions: any[] = parsedQuestions.map((q) => ({
      exam_id: selectedExamId || q.exam_id || undefined,
      subject_id: targetSubjectId,
      subject_name: q.subject_name || finalSubName,
      topic: q.topic || defaultTopic.trim() || "সাধারণ",
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
      source: q.source || (languageMode === "ar" ? "المناهج المعتمدة" : languageMode === "en" ? "Curriculum Reference" : "মাদ্রাসা পাঠ্যবই"),
      difficulty: q.difficulty || "Medium",
      exam_type: q.exam_type || "NTRCA",
      language: q.language || languageMode,
    }));

    addBulkQuestions(readyQuestions);
    showToast(`${readyQuestions.length}টি প্রশ্ন সফলভাবে প্রশ্ন ব্যাংকে যুক্ত করা হয়েছে!`, "success");
    setParsedQuestions([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in my-auto max-h-[94vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">
                  AI স্মার্ট কপি-পেস্ট অপশন ও বাল্ক এডিটর
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                  বাংলা • English • العربية
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                যেকোনো বাংলা, ইংরেজি অথবা আরবি টেক্সট পেস্ট করে বিষয় ও টপিকসহ অটো-পার্স ও এডিট করুন
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

        {/* SECTION 1: Language Selection & Global Subject/Topic Settings */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Languages className="w-4 h-4 text-emerald-600" />
              <span>ভাষার ধরন (Language Mode):</span>
            </div>

            {/* Language Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleLoadTemplate("bn")}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  languageMode === "bn"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-50"
                }`}
              >
                🇧🇩 বাংলা
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
                🇬🇧 English
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
                🇸🇦 العربية
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
                🌐 দ্বিভাষিক
              </button>
            </div>
          </div>

          {/* Subject & Topic Controls with Manual Entry Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
            {/* Subject Selector & Manual Input */}
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
                  <span>{isCustomSubject ? "তালিকা থেকে বাছুন" : "ম্যানুয়ালি লিখুন"}</span>
                </button>
              </div>

              {!isCustomSubject ? (
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer"
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
                    placeholder="কাস্টম বিষয় লিখুন (যেমন: ফিকহ ও উসুল)"
                    className="w-full px-2.5 py-1.5 rounded-xl border border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs"
                  />
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveCustomSubject}
                      onChange={(e) => setSaveCustomSubject(e.target.checked)}
                      className="w-3.5 h-3.5 accent-amber-600 rounded cursor-pointer"
                    />
                    <span>বিষয়টি স্থায়ীভাবে সংরক্ষণ করুন</span>
                  </label>
                </div>
              )}
            </div>

            {/* Topic Input with Manual typing & quick chips */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                অধ্যায় / টপিক (Topic - ম্যানুয়ালি লিখুন)
              </label>
              <input
                type="text"
                value={defaultTopic}
                onChange={(e) => setDefaultTopic(e.target.value)}
                placeholder="যেমন: নহুমীর / সুরা বাকারাহ / Tense"
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
              {!isCustomSubject && currentSubject?.topics && currentSubject.topics.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  {currentSubject.topics.slice(0, 3).map((tName, tIdx) => (
                    <button
                      key={tIdx}
                      type="button"
                      onClick={() => setDefaultTopic(tName)}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:border-emerald-400 cursor-pointer"
                    >
                      {tName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Model Test Linker */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                মডেল টেস্ট / পরীক্ষা (ঐচ্ছিক):
              </label>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="">সেন্ট্রাল প্রশ্ন ব্যাংক (সাধারণ)</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: Textarea Box with Action Toolbar */}
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
              rows={8}
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
              <span>AI ইঞ্জিন স্বয়ংক্রিয়ভাবে বিষয়, টপিক, আরবি হরকত ও অপশন ডিটেক্ট করে।</span>
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

        {/* SECTION 3: Parsed Preview Section (সব অপশনেই ম্যানুয়ালি এডিট সুবিধা) */}
        {parsedQuestions.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>পার্স করা প্রশ্ন ({parsedQuestions.length} টি) - বিষয়, টপিক ও বিকল্প ম্যানুয়ালি পরিবর্তনযোগ্য</span>
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold">
                  {getEffectiveSubjectName()}
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

            {/* Questions List with Full Manual Editing on Every Card */}
            <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
              {parsedQuestions.map((q, idx) => {
                const optLabels = optionStyle === "ar" ? ["أ", "ب", "ج", "د", "هـ"] : optionStyle === "en" ? ["A", "B", "C", "D", "E"] : ["ক", "খ", "গ", "ঘ", "ঙ"];
                return (
                  <div
                    key={q.id || idx}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs"
                  >
                    {/* Per-Card Subject & Topic Editing Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-slate-200/80 dark:border-slate-700">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>

                        {/* Subject manual editor */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500 font-semibold">বিষয়:</span>
                          <input
                            type="text"
                            value={q.subject_name}
                            onChange={(e) => handleUpdateQuestionField(idx, "subject_name", e.target.value)}
                            placeholder="বিষয় নাম"
                            className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 w-28"
                          />
                        </div>

                        {/* Topic manual editor */}
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-slate-500 font-semibold">টপিক:</span>
                          <input
                            type="text"
                            value={q.topic}
                            onChange={(e) => handleUpdateQuestionField(idx, "topic", e.target.value)}
                            placeholder="টপিক নাম"
                            className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 w-32"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteParsedQuestion(idx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 cursor-pointer"
                        title="প্রশ্নটি বাদ দিন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Question Text & Arabic Text */}
                    <div className="space-y-1">
                      <textarea
                        rows={1}
                        value={q.question}
                        onChange={(e) => handleUpdateQuestionField(idx, "question", e.target.value)}
                        className="w-full font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-1 focus:ring-emerald-500 outline-none leading-relaxed"
                        placeholder="মূল প্রশ্ন লিখুন..."
                      />
                      {q.arabic_text && (
                        <input
                          type="text"
                          value={q.arabic_text}
                          onChange={(e) => handleUpdateQuestionField(idx, "arabic_text", e.target.value)}
                          className="w-full font-arabic text-sm text-emerald-900 dark:text-emerald-300 font-semibold bg-emerald-50/60 dark:bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-200 dark:border-emerald-900 text-right"
                          placeholder="আরবি ইবারত..."
                          dir="rtl"
                        />
                      )}
                    </div>

                    {/* Options Grid (All Options Editable) */}
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
                              placeholder={`বিকল্প ${optLabels[oIdx]}`}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      <input
                        type="text"
                        value={q.explanation || ""}
                        onChange={(e) => handleUpdateQuestionField(idx, "explanation", e.target.value)}
                        placeholder="ব্যাখ্যা (ঐচ্ছিক)..."
                        className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300"
                      />
                      <input
                        type="text"
                        value={q.source || ""}
                        onChange={(e) => handleUpdateQuestionField(idx, "source", e.target.value)}
                        placeholder="রেফারেন্স বা বই (ঐচ্ছিক)..."
                        className="w-full px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300"
                      />
                    </div>
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
