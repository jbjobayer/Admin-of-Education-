import React from "react";
import { CheckCircle2, Edit3, Trash2, MoveUp, MoveDown, HelpCircle, BookOpen } from "lucide-react";
import { Question } from "../../types";
import {
  detectQuestionLanguage,
  getOptionLabel,
  formatQuestionNumber,
  SupportedLanguage,
  isArabicText,
} from "../../lib/languageUtils";

interface QuestionItemCardProps {
  question: Partial<Question>;
  index: number;
  subjectName?: string;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  // Student Interactive Mode
  isStudentMode?: boolean;
  selectedOptionIndex?: number | null;
  onSelectOption?: (optIdx: number) => void;
  showCorrectAnswer?: boolean;
  // Compact Mode for lists
  compact?: boolean;
}

export const QuestionItemCard: React.FC<QuestionItemCardProps> = ({
  question,
  index,
  subjectName,
  showActions = false,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
  isStudentMode = false,
  selectedOptionIndex = null,
  onSelectOption,
  showCorrectAnswer = true,
  compact = false,
}) => {
  const lang: SupportedLanguage = detectQuestionLanguage(question);
  const isAr = lang === "ar";
  const isEn = lang === "en";

  const options = question.options && question.options.length >= 2
    ? question.options
    : [
        question.option_a || "",
        question.option_b || "",
        question.option_c || "",
        question.option_d || "",
      ].filter(Boolean);

  const correctIndex = question.correct_index !== undefined
    ? question.correct_index
    : question.correct_option === "option_b" || question.correct_option === "B" || question.correct_option === "b"
    ? 1
    : question.correct_option === "option_c" || question.correct_option === "C" || question.correct_option === "c"
    ? 2
    : question.correct_option === "option_d" || question.correct_option === "D" || question.correct_option === "d"
    ? 3
    : 0;

  const mainQuestionText = question.question || question.question_text || "প্রশ্ন";
  const arabicIbarat = question.arabic_text;

  return (
    <div
      className={`rounded-2xl border transition-all ${
        compact ? "p-3" : "p-4 sm:p-5"
      } ${
        isAr
          ? "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
      }`}
      dir={isAr ? "rtl" : "ltr"}
    >
      {/* Top Meta Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className={`flex items-center gap-2 ${isAr ? "flex-row-reverse" : "flex-row"}`}>
          {/* Question Number Badge */}
          <span className="min-w-[28px] h-7 px-2 rounded-full bg-slate-900 dark:bg-slate-800 text-white font-black text-xs flex items-center justify-center shadow-xs">
            {formatQuestionNumber(index + 1, lang)}
          </span>

          {/* Subject badge */}
          {(question.subject_name || subjectName) && (
            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] border border-emerald-200/60 dark:border-emerald-800/60">
              {question.subject_name || subjectName}
            </span>
          )}

          {/* Topic Badge */}
          {question.topic && (
            <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-semibold text-[10px] border border-amber-200/60 dark:border-amber-800/60">
              {question.topic}
            </span>
          )}

          {/* Language Flag Badge */}
          <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-[10px]">
            {isAr ? "🇸🇦 عربي" : isEn ? "🇬🇧 English" : "🇧🇩 বাংলা"}
          </span>
        </div>

        {/* Action Controls for Admin/Editor */}
        {showActions && (
          <div className="flex items-center gap-1" dir="ltr">
            {onMoveUp && (
              <button
                type="button"
                disabled={isFirst}
                onClick={onMoveUp}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="উপরে নিন"
              >
                <MoveUp className="w-3.5 h-3.5" />
              </button>
            )}

            {onMoveDown && (
              <button
                type="button"
                disabled={isLast}
                onClick={onMoveDown}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="নিচে নিন"
              >
                <MoveDown className="w-3.5 h-3.5" />
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>এডিট</span>
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer"
                title="প্রশ্নটি বাদ দিন"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Question Title (RTL for Arabic, LTR for Bengali/English) */}
      <div className="space-y-2 mb-3.5">
        {/* Arabic Ibarat / Verse if present separately */}
        {arabicIbarat && (
          <div
            className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-900/60 font-arabic text-emerald-950 dark:text-emerald-200 text-sm sm:text-base font-semibold leading-loose text-right"
            dir="rtl"
          >
            {arabicIbarat}
          </div>
        )}

        {/* Question Heading */}
        <h3
          className={`font-bold text-slate-900 dark:text-white leading-relaxed ${
            isAr
              ? "font-arabic text-base sm:text-lg text-right"
              : "text-sm sm:text-base text-left"
          }`}
        >
          {mainQuestionText}
        </h3>
      </div>

      {/* Options List (Exact Matching Reference Design) */}
      <div className="grid grid-cols-1 gap-2.5 pt-1">
        {options.map((optText, optIdx) => {
          const isCorrect = showCorrectAnswer && correctIndex === optIdx;
          const isSelected = selectedOptionIndex === optIdx;
          const badgeLabel = getOptionLabel(optIdx, lang);

          // Card Class computation
          let cardClasses = "p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs sm:text-sm";

          if (isStudentMode) {
            cardClasses += " cursor-pointer ";
            if (isSelected) {
              cardClasses += " bg-emerald-600 text-white font-bold border-emerald-600 shadow-sm ring-2 ring-emerald-500/30";
            } else {
              cardClasses += " bg-slate-50/90 dark:bg-slate-800/70 border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 hover:border-slate-300";
            }
          } else {
            // Admin / Preview mode
            if (isCorrect) {
              cardClasses += " bg-emerald-500/15 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-100 font-bold shadow-xs ring-1 ring-emerald-500/30";
            } else {
              cardClasses += " bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300";
            }
          }

          return (
            <div
              key={optIdx}
              onClick={() => {
                if (isStudentMode && onSelectOption) {
                  onSelectOption(optIdx);
                }
              }}
              className={cardClasses}
            >
              {/* If Arabic: Layout starts with Option Badge on the RIGHT, Text on the RIGHT */}
              {isAr ? (
                <>
                  {/* Right side: Option Text and Arabic Badge */}
                  <div className="flex items-center gap-3 min-w-0 flex-1 justify-start">
                    {/* Arabic Option Badge (أ, ب, ج, د) on the RIGHT side */}
                    <span
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 border ${
                        isStudentMode && isSelected
                          ? "bg-white text-emerald-700 border-white shadow-xs"
                          : isCorrect
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200/80 dark:border-blue-800"
                      }`}
                    >
                      {badgeLabel}
                    </span>

                    {/* Option Text */}
                    <span
                      className={`font-arabic text-sm sm:text-base leading-relaxed text-right ${
                        isStudentMode && isSelected
                          ? "text-white"
                          : isCorrect
                          ? "text-emerald-950 dark:text-emerald-100 font-bold"
                          : "text-slate-800 dark:text-slate-200 font-medium"
                      }`}
                    >
                      {optText}
                    </span>
                  </div>

                  {/* Left side: Correct indicator if applicable */}
                  {isCorrect && !isStudentMode && (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 flex-shrink-0" dir="ltr">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>صحيح</span>
                    </div>
                  )}
                </>
              ) : (
                /* Bengali / English LTR Mode: Badge on the LEFT, Text on the LEFT */
                <>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Option Badge on the LEFT (ক, খ, গ, ঘ or A, B, C, D) */}
                    <span
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 border ${
                        isStudentMode && isSelected
                          ? "bg-white text-emerald-700 border-white shadow-xs"
                          : isCorrect
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {badgeLabel}
                    </span>

                    {/* Option Text */}
                    <span
                      className={`text-left leading-relaxed ${
                        isStudentMode && isSelected
                          ? "text-white"
                          : isCorrect
                          ? "text-emerald-950 dark:text-emerald-100 font-bold"
                          : "text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {optText}
                    </span>
                  </div>

                  {/* Right side: Correct Indicator for Bengali/English */}
                  {isCorrect && !isStudentMode && (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>সঠিক উত্তর</span>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Explanation & Source (if present) */}
      {(question.explanation || question.source) && (
        <div
          className={`mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-xs ${
            isAr ? "text-right" : "text-left"
          }`}
        >
          {question.explanation && (
            <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40 text-amber-900 dark:text-amber-200">
              <span className="font-bold">{isAr ? "الشرح: " : "ব্যাখ্যা: "}</span>
              <span className={isAr ? "font-arabic" : ""}>{question.explanation}</span>
            </div>
          )}
          {question.source && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-slate-400" />
              <span>{isAr ? "المصدر: " : "রেফারেন্স: "}</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{question.source}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
