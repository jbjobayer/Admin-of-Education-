import React from "react";
import { X } from "lucide-react";
import { StudentAppPreviewTab } from "../tabs/StudentAppPreviewTab";
import { useAdminData } from "../../context/AdminDataContext";

export const LiveAppPreviewModal: React.FC = () => {
  const { isPreviewModalOpen, setIsPreviewModalOpen } = useAdminData();

  if (!isPreviewModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 relative shadow-2xl animate-in fade-in zoom-in-95 my-auto max-h-[95vh] overflow-y-auto">
        <button
          onClick={() => setIsPreviewModalOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <StudentAppPreviewTab />
      </div>
    </div>
  );
};
