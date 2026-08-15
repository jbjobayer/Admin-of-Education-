import React, { useState, useEffect } from "react";
import { X, CheckCircle2, FileCheck, HelpCircle, Layers } from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import { Exam, ExamCategory, ExamStatus, Question } from "../../types";

interface ExamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  examToEdit?: Exam | null;
}

export const ExamFormModal: React.FC<ExamFormModalProps> = ({
  isOpen,
  onClose,
  examToEdit,
}) => {
  const { questions, addExam, updateExam, showToast } = useAdminData();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExamCategory>("daily_live");
  const [subject, setSubject] = useState("নাহু ও সরফ");
  const [syllabus, setSyllabus] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [totalMarks, setTotalMarks] = useState(20);
  const [negativeMarking, setNegativeMarking] = useState(0.25);
  const [status, setStatus] = useState<ExamStatus>("live");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  useEffect(() => {
    if (examToEdit) {
      setTitle(examToEdit.title);
      setCategory(examToEdit.category);
      setSubject(examToEdit.subject);
      setSyllabus(examToEdit.syllabus || "");
      setDurationMinutes(examToEdit.duration_minutes);
      setTotalMarks(examToEdit.total_marks);
      setNegativeMarking(examToEdit.negative_marking);
      setStatus(examToEdit.status);
      setSelectedQuestionIds(examToEdit.questions.map((q) => q.id));
    } else {
      setTitle("");
      setCategory("daily_live");
      setSubject("নাহু ও সরফ");
      setSyllabus("");
      setDurationMinutes(20);
      setTotalMarks(20);
      setNegativeMarking(0.25);
      setStatus("live");
      // Pick first 5 questions by default
      setSelectedQuestionIds(questions.slice(0, 5).map((q) => q.id));
    }
  }, [examToEdit, questions, isOpen]);

  if (!isOpen) return null;

  const toggleQuestionSelection = (qId: string) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("দয়া করে পরীক্ষার শিরোনাম প্রদান করুন", "error");
      return;
    }

    const selectedQuestions = questions.filter((q) => selectedQuestionIds.includes(q.id));
    const now = new Date();
    const startTime = now.toISOString();
    const endTime = new Date(now.getTime() + durationMinutes * 60000 * 24).toISOString();

    const examData = {
      title: title.trim(),
      category,
      subject,
      syllabus: syllabus.trim(),
      duration_minutes: durationMinutes,
      total_marks: totalMarks,
      negative_marking: negativeMarking,
      start_time: startTime,
      end_time: endTime,
      status,
      participant_count: examToEdit ? examToEdit.participant_count : 0,
      result_published: examToEdit ? examToEdit.result_published : false,
      questions: selectedQuestions.length > 0 ? selectedQuestions : questions.slice(0, 5),
    };

    if (examToEdit) {
      updateExam(examToEdit.id, examData);
    } else {
      addExam(examData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              {examToEdit ? "মডেল টেস্ট এডিট করুন (Edit Exam)" : "নতুন পরীক্ষা তৈরি করুন (Create Model Test)"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              সময়কাল, নেগেটিভ মার্কিং, সিলেবাস ও প্রশ্ন নির্বাচন করুন
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                পরীক্ষার নাম / শিরোনাম *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="যেমন: ১৯তম NTRCA প্রিলি মেগা মডেল টেস্ট - ০১"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                ক্যাটাগরি
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExamCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="daily_live">দৈনিক লাইভ পরীক্ষা (Daily Live)</option>
                <option value="weekly_model_test">সাপ্তাহিক মেগা টেস্ট (Weekly)</option>
                <option value="monthly_mega">মাসিক মেগা মডেল টেস্ট</option>
                <option value="free_test">ফ্রি ট্রায়াল টেস্ট</option>
                <option value="premium_ntrca">প্রিমিয়াম NTRCA স্পেশাল</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                বিষয় / সাবজেক্ট
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="যেমন: আরবি সাহিত্য ও ব্যাকরণ"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                সময়কাল (মিনিট)
              </label>
              <input
                type="number"
                min={5}
                max={180}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                মোট নম্বর
              </label>
              <input
                type="number"
                min={5}
                max={200}
                value={totalMarks}
                onChange={(e) => setTotalMarks(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                নেগেটিভ মার্কিং অনুপাত
              </label>
              <select
                value={negativeMarking}
                onChange={(e) => setNegativeMarking(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value={0}>নাই (০.০০)</option>
                <option value={0.25}>০.২৫ নম্বর কর্তন (প্রমিত NTRCA)</option>
                <option value={0.50}>০.৫০ নম্বর কর্তন</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                স্ট্যাটাস
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ExamStatus)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="live">লাইভ চালু (Live)</option>
                <option value="upcoming">আসন্ন (Upcoming)</option>
                <option value="completed">সম্পন্ন (Completed)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                সিলেবাস ও নির্দেশনা
              </label>
              <textarea
                rows={2}
                value={syllabus}
                onChange={(e) => setSyllabus(e.target.value)}
                placeholder="যেমন: আল-কোরআন ১ম-৫ম পারা, ইলমুন নাহু এর মারফুআত..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Question Picker from Bank */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                প্রশ্ন ব্যাংক থেকে প্রশ্ন নির্বাচন ({selectedQuestionIds.length} টি নির্বাচিত)
              </label>
              <button
                type="button"
                onClick={() => setSelectedQuestionIds(questions.map((q) => q.id))}
                className="text-xs text-emerald-600 font-bold hover:underline"
              >
                সব সিলেক্ট করুন
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 bg-slate-50 dark:bg-slate-800/40">
              {questions.map((q) => {
                const isSelected = selectedQuestionIds.includes(q.id);
                return (
                  <div
                    key={q.id}
                    onClick={() => toggleQuestionSelection(q.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between gap-3 text-xs transition-colors ${
                      isSelected
                        ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 font-medium text-emerald-950 dark:text-emerald-100"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] text-slate-400">[{q.subject_name}]</span>
                      <span className="truncate">{q.question}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-4 h-4 accent-emerald-600 rounded flex-shrink-0"
                    />
                  </div>
                );
              })}
            </div>
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
              {examToEdit ? "আপডেট করুন" : "মডেল টেস্ট প্রকাশ করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
