import React, { useState } from "react";
import {
  Briefcase,
  Plus,
  Flame,
  Calendar,
  Building,
  ExternalLink,
  Users,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import { JobCircular } from "../../types";

interface JobCircularManagerProps {
  onOpenJobForm: (jobToEdit?: JobCircular) => void;
}

export const JobCircularManager: React.FC<JobCircularManagerProps> = ({ onOpenJobForm }) => {
  const { jobCirculars, deleteJobCircular, toggleJobCircularActive, toggleJobCircularHot, searchQuery } = useAdminData();

  const filteredJobs = jobCirculars.filter((j) => {
    return (
      !searchQuery ||
      j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.qualification.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-600" />
            <span>জব সার্কুলার ও বুলেটিন ম্যানেজার (Job Circulars CMS)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            শিক্ষক নিবন্ধন (NTRCA), মাদ্রাসা শিক্ষা অধিদপ্তর ও ইসলামিক ফাউন্ডেশনের নিয়োগ বিজ্ঞপ্তি
          </p>
        </div>

        <button
          onClick={() => onOpenJobForm()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন বিজ্ঞপ্তি যুক্ত করুন</span>
        </button>
      </div>

      {/* Circulars List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredJobs.map((job) => {
          const isExpired = new Date(job.deadline) < new Date();

          return (
            <div
              key={job.id}
              className={`bg-white dark:bg-slate-900 rounded-3xl p-6 border transition-all flex flex-col justify-between ${
                job.is_active
                  ? "border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md"
                  : "border-slate-300 dark:border-slate-800 opacity-60 bg-slate-50"
              }`}
            >
              <div>
                {/* Badges & Hot Indicator */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                      {job.category}
                    </span>

                    {job.is_hot && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500 text-white flex items-center gap-1 animate-pulse">
                        <Flame className="w-3 h-3" />
                        <span>হট সার্কুলার</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Hot Toggle */}
                    <button
                      onClick={() => toggleJobCircularHot(job.id)}
                      className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        job.is_hot
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      }`}
                      title={job.is_hot ? "হট ব্যাজ নিষ্ক্রিয় করুন" : "হট ব্যাজ যুক্ত করুন"}
                    >
                      <Flame className="w-3.5 h-3.5" />
                    </button>

                    {/* Active Toggle */}
                    <button
                      onClick={() => toggleJobCircularActive(job.id)}
                      className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        job.is_active
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                      }`}
                      title={job.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                    >
                      {job.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => onOpenJobForm(job)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="এডিট"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm("আপনি কি নিশ্চিত এই সার্কুলারটি মুছে ফেলতে চান?")) {
                          deleteJobCircular(job.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="মুছুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Job Title & Org */}
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {job.title}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mt-1.5 font-medium">
                  <Building className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{job.organization}</span>
                </div>

                {/* Details Grid */}
                <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>পদসংখ্যা:</span>
                    <strong className="text-emerald-600">{job.vacancies}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>যোগ্যতা:</span>
                    <span className="truncate max-w-[200px] font-medium">{job.qualification}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>আবেদনের শেষ তারিখ:</span>
                    <span className={`font-bold ${isExpired ? "text-rose-500" : "text-amber-600"}`}>
                      {job.deadline} {isExpired && "(মেয়াদ উত্তীর্ণ)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Application Link */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <a
                  href={job.apply_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                >
                  <span>আবেদনের লিংক ভিজিট করুন</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <span className="text-[10px] text-slate-400 font-mono">
                  পোস্ট করা হয়েছে: {job.posted_at}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
