import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini Client safely
  let ai: GoogleGenAI | null = null;
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log("Gemini API client initialized successfully in server.");
    } else {
      console.warn("WARN: GEMINI_API_KEY is not set. Conversational mode will fall back to predefined text.");
    }
  } catch (err) {
    console.error("Error initializing Gemini client:", err);
  }

  // API endpoint for dynamic conversational check-in
  app.post("/api/ama-response", async (req, res) => {
    try {
      const {
        language,
        nextIndex,
        answers,
        userJustAnsweredIndex,
        userJustAnsweredValue,
        messages,
        predefinedQuestion,
        emotionalQ2Response,
        emotionalQ3Response
      } = req.body;

      if (!ai) {
        throw new Error("Gemini client not initialized");
      }

      // Construct the context-aware prompt for Gemini 3.5 Flash
      const languageName = language === 'twi' ? 'Twi' : language === 'ga' ? 'Ga' : 'English';

      const recentChatText = messages && messages.length > 0
        ? messages.slice(-5).map((m: any) => `${m.sender === 'ama' ? 'Ama' : 'Mother'}: ${m.text}`).join("\n")
        : "";

      const prompt = `You are Ama, a warm, compassionate, and expert Ghanaian health assistant / midwife for pregnant mothers on the app "MamaMatch GH".
We are carrying out a standard 10-question maternal health check-in to assess if there are risk symptoms.
The mother is communicating in: ${languageName}.

Currently, she is about to receive question index ${nextIndex + 1} of 10.
The medical topic we MUST ask her about is defined by this standard question: "${predefinedQuestion}"

${userJustAnsweredIndex !== undefined && userJustAnsweredIndex >= 0 ? `The mother just responded to the previous question index ${userJustAnsweredIndex} with the answer: "${userJustAnsweredValue}".` : ''}

${userJustAnsweredIndex === 1 && userJustAnsweredValue === true ? `CRITICAL: The mother answered "Yes" to having bleeding/spotting. You MUST acknowledge this with deep compassion using the sentiment of: "${emotionalQ2Response}".` : ''}
${userJustAnsweredIndex === 2 && userJustAnsweredValue === true ? `CRITICAL: The mother answered "Yes" to having a severe headache. You MUST acknowledge this with deep compassion using the sentiment of: "${emotionalQ3Response}".` : ''}

Here is the recent conversation history for context:
${recentChatText}

Instructions:
1. Act as the caring, supportive Ghanaian health assistant and midwife Ama.
2. Formulate a short, warm, and direct response to the user. Max 2-3 sentences. Keep it compact so it fits beautifully in the chat interface.
3. Write completely and naturally in the selected language: "${languageName}". If Twi or Ga is selected, leverage natural local phrasing.
4. Integrate the medical query "${predefinedQuestion}" in your text so she can respond with Yes/No (or weeks).
5. Do NOT output metadata, headers, or internal labels. Output only the direct words Ama says to the mother.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      });

      const generatedText = response.text?.trim() || "";

      if (!generatedText) {
        throw new Error("Received empty text from Gemini");
      }

      res.json({ text: generatedText });
    } catch (error: any) {
      console.error("Error in /api/ama-response:", error);
      res.status(500).json({ error: "Failed to generate dynamic message", details: error.message });
    }
  });

  // Vite server / production routing integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
