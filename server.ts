import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialize Gemini AI client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not configured in environment.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Helper to safely extract JSON from Gemini text output
function extractJsonFromGeminiResponse(rawText: string | undefined): any {
  if (!rawText || !rawText.trim()) return [];
  let cleaned = rawText.trim();
  // Remove markdown fences like ```json ... ``` or ``` ... ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  // Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch (_err) {
    // Attempt regex extraction for JSON Array [...] or Object {...}
    const arrayMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch (_inner) {
        // continue
      }
    }
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        const parsed = JSON.parse(objMatch[0]);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (_inner) {
        // continue
      }
    }
    console.error("Failed to parse Gemini JSON output:", cleaned);
    throw new Error("AI মডেল থেকে সঠিক JSON ফরম্যাট পাওয়া যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
  }
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    appName: "Tamreen Central Admin CMS",
    timestamp: new Date().toISOString(),
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
  });
});

// AI Question Generator Endpoint (Gemini 3.7 Flash - Multilingual: Bangla, English, Arabic)
app.post("/api/gemini/generate-questions", async (req, res) => {
  try {
    const {
      subject,
      subject_name,
      topic,
      difficulty = "Medium",
      examType = "NTRCA",
      exam_type,
      count = 5,
      includeArabic = true,
      include_arabic,
      language = "bn", // "bn" | "en" | "ar" | "mixed"
      optionsFormat = "bn", // "bn" | "en" | "ar"
      customPrompt = "",
    } = req.body;

    const currentSubject = (subject_name || subject || "").trim() || "ইসলামিক স্টাডিজ ও মাদ্রাসা কারিকুলাম";
    const currentTopic = (topic || "").trim() || "সাধারণ পাঠ্যক্রম ও ব্যাকরণ";
    const currentExamType = exam_type || examType || "NTRCA";
    const shouldIncludeArabic = include_arabic ?? includeArabic ?? true;
    const qCount = Math.min(Math.max(Number(count) || 5, 1), 25);

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured in the environment. Please add GEMINI_API_KEY in the Settings > Secrets panel.",
      });
    }

    let languageInstructions = "";
    if (language === "ar") {
      languageInstructions = `CRITICAL LANGUAGE REQUIREMENT: ALL questions, options, and explanations MUST be written in classical Arabic (الفصحى).
- Include complete Harakat/Tashkeel/I'rab (مع التشكيل الكامل وضبط الإعراب) in the 'question', 'arabic_text', and 'options'.
- Provide 4 distinct options in Arabic.
- Reference authentic classical books (e.g. شرح ابن عقيل, الكافية, صحيح البخاري, تفسير القرطبي, فتح القدير).`;
    } else if (language === "en") {
      languageInstructions = `CRITICAL LANGUAGE REQUIREMENT: ALL questions, options, and explanations MUST be written in English.
- Target competitive examinations (e.g. NTRCA English, BCS English, General Grammar, Vocabulary, Literature, Comprehension).
- Options MUST be 4 distinct English choices with clear text.
- Explanations MUST clearly explain the grammatical rules, idioms, or contextual meaning in English.`;
    } else if (language === "mixed") {
      languageInstructions = `CRITICAL LANGUAGE REQUIREMENT: Bilingual / Mixed format (Bengali + Arabic text with full Harakat / English).
- Questions in Bengali explaining Arabic/English terms.
- For Quran/Hadith/Grammar, 'arabic_text' MUST have complete Tashkeel/Harakat (الحركات الكاملة).
- Explanations in Bengali with original text references.`;
    } else {
      languageInstructions = `CRITICAL LANGUAGE REQUIREMENT: Questions and explanations in Standard Bengali (বাংলা).
${shouldIncludeArabic ? "- For Islamic Studies, Quran, Hadith, Fiqh, Nahu, Sarf, Arabic text MUST be provided with full Harakat (اعراب / হরকত) in 'arabic_text'." : ""}
- Options in Bengali with proper formatting.`;
    }

    const promptText = `You are a senior curriculum specialist and question author for competitive examinations in Bangladesh (NTRCA 18th/19th Teacher Registration, Madrasah Board Dakhil/Alim/Fazil/Kamil, BCS, and Primary).

Generate exactly ${qCount} high-quality, authentic Multiple Choice Questions (MCQs) strictly on:
- Subject: "${currentSubject}"
- Specific Topic / Chapter: "${currentTopic}"
- Exam Target: "${currentExamType}"
- Difficulty Level: "${difficulty}" (Easy / Medium / Hard)
- Language: "${language}"

CRITICAL TOPICAL RULES:
1. Every single question MUST directly test knowledge of the given Topic: "${currentTopic}".
2. Provide exactly 4 plausible options for each question, where exactly one is definitively correct.
3. 'correct_index' must be an integer (0 for option 1, 1 for option 2, 2 for option 3, 3 for option 4).
4. Provide a clear, educational 'explanation' citing authentic textbook or primary sources in 'source'.
5. If the question deals with Arabic texts (Quran, Hadith, Nahu, Sarf, Balaghat, Fiqh), provide the exact Arabic excerpt with FULL Harakat/Tashkeel in 'arabic_text'.

${languageInstructions}
${customPrompt ? `Additional user custom requirement: ${customPrompt}` : ""}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: promptText,
      config: {
        systemInstruction:
          "You are an expert multilingual exam question creator. Always provide authentic, precise questions strictly tailored to the requested topic and subject with verified answers, clear explanations, and proper Arabic diacritics when relevant.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "Question text" },
              arabic_text: { type: Type.STRING, description: "Arabic text with full Harakat/I'rab if applicable" },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of exactly 4 options",
              },
              correct_index: {
                type: Type.INTEGER,
                description: "Index of the correct option (0 to 3)",
              },
              explanation: { type: Type.STRING, description: "Detailed explanation with reference" },
              source: { type: Type.STRING, description: "Source book or authentic reference" },
              difficulty: { type: Type.STRING },
              subject: { type: Type.STRING },
              topic: { type: Type.STRING },
              language: { type: Type.STRING },
            },
            required: ["question", "options", "correct_index", "explanation", "source"],
          },
        },
      },
    });

    const parsedQuestions = extractJsonFromGeminiResponse(response.text);
    const formattedQuestions = (Array.isArray(parsedQuestions) ? parsedQuestions : [parsedQuestions]).map((q: any) => ({
      ...q,
      subject: q.subject || currentSubject,
      topic: q.topic || currentTopic,
      difficulty: q.difficulty || difficulty,
      language: q.language || language,
    }));

    return res.json({
      success: true,
      count: formattedQuestions.length,
      questions: formattedQuestions,
    });
  } catch (error: any) {
    console.error("Gemini Question Generation Error:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate questions using AI",
    });
  }
});

// Shared Bulk Text Parser Handler
async function handleParseRawText(req: express.Request, res: express.Response) {
  try {
    const {
      rawText,
      raw_text,
      defaultSubject,
      subject_name,
      topic,
      language = "auto", // "auto" | "bn" | "en" | "ar" | "mixed"
      optionsFormat = "auto", // "auto" | "bn" | "en" | "ar"
    } = req.body;

    const textToParse = rawText || raw_text;
    const currentSubject = (subject_name || defaultSubject || "").trim() || "ইসলামিক স্টাডিজ ও সাধারণ বিষয়";
    const currentTopic = (topic || "").trim() || "সাধারণ";

    if (!textToParse || !textToParse.trim()) {
      return res.status(400).json({ error: "Raw text is required for parsing" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured.",
      });
    }

    const promptText = `Parse the following raw text containing multiple choice questions (MCQs) into structured JSON format for our question bank.
