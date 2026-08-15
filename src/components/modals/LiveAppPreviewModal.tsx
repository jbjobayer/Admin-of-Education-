import React from "react";
import { X } from "lucide-react";
import { StudentAppPreviewTab } from "../tabs/StudentAppPreviewTab";
import { useAdminData } from "../../context/AdminDataContext";

export const LiveAppPreviewModal: React.FC = () => {
  const { isPreviewModalOpen, setIsPreviewModalOpen } = useAdminData();

  if (!isPreviewModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl max-w-4xl w-full p-3 sm:p-6 relative shadow-2xl animate-in fade-in zoom-in-95 my-auto max-h-[95vh] overflow-y-auto">
        <button
          onClick={() => setIsPreviewModalOpen(false)}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer z-20 min-w-[36px] min-h-[36px] flex items-center justify-center shadow-md"
          aria-label="Close Preview"
        >
          <X className="w-5 h-5" />
        </button>

        <StudentAppPreviewTab />
      </div>
    </div>
  );
};
