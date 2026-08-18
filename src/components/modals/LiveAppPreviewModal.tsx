import React, { useEffect } from "react";
import { X, Smartphone } from "lucide-react";
import { StudentAppPreviewTab } from "../tabs/StudentAppPreviewTab";
import { useAdminData } from "../../context/AdminDataContext";

export const LiveAppPreviewModal: React.FC = () => {
  const { isPreviewModalOpen, setIsPreviewModalOpen, previewExam } = useAdminData();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPreviewModalOpen) {
        setIsPreviewModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPreviewModalOpen, setIsPreviewModalOpen]);

  if (!isPreviewModalOpen) return null;

  return (
    <div
      id="live-app-preview-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsPreviewModalOpen(false);
        }
      }}
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-4 sm:p-6 relative shadow-2xl animate-in fade-in zoom-in-95 my-auto max-h-[96vh] overflow-y-auto flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-shrink-0 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                তামরীন স্টুডেন্ট অ্যাপ - লাইভ সিমুলেটর
              </h3>
              <p className="text-[11px] text-slate-400">
                অ্যাডমিনের সকল ডাটা ও সেটিংস এখানে রিয়েল-টাইমে পরীক্ষা করুন
              </p>
            </div>
          </div>

          <button
            id="close-preview-modal-btn"
            onClick={() => setIsPreviewModalOpen(false)}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Simulator View */}
        <div className="flex-1 overflow-y-auto">
          <StudentAppPreviewTab initialExam={previewExam} />
        </div>
      </div>
    </div>
  );
};