Supported Languages in input:
1. Bengali (বাংলা): e.g. ১. প্রশ্ন? (ক) ... (খ) ... (গ) ... (ঘ) ... সঠিক উত্তর: খ, ব্যাখ্যা: ...
2. English: e.g. 1. Question? (A) ... (B) ... (C) ... (D) ... Ans: B, Explanation: ...
3. Arabic (العربية مع التشكيل الكامل): e.g. ١. السؤال؟ (أ) ... (ب) ... (ج) ... (د) ... الإجابة: ب، الشرح: ...
4. Mixed/Bilingual: e.g. বাংলা প্রশ্ন সাথে আরবি বাক্য বা ইংরেজি পরিভাষা।

Instructions:
- Extract every single question accurately.
- For Arabic text or Quranic verses/Hadiths/grammar rules, preserve complete Harakat/Diacritics (اعراب / تشكيل). If the question is in Arabic or has an Arabic part, put the Arabic passage in 'arabic_text'.
- Extract exactly 4 clean options (strip option markers like (ক), A., 1., أ) from the option text.
- Determine the correct answer index: 0 for 1st option (A/ক/أ), 1 for 2nd option (B/খ/ب), 2 for 3rd option (C/গ/ج), 3 for 4th option (D/ঘ/د).
- If explanation or source is present in text, extract it. If not, generate a brief authentic 1-line explanation and reference.
- Default Subject: ${currentSubject}
- Default Topic: ${currentTopic}
- Target Language Hint: ${language}

Raw Text to parse:
\`\`\`
${textToParse}
\`\`\``;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: promptText,
      config: {
        systemInstruction:
          "You are an expert multilingual exam parser that accurately converts raw Bengali, English, and Arabic MCQ text into clean structured JSON format. Preserve Arabic harakat and diacritics with extreme precision.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              arabic_text: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correct_index: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
              source: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              subject: { type: Type.STRING },
              topic: { type: Type.STRING },
              language: { type: Type.STRING },
            },
            required: ["question", "options", "correct_index"],
          },
        },
      },
    });

    const parsedQuestions = extractJsonFromGeminiResponse(response.text);
    const formattedQuestions = (Array.isArray(parsedQuestions) ? parsedQuestions : [parsedQuestions]).map((q: any) => ({
      ...q,
      subject: q.subject || currentSubject,
      topic: q.topic || currentTopic,
    }));

    return res.json({
      success: true,
      count: formattedQuestions.length,
      questions: formattedQuestions,
    });
  } catch (error: any) {
    console.error("Gemini Raw Text Parser Error:", error);
    return res.status(500).json({
      error: error.message || "Failed to parse text with AI",
    });
  }
}

// Smart Bulk Text Parser Endpoints (Both paths supported)
app.post("/api/gemini/parse-raw-text", handleParseRawText);
app.post("/api/gemini/parse-bulk-questions", handleParseRawText);

// Start the Express server with Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Tamreen Admin CMS Server running on http://localhost:${PORT}`);
  });
}

startServer();
