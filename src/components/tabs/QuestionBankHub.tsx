import React, { useState } from "react";
import {
  HelpCircle,
  Plus,
  Sparkles,
  FileText,
  Upload,
  Download,
  Filter,
  Search,
  BookOpen,
  Trash2,
  Edit,
  Tag,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  Copy,
  Languages,
} from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import { Question, QuestionDifficulty, ExamTargetCategory } from "../../types";

interface QuestionBankHubProps {
  onOpenManualForm: (questionToEdit?: Question) => void;
  onOpenBulkParser: () => void;
  onOpenAiGenerator: () => void;
}

export const QuestionBankHub: React.FC<QuestionBankHubProps> = ({
  onOpenManualForm,
  onOpenBulkParser,
  onOpenAiGenerator,
}) => {
  const { questions, subjects, deleteQuestion, addBulkQuestions, showToast, searchQuery, setSearchQuery } = useAdminData();

  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedExamType, setSelectedExamType] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // Available topics for the active selected subject or all
  const availableTopics = Array.from(
    new Set(
      questions
        .filter((q) => selectedSubject === "all" || q.subject_id === selectedSubject)
        .map((q) => q.topic)
        .filter(Boolean)
    )
  );

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    const matchesSubject = selectedSubject === "all" || q.subject_id === selectedSubject;
    const matchesTopic = selectedTopic === "all" || q.topic === selectedTopic;
    const matchesDifficulty = selectedDifficulty === "all" || q.difficulty === selectedDifficulty;
    const matchesExamType = selectedExamType === "all" || q.exam_type === selectedExamType;
    const matchesLanguage = selectedLanguage === "all" || (q.language || "bn") === selectedLanguage;
    const matchesSearch =
      !searchQuery ||
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.arabic_text && q.arabic_text.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.topic && q.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
      q.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.source && q.source.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSubject && matchesTopic && matchesDifficulty && matchesExamType && matchesLanguage && matchesSearch;
  });

  // Export questions to CSV
  const handleExportCSV = () => {
    const headers = ["ID", "Subject", "Topic", "Question", "Arabic Text", "Option A", "Option B", "Option C", "Option D", "Correct Index", "Explanation", "Source", "Difficulty", "Exam Type", "Language"];
    const rows = filteredQuestions.map((q) => [
      q.id,
      `"${(q.subject_name || "").replace(/"/g, '""')}"`,
      `"${(q.topic || "").replace(/"/g, '""')}"`,
      `"${q.question.replace(/"/g, '""')}"`,
      `"${(q.arabic_text || "").replace(/"/g, '""')}"`,
      `"${(q.options[0] || "").replace(/"/g, '""')}"`,
      `"${(q.options[1] || "").replace(/"/g, '""')}"`,
      `"${(q.options[2] || "").replace(/"/g, '""')}"`,
      `"${(q.options[3] || "").replace(/"/g, '""')}"`,
      q.correct_index,
      `"${(q.explanation || "").replace(/"/g, '""')}"`,
      `"${(q.source || "").replace(/"/g, '""')}"`,
      q.difficulty,
      q.exam_type,
      q.language || "bn",
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tamreen_questions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("সিএসভি ফাইল সফলভাবে ডাউনলোড হয়েছে!");
  };

  // Import questions from JSON / CSV
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith(".json")) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            addBulkQuestions(parsed);
          }
        } else {
          // Parse simple CSV
          const lines = text.split("\n").filter((l) => l.trim());
          const newQs: any[] = [];
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim());
            if (cols.length >= 8) {
              newQs.push({
                subject_id: "sub-1",
                subject_name: cols[1] || "সাধারণ বিষয়",
                topic: cols[2] || "সাধারণ",
                question: cols[3] || cols[0],
                arabic_text: cols[4] || "",
                options: [cols[5] || "ক", cols[6] || "খ", cols[7] || "গ", cols[8] || "ঘ"],
                correct_index: parseInt(cols[9] || "0", 10) || 0,
                explanation: cols[10] || "",
                source: cols[11] || "রেফারেন্স বই",
                difficulty: (cols[12] as any) || "Medium",
                exam_type: (cols[13] as any) || "NTRCA",
                language: (cols[14] as any) || "bn",
              });
            }
          }
          if (newQs.length > 0) {
            addBulkQuestions(newQs);
          }
        }
      } catch (err) {
        showToast("ফাইল ইমপোর্টে সমস্যা হয়েছে। সঠিক ফরম্যাট ব্যবহার করুন।", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 4 Ways to Add Questions Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-600" />
              <span>প্রশ্ন ব্যাংক হাব (Question Bank Master Hub)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              আরবি হরকত (اعراب), বাংলা ও ইংরেজি প্রশ্ন তৈরি, AI স্মার্ট কপি-পেস্ট ও Gemini AI জেনারেশন
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full">
              মোট প্রশ্ন: {questions.length.toLocaleString("bn-BD")} টি
            </span>
          </div>
        </div>

        {/* 4 Methods Action Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
          {/* Method 1: Manual Form */}
          <button
            onClick={() => onOpenManualForm()}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 text-left transition-all group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-white">১. ম্যানুয়াল এন্ট্রি ফর্ম</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              বাংলা/ইংরেজি/আরবি হরকত ও রেফারেন্সসহ যুক্ত করুন
            </p>
          </button>

          {/* Method 2: Smart Bulk Parser */}
          <button
            onClick={onOpenBulkParser}
            className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-teal-500/10 hover:from-amber-500/20 hover:to-teal-500/20 border border-amber-500/40 text-left transition-all group cursor-pointer shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform shadow-md shadow-amber-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">২. AI কপি-পেস্ট পার্সার</h4>
              <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.2 rounded font-bold">AI</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              যেকোনো বাংলা, ইংরেজি ও আরবি টেক্সট পেস্ট করে অটো-পার্স
            </p>
          </button>

          {/* Method 3: Gemini AI Generator */}
          <button
            onClick={onOpenAiGenerator}
            className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 hover:from-indigo-500/20 hover:to-emerald-500/20 border border-indigo-500/30 text-left transition-all group cursor-pointer shadow-sm"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform shadow-md shadow-indigo-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">৩. Gemini AI জেনারেটর</h4>
              <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-bold">PRO</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              টপিক ও শ্রেণি অনুযায়ী বাংলা, ইংরেজি ও আরবি MCQ প্রস্তুত
            </p>
          </button>

          {/* Method 4: Excel / CSV Import & Export */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <button
                  onClick={handleExportCSV}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors"
                  title="CSV এক্সপোর্ট"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">৪. CSV / এক্সেল ইমপোর্ট</h4>
            </div>

            <label className="mt-2 inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-100 text-xs font-semibold cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>ফাইল আপলোড</span>
              <input type="file" accept=".csv,.json" onChange={handleImportFile} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Subject Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedTopic("all");
              }}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
            >
              <option value="all">সকল বিষয় ({questions.length})</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name_bn}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Filter */}
          {availableTopics.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-emerald-600" />
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
              >
                <option value="all">সকল টপিক / অধ্যায়</option>
                {availableTopics.map((t, idx) => (
                  <option key={idx} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Language Filter */}
          <div className="flex items-center gap-1.5">
            <Languages className="w-4 h-4 text-emerald-600" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
            >
              <option value="all">সকল ভাষা (All)</option>
              <option value="bn">🇧🇩 বাংলা (Bengali)</option>
              <option value="en">🇬🇧 English (ইংরেজি)</option>
              <option value="ar">🇸🇦 العربية (Arabic)</option>
              <option value="mixed">🌐 দ্বিভাষিক / মিশ্র</option>
            </select>
          </div>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
          >
            <option value="all">সকল ডিফিকাল্টি</option>
            <option value="Easy">সহজ (Easy)</option>
            <option value="Medium">মাঝারি (Medium)</option>
            <option value="Hard">কঠিন (Hard)</option>
          </select>

          {/* Exam Type Filter */}
          <select
            value={selectedExamType}
            onChange={(e) => setSelectedExamType(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
          >
            <option value="all">সকল পরীক্ষার টার্গেট</option>
            <option value="NTRCA">NTRCA শিক্ষক নিবন্ধন</option>
            <option value="Dakhil">দাখিল (Dakhil)</option>
            <option value="Alim">আলিম (Alim)</option>
            <option value="Fazil">ফাজিল (Fazil)</option>
            <option value="Kamil">কামিল (Kamil)</option>
            <option value="Madrasah Directorate">মাদ্রাসা শিক্ষা অধিদপ্তর</option>
            <option value="BCS">বিসিএস ও অন্যান্য</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>পাওয়া গেছে: <strong>{filteredQuestions.length}</strong> টি প্রশ্ন</span>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>এক্সপোর্ট</span>
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((q, index) => {
            const isExpanded = expandedQuestionId === q.id;
            const qLang = q.language || (q.arabic_text ? "ar" : "bn");

            return (
              <div
                key={q.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>

                    <div className="space-y-2 flex-1 min-w-0">
                      {/* Meta Tags */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50">
                          {q.subject_name}
                        </span>
                        {q.topic && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {q.topic}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            q.difficulty === "Easy"
                              ? "bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300"
                              : q.difficulty === "Hard"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                          }`}
                        >
                          {q.difficulty === "Easy" ? "সহজ" : q.difficulty === "Hard" ? "কঠিন" : "মাঝারি"}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                          {q.exam_type}
                        </span>
                        {/* Language Tag */}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {qLang === "ar" ? "🇸🇦 العربية" : qLang === "en" ? "🇬🇧 English" : qLang === "mixed" ? "🌐 মিশ্র" : "🇧🇩 বাংলা"}
                        </span>
                      </div>

                      {/* Main Question Text */}
                      <h3
                        className={`text-base font-bold text-slate-900 dark:text-white leading-relaxed ${
                          qLang === "ar" ? "font-arabic text-lg" : ""
                        }`}
                        dir={qLang === "ar" ? "rtl" : "ltr"}
                      >
                        {q.question}
                      </h3>

                      {/* Arabic Text with Harakat (if present) */}
                      {q.arabic_text && (
                        <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50 font-arabic text-xl text-emerald-950 dark:text-emerald-200 leading-loose" dir="rtl">
                          {q.arabic_text}
                        </div>
                      )}

                      {/* 4 Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = q.correct_index === optIdx;
                          const optionLabels = qLang === "ar" ? ["أ", "ب", "ج", "د"] : qLang === "en" ? ["A", "B", "C", "D"] : ["ক", "খ", "গ", "ঘ"];
                          return (
                            <div
                              key={optIdx}
                              className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
                                isCorrect
                                  ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-100 font-bold shadow-sm"
                                  : "bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0 ${
                                  isCorrect
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                                }`}
                              >
                                {optionLabels[optIdx]}
                              </span>
                              <span className={`truncate flex-1 ${qLang === "ar" ? "font-arabic text-sm" : ""}`} dir={qLang === "ar" ? "rtl" : "ltr"}>{opt}</span>
                              {isCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation & Source (Accordion/Toggle) */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 animate-in fade-in">
                          {q.explanation && (
                            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
                              <strong>ব্যাখ্যা ও বিশ্লেষণ: </strong>
                              {q.explanation}
                            </div>
                          )}
                          {q.source && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                              <span>উৎস / রেফারেন্স: <strong>{q.source}</strong></span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <button
                      onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs flex items-center gap-1 cursor-pointer"
                      title={isExpanded ? "সংকুচিত করুন" : "ব্যাখ্যা দেখুন"}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => onOpenManualForm(q)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 cursor-pointer"
                      title="এডিট করুন"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm("আপনি কি নিশ্চিত এই প্রশ্নটি মুছে ফেলতে চান?")) {
                          deleteQuestion(q.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
            <HelpCircle className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              কোনো প্রশ্ন খুঁজে পাওয়া যায়নি
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              অনুগ্রহ করে ফিল্টার পরিবর্তন করুন অথবা AI দিয়ে বা ম্যানুয়ালি নতুন প্রশ্ন যুক্ত করুন।
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                onClick={onOpenBulkParser}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                AI দিয়ে টেক্সট পেস্ট করুন
              </button>
              <button
                onClick={onOpenAiGenerator}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                AI দিয়ে প্রশ্ন তৈরি করুন
              </button>
              <button
                onClick={() => {
                  setSelectedSubject("all");
                  setSelectedDifficulty("all");
                  setSelectedExamType("all");
                  setSelectedLanguage("all");
                  setSearchQuery("");
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                ফিল্টার রিসেট
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
