// Language and Direction detection utilities for Bengali, Arabic, and English MCQ questions

export const ARABIC_UNICODE_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/**
 * Checks if a given text contains Arabic characters (with or without Harakat / Tashkeel)
 */
export function isArabicText(text?: string | null): boolean {
  if (!text) return false;
  return ARABIC_UNICODE_REGEX.test(text);
}

/**
 * Checks if a given text is primarily English
 */
export function isEnglishText(text?: string | null): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  // If contains Arabic or Bengali, it's not English
  if (isArabicText(trimmed)) return false;
  const BENGALI_REGEX = /[\u0980-\u09FF]/;
  if (BENGALI_REGEX.test(trimmed)) return false;
  return /^[A-Za-z0-9\s.,?!'"()\-/:;%#+=$@&*]+$/.test(trimmed);
}

export type SupportedLanguage = "ar" | "bn" | "en";

export interface QuestionLike {
  language?: string;
  arabic_text?: string | null;
  question?: string;
  question_text?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  options?: string[];
  explanation?: string;
}

/**
 * Detects whether a question should be treated as Arabic, English, or Bengali
 */
export function detectQuestionLanguage(q?: QuestionLike | null): SupportedLanguage {
  if (!q) return "bn";

  if (q.language === "ar") return "ar";
  if (q.language === "en") return "en";
  if (q.language === "bn") return "bn";

  // Check if arabic_text exists
  if (q.arabic_text && isArabicText(q.arabic_text)) return "ar";

  // Check question text
  const qText = q.question_text || q.question || "";
  if (isArabicText(qText)) return "ar";

  // Check options
  if (q.options && q.options.some((opt) => isArabicText(opt))) return "ar";
  if (
    isArabicText(q.option_a) ||
    isArabicText(q.option_b) ||
    isArabicText(q.option_c) ||
    isArabicText(q.option_d)
  ) {
    return "ar";
  }

  // Check English
  if (qText && isEnglishText(qText)) return "en";

  return "bn";
}

/**
 * Returns option badge labels (ক/খ/গ/ঘ for Bengali, أ/ب/ج/د for Arabic, A/B/C/D for English)
 */
export function getOptionLabel(index: number, lang: SupportedLanguage): string {
  if (lang === "ar") {
    const arabicLabels = ["أ", "ب", "ج", "د", "هـ"];
    return arabicLabels[index] || "أ";
  }
  if (lang === "en") {
    const englishLabels = ["A", "B", "C", "D", "E"];
    return englishLabels[index] || "A";
  }
  const banglaLabels = ["ক", "খ", "গ", "ঘ", "ঙ"];
  return banglaLabels[index] || "ক";
}

const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const BANGLA_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/**
 * Converts a number to Arabic-Indic digits (١, ٢, ٣...)
 */
export function toArabicDigits(num: number | string): string {
  const str = String(num);
  return str.replace(/[0-9]/g, (d) => ARABIC_DIGITS[parseInt(d, 10)] || d);
}

/**
 * Converts a number to Bengali digits (১, ২, ৩...)
 */
export function toBanglaDigits(num: number | string): string {
  const str = String(num);
  return str.replace(/[0-9]/g, (d) => BANGLA_DIGITS[parseInt(d, 10)] || d);
}

/**
 * Returns localized question number badge text (e.g., .١ or ১.)
 */
export function formatQuestionNumber(num: number, lang: SupportedLanguage): string {
  if (lang === "ar") {
    return `${toArabicDigits(num)}.` ;
  }
  if (lang === "en") {
    return `${num}.`;
  }
  return `${toBanglaDigits(num)}.`;
}
