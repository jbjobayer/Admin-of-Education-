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
  FileQuestion,
  HelpCircle,
  Sparkles,
  Layers,
} from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import { Course, CourseButton, CourseChapter } from "../../types";

interface CourseBatchManagerProps {
  onOpenCourseForm: (courseToEdit?: Course) => void;
  onOpenExamFormForCourse?: (courseId: string) => void;
}

export const CourseBatchManager: React.FC<CourseBatchManagerProps> = ({
  onOpenCourseForm,
  onOpenExamFormForCourse,
}) => {
  const {
    courses,
    exams,
    questions,
    deleteCourse,
    updateCourse,
    updateCourseButtons,
    getCourseExams,
    getCourseQuestions,
    linkExamToCourse,
    openExamInSimulator,
    showToast,
    searchQuery,
  } = useAdminData();

  const [expandedExamsCourseId, setExpandedExamsCourseId] = useState<string | null>(null);
  const [editingButtonsCourseId, setEditingButtonsCourseId] = useState<string | null>(null);
  const [linkingExamCourseId, setLinkingExamCourseId] = useState<string | null>(null);
  const [selectedExamToLink, setSelectedExamToLink] = useState<string>("");

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

  // Handle linking an exam to course
  const handleLinkExamSubmit = async (courseId: string) => {
    if (!selectedExamToLink) {
      showToast("দয়া করে একটি পরীক্ষা নির্বাচন করুন", "error");
      return;
    }
    await linkExamToCourse(selectedExamToLink, courseId);
    setSelectedExamToLink("");
    setLinkingExamCourseId(null);
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
            কোর্সের বাটন, সংযুক্ত মডেল টেস্ট পরীক্ষা, প্রশ্ন ব্যাংক, ভিডিও লেকচার ও রুটিন ব্যবস্থাপনা
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
          const isEditingButtons = editingButtonsCourseId === course.id;
          const isExamsExpanded = expandedExamsCourseId === course.id;
          const isLinkingModal = linkingExamCourseId === course.id;

          const courseExamsList = getCourseExams(course.id);
          const courseQuestionsList = getCourseQuestions(course.id);

          const totalExamCount = courseExamsList.length || course.total_exams || 0;
          const totalQuestionsCount =
            courseQuestionsList.length ||
            courseExamsList.reduce((acc, e) => acc + (e.questions?.length || e.total_questions || 0), 0) ||
            course.total_questions ||
            0;

          // Available exams to link
          const unlinkedExams = exams.filter(
            (e) => !courseExamsList.some((ce) => ce.id === e.id)
          );

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

                        {/* Exam & Question counts pills */}
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-[11px] flex items-center gap-1 border border-purple-200 dark:border-purple-800">
                          <FileText className="w-3 h-3 text-purple-600" />
                          {totalExamCount} টি পরীক্ষা
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-[11px] flex items-center gap-1 border border-blue-200 dark:border-blue-800">
                          <HelpCircle className="w-3 h-3 text-blue-600" />
                          {totalQuestionsCount} টি প্রশ্ন
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setExpandedExamsCourseId(isExamsExpanded ? null : course.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border ${
                        isExamsExpanded
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>পরীক্ষা ও প্রশ্ন ({totalExamCount})</span>
                      {isExamsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

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

                {/* Granular Linked Exams & Question Management Panel (Expandable) */}
                {isExamsExpanded && (
                  <div className="mt-5 p-5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/60 animate-in fade-in space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-purple-600" />
                          <span>এই কোর্সের সাথে সংযুক্ত পরীক্ষা ও প্রশ্নব্যাংক ({courseExamsList.length} টি পরীক্ষা, {totalQuestionsCount} টি প্রশ্ন)</span>
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          কোর্স সাবস্ক্রাইবকারী শিক্ষার্থীরা এই পরীক্ষাগুলো লাইভ দিতে পারবে এবং ফলাফল দেখতে পারবে
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {onOpenExamFormForCourse && (
                          <button
                            onClick={() => onOpenExamFormForCourse(course.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ নতুন পরীক্ষা তৈরি করুন</span>
                          </button>
                        )}

                        <button
                          onClick={() => setLinkingExamCourseId(isLinkingModal ? null : course.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-slate-700 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold cursor-pointer transition-colors"
                        >
                          <Link2 className="w-3.5 h-3.5" />
                          <span>বিদ্যমান পরীক্ষা লিঙ্ক করুন</span>
                        </button>
                      </div>
                    </div>

                    {/* Linking Dropdown Form */}
                    {isLinkingModal && (
                      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-in fade-in">
                        <div className="flex-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                            সংযুক্ত করার জন্য পরীক্ষা নির্বাচন করুন:
                          </label>
                          <select
                            value={selectedExamToLink}
                            onChange={(e) => setSelectedExamToLink(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-white"
                          >
                            <option value="">-- পরীক্ষা বেছে নিন --</option>
                            {unlinkedExams.map((ex) => (
                              <option key={ex.id} value={ex.id}>
                                📝 {ex.title} ({ex.subject} - {ex.total_questions || ex.questions?.length || 0} টি প্রশ্ন)
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-end gap-2">
                          <button
                            onClick={() => handleLinkExamSubmit(course.id)}
                            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer transition-colors"
                          >
                            সংযুক্ত করুন
                          </button>
                          <button
                            onClick={() => setLinkingExamCourseId(null)}
                            className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                          >
                            বাতিল
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Exams List in Course */}
                    {courseExamsList.length === 0 ? (
                      <div className="p-6 text-center rounded-xl bg-white/70 dark:bg-slate-900/50 border border-dashed border-purple-200 dark:border-purple-900/40">
                        <FileQuestion className="w-8 h-8 text-purple-400 mx-auto mb-2 opacity-60" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          এখনো কোনো পরীক্ষা সরাসরি এই কোর্সে সংযুক্ত করা হয়নি
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          উপরের "নতুন পরীক্ষা তৈরি করুন" অথবা "বিদ্যমান পরীক্ষা লিঙ্ক করুন" বোতাম চেপে পরীক্ষা ও প্রশ্ন সংযুক্ত করুন
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {courseExamsList.map((ex) => {
                          const exQuestions =
                            ex.questions ||
                            questions.filter((q) => q.exam_id === ex.id) ||
                            [];
                          const qCount = exQuestions.length || ex.total_questions || 0;

                          return (
                            <div
                              key={ex.id}
                              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-100 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-3"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-[10px] font-bold">
                                    {ex.subject || "সাধারণ বিষয়"}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400">
                                    {ex.duration_minutes} মিনিট • {ex.total_marks || 100} মার্ক
                                  </span>
                                </div>
                                <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                                  {ex.title}
                                </h5>
                                {ex.syllabus && (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                                    সিলেবাস: {ex.syllabus}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{qCount} টি প্রশ্ন যুক্ত আছে</span>
                                </span>

                                <button
                                  onClick={() => openExamInSimulator(ex)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors border border-emerald-200 dark:border-emerald-800"
                                >
                                  <PlayCircle className="w-3 h-3" />
                                  <span>সিমুলেটরে টেস্ট দিন</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

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
