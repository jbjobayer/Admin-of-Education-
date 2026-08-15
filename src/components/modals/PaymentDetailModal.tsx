import React from "react";
import { X, CheckCircle2, XCircle, CreditCard, ExternalLink } from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import { PaymentRecord } from "../../types";

interface PaymentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentRecord | null;
}

export const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  isOpen,
  onClose,
  payment,
}) => {
  const { approvePayment, rejectPayment } = useAdminData();

  if (!isOpen || !payment) return null;

  const isPending = payment.status === "pending";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
              ৳
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                পেমেন্ট ও TrxID বিস্তারিত
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {payment.gateway} গেটওয়ে ট্রানজেকশন ভেরিফিকেশন
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

        {/* Payment Details Info Grid */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-2.5 text-xs">
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
            <span>শিক্ষার্থীর নাম:</span>
            <strong className="text-slate-900 dark:text-white text-sm">{payment.user_name}</strong>
          </div>

          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
            <span>মোবাইল নম্বর:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{payment.user_phone}</span>
          </div>

          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
            <span>সেন্ডার একাউন্ট নম্বর:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{payment.sender_number}</span>
          </div>

          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
            <span>গেটওয়ে:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
              {payment.gateway}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
            <span>ট্রানজেকশন আইডি (TrxID):</span>
            <span className="font-mono font-extrabold text-sm bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-emerald-600">
              {payment.trx_id}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
            <span>প্যাকেজ / প্ল্যান:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{payment.plan_name}</span>
          </div>

          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700">
            <span className="font-bold">পরিশোধিত টাকার পরিমাণ:</span>
            <span className="font-extrabold text-base text-emerald-600">৳ {payment.amount}</span>
          </div>
        </div>

        {/* Screenshot View (if provided) */}
        {payment.screenshot_url && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              শিক্ষার্থীর আপলোড করা পেমেন্ট স্ক্রিনশট / স্লিপ
            </label>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-48">
              <img
                src={payment.screenshot_url}
                alt="Payment Slip"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
          >
            বন্ধ করুন
          </button>

          {isPending ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  rejectPayment(payment.id);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold text-xs cursor-pointer"
              >
                বাতিল করুন
              </button>

              <button
                type="button"
                onClick={() => {
                  approvePayment(payment.id);
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                অনুমোদন ও প্রিমিয়াম চালু
              </button>
            </div>
          ) : (
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-xl ${
                payment.status === "approved"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
              }`}
            >
              স্ট্যাটাস: {payment.status === "approved" ? "অনুমোদিত ও সক্রিয়" : "বাতিলকৃত"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
