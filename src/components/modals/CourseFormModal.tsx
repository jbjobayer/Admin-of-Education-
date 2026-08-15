import React, { useState, useEffect } from "react";
import { X, BookOpen, Plus, Trash2 } from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import { Course, CourseButton } from "../../types";

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseToEdit?: Course | null;
}

export const CourseFormModal: React.FC<CourseFormModalProps> = ({
  isOpen,
  onClose,
  courseToEdit,
}) => {
  const { addCourse, updateCourse, showToast } = useAdminData();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [courseTag, setCourseTag] = useState("NTRCA স্পেশাল ব্যাচ");
  const [mentor, setMentor] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [originalPrice, setOriginalPrice] = useState(1200);
  const [discountPrice, setDiscountPrice] = useState(499);
  const [featuresInput, setFeaturesInput] = useState("");

  useEffect(() => {
    if (courseToEdit) {
      setTitle(courseToEdit.title);
      setSubtitle(courseToEdit.subtitle);
      setCourseTag(courseToEdit.course_tag);
      setMentor(courseToEdit.mentor);
      setCoverImage(courseToEdit.cover_image);
      setOriginalPrice(courseToEdit.original_price);
      setDiscountPrice(courseToEdit.discount_price);
      setFeaturesInput(courseToEdit.features.join(", "));
    } else {
      setTitle("");
      setSubtitle("");
      setCourseTag("NTRCA স্পেশাল ব্যাচ");
      setMentor("মুফতি আবদুল্লাহ আল কাফী");
      setCoverImage("https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=600");
      setOriginalPrice(1200);
      setDiscountPrice(499);
      setFeaturesInput("লাইভ ক্লাস, প্রিলিমিনারি মডেল টেস্ট, পিডিএফ হ্যান্ডনোট, ডাউট সলভিং");
    }
  }, [courseToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("দয়া করে কোর্সের নাম প্রদান করুন", "error");
      return;
    }

    const defaultButtons: CourseButton[] = courseToEdit
      ? courseToEdit.custom_buttons
      : [
          {
            id: `btn-1`,
            label: "রুটিন দেখুন (PDF)",
            action_type: "pdf_url",
            action_value: "https://example.com/routine.pdf",
            is_active: true,
            order: 1,
          },
          {
            id: `btn-2`,
            label: "ডেমো ক্লাস",
            action_type: "video_url",
            action_value: "https://youtube.com/demo",
            is_active: true,
            order: 2,
          },
          {
            id: `btn-3`,
            label: "ভর্তি হোন",
            action_type: "payment_drawer",
            action_value: "#enroll",
            is_active: true,
            order: 3,
            color: "bg-emerald-600 text-white",
          },
        ];

    const courseData = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      course_tag: courseTag.trim(),
      mentor: mentor.trim(),
      cover_image: coverImage.trim() || "https://images.unsplash.com/photo-1542810634-71277d95dcbb?w=600",
      original_price: originalPrice,
      discount_price: discountPrice,
      enrolled_count: courseToEdit ? courseToEdit.enrolled_count : 0,
      is_active: true,
      features: featuresInput.split(",").map((f) => f.trim()).filter(Boolean),
      custom_buttons: defaultButtons,
      chapters: courseToEdit ? courseToEdit.chapters : [],
    };

    if (courseToEdit) {
      updateCourse(courseToEdit.id, courseData);
    } else {
      addCourse(courseData);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              {courseToEdit ? "কোর্স সম্পাদনা (Edit Course)" : "নতুন কোর্স তৈরি (Create New Course)"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              কোর্স বিবরণ, মূল্য, মেন্টর ও ফিচার কনফিগার করুন
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
              কোর্সের নাম *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: ১৯তম NTRCA প্রিলিমিনারি ফুল কোর্স"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                কোর্স ট্যাগ / ক্যাটাগরি
              </label>
              <input
                type="text"
                value={courseTag}
                onChange={(e) => setCourseTag(e.target.value)}
                placeholder="যেমন: স্পেশাল ব্যাচ / আলিম / কামিল"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                প্রধান মেন্টর / প্রশিক্ষক
              </label>
              <input
                type="text"
                value={mentor}
                onChange={(e) => setMentor(e.target.value)}
                placeholder="যেমন: মাওলানা মুফতি আব্দুর রহমান"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                ছাড় মূল্য / কোর্স ফি (৳) *
              </label>
              <input
                type="number"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                required
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                রেগুলার মূল্য (৳)
              </label>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              কভার ছবির লিংক (Image URL)
            </label>
            <input
              type="text"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              কোর্সের মূল সুবিধাসমূহ (কমা দিয়ে আলাদা করুন)
            </label>
            <textarea
              rows={2}
              value={featuresInput}
              onChange={(e) => setFeaturesInput(e.target.value)}
              placeholder="লাইভ ক্লাস, লেকচার শিট, ৫০+ মডেল টেস্ট..."
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
              {courseToEdit ? "আপডেট করুন" : "কোর্স তৈরি করুন"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
