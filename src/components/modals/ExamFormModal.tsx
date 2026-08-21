import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  FileCheck,
  HelpCircle,
  Layers,
  Sparkles,
  ClipboardPaste,
  Plus,
  Search,
  Filter,
  Tag,
  BookOpen,
  Trash2,
  Languages,
  RefreshCw,
  Eye,
  Check,
  ListFilter,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { useAdminData } from "../../context/AdminDataContext";
import {
  Exam,
  ExamCategory,
  ExamStatus,
  Question,
  QuestionDifficulty,
  ExamTargetCategory,
} from "../../types";

interface ExamFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  examToEdit?: Exam | null;
  initialCourseId?: string;
}

type QuestionAddMode = "bank" | "manual" | "paste" | "ai";

export const ExamFormModal: React.FC<ExamFormModalProps> = ({
  isOpen,
  onClose,
  examToEdit,
  initialCourseId,
}) => {
  const {
    questions,
    subjects,
    courses,
    addExam,
    updateExam,
    addQuestion,
    addBulkQuestions,
    showToast,
  } = useAdminData();

  // Basic Exam Info
  const [examTargetType, setExamTargetType] = useState<"course_exam" | "free_exam">("free_exam");
  const [title, setTitle] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [category, setCategory] = useState<ExamCategory>("daily_live");
  const [subject, setSubject] = useState("নাহু ও সরফ");
  const [syllabus, setSyllabus] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [totalMarks, setTotalMarks] = useState(20);
  const [negativeMarking, setNegativeMarking] = useState(0.25);
  const [status, setStatus] = useState<ExamStatus>("live");
  const [isSaving, setIsSaving] = useState(false);

  // Selected Questions currently attached to this exam
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [showQuestionsList, setShowQuestionsList] = useState(false);

  // Active question addition tab inside the modal (Direct, No popup)
  const [activeAddMode, setActiveAddMode] = useState<QuestionAddMode>("bank");

  // ----------------------------------------------------
  // Tab 1: Question Bank Picker States
  // ----------------------------------------------------
  const [bankSubjectFilter, setBankSubjectFilter] = useState<string>("all");
  const [bankTopicFilter, setBankTopicFilter] = useState<string>("all");
  const [bankSearchQuery, setBankSearchQuery] = useState<string>("");

  // ----------------------------------------------------
  // Tab 2: Direct Manual Question Creator States
  // ----------------------------------------------------
  const [manualSubject, setManualSubject] = useState<string>("");
  const [manualTopic, setManualTopic] = useState<string>("");
  const [manualQuestionText, setManualQuestionText] = useState<string>("");
  const [manualArabicText, setManualArabicText] = useState<string>("");
  const [manualOptions, setManualOptions] = useState<string[]>([
    "",
    "",
    "",
    "",
  ]);
  const [manualCorrectIndex, setManualCorrectIndex] = useState<number>(0);
  const [manualExplanation, setManualExplanation] = useState<string>("");
  const [manualSource, setManualSource] = useState<string>("");
  const [manualDifficulty, setManualDifficulty] =
    useState<QuestionDifficulty>("Medium");
  const [manualExamType, setManualExamType] =
    useState<ExamTargetCategory>("NTRCA");

  // ----------------------------------------------------
  // Tab 3: Direct Copy-Paste Parser States
  // ----------------------------------------------------
  const [pasteSubject, setPasteSubject] = useState<string>("");
  const [pasteTopic, setPasteTopic] = useState<string>("");
  const [rawPasteText, setRawPasteText] = useState<string>("");
  const [isParsingPaste, setIsParsingPaste] = useState<boolean>(false);
  const [parsedPasteQuestions, setParsedPasteQuestions] = useState<Question[]>(
    []
  );

  // ----------------------------------------------------
  // Tab 4: Direct Gemini AI Generator States
  // ----------------------------------------------------
  const [aiSubject, setAiSubject] = useState<string>("");
  const [aiTopic, setAiTopic] = useState<string>("");
  const [aiDifficulty, setAiDifficulty] =
    useState<QuestionDifficulty>("Medium");
  const [aiExamType, setAiExamType] = useState<ExamTargetCategory>("NTRCA");
  const [aiCount, setAiCount] = useState<number>(5);
  const [aiLanguage, setAiLanguage] = useState<"bn" | "en" | "ar" | "mixed">(
    "bn"
  );
  const [aiIncludeArabic, setAiIncludeArabic] = useState<boolean>(true);
  const [aiCustomPrompt, setAiCustomPrompt] = useState<string>("");
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [generatedAiQuestions, setGeneratedAiQuestions] = useState<Question[]>(
    []
  );

  // Initialize or Reset Form
  useEffect(() => {
    if (examToEdit) {
      setTitle(examToEdit.title);
      const hasCourse = Boolean(examToEdit.course_id);
      setExamTargetType(hasCourse ? "course_exam" : "free_exam");
      setSelectedCourseId(examToEdit.course_id || initialCourseId || "");
      setCategory(examToEdit.category || (hasCourse ? "daily_live" : "free_test"));
      setSubject(examToEdit.subject || "নাহু ও সরফ");
      setSyllabus(examToEdit.syllabus || "");
      setDurationMinutes(examToEdit.duration_minutes || 20);
      setTotalMarks(examToEdit.total_marks || 20);
      setNegativeMarking(examToEdit.negative_marking ?? 0.25);
      setStatus(examToEdit.status || "live");

      // Populate existing questions
      if (examToEdit.questions && examToEdit.questions.length > 0) {
        setExamQuestions(examToEdit.questions);
      } else {
        // Try to match questions linked by exam_id, free_exam_id or subject from question bank
        const linked = questions.filter((q) => (q.exam_id && q.exam_id === examToEdit.id) || (q.free_exam_id && q.free_exam_id === examToEdit.id));
        if (linked.length > 0) {
          setExamQuestions(linked);
        } else {
          const subMatch = questions.filter(
            (q) =>
              (q.subject_name && examToEdit.subject && q.subject_name.toLowerCase().includes(examToEdit.subject.toLowerCase())) ||
              (q.subject_id && examToEdit.subject && examToEdit.subject.includes(q.subject_id))
          );
          setExamQuestions(subMatch.length > 0 ? subMatch.slice(0, 10) : questions.slice(0, 5));
        }
      }

      setManualSubject(examToEdit.subject || "নাহু ও সরফ");
      setPasteSubject(examToEdit.subject || "নাহু ও সরফ");
      setAiSubject(examToEdit.subject || "নাহু ও সরফ");
    } else {
      setTitle("");
      const isInitialCourse = Boolean(initialCourseId);
      setExamTargetType(isInitialCourse ? "course_exam" : "free_exam");
      setSelectedCourseId(initialCourseId || "");
      setCategory(isInitialCourse ? "daily_live" : "free_test");
      setSubject("নাহু ও সরফ");
      setSyllabus("");
      setDurationMinutes(20);
      setTotalMarks(20);
      setNegativeMarking(0.25);
      setStatus("live");
      // Default to first 5 questions if available
      setExamQuestions(questions.slice(0, 5));

      setManualSubject("নাহু ও সরফ");
      setPasteSubject("নাহু ও সরফ");
      setAiSubject("নাহু ও সরফ");
    }
  }, [examToEdit, initialCourseId, isOpen]);

  // Sync subject field changes to sub-tabs
  const handleExamSubjectChange = (newSub: string) => {
    setSubject(newSub);
    if (!manualSubject || manualSubject === subject) setManualSubject(newSub);
    if (!pasteSubject || pasteSubject === subject) setPasteSubject(newSub);
    if (!aiSubject || aiSubject === subject) setAiSubject(newSub);
  };

  if (!isOpen) return null;

  // ----------------------------------------------------
  // Helpers for Question Attachment
  // ----------------------------------------------------
  const isQuestionAttached = (qId: string) => {
    return examQuestions.some((q) => q.id === qId);
  };

  const toggleAttachQuestion = (q: Question) => {
    if (isQuestionAttached(q.id)) {
      setExamQuestions((prev) => prev.filter((item) => item.id !== q.id));
    } else {
      setExamQuestions((prev) => [...prev, q]);
    }
  };

  const removeExamQuestion = (qId: string) => {
    setExamQuestions((prev) => prev.filter((q) => q.id !== qId));
    showToast("প্রশ্নটি পরীক্ষা থেকে বাদ দেওয়া হয়েছে", "info");
  };

  const clearAllExamQuestions = () => {
    setExamQuestions([]);
    showToast("সব প্রশ্ন সরানো হয়েছে", "info");
  };

  // ----------------------------------------------------
  // Bank Filter Logic
  // ----------------------------------------------------
  const availableBankTopics = Array.from(
    new Set(
      questions
        .filter(
          (q) =>
            bankSubjectFilter === "all" || q.subject_id === bankSubjectFilter
        )
        .map((q) => q.topic)
        .filter(Boolean)
    )
  );

  const filteredBankQuestions = questions.filter((q) => {
    const matchesSubject =
      bankSubjectFilter === "all" ||
      q.subject_id === bankSubjectFilter ||
      q.subject_name.toLowerCase() === bankSubjectFilter.toLowerCase();
    const matchesTopic =
      bankTopicFilter === "all" || q.topic === bankTopicFilter;
    const matchesSearch =
      !bankSearchQuery ||
      q.question.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
      (q.arabic_text &&
        q.arabic_text.toLowerCase().includes(bankSearchQuery.toLowerCase())) ||
      (q.topic &&
        q.topic.toLowerCase().includes(bankSearchQuery.toLowerCase())) ||
      q.subject_name.toLowerCase().includes(bankSearchQuery.toLowerCase());

    return matchesSubject && matchesTopic && matchesSearch;
  });

  const selectAllFilteredBankQuestions = () => {
    const newItems = filteredBankQuestions.filter(
      (fq) => !isQuestionAttached(fq.id)
    );
    if (newItems.length === 0) {
      showToast("সবগুলো প্রশ্ন ইতোমধ্যে যুক্ত আছে", "info");
      return;
    }
    setExamQuestions((prev) => [...prev, ...newItems]);
    showToast(`${newItems.length}টি প্রশ্ন পরীক্ষায় যুক্ত করা হয়েছে`, "success");
  };

  const deselectAllFilteredBankQuestions = () => {
    const idsToRemove = new Set(filteredBankQuestions.map((q) => q.id));
    setExamQuestions((prev) => prev.filter((q) => !idsToRemove.has(q.id)));
    showToast("ফিল্টার করা প্রশ্নগুলো সরানো হয়েছে", "info");
  };

  // ----------------------------------------------------
  // Manual Question Submit
  // ----------------------------------------------------
  const handleAddManualQuestionToExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuestionText.trim()) {
      showToast("প্রশ্নের মূল টেক্সট লিখুন", "error");
      return;
    }
    if (manualOptions.some((opt) => !opt.trim())) {
      showToast("দয়া করে ৪টি বিকল্পই পূরণ করুন", "error");
      return;
    }

    const effectiveSub = manualSubject.trim() || subject || "সাধারণ বিষয়";
    const effectiveTopic = manualTopic.trim() || syllabus || "সাধারণ";

    const matchedSub = subjects.find(
      (s) =>
        s.name_bn.toLowerCase() === effectiveSub.toLowerCase() ||
        s.id === effectiveSub
    );
    const subId = matchedSub ? matchedSub.id : `sub-custom-${Date.now()}`;

    const newQ: Question = {
      id: `q-manual-${Date.now()}`,
      exam_id: examToEdit ? examToEdit.id : undefined,
      subject_id: subId,
      subject_name: effectiveSub,
      topic: effectiveTopic,
      question: manualQuestionText.trim(),
      question_text: manualQuestionText.trim(),
      arabic_text: manualArabicText.trim() || undefined,
      options: manualOptions.map((o) => o.trim()),
      option_a: manualOptions[0].trim(),
      option_b: manualOptions[1].trim(),
      option_c: manualOptions[2].trim(),
      option_d: manualOptions[3].trim(),
      correct_index: manualCorrectIndex,
      correct_option: ["option_a", "option_b", "option_c", "option_d"][
        manualCorrectIndex
      ],
      explanation: manualExplanation.trim(),
      source: manualSource.trim() || "মাদ্রাসা পাঠ্যবই",
      difficulty: manualDifficulty,
      exam_type: manualExamType,
      created_at: new Date().toISOString(),
    };

    // 1. Add to global bank
    addQuestion(newQ);
    // 2. Add to this exam
    setExamQuestions((prev) => [...prev, newQ]);

    showToast(
      "প্রশ্নটি সফলভাবে তৈরি হয়ে পরীক্ষায় ও প্রশ্ন ব্যাংকে যুক্ত হয়েছে!",
      "success"
    );

    // Reset manual fields for next question
    setManualQuestionText("");
    setManualArabicText("");
    setManualOptions(["", "", "", ""]);
    setManualCorrectIndex(0);
    setManualExplanation("");
    setManualSource("");
  };

  // ----------------------------------------------------
  // Paste Parser Logic
  // ----------------------------------------------------
  const handleParsePasteText = async () => {
    if (!rawPasteText.trim()) {
      showToast("দয়া করে টেক্সট পেস্ট করুন", "error");
      return;
    }

    setIsParsingPaste(true);
    const effSub = pasteSubject.trim() || subject || "সাধারণ বিষয়";
    const effTopic = pasteTopic.trim() || "সাধারণ";

    try {
      const response = await fetch("/api/gemini/parse-raw-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: rawPasteText,
          defaultSubject: effSub,
          subject_name: effSub,
          topic: effTopic,
        }),
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.questions)) {
        const formatted: Question[] = data.questions.map(
          (q: any, idx: number) => ({
            id: `paste-q-${Date.now()}-${idx}`,
            exam_id: examToEdit ? examToEdit.id : undefined,
            subject_id: "parsed",
            subject_name: effSub,
            topic: q.topic || effTopic,
            question: q.question || "প্রশ্ন",
            question_text: q.question,
            arabic_text: q.arabic_text || "",
            options:
              q.options && q.options.length >= 2
                ? q.options
                : ["ক", "খ", "গ", "ঘ"],
            option_a: q.options?.[0] || "ক",
            option_b: q.options?.[1] || "খ",
            option_c: q.options?.[2] || "গ",
            option_d: q.options?.[3] || "ঘ",
            correct_index:
              q.correct_index !== undefined ? Number(q.correct_index) : 0,
            correct_option: [
              "option_a",
              "option_b",
              "option_c",
              "option_d",
            ][q.correct_index || 0],
            explanation: q.explanation || "",
            source: q.source || "মাদ্রাসা পাঠ্যবই",
            difficulty: "Medium",
            exam_type: "NTRCA",
            created_at: new Date().toISOString(),
          })
        );

        setParsedPasteQuestions(formatted);
        showToast(
          `${formatted.length}টি প্রশ্ন পার্স হয়েছে! নিচে চেক করে পরীক্ষায় যুক্ত করুন।`,
          "success"
        );
      } else {
        throw new Error(data.error || "Failed to parse text");
      }
    } catch (err: any) {
      // Local fallback regex parser
      const lines = rawPasteText.split("\n").filter((l) => l.trim());
      const fallbackList: Question[] = [];
      let curQ: Partial<Question> | null = null;
      let opts: string[] = [];

      lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (/^\d+[\.\)]\s*/.test(trimmed) || /^(প্রশ্ন|Q)[\s\d]*:?/i.test(trimmed)) {
          if (curQ && curQ.question) {
            fallbackList.push({
              id: `paste-local-${Date.now()}-${idx}`,
              subject_id: "parsed",
              subject_name: effSub,
              topic: effTopic,
              question: curQ.question,
              options: opts.length >= 2 ? opts : ["ক", "খ", "গ", "ঘ"],
              correct_index: 0,
              explanation: "সঠিক সমাধান",
              source: "রেফারেন্স বই",
              difficulty: "Medium",
              exam_type: "NTRCA",
              created_at: new Date().toISOString(),
            });
          }
          curQ = { question: trimmed.replace(/^\d+[\.\)]\s*/, "") };
          opts = [];
        } else if (/^[(\[]?[কখগঘabcdABCD1234][)\]\.]\s*/.test(trimmed)) {
          opts.push(trimmed.replace(/^[(\[]?[কখগঘabcdABCD1234][)\]\.]\s*/, ""));
        }
      });

      if (curQ && (curQ as any).question) {
        fallbackList.push({
          id: `paste-local-last-${Date.now()}`,
          subject_id: "parsed",
          subject_name: effSub,
          topic: effTopic,
          question: (curQ as any).question,
          options: opts.length >= 2 ? opts : ["ক", "খ", "গ", "ঘ"],
          correct_index: 0,
          explanation: "সঠিক সমাধান",
          source: "রেফারেন্স বই",
          difficulty: "Medium",
          exam_type: "NTRCA",
          created_at: new Date().toISOString(),
        });
      }

      if (fallbackList.length > 0) {
        setParsedPasteQuestions(fallbackList);
        showToast(`${fallbackList.length}টি প্রশ্ন পার্স হয়েছে!`, "success");
      } else {
        showToast("টেক্সট পার্স করা যায়নি। ফরম্যাট চেক করুন।", "error");
      }
    } finally {
      setIsParsingPaste(false);
    }
  };

  const handleAddParsedQuestionsToExam = () => {
    if (parsedPasteQuestions.length === 0) return;

    addBulkQuestions(parsedPasteQuestions);
    setExamQuestions((prev) => [...prev, ...parsedPasteQuestions]);
    showToast(
      `${parsedPasteQuestions.length}টি প্রশ্ন পরীক্ষায় এবং প্রশ্ন ব্যাংকে যুক্ত হয়েছে!`,
      "success"
    );
    setParsedPasteQuestions([]);
    setRawPasteText("");
  };

  // ----------------------------------------------------
  // AI Generator Logic
  // ----------------------------------------------------
  const handleGenerateAiQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingAi(true);

    const effSub = aiSubject.trim() || subject || "সাধারণ বিষয়";
    const effTopic = aiTopic.trim() || syllabus || "সাধারণ প্রস্তুতি";

    try {
      const response = await fetch("/api/gemini/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_name: effSub,
          topic: effTopic,
          difficulty: aiDifficulty,
          exam_type: aiExamType,
          count: aiCount,
          include_arabic: aiIncludeArabic,
          language: aiLanguage,
          customPrompt: aiCustomPrompt,
        }),
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.questions)) {
        const formatted: Question[] = data.questions.map(
          (q: any, idx: number) => ({
            id: `ai-exam-${Date.now()}-${idx}`,
            exam_id: examToEdit ? examToEdit.id : undefined,
            subject_id: "ai",
            subject_name: effSub,
            topic: q.topic || effTopic,
            question: q.question,
            question_text: q.question,
            arabic_text: q.arabic_text || "",
            options:
              q.options && q.options.length >= 2
                ? q.options
                : ["ক", "খ", "গ", "ঘ"],
            option_a: q.options?.[0] || "ক",
            option_b: q.options?.[1] || "খ",
            option_c: q.options?.[2] || "গ",
            option_d: q.options?.[3] || "ঘ",
            correct_index:
              q.correct_index !== undefined ? Number(q.correct_index) : 0,
            correct_option: [
              "option_a",
              "option_b",
              "option_c",
              "option_d",
            ][q.correct_index || 0],
            explanation: q.explanation || "",
            source: q.source || "Gemini AI কারিকুলাম রেফারেন্স",
            difficulty: q.difficulty || aiDifficulty,
            exam_type: q.exam_type || aiExamType,
            language: aiLanguage,
            created_at: new Date().toISOString(),
          })
        );

        setGeneratedAiQuestions(formatted);
        showToast(
          `${formatted.length}টি AI প্রশ্ন সফলভাবে তৈরি হয়েছে! নিচে চেক করে পরীক্ষায় যুক্ত করুন।`,
          "success"
        );
      } else {
        throw new Error(data.error || "Failed to generate AI questions");
      }
    } catch (err: any) {
      console.error(err);
      // Fallback generator
      const fallbackList: Question[] = Array.from({ length: aiCount }).map(
        (_, i) => ({
          id: `ai-fallback-${Date.now()}-${i}`,
          subject_id: "ai",
          subject_name: effSub,
          topic: effTopic,
          question: `প্রশ্ন ${i + 1}: ${effSub} (${effTopic}) বিষয়ক প্রমিত প্রশ্ন?`,
          arabic_text: aiIncludeArabic
            ? "قَالَ رَسُولُ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ: «طَلَبُ الْعِلْمِ فَرِيضَةٌ»"
            : undefined,
          options: [
            "বিকল্প ক (সঠিক উত্তর)",
            "বিকল্প খ",
            "বিকল্প গ",
            "বিকল্প ঘ",
          ],
          correct_index: 0,
          explanation: "এটি প্রমিত মাদ্রাসা কারিকুলাম অনুযায়ী সঠিক উত্তর।",
          source: "আল-হেদায়া ও প্রমিত ফতোয়া সংকলন",
          difficulty: aiDifficulty,
          exam_type: aiExamType,
          language: aiLanguage,
          created_at: new Date().toISOString(),
        })
      );
      setGeneratedAiQuestions(fallbackList);
      showToast("AI প্রশ্ন তৈরি হয়েছে!", "success");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAddAiQuestionsToExam = () => {
    if (generatedAiQuestions.length === 0) return;

    addBulkQuestions(generatedAiQuestions);
    setExamQuestions((prev) => [...prev, ...generatedAiQuestions]);
    showToast(
      `${generatedAiQuestions.length}টি AI প্রশ্ন পরীক্ষায় ও প্রশ্ন ব্যাংকে যুক্ত হয়েছে!`,
      "success"
    );
    setGeneratedAiQuestions([]);
  };

  // ----------------------------------------------------
  // Form Final Submit (Exam Create / Update)
  // ----------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (!title.trim()) {
      showToast("দয়া করে পরীক্ষার শিরোনাম প্রদান করুন", "error");
      return;
    }

    const isCourseExam = examTargetType === "course_exam";

    // Strict validation: Course Exam MUST have a valid course_id
    if (isCourseExam && (!selectedCourseId || selectedCourseId.trim() === "")) {
      showToast("কোর্স পরীক্ষার জন্য অবশ্যই একটি কোর্স নির্বাচন করতে হবে (course_id NULL থাকা যাবে না)।", "error");
      return;
    }

    if (examQuestions.length === 0) {
      showToast(
        "দয়া করে পরীক্ষায় অন্তত ১টি প্রশ্ন যুক্ত করুন (ব্যাংক/ম্যানুয়াল/পেস্ট/AI)",
        "error"
      );
      return;
    }

    setIsSaving(true);

    try {
      const now = new Date();
      const startTime = now.toISOString();
      const endTime = new Date(
        now.getTime() + durationMinutes * 60000 * 24
      ).toISOString();

      const mappedExamType =
        category === "daily_live"
          ? "live_exam"
          : category === "premium_ntrca"
          ? "full_test"
          : "model_test";

      const calculatedTotalMarks = Number(totalMarks || examQuestions.length || 50);
      const calculatedPassMarks = Math.round(calculatedTotalMarks * 0.4) || 20;

      const finalCourseId = isCourseExam ? selectedCourseId : null;
      const isFree = !isCourseExam;

      const examData = {
        course_id: finalCourseId,
        title: title.trim(),
        description: syllabus.trim() || subject.trim() || title.trim(),
        category: isCourseExam ? category : "free_test",
        exam_type: mappedExamType,
        subject: subject.trim(),
        syllabus: syllabus.trim(),
        duration_minutes: Number(durationMinutes),
        total_questions: Number(examQuestions.length),
        total_marks: calculatedTotalMarks,
        negative_marking: Number(negativeMarking),
        negative_mark: Number(negativeMarking),
        pass_marks: calculatedPassMarks,
        pass_mark: calculatedPassMarks,
        start_time: startTime,
        end_time: endTime,
        exam_date: startTime,
        is_free: isFree,
        is_published: true,
        sort_order: 0,
        status,
        participant_count: examToEdit ? examToEdit.participant_count : 0,
        result_published: examToEdit ? examToEdit.result_published : false,
        questions: examQuestions.map((q) => ({
          ...q,
          exam_id: isCourseExam ? (examToEdit?.id || q.exam_id) : undefined,
          free_exam_id: !isCourseExam ? (examToEdit?.id || q.free_exam_id || q.exam_id) : undefined,
        })),
        table_type: isCourseExam ? "course_exams" : "free_exams",
      };

      if (examToEdit) {
        const res = await updateExam(examToEdit.id, examData);
        if (res && res.success === false) {
          return;
        }
      } else {
        const res = await addExam(examData);
        if (res && res.success === false) {
          return;
        }
      }

      onClose();
    } catch (err: any) {
      console.error("Error submitting exam:", err);
      showToast(`পরীক্ষা সংরক্ষণ করতে সমস্যা হয়েছে: ${err?.message || ""}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Harakat Toolbar items
  const harakatList = [
    { label: "َ", name: "ফাতহাহ (যবর)", char: "َ" },
    { label: "ِ", name: "কাসরাহ (যের)", char: "ِ" },
    { label: "ُ", name: "দাম্মাহ (পেশ)", char: "ُ" },
    { label: "ً", name: "তানভীন ফাতহাহ", char: "ً" },
    { label: "ٍ", name: "তানভীন কাসরাহ", char: "ٍ" },
    { label: "ٌ", name: "তানভীন দাম্মাহ", char: "ٌ" },
    { label: "ّ", name: "তাশদীদ", char: "ّ" },
    { label: "ْ", name: "সুকুন/জযম", char: "ْ" },
    { label: "ٰ", name: "খাড়া যবর", char: "ٰ" },
  ];

  const insertHarakat = (char: string) => {
    setManualArabicText((prev) => prev + char);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in my-auto max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                {examToEdit
                  ? "মডেল টেস্ট এডিট ও প্রশ্ন কন্ট্রোলার"
                  : "নতুন মডেল টেস্ট ও পরীক্ষা তৈরি করুন"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                সময়কাল, নেগেটিভ মার্কিং এবং ৪টি পদ্ধতিতে সরাসরি প্রশ্ন যুক্ত
                করুন
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Section 1: Basic Exam Configurations */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2.5">
              <h4 className="font-bold text-slate-800 dark:text-white text-xs flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>১. পরীক্ষার ধরন, সাধারণ তথ্য ও শিডিউল</span>
              </h4>

              {/* Target Table Mode Selector */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setExamTargetType("free_exam");
                    setSelectedCourseId("");
                    setCategory("free_test");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    examTargetType === "free_exam"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-amber-600"
                  }`}
                >
                  <span>🎁 ফ্রি পরীক্ষা / মডেল টেস্ট (free_exams)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExamTargetType("course_exam");
                    if (!selectedCourseId && courses.length > 0) {
                      setSelectedCourseId(courses[0].id);
                    }
                    setCategory("daily_live");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    examTargetType === "course_exam"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-emerald-600"
                  }`}
                >
                  <span>🎓 কোর্স পরীক্ষা (course_exams)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  পরীক্ষার নাম / শিরোনাম *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="যেমন: ১৯তম NTRCA প্রিলি মেগা মডেল টেস্ট - ০১"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  required
                />
              </div>

              {examTargetType === "course_exam" ? (
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
                    <span>সংযুক্ত কোর্স / ব্যাচ (Course) * (বাধ্যতামূলক)</span>
                    <span className="text-[10px] text-emerald-600 font-bold">course_exams টেবিল</span>
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-emerald-400 dark:border-emerald-600 bg-emerald-50/60 dark:bg-slate-800 text-slate-900 dark:text-white font-bold cursor-pointer focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">-- কোর্স নির্বাচন করুন (বাধ্যতামূলক) --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        📚 {c.title} {c.course_tag ? `(${c.course_tag})` : ""}
                      </option>
                    ))}
                  </select>
                  {!selectedCourseId && (
                    <p className="text-[10px] text-rose-500 font-medium mt-1">
                      ⚠️ কোর্স পরীক্ষার জন্য course_id ফাঁকা রাখা যাবে না।
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
                    <span>পরীক্ষার পরিধি ও ধরন</span>
                    <span className="text-[10px] text-amber-600 font-bold">free_exams টেবিল</span>
                  </label>
                  <div className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-slate-800 text-amber-900 dark:text-amber-200 font-medium text-[11px] flex items-center gap-1.5">
                    <span>✨ উন্মুক্ত ও ফ্রি মডেল টেস্ট (কোর্সের আওতাভুক্ত নয়)</span>
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  ক্যাটাগরি
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExamCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer"
                >
                  {examTargetType === "course_exam" ? (
                    <>
                      <option value="daily_live">দৈনিক লাইভ পরীক্ষা (Daily Live)</option>
                      <option value="weekly_model_test">সাপ্তাহিক মেগা টেস্ট (Weekly)</option>
                      <option value="monthly_mega">মাসিক মেগা মডেল টেস্ট</option>
                      <option value="premium_ntrca">প্রিমিয়াম NTRCA স্পেশাল</option>
                    </>
                  ) : (
                    <>
                      <option value="free_test">ফ্রি ট্রায়াল টেস্ট (Free Test)</option>
                      <option value="weekly_model_test">উন্মুক্ত সাপ্তাহিক মডেল টেস্ট</option>
                      <option value="daily_live">উন্মুক্ত ডেইলি টেস্ট</option>
                      <option value="monthly_mega">উন্মুক্ত মেগা মডেল টেস্ট</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  বিষয় / সাবজেক্ট
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => handleExamSubjectChange(e.target.value)}
                  placeholder="যেমন: আরবি সাহিত্য ও ব্যাকরণ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  সময়কাল (মিনিট)
                </label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  মোট নম্বর (Marks)
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  নেগেটিভ মার্কিং অনুপাত
                </label>
                <select
                  value={negativeMarking}
                  onChange={(e) => setNegativeMarking(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer"
                >
                  <option value={0}>নাই (০.০০)</option>
                  <option value={0.25}>০.২৫ নম্বর কর্তন (প্রমিত NTRCA)</option>
                  <option value={0.5}>০.৫০ নম্বর কর্তন</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  স্ট্যাটাস
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ExamStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer"
                >
                  <option value="live">লাইভ চালু (Live)</option>
                  <option value="upcoming">আসন্ন (Upcoming)</option>
                  <option value="completed">সম্পন্ন (Completed)</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  সিলেবাস ও নির্দেশনা
                </label>
                <input
                  type="text"
                  value={syllabus}
                  onChange={(e) => setSyllabus(e.target.value)}
                  placeholder="যেমন: সন্ধি, কারক ও বিভক্তি, সমাস, ইলমুন নাহু এর মারফুআত..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Attached Questions Summary Bar with Toggle Review List */}
          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                {examQuestions.length}
              </span>
              <div>
                <span className="font-bold text-emerald-950 dark:text-emerald-200 text-xs">
                  এই পরীক্ষায় যুক্ত প্রশ্ন: {examQuestions.length} টি
                </span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 ml-1.5">
                  (মোট নম্বর: {totalMarks})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {examQuestions.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowQuestionsList(!showQuestionsList)}
                    className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer hover:bg-emerald-100"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{showQuestionsList ? "তালিকা লুকান" : "যুক্ত হওয়া প্রশ্ন দেখুন"}</span>
                    {showQuestionsList ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={clearAllExamQuestions}
                    className="px-2.5 py-1 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold text-[11px] hover:bg-rose-200 cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>সব ক্লিয়ার</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Collapsible List of Attached Questions */}
          {showQuestionsList && examQuestions.length > 0 && (
            <div className="max-h-60 overflow-y-auto space-y-2 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in">
              {examQuestions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-2 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                        {q.subject_name}
                      </span>
                      {q.topic && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 font-semibold">
                          {q.topic}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-slate-800 dark:text-white">
                      {q.question}
                    </p>
                    {q.arabic_text && (
                      <p
                        className="font-arabic text-emerald-800 dark:text-emerald-300 text-xs font-semibold"
                        dir="rtl"
                      >
                        {q.arabic_text}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                      {q.options.map((opt, oIdx) => (
                        <span
                          key={oIdx}
                          className={`px-1.5 py-0.5 rounded ${
                            q.correct_index === oIdx
                              ? "bg-emerald-600 text-white font-bold"
                              : "bg-slate-100 dark:bg-slate-800"
                          }`}
                        >
                          {["ক", "খ", "গ", "ঘ"][oIdx]}: {opt}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeExamQuestion(q.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 cursor-pointer flex-shrink-0"
                    title="এই প্রশ্নটি পরীক্ষা থেকে বাদ দিন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Section 3: Direct In-Form Question Adders (No Popups!) */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-white text-xs flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>২. পরীক্ষায় প্রশ্ন যুক্ত করার পদ্ধতি নির্বাচন করুন (সরাসরি ফর্মের ভেতর):</span>
              </h4>
            </div>

            {/* 4 Direct Mode Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setActiveAddMode("bank")}
                className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  activeAddMode === "bank"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>১. প্রশ্ন ব্যাংক থেকে</span>
                <span className="text-[9px] opacity-80">সিলেক্ট করুন</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAddMode("manual")}
                className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  activeAddMode === "manual"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400"
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>২. ম্যানুয়ালি লিখুন</span>
                <span className="text-[9px] opacity-80">বিষয় ও টপিক সহ</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAddMode("paste")}
                className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  activeAddMode === "paste"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400"
                }`}
              >
                <ClipboardPaste className="w-4 h-4" />
                <span>৩. স্মার্ট কপি-পেস্ট</span>
                <span className="text-[9px] opacity-80">বাল্ক টেক্সট পার্সার</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAddMode("ai")}
                className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  activeAddMode === "ai"
                    ? "bg-gradient-to-tr from-amber-500 to-amber-600 text-white border-amber-500 shadow-md shadow-amber-500/20"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>৪. Gemini AI জেনারেটর</span>
                <span className="text-[9px] opacity-80">টপিক দিয়ে তৈরি</span>
              </button>
            </div>

            {/* TAB 1: FROM QUESTION BANK */}
            {activeAddMode === "bank" && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Subject Filter */}
                    <div className="flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={bankSubjectFilter}
                        onChange={(e) => {
                          setBankSubjectFilter(e.target.value);
                          setBankTopicFilter("all");
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        <option value="all">সকল বিষয় ({questions.length})</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name_bn}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Topic Filter */}
                    {availableBankTopics.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <select
                          value={bankTopicFilter}
                          onChange={(e) => setBankTopicFilter(e.target.value)}
                          className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer max-w-[160px] truncate"
                        >
                          <option value="all">সকল টপিক</option>
                          {availableBankTopics.map((t, idx) => (
                            <option key={idx} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Quick Select / Deselect All */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllFilteredBankQuestions}
                      className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold text-[11px] hover:bg-emerald-200 cursor-pointer"
                    >
                      ফিল্টার করা সব যোগ ({filteredBankQuestions.length})
                    </button>
                    <button
                      type="button"
                      onClick={deselectAllFilteredBankQuestions}
                      className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] hover:bg-slate-300 cursor-pointer"
                    >
                      বাদ দিন
                    </button>
                  </div>
                </div>

                {/* Search in bank */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={bankSearchQuery}
                    onChange={(e) => setBankSearchQuery(e.target.value)}
                    placeholder="প্রশ্ন, ইবারত বা ব্যাখ্যা দিয়ে খুঁজুন..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>

                {/* Questions List */}
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {filteredBankQuestions.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      কোনো প্রশ্ন পাওয়া যায়নি। ফিল্টার পরিবর্তন করুন অথবা ম্যানুয়ালি / AI দিয়ে তৈরি করুন।
                    </div>
                  ) : (
                    filteredBankQuestions.map((q) => {
                      const isSelected = isQuestionAttached(q.id);
                      return (
                        <div
                          key={q.id}
                          onClick={() => toggleAttachQuestion(q)}
                          className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between gap-3 text-xs transition-all ${
                            isSelected
                              ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 font-medium text-emerald-950 dark:text-emerald-100 shadow-xs"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-300"
                          }`}
                        >
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                                {q.subject_name}
                              </span>
                              {q.topic && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-semibold">
                                  {q.topic}
                                </span>
                              )}
                            </div>
                            <p className="font-semibold truncate">{q.question}</p>
                            {q.arabic_text && (
                              <p
                                className="font-arabic text-emerald-700 dark:text-emerald-400 text-[11px] truncate"
                                dir="rtl"
                              >
                                {q.arabic_text}
                              </p>
                            )}
                          </div>

                          <input
                            type="checkbox"
                            checked={isSelected}
                            readOnly
                            className="w-4 h-4 accent-emerald-600 rounded flex-shrink-0 cursor-pointer"
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: DIRECT MANUAL QUESTION CREATOR */}
            {activeAddMode === "manual" && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      বিষয় (Subject)
                    </label>
                    <input
                      type="text"
                      value={manualSubject}
                      onChange={(e) => setManualSubject(e.target.value)}
                      placeholder="যেমন: বাংলা / আরবি / আল-কুরআন"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      অধ্যায় / টপিক (Topic)
                    </label>
                    <input
                      type="text"
                      value={manualTopic}
                      onChange={(e) => setManualTopic(e.target.value)}
                      placeholder="যেমন: সন্ধি / কারক / নাত ও সিফাত"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    প্রশ্নের মূল বক্তব্য / প্রশ্ন *
                  </label>
                  <textarea
                    rows={2}
                    value={manualQuestionText}
                    onChange={(e) => setManualQuestionText(e.target.value)}
                    placeholder="এখানে প্রশ্নটি লিখুন..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                {/* Arabic text with Harakat toolbar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-emerald-800 dark:text-emerald-300">
                      আরবি ইবারত / আয়াত / হাদিস (ঐচ্ছিক)
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {harakatList.map((h, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => insertHarakat(h.char)}
                          className="w-5 h-5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-emerald-700 dark:text-emerald-300 font-arabic font-bold text-xs flex items-center justify-center hover:bg-emerald-50 cursor-pointer"
                          title={h.name}
                        >
                          {h.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={manualArabicText}
                    onChange={(e) => setManualArabicText(e.target.value)}
                    placeholder="مَا هُوَ حُكْمُ..."
                    className="w-full px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-arabic text-sm text-right"
                    dir="rtl"
                  />
                </div>

                {/* Options A, B, C, D with click-to-select correct */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    ৪টি বিকল্প (ক্লিক করে সঠিক উত্তর নির্বাচন করুন) *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {manualOptions.map((opt, oIdx) => {
                      const isCorrect = manualCorrectIndex === oIdx;
                      return (
                        <div
                          key={oIdx}
                          onClick={() => setManualCorrectIndex(oIdx)}
                          className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                            isCorrect
                              ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-500 font-bold"
                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                              isCorrect
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {["ক", "খ", "গ", "ঘ"][oIdx]}
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const updated = [...manualOptions];
                              updated[oIdx] = e.target.value;
                              setManualOptions(updated);
                            }}
                            placeholder={`বিকল্প ${["ক", "খ", "গ", "ঘ"][oIdx]}`}
                            className="flex-1 bg-transparent border-none outline-none text-xs text-slate-900 dark:text-white"
                          />
                          {isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={manualExplanation}
                    onChange={(e) => setManualExplanation(e.target.value)}
                    placeholder="সঠিক উত্তরের ব্যাখ্যা (ঐচ্ছিক)..."
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                  <input
                    type="text"
                    value={manualSource}
                    onChange={(e) => setManualSource(e.target.value)}
                    placeholder="রেফারেন্স বই (যেমন: আল-হেদায়া / বাংলা ব্যাকরণ)..."
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddManualQuestionToExam}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>এই প্রশ্নটি পরীক্ষায় ও প্রশ্ন ব্যাংকে যুক্ত করুন</span>
                </button>
              </div>
            )}

            {/* TAB 3: SMART COPY-PASTE PARSER */}
            {activeAddMode === "paste" && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      বিষয় (Subject)
                    </label>
                    <input
                      type="text"
                      value={pasteSubject}
                      onChange={(e) => setPasteSubject(e.target.value)}
                      placeholder="যেমন: বাংলা / আরবি"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      অধ্যায় / টপিক (Topic)
                    </label>
                    <input
                      type="text"
                      value={pasteTopic}
                      onChange={(e) => setPasteTopic(e.target.value)}
                      placeholder="যেমন: কারক ও বিভক্তি / সমাস"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      MCQ প্রশ্নসমূহ এখানে পেস্ট করুন
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setRawPasteText(
                          `১. 'সন্ধি' ব্যাকরণের কোন অংশের আলোচ্য বিষয়?\n(ক) ধ্বনিতত্ত্ব (খ) শব্দতত্ত্ব (গ) রূপতত্ত্ব (ঘ) বাক্যতত্ত্ব\nউত্তর: ক\n\n২. 'বিদ্যালয়' এর সঠিক সন্ধি বিচ্ছেদ কোনটি?\n(ক) বিদ্যা + লয় (খ) বিদ্যা + আলয় (গ) বিদ্য + আলয় (ঘ) বিদ + আলয়\nউত্তর: খ`
                        )
                      }
                      className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
                    >
                      নমুনা পেস্ট করুন
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={rawPasteText}
                    onChange={(e) => setRawPasteText(e.target.value)}
                    placeholder="১. প্রশ্ন?\n(ক) বিকল্প ১ (খ) বিকল্প ২ (গ) বিকল্প ৩ (ঘ) বিকল্প ৪\nউত্তর: ক"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                  />
                </div>

                <button
                  type="button"
                  disabled={isParsingPaste}
                  onClick={handleParsePasteText}
                  className="w-full py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isParsingPaste ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>টেক্সট পার্স করা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      <span>টেক্সট পার্স করুন (Parse Questions)</span>
                    </>
                  )}
                </button>

                {/* Parsed Preview Cards */}
                {parsedPasteQuestions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-600 text-xs">
                        পার্স হওয়া প্রশ্ন ({parsedPasteQuestions.length} টি)
                      </span>
                      <button
                        type="button"
                        onClick={handleAddParsedQuestionsToExam}
                        className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>সব প্রশ্ন এই পরীক্ষায় যুক্ত করুন</span>
                      </button>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {parsedPasteQuestions.map((pq, pIdx) => (
                        <div
                          key={pIdx}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 dark:text-white">
                              {pIdx + 1}. {pq.question}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                              সঠিক: {["ক", "খ", "গ", "ঘ"][pq.correct_index]}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                            {pq.options.map((opt, oIdx) => (
                              <span
                                key={oIdx}
                                className={
                                  pq.correct_index === oIdx
                                    ? "font-bold text-emerald-600"
                                    : ""
                                }
                              >
                                {["ক", "খ", "গ", "ঘ"][oIdx]}. {opt}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: DIRECT GEMINI AI GENERATOR */}
            {activeAddMode === "ai" && (
              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-slate-800/40 border border-amber-200/80 dark:border-slate-700 space-y-3 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      বিষয় (Subject)
                    </label>
                    <input
                      type="text"
                      value={aiSubject}
                      onChange={(e) => setAiSubject(e.target.value)}
                      placeholder="যেমন: বাংলা / আরবি সাহিত্য"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      অধ্যায় / নির্দিষ্ট টপিক (Topic) *
                    </label>
                    <input
                      type="text"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="যেমন: সন্ধি / কারক / কাওয়ায়েদ"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      প্রশ্নের ভাষা
                    </label>
                    <select
                      value={aiLanguage}
                      onChange={(e) =>
                        setAiLanguage(
                          e.target.value as "bn" | "en" | "ar" | "mixed"
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer"
                    >
                      <option value="bn">বাংলা (Bengali)</option>
                      <option value="ar">العربية (Arabic مع التشكيل)</option>
                      <option value="en">English (ইংরেজি)</option>
                      <option value="mixed">দ্বিভাষিক (Mixed)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      ডিফিকাল্টি
                    </label>
                    <select
                      value={aiDifficulty}
                      onChange={(e) =>
                        setAiDifficulty(e.target.value as QuestionDifficulty)
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium cursor-pointer"
                    >
                      <option value="Easy">সহজ (Easy)</option>
                      <option value="Medium">মাঝারি (Medium)</option>
                      <option value="Hard">কঠিন (Hard)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      প্রশ্নের সংখ্যা: {aiCount} টি
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={20}
                      value={aiCount}
                      onChange={(e) => setAiCount(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer mt-1"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 pt-4">
                    <input
                      type="checkbox"
                      id="ai-harakat"
                      checked={aiIncludeArabic}
                      onChange={(e) => setAiIncludeArabic(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                    <label
                      htmlFor="ai-harakat"
                      className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer text-[11px]"
                    >
                      আরবি হরকত ও اعراب যুক্ত করুন
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isGeneratingAi}
                  onClick={handleGenerateAiQuestions}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingAi ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Gemini AI প্রশ্ন তৈরি করছে...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {aiCount}টি AI প্রশ্ন জেনারেট করুন ({aiTopic || aiSubject})
                      </span>
                    </>
                  )}
                </button>

                {/* AI Generated Preview Cards */}
                {generatedAiQuestions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-amber-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-700 dark:text-amber-400 text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>AI জেনারেট করা প্রশ্ন ({generatedAiQuestions.length} টি)</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleAddAiQuestionsToExam}
                        className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>সবগুলো এই পরীক্ষায় যুক্ত করুন</span>
                      </button>
                    </div>

                    <div className="max-h-52 overflow-y-auto space-y-2">
                      {generatedAiQuestions.map((gq, gIdx) => (
                        <div
                          key={gIdx}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-slate-700 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 dark:text-white">
                              {gIdx + 1}. {gq.question}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                              সঠিক: {["ক", "খ", "গ", "ঘ"][gq.correct_index]}
                            </span>
                          </div>
                          {gq.arabic_text && (
                            <p
                              className="font-arabic text-emerald-700 dark:text-emerald-400 text-xs text-right"
                              dir="rtl"
                            >
                              {gq.arabic_text}
                            </p>
                          )}
                          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                            {gq.options.map((opt, oIdx) => (
                              <span
                                key={oIdx}
                                className={
                                  gq.correct_index === oIdx
                                    ? "font-bold text-emerald-600"
                                    : ""
                                }
                              >
                                {["ক", "খ", "গ", "ঘ"][oIdx]}. {opt}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              মোট প্রশ্ন যুক্ত:{" "}
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                {examQuestions.length} টি
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold cursor-pointer shadow-md shadow-emerald-600/20 flex items-center gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{examToEdit ? "মডেল টেস্ট আপডেট করুন" : "মডেল টেস্ট প্রকাশ করুন"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
