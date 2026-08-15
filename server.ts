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

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    appName: "Tamreen Central Admin CMS",
    timestamp: new Date().toISOString(),
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
  });
});

// AI Question Generator Endpoint (Gemini Powered)
app.post("/api/gemini/generate-questions", async (req, res) => {
  try {
    const {
      subject,
      topic,
      difficulty = "Medium",
      examType = "NTRCA",
      count = 5,
      includeArabic = true,
      customPrompt = "",
    } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured. Please configure GEMINI_API_KEY in the Settings > Secrets panel.",
      });
    }

    const promptText = `You are a senior curriculum specialist and question author for Islamic and Madrasah education in Bangladesh (such as NTRCA Teachers Registration, Madrasah Directorate, Fazil/Kamil, Dakhil/Alim, and Islamic University).
Generate exactly ${count} multiple choice questions (MCQs) for:
- Subject: ${subject}
- Topic: ${topic || "General Islamic and Madrasah syllabus"}
- Difficulty: ${difficulty} (Easy / Medium / Hard)
- Exam Target: ${examType} (e.g., NTRCA, Alim, Kamil, BCS Islamic Studies)
${includeArabic ? "- IMPORTANT: For subjects like Quran, Hadith, Fiqh, Nahu, Sarf, Arabic Literature, provide accurate Arabic text with complete Harakat/Diacritics (اعراب / হরকত) in the 'arabic_text' field." : ""}
${customPrompt ? `- Additional specific instruction: ${customPrompt}` : ""}

For each question, provide:
1. question: Question in clean Bengali (Bangla)
2. arabic_text: Relevant Arabic Ayah, Hadith, or Arabic phrase with full Harakat/I'rab (or empty string if not applicable)
3. options: Array of exactly 4 options in Bengali (and/or Arabic terms). Example: ["ক) ...", "খ) ...", "গ) ...", "ঘ) ..."] or text options
4. correct_index: Integer 0, 1, 2, or 3 corresponding to the correct option in options array
5. explanation: Clear explanation in Bengali explaining why the answer is correct with authentic reference (e.g. Surah & Ayah, Sahih Bukhari Hadith no, or grammar rule in Nahu/Sarf)
6. source: Authentic book/reference name (e.g., তাফসিরে ইবনে কাসির, সহিহ বুখারি, হেদায়া, কাফিয়া, নূরুল আনওয়ার)
7. difficulty: "${difficulty}"
8. subject: "${subject}"
9. topic: "${topic || subject}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: promptText,
      config: {
        systemInstruction:
          "You are an expert Islamic studies and Madrasah competitive exam question creator. Always provide authentic, precise questions with verified answers and proper Arabic diacritics.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "Question text in Bengali" },
              arabic_text: { type: Type.STRING, description: "Arabic text with full Harakat/I'rab if applicable" },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of 4 options (A, B, C, D / ক, খ, গ, ঘ)",
              },
              correct_index: {
                type: Type.INTEGER,
                description: "Index of the correct option (0 to 3)",
              },
              explanation: { type: Type.STRING, description: "Detailed explanation in Bengali with reference" },
              source: { type: Type.STRING, description: "Source book or authentic reference" },
              difficulty: { type: Type.STRING },
              subject: { type: Type.STRING },
              topic: { type: Type.STRING },
            },
            required: ["question", "options", "correct_index", "explanation", "source"],
          },
        },
      },
    });

    const jsonText = response.text || "[]";
    const questions = JSON.parse(jsonText);
    return res.json({ success: true, count: questions.length, questions });
  } catch (error: any) {
    console.error("Gemini Question Generation Error:", error);
    return res.status(500).json({
      error: error.message || "Failed to generate questions using AI",
    });
  }
});

// Smart Bulk Text Parser Endpoint (Gemini Powered)
app.post("/api/gemini/parse-raw-text", async (req, res) => {
  try {
    const { rawText, defaultSubject = "ইসলামিক স্টাডিজ" } = req.body;

    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: "Raw text is required for parsing" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured.",
      });
    }

    const promptText = `Parse the following raw text containing MCQs into structured JSON format for our question bank.
Extract all questions, Arabic texts (if present with Harakat), 4 options, correct answer index, explanation (if available), and source.
Default Subject: ${defaultSubject}

Raw Text to parse:
\`\`\`
${rawText}
\`\`\``;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: promptText,
      config: {
        systemInstruction:
          "You are a parser that accurately converts raw Bangla and Arabic MCQ text into clean structured JSON format.",
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
            },
            required: ["question", "options", "correct_index"],
          },
        },
      },
    });

    const jsonText = response.text || "[]";
    const questions = JSON.parse(jsonText);
    return res.json({ success: true, count: questions.length, questions });
  } catch (error: any) {
    console.error("Gemini Raw Text Parser Error:", error);
    return res.status(500).json({
      error: error.message || "Failed to parse text with AI",
    });
  }
});

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
