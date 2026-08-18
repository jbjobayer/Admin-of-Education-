import React, { useState } from "react";
import {
  Sliders,
  Megaphone,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Link,
  MessageSquare,
  Phone,
  Send,
  Save,
  Sparkles,
  AlertTriangle,
  FileText,
  Type,
  CheckCircle2,
} from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import { HomeBanner } from "../../types";

export const GlobalAppCustomizer: React.FC = () => {
  const { appSettings, updateAppSettings, addHomeBanner, updateHomeBanner, deleteHomeBanner, showToast } = useAdminData();

  // Marquee state
  const [marqueeText, setMarqueeText] = useState(appSettings.marquee_text);
  const [marqueeSpeed, setMarqueeSpeed] = useState(appSettings.marquee_speed);
  const [marqueeActive, setMarqueeActive] = useState(appSettings.marquee_active);

  // Emergency notice state
  const [emergencyEnabled, setEmergencyEnabled] = useState(appSettings.emergency_notice.enabled);
  const [emergencyMessage, setEmergencyMessage] = useState(appSettings.emergency_notice.message);
  const [emergencyType, setEmergencyType] = useState(appSettings.emergency_notice.type);
  const [emergencyBtnText, setEmergencyBtnText] = useState(appSettings.emergency_notice.action_btn_text || "");
  const [emergencyBtnUrl, setEmergencyBtnUrl] = useState(appSettings.emergency_notice.action_url || "");

  // Font & Contact settings
  const [arabicFontSize, setArabicFontSize] = useState(appSettings.default_arabic_font_size);
  const [routinePdfUrl, setRoutinePdfUrl] = useState(appSettings.routine_pdf_url);
  const [hotline, setHotline] = useState(appSettings.hotline_number);
  const [whatsapp, setWhatsapp] = useState(appSettings.whatsapp_link);
  const [telegram, setTelegram] = useState(appSettings.telegram_link);
  const [maintenanceMode, setMaintenanceMode] = useState(appSettings.maintenance_mode);

  // New Banner Modal state
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [bannerTargetUrl, setBannerTargetUrl] = useState("");

  const handleSaveAllSettings = () => {
    updateAppSettings({
      marquee_text: marqueeText,
      marquee_speed: marqueeSpeed,
      marquee_active: marqueeActive,
      emergency_notice: {
        enabled: emergencyEnabled,
        message: emergencyMessage,
        type: emergencyType as any,
        action_btn_text: emergencyBtnText,
        action_url: emergencyBtnUrl,
      },
      default_arabic_font_size: arabicFontSize,
      routine_pdf_url: routinePdfUrl,
      hotline_number: hotline,
      whatsapp_link: whatsapp,
      telegram_link: telegram,
      maintenance_mode: maintenanceMode,
    });
  };

  const handleCreateBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerImageUrl) return;

    const banners = appSettings.home_banners || [];
    addHomeBanner({
      title: bannerTitle || "স্পেশাল অফার",
      image_url: bannerImageUrl,
      target_url: bannerTargetUrl || "#",
      is_active: true,
      order: banners.length + 1,
    });

    setIsBannerModalOpen(false);
    setBannerTitle("");
    setBannerImageUrl("");
    setBannerTargetUrl("");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Save All Action */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-600" />
            <span>গ্লোবাল অ্যাপ কাস্টমাইজার ও ব্যানার ম্যানেজার (App UI Master Config)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            হোম ব্যানার স্লাইডার, মারকুই স্ক্রল টেক্সট, জরুরি ব্রডকাস্ট ও সোশ্যাল চ্যানেল লিংক
          </p>
        </div>

        <button
          onClick={handleSaveAllSettings}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>সকল পরিবর্তন সেভ করুন</span>
        </button>
      </div>

      {/* Top Running Marquee Config Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                টপ রানিং মারকুই নোটিশ (Top Ticker Scrolling Notice)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                অ্যাপের হোম স্ক্রিনের শীর্ষে চলমান গুরুত্বপূর্ণ ঘোষণা
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="marquee-toggle"
              checked={marqueeActive}
              onChange={(e) => setMarqueeActive(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
            <label htmlFor="marquee-toggle" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              {marqueeActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
            </label>
          </div>
        </div>

        {/* Live Preview Box */}
        {marqueeActive && (
          <div className="p-2.5 rounded-xl bg-emerald-900 text-amber-300 text-xs font-semibold overflow-hidden whitespace-nowrap shadow-inner flex items-center gap-2">
            <span className="bg-amber-400 text-emerald-950 px-2 py-0.5 rounded text-[10px] font-bold">
              ঘোষণা
            </span>
            <div className="animate-marquee font-medium">
              {marqueeText}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs pt-2">
          <div className="md:col-span-3">
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              মারকুই টেক্সট
            </label>
            <input
              type="text"
              value={marqueeText}
              onChange={(e) => setMarqueeText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              স্ক্রলিং স্পিড (সেকেন্ড)
            </label>
            <input
              type="number"
              min={5}
              max={60}
              value={marqueeSpeed}
              onChange={(e) => setMarqueeSpeed(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
            />
          </div>
        </div>
      </div>

      {/* Emergency Broadcast Alert Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                জরুরি নোটিশ ও পুশ ব্যানার (Emergency Broadcast Alert)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                সকল শিক্ষার্থীর ডিভাইসে তাৎক্ষণিক হাই-প্রায়োরিটি অ্যালার্ট প্রদর্শন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="emergency-toggle"
              checked={emergencyEnabled}
              onChange={(e) => setEmergencyEnabled(e.target.checked)}
              className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
            />
            <label htmlFor="emergency-toggle" className="text-xs font-bold text-rose-600 cursor-pointer">
              {emergencyEnabled ? "জরুরি অ্যালার্ট অন" : "অফ"}
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
          <div className="md:col-span-2">
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              নোটিশ মেসেজ
            </label>
            <input
              type="text"
              value={emergencyMessage}
              onChange={(e) => setEmergencyMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              অ্যালার্ট টাইপ / থিম
            </label>
            <select
              value={emergencyType}
              onChange={(e) => setEmergencyType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer"
            >
              <option value="urgent">জরুরি (Red Urgent)</option>
              <option value="warning">সতর্কবার্তা (Amber Warning)</option>
              <option value="info">তথ্যমূলক (Blue Info)</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              বাটন টেক্সট (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={emergencyBtnText}
              onChange={(e) => setEmergencyBtnText(e.target.value)}
              placeholder="যেমন: এখনই দেখুন"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              বাটন অ্যাকশন লিংক (URL)
            </label>
            <input
              type="text"
              value={emergencyBtnUrl}
              onChange={(e) => setEmergencyBtnUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
            />
          </div>
        </div>
      </div>

      {/* Home Banner Slider Manager */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                হোম ব্যানার স্লাইডার ম্যানেজার ({(appSettings.home_banners || []).length} টি ব্যানার)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                অ্যাপের হোম পেজে দৃশ্যমান স্লাইডার ব্যানার ও ক্লিক অ্যাকশন
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsBannerModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ব্যানার যোগ করুন</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {(appSettings.home_banners || []).map((banner) => (
            <div
              key={banner.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 overflow-hidden flex flex-col justify-between"
            >
              <div>
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-32 object-cover"
                />

                <div className="p-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800 dark:text-white truncate">
                      {banner.title}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
                      ক্রম: {banner.order}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 font-mono truncate">
                    লিংক: {banner.target_url}
                  </p>
                </div>
              </div>

              <div className="p-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <button
                  onClick={() => updateHomeBanner(banner.id, { is_active: !banner.is_active })}
                  className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                    banner.is_active
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                  }`}
                >
                  {banner.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{banner.is_active ? "সক্রিয়" : "হাইড"}</span>
                </button>

                <button
                  onClick={() => deleteHomeBanner(banner.id)}
                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  title="ব্যানার মুছুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Routine, Font & Social Links Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">
          রুটিন, ফন্ট সাইজ ও সোশ্যাল চ্যানেল কনফিগারেশন
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              কেন্দ্রীয় পরীক্ষার রুটিন (PDF লিংক)
            </label>
            <input
              type="text"
              value={routinePdfUrl}
              onChange={(e) => setRoutinePdfUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              ডিফল্ট আরবি হরকত ফন্ট সাইজ (px)
            </label>
            <input
              type="number"
              min={14}
              max={32}
              value={arabicFontSize}
              onChange={(e) => setArabicFontSize(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              হটলাইন মোবাইল নম্বর
            </label>
            <input
              type="text"
              value={hotline}
              onChange={(e) => setHotline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              হোয়াটসঅ্যাপ সাপোর্ট গ্রুপ / হেল্পলাইন
            </label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
              টেলিগ্রাম চ্যানেল লিংক
            </label>
            <input
              type="text"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
            />
          </div>

          <div className="flex items-center gap-2 pt-5">
            <input
              type="checkbox"
              id="maintenance-toggle"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
            />
            <label htmlFor="maintenance-toggle" className="font-bold text-rose-600 cursor-pointer">
              মেইনটেন্যান্স মোড (অ্যাপে অ্যাক্সেস সাময়িক বন্ধ)
            </label>
          </div>
        </div>
      </div>

      {/* New Banner Modal */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              নতুন হোম ব্যানার যুক্ত করুন
            </h3>

            <form onSubmit={handleCreateBanner} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  ব্যানার শিরোনাম
                </label>
                <input
                  type="text"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="যেমন: ১৯তম শিক্ষক নিবন্ধন স্পেশাল ব্যাচ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  ব্যানার ছবির লিংক (Image URL)
                </label>
                <input
                  type="text"
                  value={bannerImageUrl}
                  onChange={(e) => setBannerImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  টার্গেট অ্যাকশন লিংক (Redirect URL)
                </label>
                <input
                  type="text"
                  value={bannerTargetUrl}
                  onChange={(e) => setBannerTargetUrl(e.target.value)}
                  placeholder="https://... অথবা কোর্স আইডি"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold cursor-pointer"
                >
                  যোগ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
