import React, { useState, useEffect } from "react";
import { X, Briefcase, Flame } from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import { JobCircular } from "../../types";

interface JobCircularModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobToEdit?: JobCircular | null;
}

export const JobCircularModal: React.FC<JobCircularModalProps> = ({
  isOpen,
  onClose,
  jobToEdit,
}) => {
  const { addJobCircular, updateJobCircular, showToast } = useAdminData();

  const [title, setTitle] = useState("");
  const [organization, setOrganization] = useState("");
  const [category, setCategory] = useState("মাদ্রাসা শিক্ষা");
  const [vacancies, setVacancies] = useState("");
  const [qualification, setQualification] = useState("");
  const [deadline, setDeadline] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [isHot, setIsHot] = useState(false);

  useEffect(() => {
    if (jobToEdit) {
      setTitle(jobToEdit.title);
      setOrganization(jobToEdit.organization);
      setCategory(jobToEdit.category);
      setVacancies(jobToEdit.vacancies);
      setQualification(jobToEdit.qualification);
      setDeadline(jobToEdit.deadline);
      setApplyUrl(jobToEdit.apply_url);
      setIsHot(jobToEdit.is_hot);
    } else {
      setTitle("");
      setOrganization("");
      setCategory("মাদ্রাসা শিক্ষা");
      setVacancies("১০০+");
      setQualification("ফাজিল/কামিল বা সমমান");
      setDeadline("২০২৬-১২-৩১");
      setApplyUrl("http://ntrca.teletalk.com.bd");
      setIsHot(false);
    }
  }, [jobToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !organization.trim()) {
      showToast("দয়া করে পদের নাম ও প্রতিষ্ঠানের নাম পূরণ করুন", "error");
      return;
    }

    const jobData = {
      title: title.trim(),
      organization: organization.trim(),
      category: category.trim(),
      vacancies: vacancies.trim() || "নির্ধারিত নয়",
      qualification: qualification.trim(),
      deadline: deadline.trim() || "২০২৬-১২-৩১",
      apply_url: applyUrl.trim() || "http://ntrca.teletalk.com.bd",
      is_hot: isHot,
      is_active: true,
      posted_at: new Date().toISOString().slice(0, 10),
    };

    if (jobToEdit) {
      updateJobCircular(jobToEdit.id, jobData);
    } else {
      addJobCircular(jobData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              {jobToEdit ? "নিয়োগ বিজ্ঞপ্তি সম্পাদনা (Edit Circular)" : "নতুন জব বিজ্ঞপ্তি যুক্ত করুন (Add Job Circular)"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              প্রতিষ্ঠানের নাম, পদের বিবরণ, আবেদনের শেষ তারিখ ও লিংক
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
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              বিজ্ঞপ্তির শিরোনাম / পদের নাম *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: বেসরকারি শিক্ষক নিবন্ধন (NTRCA) ১৯তম শিক্ষক নিয়োগ"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                প্রতিষ্ঠান / অধিদপ্তর *
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="যেমন: মাদ্রাসা শিক্ষা অধিদপ্তর, ঢাকা"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                ক্যাটাগরি
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="যেমন: সরকারি মাদ্রাসা / NTRCA"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                মোট পদসংখ্যা
              </label>
              <input
                type="text"
                value={vacancies}
                onChange={(e) => setVacancies(e.target.value)}
                placeholder="যেমন: ৯৬,৭৩৬ জন"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                আবেদনের শেষ তারিখ (YYYY-MM-DD)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              প্রয়োজনীয় শিক্ষাগত যোগ্যতা
            </label>
            <input
              type="text"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              placeholder="যেমন: আলিম/ফাজিল/স্নাতক (সম্মান) বা সমমান ডিগ্রি"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              আবেদনের সরাসরি লিংক (URL)
            </label>
            <input
              type="text"
              value={applyUrl}
              onChange={(e) => setApplyUrl(e.target.value)}
              placeholder="http://..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="job-is-hot"
              checked={isHot}
              onChange={(e) => setIsHot(e.target.checked)}
              className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
            />
            <label htmlFor="job-is-hot" className="font-bold text-rose-600 flex items-center gap-1 cursor-pointer">
              <Flame className="w-3.5 h-3.5" />
              <span>হট নিয়োগ বিজ্ঞপ্তি হিসেবে হাইলাইট করুন</span>
            </label>
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
              {jobToEdit ? "আপডেট করুন" : "বিজ্ঞপ্তি প্রকাশ করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
