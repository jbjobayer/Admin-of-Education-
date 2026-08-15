import React, { useState } from "react";
import {
  FileText,
  X,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import { Question } from "../../types";

interface BulkPasteParserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BulkPasteParserModal: React.FC<BulkPasteParserModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { subjects, addBulkQuestions, showToast } = useAdminData();

  const [rawText, setRawText] = useState(
`১. 'আল-কাফি' (الكافي) গ্রন্থটির মূল রচয়িতা কে?
(ক) ইমাম বুখারী (র.)
(খ) আল্লামা কুলাইনী
(গ) ইমাম কুদুরী
(ঘ) ইমাম মারগীনানী
সঠিক উত্তর: খ
ব্যাখ্যা: আল্লামা কুলাইনী শিয়া ফেকাহ ও হাদিসের অন্যতম মৌলিক গ্রন্থ আল-কাফি সংকলন করেন।

২. فعل ماض এর সিগাহ সংখ্যা কয়টি?
(ক) ১২টি
(খ) ১৪টি
(গ) ১৬টি
(ঘ) ১৮টি
সঠিক উত্তর: খ
ব্যাখ্যা: আরবি ব্যাকরণে ফেল মাজি এর মোট ১৪টি সিগাহ রয়েছে।`
  );

  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || "sub-1");
  const [isLoading, setIsLoading] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);

  if (!isOpen) return null;

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  // Client-side regex parser for fallback or fast offline parsing
  const parseWithRegex = (text: string): Question[] => {
    const blocks = text.split(/\n\s*\n|\n(?=\d+[\.\)]|\(\d+\))/);
    const results: Question[] = [];

    blocks.forEach((block, idx) => {
      const lines = block.trim().split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) return;

      const qLine = lines[0].replace(/^\d+[\.\)]\s*|\(\d+\)\s*/, "");
      const options: string[] = [];
      let correctIdx = 0;
      let explanation = "";
      let arabicText = "";

      // Check for arabic in question
      const arabicMatch = qLine.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]+/g);
      if (arabicMatch && arabicMatch.join(" ").length > 3) {
        arabicText = arabicMatch.join(" ");
      }

      lines.slice(1).forEach((line) => {
        if (/^[\(\[]?[ক-ঘa-d১-৪][\)\]\.\-]/i.test(line)) {
          const optText = line.replace(/^[\(\[]?[ক-ঘa-d১-৪][\)\]\.\-\s]*/i, "").trim();
          options.push(optText);
        } else if (/সঠিক\s*উত্তর|উত্তর|Ans|Answer/i.test(line)) {
          if (/খ|b|২/i.test(line)) correctIdx = 1;
          else if (/গ|c|৩/i.test(line)) correctIdx = 2;
          else if (/ঘ|d|৪/i.test(line)) correctIdx = 3;
          else correctIdx = 0;
        } else if (/ব্যাখ্যা|Explanation/i.test(line)) {
          explanation = line.replace(/^(ব্যাখ্যা|Explanation)[:\s]*/i, "").trim();
        }
      });

      // Ensure 4 options
      while (options.length < 4) {
        options.push(`বিকল্প ${options.length + 1}`);
      }

      results.push({
        id: `parsed-${Date.now()}-${idx}`,
        subject_id: currentSubject.id,
        subject_name: currentSubject.name_bn,
        topic: "বাল্ক পেস্ট",
        question: qLine,
        arabic_text: arabicText || undefined,
        options: options.slice(0, 4),
        correct_index: correctIdx,
        explanation: explanation || "সঠিক উত্তর মাদ্রাসা কারিকুলাম ভিত্তিক।",
        source: "টেক্সট পার্সার",
        difficulty: "Medium",
        exam_type: "NTRCA",
        created_at: new Date().toISOString(),
      });
    });

    return results;
  };

  const handleParseText = async (useAi: boolean = false) => {
    if (!rawText.trim()) return;
    setIsLoading(true);

    if (useAi) {
      try {
        const response = await fetch("/api/gemini/parse-raw-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            raw_text: rawText,
            subject_name: currentSubject.name_bn,
          }),
        });

        const data = await response.json();
        if (data.success && Array.isArray(data.questions)) {
          const formatted: Question[] = data.questions.map((q: any, i: number) => ({
            id: `ai-parsed-${Date.now()}-${i}`,
            subject_id: currentSubject.id,
            subject_name: currentSubject.name_bn,
            topic: q.topic || "বাল্ক ইমপোর্ট",
            question: q.question,
            arabic_text: q.arabic_text || "",
            options: q.options || ["ক", "খ", "গ", "ঘ"],
            correct_index: q.correct_index || 0,
            explanation: q.explanation || "",
            source: q.source || "পার্সার ভেরিফাইড",
            difficulty: q.difficulty || "Medium",
            exam_type: q.exam_type || "NTRCA",
            created_at: new Date().toISOString(),
          }));
          setParsedQuestions(formatted);
          showToast(`${formatted.length}টি প্রশ্ন AI দিয়ে নির্ভুলভাবে পার্স হয়েছে!`, "success");
        } else {
          throw new Error("AI parser failed");
        }
      } catch (err) {
        console.error(err);
        const regexResults = parseWithRegex(rawText);
        setParsedQuestions(regexResults);
        showToast(`${regexResults.length}টি প্রশ্ন পার্স করা হয়েছে!`, "info");
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

  const handleSaveToBank = () => {
    if (parsedQuestions.length === 0) return;
    addBulkQuestions(parsedQuestions);
    setParsedQuestions([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                স্মার্ট বাল্ক টেক্সট পার্সার (Smart Raw Text MCQ Parser)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                যেকোনো টেক্সট বা ওয়ার্ড ফাইল থেকে পেস্ট করুন; সিস্টেম স্বয়ংক্রিয়ভাবে প্রশ্ন, অপশন ও উত্তর আলাদা করবে
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

        {/* Input Area */}
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <label className="font-bold text-slate-700 dark:text-slate-300">
              বিষয় নির্বাচন করুন:
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name_bn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="এখানে আপনার প্রশ্ন পেস্ট করুন..."
              className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            <button
              onClick={() => handleParseText(false)}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer text-xs"
            >
              দ্রুত পার্স (Regex Engine)
            </button>

            <button
              onClick={() => handleParseText(true)}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold transition-all cursor-pointer text-xs flex items-center gap-2 shadow-md shadow-amber-500/20"
            >
              {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>AI স্মার্ট পার্স (Gemini)</span>
            </button>
          </div>
        </div>

        {/* Parsed Preview */}
        {parsedQuestions.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>পার্স করা প্রশ্নসমূহ ({parsedQuestions.length} টি)</span>
              </h4>

              <button
                onClick={handleSaveToBank}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                সব প্রশ্ন ব্যাংকে যুক্ত করুন
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
              {parsedQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs"
                >
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-emerald-600">{idx + 1}.</span>
                    <span className="font-bold text-slate-900 dark:text-white">{q.question}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        className={`p-1.5 rounded-lg border text-[11px] ${
                          q.correct_index === oIdx
                            ? "bg-emerald-100 border-emerald-500 font-bold text-emerald-900"
                            : "bg-white border-slate-200 text-slate-700"
                        }`}
                      >
                        {["ক", "খ", "গ", "ঘ"][oIdx]}. {opt}
                      </div>
                    ))}
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
