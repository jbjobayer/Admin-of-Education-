import React, { useState, useEffect } from "react";
import { X, CheckCircle2, BookOpen, Sparkles, Layers } from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import { Question, QuestionDifficulty, ExamTargetCategory } from "../../types";

interface QuestionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionToEdit?: Question | null;
}

export const QuestionFormModal: React.FC<QuestionFormModalProps> = ({
  isOpen,
  onClose,
  questionToEdit,
}) => {
  const { subjects, addQuestion, updateQuestion, showToast } = useAdminData();

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
      setSubjectId(questionToEdit.subject_id);
      setTopic(questionToEdit.topic || "");
      setQuestionText(questionToEdit.question);
      setArabicText(questionToEdit.arabic_text || "");
      setOptionA(questionToEdit.options[0] || "");
      setOptionB(questionToEdit.options[1] || "");
      setOptionC(questionToEdit.options[2] || "");
      setOptionD(questionToEdit.options[3] || "");
      setCorrectIndex(questionToEdit.correct_index);
      setExplanation(questionToEdit.explanation);
      setSource(questionToEdit.source || "");
      setDifficulty(questionToEdit.difficulty);
      setExamType(questionToEdit.exam_type);
    } else {
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
  }, [questionToEdit, subjects, isOpen]);

  if (!isOpen) return null;

  const currentSubject = subjects.find((s) => s.id === subjectId) || subjects[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !optionA.trim() || !optionB.trim()) {
      showToast("দয়া করে প্রশ্ন ও অন্তত দুটি বিকল্প পূরণ করুন", "error");
      return;
    }

    const qData = {
      subject_id: subjectId,
      subject_name: currentSubject.name_bn,
      topic: topic.trim() || "সাধারণ",
      question: questionText.trim(),
      arabic_text: arabicText.trim() || undefined,
      options: [optionA.trim(), optionB.trim(), optionC.trim() || "গ", optionD.trim() || "ঘ"],
      correct_index: correctIndex,
      explanation: explanation.trim(),
      source: source.trim() || "মাদ্রাসা পাঠ্যবই ও রেফারেন্স",
      difficulty,
      exam_type: examType,
    };

    if (questionToEdit) {
      updateQuestion(questionToEdit.id, qData);
    } else {
      addQuestion(qData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              {questionToEdit ? "প্রশ্ন সম্পাদনা করুন (Edit Question)" : "নতুন প্রশ্ন তৈরি (Create Question)"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              আরবি হরকত, ৪টি বিকল্প, সঠিক উত্তর ও প্রামাণিক ব্যাখ্যা প্রদান করুন
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                অধ্যায় / টপিক
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="যেমন: নহুমীর / কাফিয়া / ফিকহুল আকবর"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              মূল প্রশ্ন (বাংলা) *
            </label>
            <textarea
              rows={2}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="প্রশ্নটি এখানে টাইপ করুন..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium leading-relaxed"
              required
            />
          </div>

          {/* Arabic Text (Optional) with live Harakat preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                আরবি মূল ইবারত বা আয়াত/হাদিস (হরকত সহ - ঐচ্ছিক)
              </label>
              <span className="text-[10px] text-emerald-600 font-semibold font-mono">
                UTF-8 Arabic Supported
              </span>
            </div>
            <input
              type="text"
              value={arabicText}
              onChange={(e) => setArabicText(e.target.value)}
              placeholder="مثال: إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-arabic text-base"
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
              ৪টি অপশন ও সঠিক উত্তর নির্ধারণ করুন *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { label: "ক", val: optionA, set: setOptionA, idx: 0 },
                { label: "খ", val: optionB, set: setOptionB, idx: 1 },
                { label: "গ", val: optionC, set: setOptionC, idx: 2 },
                { label: "ঘ", val: optionD, set: setOptionD, idx: 3 },
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
                    className="w-full bg-transparent border-none focus:outline-none text-slate-900 dark:text-white font-medium text-xs"
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
