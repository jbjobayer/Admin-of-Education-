import React, { useState } from "react";
import { X, Megaphone, AlertTriangle, CheckCircle2, ShieldAlert, Radio } from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";

interface EmergencyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyNoticeModal: React.FC<EmergencyNoticeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { appSettings, updateAppSettings, showToast } = useAdminData();

  const [enabled, setEnabled] = useState(appSettings.emergency_notice.enabled);
  const [message, setMessage] = useState(appSettings.emergency_notice.message);
  const [type, setType] = useState<"urgent" | "info" | "warning">(
    appSettings.emergency_notice.type || "urgent"
  );
  const [actionBtnText, setActionBtnText] = useState(
    appSettings.emergency_notice.action_btn_text || ""
  );
  const [actionUrl, setActionUrl] = useState(
    appSettings.emergency_notice.action_url || ""
  );

  if (!isOpen) return null;

  const handleSave = () => {
    updateAppSettings({
      emergency_notice: {
        enabled,
        message,
        type,
        action_btn_text: actionBtnText,
        action_url: actionUrl,
      },
    });
    showToast(
      enabled
        ? "জরুরি নোটিশ সফলভাবে লাইভ অ্যাপে প্রচার করা হয়েছে!"
        : "জরুরি নোটিশ অ্যাপ থেকে বন্ধ করা হয়েছে।"
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center font-bold">
              <Megaphone className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                অ্যাপে জরুরি নোটিশ ব্রডকাস্ট
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                সকল শিক্ষার্থীর মোবাইল অ্যাপে টপ ব্যানার বা অ্যালার্ট পপআপ প্রচার
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

        {/* Form Body */}
        <div className="space-y-4 text-xs">
          {/* Enable Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="font-bold text-slate-800 dark:text-white block text-sm">
                জরুরি নোটিশ স্ট্যাটাস
              </label>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                চালু করলে সমস্ত শিক্ষার্থীর অ্যাপে তৎক্ষণাৎ নোটিশ দৃশ্যমান হবে
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`w-13 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                enabled ? "bg-rose-600" : "bg-slate-300 dark:bg-slate-700"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm ${
                  enabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Notice Type */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">
              নোটিশের ধরন / গুরুত্ব
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType("urgent")}
                className={`py-2 px-3 rounded-xl font-bold text-center border cursor-pointer transition-all ${
                  type === "urgent"
                    ? "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-600 ring-2 ring-rose-500/20"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                🔴 অতীব জরুরি
              </button>

              <button
                type="button"
                onClick={() => setType("warning")}
                className={`py-2 px-3 rounded-xl font-bold text-center border cursor-pointer transition-all ${
                  type === "warning"
                    ? "bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-600 ring-2 ring-amber-500/20"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                🟡 সতর্কতা / রুটিন
              </button>

              <button
                type="button"
                onClick={() => setType("info")}
                className={`py-2 px-3 rounded-xl font-bold text-center border cursor-pointer transition-all ${
                  type === "info"
                    ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-600 ring-2 ring-blue-500/20"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                🔵 তথ্যমূলক
              </button>
            </div>
          </div>

          {/* Notice Message */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 block">
              নোটিশ বার্তা (Message Text)
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="যেমন: সার্ভার মেইনটেন্যান্স এর কারণে আজ রাত ১২টা থেকে ১টা পর্যন্ত পরীক্ষা সাময়িক বন্ধ থাকবে..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Action Button & Link (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                অ্যাকশন বাটন টেক্সট (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={actionBtnText}
                onChange={(e) => setActionBtnText(e.target.value)}
                placeholder="যেমন: রুটিন দেখুন / নোটিশ পড়ুন"
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                বাটন লিংক / URL (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
          >
            বাতিল
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Radio className="w-4 h-4" />
            <span>অ্যাপে ব্রডকাস্ট করুন</span>
          </button>
        </div>
      </div>
    </div>
  );
};
