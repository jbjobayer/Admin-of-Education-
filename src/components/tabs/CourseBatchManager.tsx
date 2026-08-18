import React, { useState } from "react";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Calendar,
  PlayCircle,
  DownloadCloud,
  CheckCircle2,
  Users,
  Video,
  FileText,
  Sliders,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MoveUp,
  MoveDown,
  Eye,
  EyeOff,
  Link2,
} from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import { Course, CourseButton, CourseChapter } from "../../types";

interface CourseBatchManagerProps {
  onOpenCourseForm: (courseToEdit?: Course) => void;
}

export const CourseBatchManager: React.FC<CourseBatchManagerProps> = ({ onOpenCourseForm }) => {
  const { courses, deleteCourse, updateCourse, updateCourseButtons, showToast, searchQuery } = useAdminData();
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(courses[0]?.id || null);
  const [editingButtonsCourseId, setEditingButtonsCourseId] = useState<string | null>(null);

  const filteredCourses = courses.filter((c) => {
    return (
      !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mentor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.course_tag.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Toggle button active state
  const handleToggleButtonActive = (courseId: string, btnId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;
    const buttons = course.custom_buttons || [];
    const updatedButtons = buttons.map((btn) =>
      btn.id === btnId ? { ...btn, is_active: !btn.is_active } : btn
    );
    updateCourseButtons(courseId, updatedButtons);
  };

  // Add new dynamic button to course
  const handleAddNewButton = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;
    const buttons = course.custom_buttons || [];

    const newBtn: CourseButton = {
      id: `btn-${Date.now()}`,
      label: "নতুন বাটন",
      action_type: "pdf_url",
      action_value: "https://example.com/file.pdf",
      is_active: true,
      order: buttons.length + 1,
      color: "bg-emerald-600 text-white",
    };

    updateCourseButtons(courseId, [...buttons, newBtn]);
  };

  // Delete dynamic button
  const handleDeleteButton = (courseId: string, btnId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;
    const buttons = course.custom_buttons || [];
    const updatedButtons = buttons.filter((b) => b.id !== btnId);
    updateCourseButtons(courseId, updatedButtons);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & New Course Action */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <span>কোর্স ও ব্যাচ ম্যানেজার (Course & Batch CMS)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            কোর্সের বাটন, ভিডিও লেকচার, রুটিন ডাউনলোড লিংক ও সিলেবাস কনফিগারেশন
          </p>
        </div>

        <button
          onClick={() => onOpenCourseForm()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন কোর্স যুক্ত করুন</span>
        </button>
      </div>

      {/* Courses List */}
      <div className="space-y-6">
        {filteredCourses.map((course) => {
          const isExpanded = expandedCourseId === course.id;
          const isEditingButtons = editingButtonsCourseId === course.id;

          return (
            <div
              key={course.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
            >
              {/* Course Main Card Header */}
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  {/* Left: Cover & Info */}
                  <div className="flex flex-col sm:flex-row items-start gap-4 flex-1">
                    <img
                      src={course.cover_image}
                      alt={course.title}
                      className="w-full sm:w-44 h-28 object-cover rounded-2xl border border-slate-200 dark:border-slate-700 flex-shrink-0"
                    />

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          {course.course_tag}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          মেন্টর: <strong>{course.mentor}</strong>
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {course.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {course.subtitle}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-extrabold text-emerald-600">
                            ৳{course.discount_price}
                          </span>
                          {course.original_price > course.discount_price && (
                            <span className="text-xs text-slate-400 line-through">
                              ৳{course.original_price}
                            </span>
                          )}
                        </div>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-amber-600" />
                          ভর্তি হয়েছেন: <strong>{(course.enrolled_count || 0).toLocaleString("bn-BD")}</strong> জন
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setEditingButtonsCourseId(isEditingButtons ? null : course.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border ${
                        isEditingButtons
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>বাটন কন্ট্রোল ({(course.custom_buttons || []).length})</span>
                    </button>

                    <button
                      onClick={() => onOpenCourseForm(course)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                      title="কোর্স এডিট করুন"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm("আপনি কি নিশ্চিত এই কোর্সটি মুছে ফেলতে চান?")) {
                          deleteCourse(course.id);
                        }
                      }}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 text-slate-600 dark:text-slate-300 hover:text-rose-600 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                      title="কোর্স মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Interactive Dynamic Buttons Preview Bar */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      শিক্ষার্থীদের মোবাইল অ্যাপে দৃশ্যমান বাটনসমূহ:
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      লাইভ ইন্টারেক্টিভ অ্যাকশন
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {(course.custom_buttons || []).map((btn) => (
                      <div
                        key={btn.id}
                        className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                          btn.is_active
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700"
                            : "opacity-40 line-through bg-slate-50 dark:bg-slate-900 border-dashed border-slate-300 text-slate-400"
                        }`}
                      >
                        <span>{btn.label}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
                          {btn.action_type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Granular Button Builder Panel (Expandable) */}
                {isEditingButtons && (
                  <div className="mt-5 p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 animate-in fade-in space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-amber-950 dark:text-amber-200">
                          গ্রানুলার বাটন কাস্টমাইজার (Granular Button & Action Builder)
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400">
                          প্রতিটি বাটনের টেক্সট, দৃশ্যমানতা (Enable/Disable), পিডিএফ বা ভিডিও অ্যাকশন URL পরিবর্তন করুন
                        </p>
                      </div>

                      <button
                        onClick={() => handleAddNewButton(course.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ নতুন বাটন</span>
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {course.custom_buttons.map((btn, index) => (
                        <div
                          key={btn.id}
                          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2 flex-1 w-full md:w-auto">
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold text-[10px]">
                              {index + 1}
                            </span>
                            <input
                              type="text"
                              value={btn.label}
                              onChange={(e) => {
                                const updated = course.custom_buttons.map((b) =>
                                  b.id === btn.id ? { ...b, label: e.target.value } : b
                                );
                                updateCourseButtons(course.id, updated);
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-800 dark:text-white"
                              placeholder="বাটন নাম"
                            />
                            <select
                              value={btn.action_type}
                              onChange={(e) => {
                                const updated = course.custom_buttons.map((b) =>
                                  b.id === btn.id ? { ...b, action_type: e.target.value as any } : b
                                );
                                updateCourseButtons(course.id, updated);
                              }}
                              className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            >
                              <option value="pdf_url">PDF ডাউনলোড লিংক</option>
                              <option value="video_url">ভিডিও ক্লাস লিংক</option>
                              <option value="payment_drawer">ভর্তি/পেমেন্ট ড্রয়ার</option>
                              <option value="external_link">বাহ্যিক লিংক</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                            <input
                              type="text"
                              value={btn.action_value}
                              onChange={(e) => {
                                const updated = course.custom_buttons.map((b) =>
                                  b.id === btn.id ? { ...b, action_value: e.target.value } : b
                                );
                                updateCourseButtons(course.id, updated);
                              }}
                              placeholder="অ্যাকশন ভ্যালু বা URL"
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex-1 md:w-60 font-mono text-[11px]"
                            />

                            <button
                              onClick={() => handleToggleButtonActive(course.id, btn.id)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                btn.is_active
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                  : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                              }`}
                              title={btn.is_active ? "সক্রিয় (ক্লিক করে নিষ্ক্রিয় করুন)" : "নিষ্ক্রিয়"}
                            >
                              {btn.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>

                            <button
                              onClick={() => handleDeleteButton(course.id, btn.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                              title="বাটন মুছুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
