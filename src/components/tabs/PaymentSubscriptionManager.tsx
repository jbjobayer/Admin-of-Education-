import React, { useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Eye,
  Plus,
  ShieldCheck,
  Smartphone,
  Calendar,
  DollarSign,
  AlertCircle,
  FileCheck,
  Edit,
  Tag,
  UserPlus,
} from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import { PaymentRecord, SubscriptionPackage } from "../../types";
import { PaymentDetailModal } from "../modals/PaymentDetailModal";

interface PaymentSubscriptionManagerProps {
  onOpenPaymentDetail?: (payment: PaymentRecord) => void;
  onOpenManualActivation?: () => void;
}

export const PaymentSubscriptionManager: React.FC<PaymentSubscriptionManagerProps> = ({
  onOpenPaymentDetail,
  onOpenManualActivation,
}) => {
  const {
    payments,
    approvePayment,
    rejectPayment,
    appSettings,
    updateSubscriptionPackage,
    manuallyActivateUser,
    showToast,
    searchQuery,
  } = useAdminData();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [gatewayFilter, setGatewayFilter] = useState<string>("all");
  const [editingPackage, setEditingPackage] = useState<SubscriptionPackage | null>(null);
  const [selectedPaymentForModal, setSelectedPaymentForModal] = useState<PaymentRecord | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Manual activation form states
  const [manualPhone, setManualPhone] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualPlan, setManualPlan] = useState("monthly");
  const [manualMonths, setManualMonths] = useState(1);

  // Package edit form states
  const [pkgPrice, setPkgPrice] = useState<number>(0);
  const [pkgOriginalPrice, setPkgOriginalPrice] = useState<number>(0);
  const [pkgDiscountTag, setPkgDiscountTag] = useState<string>("");

  const pendingPayments = payments.filter((p) => p.status === "pending");
  const approvedPayments = payments.filter((p) => p.status === "approved");
  const rejectedPayments = payments.filter((p) => p.status === "rejected");

  const totalRevenue = approvedPayments.reduce((sum, p) => sum + p.amount, 0) + 18450;

  const filteredPayments = payments.filter((p) => {
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    const matchesGateway = gatewayFilter === "all" || p.gateway === gatewayFilter;
    const matchesSearch =
      !searchQuery ||
      p.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.user_phone.includes(searchQuery) ||
      p.trx_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.plan_name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesGateway && matchesSearch;
  });

  const handleSavePackageEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;

    updateSubscriptionPackage(editingPackage.id, {
      price: pkgPrice,
      original_price: pkgOriginalPrice,
      discount_tag: pkgDiscountTag,
    });

    showToast("প্যাকেজ মূল্য ও তথ্য সফলভাবে আপডেট হয়েছে!");
    setEditingPackage(null);
  };

  const subscriptionPackages = appSettings.subscription_packages || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <span>পেমেন্ট ভেরিফিকেশন ও মেম্বারশিপ ম্যানেজার (Payment & Subscriptions)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            বিকাশ, নগদ ও রকেট TrxID যাচাইকরণ, প্যাকেজ প্রাইসিং ও ম্যানুয়াল অ্যাক্টিভেশন
          </p>
        </div>

        <button
          onClick={() =>
            onOpenManualActivation ? onOpenManualActivation() : setIsManualModalOpen(true)
          }
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>ম্যানুয়াল ইউজার অ্যাক্টিভেশন</span>
        </button>
      </div>

      {/* Revenue Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            মোট সংগৃহীত পেমেন্ট
          </span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            ৳ {totalRevenue.toLocaleString("bn-BD")}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {approvedPayments.length + 85} টি অনুমোদিত ট্রানজেকশন
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            পেন্ডিং যাচাইয়ের অপেক্ষায়
          </span>
          <div className="text-2xl font-extrabold text-amber-500 mt-1">
            {pendingPayments.length} টি
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 block font-semibold">
            তাত্ক্ষণিক অনুমোদন দিন
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            বাতিল / ইনভ্যালিড TrxID
          </span>
          <div className="text-2xl font-extrabold text-rose-500 mt-1">
            {rejectedPayments.length} টি
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            ভুল নম্বর বা অমিল ট্রানজেকশন
          </span>
        </div>
      </div>

      {/* Subscription Pricing Packages Customizer */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              সাবস্ক্রিপশন প্যাকেজ মূল্য নির্ধারণ (Pricing Packages Config)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              অ্যাপের পেমেন্ট পেজে দৃশ্যমান প্ল্যানসমূহ ও ছাড় ডিসকাউন্ট
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {subscriptionPackages.map((pkg) => (
            <div
              key={pkg.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    {pkg.name_bn}
                  </span>
                  {(pkg.discount_tag || pkg.badge) && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">
                      {pkg.discount_tag || pkg.badge}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-extrabold text-emerald-600">৳{pkg.price}</span>
                  {pkg.original_price && pkg.original_price > pkg.price && (
                    <span className="text-xs text-slate-400 line-through">
                      ৳{pkg.original_price}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                  মেয়াদ: {pkg.duration_days} দিন
                </p>

                <div className="mt-3 space-y-1">
                  {pkg.perks.slice(0, 3).map((perk, i) => (
                    <div
                      key={i}
                      className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                      <span className="truncate">{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingPackage(pkg);
                  setPkgPrice(pkg.price);
                  setPkgOriginalPrice(pkg.original_price || pkg.price);
                  setPkgDiscountTag(pkg.discount_tag || pkg.badge || "");
                }}
                className="mt-4 w-full py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Edit className="w-3.5 h-3.5 text-emerald-600" />
                <span>মূল্য এডিট করুন</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-800 dark:text-white">
              পেমেন্ট ট্রানজেকশন তালিকা
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
              {filteredPayments.length} টি
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="all">সব স্ট্যাটাস</option>
              <option value="pending">পেন্ডিং ({pendingPayments.length})</option>
              <option value="approved">অনুমোদিত ({approvedPayments.length})</option>
              <option value="rejected">বাতিলকৃত ({rejectedPayments.length})</option>
            </select>

            {/* Gateway Filter */}
            <select
              value={gatewayFilter}
              onChange={(e) => setGatewayFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="all">সব গেটওয়ে</option>
              <option value="bKash">bKash</option>
              <option value="Nagad">Nagad</option>
              <option value="Rocket">Rocket</option>
              <option value="Upay">Upay</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-y border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">শিক্ষার্থী</th>
                <th className="py-3 px-4">গেটওয়ে ও নম্বর</th>
                <th className="py-3 px-4">TrxID</th>
                <th className="py-3 px-4">প্যাকেজ</th>
                <th className="py-3 px-4">পরিমাণ</th>
                <th className="py-3 px-4">তারিখ</th>
                <th className="py-3 px-4">স্ট্যাটাস</th>
                <th className="py-3 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPayments.map((p) => {
                const isPending = p.status === "pending";

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{p.user_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{p.user_phone}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {p.gateway}
                      </span>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {p.sender_number || p.user_phone}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        {p.trx_id}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {p.plan_name}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-emerald-600 text-sm">
                      ৳{p.amount}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {p.created_at?.slice(0, 16).replace("T", " ")}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          p.status === "approved"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : p.status === "rejected"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse"
                        }`}
                      >
                        {p.status === "approved"
                          ? "অনুমোদিত"
                          : p.status === "rejected"
                          ? "বাতিলকৃত"
                          : "পেন্ডিং"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() =>
                            onOpenPaymentDetail
                              ? onOpenPaymentDetail(p)
                              : setSelectedPaymentForModal(p)
                          }
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                          title="স্লিপ ও বিস্তারিত দেখুন"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {isPending && (
                          <>
                            <button
                              onClick={() => {
                                approvePayment(p.id);
                                showToast(`পেমেন্ট TrxID: ${p.trx_id} সফলভাবে অনুমোদিত হয়েছে!`);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors cursor-pointer text-xs"
                              title="অনুমোদন করুন"
                            >
                              অনুমোদন
                            </button>

                            <button
                              onClick={() => {
                                rejectPayment(p.id);
                                showToast(`পেমেন্ট TrxID: ${p.trx_id} বাতিল করা হয়েছে।`, "error");
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold transition-colors cursor-pointer text-xs"
                              title="বাতিল করুন"
                            >
                              বাতিল
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Package Edit Modal */}
      {editingPackage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              প্যাকেজ মূল্য সম্পাদনা: {editingPackage.name_bn}
            </h3>

            <form onSubmit={handleSavePackageEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  বর্তমান মূল্য (৳)
                </label>
                <input
                  type="number"
                  value={pkgPrice}
                  onChange={(e) => setPkgPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  পূর্বের রেগুলার মূল্য (৳)
                </label>
                <input
                  type="number"
                  value={pkgOriginalPrice}
                  onChange={(e) => setPkgOriginalPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  ডিসকাউন্ট ট্যাগ / ব্যাজ (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={pkgDiscountTag}
                  onChange={(e) => setPkgDiscountTag(e.target.value)}
                  placeholder="যেমন: ৫০% ছাড় / জনপ্রিয়"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPackage(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  আপডেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Detail Modal */}
      <PaymentDetailModal
        isOpen={!!selectedPaymentForModal}
        onClose={() => setSelectedPaymentForModal(null)}
        payment={selectedPaymentForModal}
      />

      {/* Manual Activation Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              ম্যানুয়াল ইউজার সাবস্ক্রিপশন অ্যাক্টিভেশন
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              কোনো শিক্ষার্থীর অ্যাকাউন্টে সরাসরি নির্দিষ্ট মেয়াদের প্রিমিয়াম অ্যাক্সেস প্রদান করুন
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!manualPhone.trim()) return;
                manuallyActivateUser({
                  phone: manualPhone,
                  fullName: manualName,
                  planId: manualPlan,
                  months: manualMonths,
                });
                showToast(`শিক্ষার্থী ${manualPhone} এর অ্যাকাউন্ট সফলভাবে সক্রিয় করা হয়েছে!`);
                setIsManualModalOpen(false);
                setManualPhone("");
                setManualName("");
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  মোবাইল নম্বর *
                </label>
                <input
                  type="tel"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  শিক্ষার্থীর নাম (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="যেমন: মুহাম্মদ আবদুল্লাহ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    প্ল্যান
                  </label>
                  <select
                    value={manualPlan}
                    onChange={(e) => setManualPlan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="monthly">মাসিক (Monthly)</option>
                    <option value="quarterly">ত্রৈমাসিক (Quarterly)</option>
                    <option value="half_yearly">ষাণ্মাসিক (Half Yearly)</option>
                    <option value="yearly">বাৎসরিক (Yearly)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    মেয়াদ (মাস)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={36}
                    value={manualMonths}
                    onChange={(e) => setManualMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  অ্যাক্টিভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
