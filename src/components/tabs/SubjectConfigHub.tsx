import React, { useState } from "react";
import {
  FolderTree,
  Plus,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  BookOpen,
  HelpCircle,
  Sparkles,
  Check,
} from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import { SubjectConfig } from "../../types";

export const SubjectConfigHub: React.FC = () => {
  const { subjects, updateSubject, toggleSubjectActive, toggleSubjectPremiumLock, addSubject, showToast, searchQuery } = useAdminData();
  const [editingSubject, setEditingSubject] = useState<SubjectConfig | null>(null);
  const [isNewSubjectModalOpen, setIsNewSubjectModalOpen] = useState(false);

  // Form states for adding/editing subject
  const [nameBn, setNameBn] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [topicsInput, setTopicsInput] = useState("");
  const [isPremiumOnly, setIsPremiumOnly] = useState(false);
  const [colorAccent, setColorAccent] = useState("emerald");

  const openEditModal = (sub: SubjectConfig) => {
    setEditingSubject(sub);
    setNameBn(sub.name_bn);
    setNameAr(sub.name_ar);
    setTopicsInput(sub.topics.join(", "));
    setIsPremiumOnly(sub.is_premium_only);
    setColorAccent(sub.color_accent);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;

    updateSubject(editingSubject.id, {
      name_bn: nameBn,
      name_ar: nameAr,
      topics: topicsInput.split(",").map((t) => t.trim()).filter(Boolean),
      is_premium_only: isPremiumOnly,
      color_accent: colorAccent,
    });

    setEditingSubject(null);
  };

  const handleCreateNewSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameBn.trim()) return;

    addSubject({
      name_bn: nameBn,
      name_ar: nameAr || nameBn,
      icon: "BookOpen",
      question_count: 0,
      is_premium_only: isPremiumOnly,
      is_active: true,
      topics: topicsInput.split(",").map((t) => t.trim()).filter(Boolean),
      color_accent: colorAccent,
      order: subjects.length + 1,
    });

    setIsNewSubjectModalOpen(false);
    setNameBn("");
    setNameAr("");
    setTopicsInput("");
  };

  const filteredSubjects = subjects.filter((s) => {
    return (
      !searchQuery ||
      s.name_bn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.topics.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-emerald-600" />
            <span>বিষয়ভিত্তিক প্রস্তুতি কনফিগারেশন (Subject Hub & Premium Locks)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ১৫+ মাদরাসা ও জেনারেল বিষয়ের দৃশ্যমানতা, প্রশ্ন ব্যাংক ও প্রিমিয়াম লক নিয়ন্ত্রণ
          </p>
        </div>

        <button
          onClick={() => {
            setNameBn("");
            setNameAr("");
            setTopicsInput("");
            setIsPremiumOnly(false);
            setIsNewSubjectModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন বিষয় যুক্ত করুন</span>
        </button>
      </div>

      {/* Subject Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSubjects.map((subject) => {
          return (
            <div
              key={subject.id}
              className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                subject.is_active
                  ? "border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md"
                  : "border-slate-300 dark:border-slate-800 opacity-60 bg-slate-50"
              }`}
            >
              <div>
                {/* Top status & lock toggles */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                    ID: {subject.id}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Premium Lock Toggle */}
                    <button
                      onClick={() => toggleSubjectPremiumLock(subject.id)}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        subject.is_premium_only
                          ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                      }`}
                      title={subject.is_premium_only ? "প্রিমিয়াম লক সক্রিয়" : "ফ্রি সকলের জন্য"}
                    >
                      {subject.is_premium_only ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      <span className="text-[10px]">{subject.is_premium_only ? "প্রিমিয়াম লক" : "ফ্রি"}</span>
                    </button>

                    {/* Active Visibility Toggle */}
                    <button
                      onClick={() => toggleSubjectActive(subject.id)}
                      className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        subject.is_active
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                      }`}
                      title={subject.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                    >
                      {subject.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => openEditModal(subject)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="এডিট"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subject Names */}
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {subject.name_bn}
                </h3>

                {subject.name_ar && (
                  <p className="font-arabic text-sm text-emerald-800 dark:text-emerald-300 mt-1">
                    {subject.name_ar}
                  </p>
                )}

                {/* Topics Pills */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {subject.topics.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom stats */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                  প্রশ্ন সংখ্যা: <strong>{subject.question_count.toLocaleString("bn-BD")}</strong> টি
                </span>
                <span className={`text-[10px] font-bold ${subject.is_active ? "text-emerald-600" : "text-slate-400"}`}>
                  {subject.is_active ? "অ্যাপে দৃশ্যমান" : "হাইড করা"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              বিষয় সম্পাদনা: {editingSubject.name_bn}
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  বিষয়ের নাম (বাংলা)
                </label>
                <input
                  type="text"
                  value={nameBn}
                  onChange={(e) => setNameBn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  বিষয়ের নাম (আরবি / Arabic)
                </label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-arabic text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  অধ্যায় / টপিকসমূহ (কমা দিয়ে আলাদা করুন)
                </label>
                <textarea
                  rows={3}
                  value={topicsInput}
                  onChange={(e) => setTopicsInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="edit-premium-lock"
                  checked={isPremiumOnly}
                  onChange={(e) => setIsPremiumOnly(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
                <label htmlFor="edit-premium-lock" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  শুধুমাত্র প্রিমিয়াম মেম্বারদের জন্য লক রাখুন
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Subject Modal */}
      {isNewSubjectModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              নতুন বিষয় যোগ করুন
            </h3>

            <form onSubmit={handleCreateNewSubject} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  বিষয়ের নাম (বাংলা)
                </label>
                <input
                  type="text"
                  value={nameBn}
                  onChange={(e) => setNameBn(e.target.value)}
                  placeholder="যেমন: আল কুরআন ও তাফসির"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  বিষয়ের নাম (আরবি)
                </label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="القرآن الكريم والتفسير"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-arabic text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  টপিকসমূহ (কমা দিয়ে আলাদা করুন)
                </label>
                <textarea
                  rows={2}
                  value={topicsInput}
                  onChange={(e) => setTopicsInput(e.target.value)}
                  placeholder="টপিক ১, টপিক ২, টপিক ৩..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="new-premium-lock"
                  checked={isPremiumOnly}
                  onChange={(e) => setIsPremiumOnly(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
                <label htmlFor="new-premium-lock" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  শুধুমাত্র প্রিমিয়াম মেম্বারদের জন্য লক রাখুন
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewSubjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  যুক্ত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
