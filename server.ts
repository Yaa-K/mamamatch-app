import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import { translations } from "./src/translations";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // JSON database persistence setup for Hackathon
  const DB_PATH = path.join(process.cwd(), "db-store.json");
  
  const defaultNurses = [
    {
      id: "nurse_1",
      name: "Abena Mensah",
      licenseNumber: "M-44512",
      region: "Ashanti",
      languages: ["English", "Twi"],
      availability: "Available",
      whatsapp: "233501234567",
      status: "VERIFIED",
      avatar: "/src/assets/midwives/8c1548b0575f612e98c57d4a163d6d63.jpg"
    },
    {
      id: "nurse_2",
      name: "Faustina Korankye",
      licenseNumber: "M-90211",
      region: "Greater Accra",
      languages: ["English", "Twi", "Ga"],
      availability: "Available",
      whatsapp: "233241234568",
      status: "VERIFIED",
      avatar: "/src/assets/midwives/download.jpg"
    },
    {
      id: "nurse_3",
      name: "Janet Osei",
      licenseNumber: "M-77112",
      region: "Northern",
      languages: ["English", "Dagbani", "Twi"],
      availability: "Available",
      whatsapp: "233201234569",
      status: "PENDING",
      avatar: "/src/assets/midwives/230d51c1dfcab904bad3f1d925b0e8b1.jpg"
    },
    {
      id: "nurse_4",
      name: "Martha Tagoe",
      licenseNumber: "M-33201",
      region: "Central",
      languages: ["English", "Fante", "Twi"],
      availability: "Busy",
      whatsapp: "233591234570",
      status: "VERIFIED",
      avatar: "/src/assets/midwives/a9da1dea6368ebb099100f489cc37cfe.jpg"
    }
  ];

  const defaultCheckIns = [
    {
      id: "triage_1",
      name: "Efua Mansa",
      phone: "+233245678912",
      language: "english",
      gestationalWeeks: 14,
      region: "Greater Accra",
      riskLevel: "MEDIUM",
      answers: { "0": "14", "1": false, "2": false, "3": true, "4": null, "5": true, "6": false, "7": false, "8": true, "9": true },
      summary: "Underwent physical check-in. Flagged for edema/swelling and localized discomfort.",
      riskExplanation: "Facial and feet swelling has been noted at 14 weeks. Although blood pressure checks are pending, symptoms warrant evaluation for early-stage preeclampsia risk.",
      pregnancyTips: [
        "Elevate your legs whenever resting or sitting.",
        "Maintain clean hydration, aiming for 3L daily. Prefer cocoyam greens/kontomire for iron."
      ],
      nextSteps: [
        "Schedule standard antenatal monitoring soon.",
        "Talk to Midwife Faustina regarding swelling care."
      ],
      timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
      status: "pending",
      matchedNurseId: "nurse_2"
    },
    {
      id: "triage_2",
      name: "Ama Serwah",
      phone: "+233549876543",
      language: "twi",
      gestationalWeeks: 28,
      region: "Ashanti",
      riskLevel: "HIGH",
      answers: { "0": "28", "1": true, "2": true, "3": false, "4": true, "5": false, "6": true, "7": false, "8": false, "9": true },
      summary: "Yɛahu anyinsɛn mu kyerɛwtohɔ. Mogya redɔm na tipae denden pii.",
      riskExplanation: "Symptom set includes vaginal spotting, high fever, and a continuous severe headache. Clinical intervention is required to safe-keep gestational status.",
      pregnancyTips: [
        "Rest immediately on your left side to improve placental circulation.",
        "Avoid lifting any heavy loads and drink fresh clean water."
      ],
      nextSteps: [
        "Proceed directly to Ridge Hospital or Komfo Anokye Teaching Hospital.",
        "Call Nurse Abena Mensah using her WhatsApp hotlink immediately."
      ],
      timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
      status: "pending",
      matchedNurseId: "nurse_1"
    },
    {
      id: "triage_3",
      name: "Naa Densua",
      phone: "+233201112222",
      language: "ga",
      gestationalWeeks: 34,
      region: "Greater Accra",
      riskLevel: "LOW",
      answers: { "0": "34", "1": false, "2": false, "3": false, "4": true, "5": false, "6": false, "7": false, "8": false, "9": true },
      summary: "Omusu eye shweshweeshwe. Saji fɛɛ yɛ kpakpa.",
      riskExplanation: "Excellent check-in response profile. No danger metrics registered today. Your baby has strong natural kinetic movements.",
      pregnancyTips: [
        "Continue consistent nutritional choices. High-fiber African stews, millet, and garden eggs.",
        "Walk gently and monitor prenatal updates closely as your due term approaches."
      ],
      nextSteps: [
        "Keep attending normal bi-weekly clinical health evaluations.",
        "Stay active in the community WhatsApp support guild."
      ],
      timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
      status: "completed",
      matchedNurseId: "nurse_2"
    }
  ];

  let db = {
    nurses: defaultNurses,
    checkIns: defaultCheckIns
  };

  if (fs.existsSync(DB_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
      if (Array.isArray(data.nurses)) db.nurses = data.nurses;
      if (Array.isArray(data.checkIns)) db.checkIns = data.checkIns;
    } catch (err) {
      console.warn("Could not read db-store.json, using defaults.");
    }
  } else {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
    } catch (err) {
      console.error("Error writing db-store.json:", err);
    }
  }

  const saveDB = () => {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
    } catch (err) {
      console.error("Error saving db-store.json:", err);
    }
  };

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
        userTypedText, // Freeform response typed by user
        messages,
        predefinedQuestion,
        emotionalQ2Response,
        emotionalQ3Response
      } = req.body;

      if (!ai) {
        throw new Error("Gemini client not initialized");
      }

      const languageName = language === 'twi' ? 'Twi' : language === 'ga' ? 'Ga' : 'English';
      const recentChatText = messages && messages.length > 0
        ? messages.slice(-6).map((m: any) => `${m.sender === 'ama' ? 'Ama' : 'Mother'}: ${m.text}`).join("\n")
        : "";

      // Construct a highly robust prompt instructing Gemini to return a structured JSON response.
      const prompt = `You are Ama, a warm, compassionate, and expert Ghanaian midwife health assistant on the app "MamaMatch GH".
We are carrying out a standard 10-question maternal health check-in.
The mother is communicating in: ${languageName}.

Your response MUST be formatted strictly as a single JSON object matching this TypeScript structure:
{
  "interpretedValue": boolean | number | null,
  "text": "Your direct reply to the mother in her language, introducing or asking the next question."
}

=== TASK 1: CLASSIFY PREVIOUS ANSWER ===
Determine the value of the previous question (index: ${userJustAnsweredIndex !== undefined ? userJustAnsweredIndex : 'none'}).
${userTypedText ? `The mother typed this freeform text response to the previous question: "${userTypedText}"
Analyze and classify this freeform text into one of these:
1. If the previous question index was 0 (How many weeks pregnant): Extract the number of weeks as an integer (e.g. "I am 12 weeks" -> 12, "twenty weeks" -> 20. If she gave months like "3 months", approximate as 12 weeks. If unclear, set to null).
2. If the previous question index was between 1 and 9 (Yes/No symptoms): Determine if she's confirming or denying the symptom:
   - true (Yes/Affirmative/Has symptom. E.g. "yes", "sometimes", "a bit", "aane", "hɛɛ", "daabi (only if clarifying they feel sick)", "it hurts", "i have bleeding").
   - false (No/Negative/No symptom. E.g. "no", "dabi", "not today", "no pain", "all clear", "it doesn't hurt").
   - null (Unclear / not sure / general chat).` : `The user clicked a button for the previous question, yielding the value: ${userJustAnsweredValue}. Put this exact value in the "interpretedValue" key.`}

=== TASK 2: GENERATE NEXT MESSAGE ===
${nextIndex < 10 ? `Formulate Ama's next response asking the next physical check-in question (index ${nextIndex}: "${predefinedQuestion}"):
- Act as the deeply caring Ghanaian health midwife.
- Max 2-3 sentences. Keep it warm, direct, and compact. Keep it fully natural in ${languageName} with warm local phrasings (such as "Maa", "My sister" or appropriate local Twi/Ga phrases if Twi/Ga is selected).
- Integrate the medical concern of question index ${nextIndex} ("${predefinedQuestion}") so the user is prompted to reply.
- If the mother's previous answer was bleeding/spotting (index 1) and true, you MUST first deliver a separate, deeply compassionate sentence resembling: "${emotionalQ2Response}".
- If the mother's previous answer was severe headache (index 2) and true, you MUST first deliver a separate, deeply compassionate sentence resembling: "${emotionalQ3Response}".` : `The mother has completed all 10 maternal check-in questions!
Formulate a very warm transition message in ${languageName} letting her know we are evaluating her health status immediately and wishing her well. Max 2 sentences.`}

Remember, you must respond with ONLY a valid raw JSON object. No markdown block wraps like \`\`\`json, no preamble. Just standard json.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        }
      });

      const rawText = response.text?.trim() || "";
      if (!rawText) {
        throw new Error("Received empty text from Gemini");
      }

      // Try parsing the json output from Gemini
      let parsedResponse: any = null;
      try {
        parsedResponse = JSON.parse(rawText);
      } catch (jsonErr) {
        // Clean up markdown block or other artifacts if present
        const cleaned = rawText
          .replace(/^```json\s*/i, "")
          .replace(/```\s*$/, "")
          .trim();
        parsedResponse = JSON.parse(cleaned);
      }

      if (!parsedResponse || typeof parsedResponse.text !== 'string') {
        throw new Error("Parsed JSON did not live up to schema expectations");
      }

      res.json(parsedResponse);
    } catch (error: any) {
      const isQuotaError = error?.status === 429 || error?.statusCode === 429 || String(error).includes("429") || String(error).includes("quota");
      if (isQuotaError) {
        console.log("INFO: Gemini API limits/quota exceeded or inactive. Seamlessly serving high-fidelity local midwife fallback response.");
      } else {
        console.warn("WARN: /api/ama-response error caught:", error?.message || error);
      }
      
      // Fully safe fallback response in case of API or JSON failures
      let fallbackText = "";
      let fallbackValue: any = null;
      
      // Quick local regex classifier as safe fallback
      const { userTypedText, userJustAnsweredValue, nextIndex, userJustAnsweredIndex, language } = req.body;
      if (userJustAnsweredValue !== undefined) {
        fallbackValue = userJustAnsweredValue;
      } else if (userTypedText) {
        const textLower = userTypedText.toLowerCase();
        if (userJustAnsweredIndex === 0) {
          const numMatch = textLower.match(/\d+/);
          fallbackValue = numMatch ? parseInt(numMatch[0]) : 12;
        } else {
          // Yes / No keyword matching in English, Twi, Ga
          const yesWords = ["yes", "yeah", "yup", "aane", "hɛɛ", "he", "true", "it hurts", "i have", "spotting", "bleeding"];
          const noWords = ["no", "nope", "dabi", "false", "haven't", "none", "not really", "all clear"];
          if (yesWords.some(w => textLower.includes(w))) fallbackValue = true;
          else if (noWords.some(w => textLower.includes(w))) fallbackValue = false;
        }
      }

      const langCode = language || 'english';
      const curLangTrans = translations[langCode as keyof typeof translations] || translations.english;

      if (userJustAnsweredIndex === 1 && fallbackValue === true) {
        fallbackText += curLangTrans.emotionalQ2 + " ";
      }
      if (userJustAnsweredIndex === 2 && fallbackValue === true) {
        fallbackText += curLangTrans.emotionalQ3 + " ";
      }
      
      if (nextIndex < 10) {
        fallbackText += curLangTrans.questions[nextIndex];
      } else {
        fallbackText += curLangTrans.calculating;
      }

      res.json({
        interpretedValue: fallbackValue,
        text: fallbackText
      });
    }
  });

  // API endpoint for generating a highly detailed clinical & wellness summary based on chat conversations
  app.post("/api/generate-analysis", async (req, res) => {
    const { messages, language, answers, riskLevel } = req.body || {};
    try {
      if (!ai) {
        throw new Error("Gemini client not initialized");
      }

      const languageName = language === 'twi' ? 'Twi' : language === 'ga' ? 'Ga' : 'English';
      const chatHistoryText = messages && messages.length > 0
        ? messages.map((m: any) => `${m.sender === 'ama' ? 'Ama' : 'Mother'}: ${m.text}`).join("\n")
        : "";

      const prompt = `You are Ama, an expert, loving, and supportive Ghanaian midwife and health assistant on the app "MamaMatch GH".
We just completed a 10-question maternal health check-in conversation with a pregnant mother.
Her primary language is ${languageName}.

We have calculated her preliminary risk level as: ${riskLevel}.

Here is the full conversation history for context:
${chatHistoryText}

Here are the extracted raw question-answer pairs:
${JSON.stringify(answers)}

Your task is to generate a beautiful, highly detailed, personalized clinical and wellness report for this mother in "${languageName}".
Ensure the tone is warm, compassionate, supportive, and distinctly Ghanaian (using culturally appropriate health tips, local foods like Kontomire/cocoyam leaves, garden eggs, oranges, water, local clinic references as suggestions, and encouraging words).

Your response MUST be formatted strictly as a single JSON object matching this structure:
{
  "summary": "A warm 2-sentence comforting summary of her status in ${languageName}.",
  "riskExplanation": "A detailed but easy-to-understand explanation of her key symptoms or risks identified (or lack thereof) in ${languageName}.",
  "pregnancyTips": [
    "Tip 1 in ${languageName} (e.g., nutrition, iron-rich foods like Kontomire or local greens, rest, etc.)",
    "Tip 2 in ${languageName} (e.g., hydration with clean water, coconut water, etc.)",
    "Tip 3 in ${languageName} (e.g., attending antenatal care at her local clinic in Ghana, observing fetal movements, etc.)"
  ],
  "nextSteps": [
    "Step 1 in ${languageName}",
    "Step 2 in ${languageName}"
  ]
}

Ensure the tips are deeply personalized to her gestational age (if known) and any symptoms she mentioned (such as severe headache, bleeding, swelling, pain during urination, dizziness, vomiting, baby's movement). For example, if she said "Yes" to bleeding, prioritize urgent medical check-up.

Remember, write completely and naturally in the specified language: "${languageName}". If Twi or Ga is selected, write exclusively in that language using authentic, comforting phrasings. Do NOT use markdown. Do NOT use markdown block wraps like \`\`\`json. Output ONLY a valid raw JSON object.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
        }
      });

      const rawText = response.text?.trim() || "";
      let parsedResponse = null;
      try {
        parsedResponse = JSON.parse(rawText);
      } catch {
        const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
        parsedResponse = JSON.parse(cleaned);
      }

      res.json(parsedResponse);
    } catch (error: any) {
      const isQuotaError = error?.status === 429 || error?.statusCode === 429 || String(error).includes("429") || String(error).includes("quota");
      if (isQuotaError) {
        console.log("INFO: Gemini API limits/quota exceeded or inactive. Seamlessly serving high-fidelity local diagnostic next-steps fallback.");
      } else {
        console.warn("WARN: /api/generate-analysis error caught:", error?.message || error);
      }
      
      const isTwi = language === 'twi';
      const isGa = language === 'ga';

      const hasBleeding = answers && (answers["1"] === true || answers[1] === true);
      const hasHeadache = answers && (answers["2"] === true || answers[2] === true);
      const hasSwelling = answers && (answers["3"] === true || answers[3] === true);
      const noBabyMove = answers && (answers["4"] === false || answers[4] === false);
      const hasPainUrinating = answers && (answers["5"] === true || answers[5] === true);
      const hasFever = answers && (answers["6"] === true || answers[6] === true);
      const hasVomiting = answers && (answers["7"] === true || answers[7] === true);
      const hasDizziness = answers && (answers["8"] === true || answers[8] === true);
      const noEatDrink = answers && (answers["9"] === false || answers[9] === false);

      let summary = "";
      let riskExplanation = "";
      let pregnancyTips: string[] = [];
      let nextSteps: string[] = [];

      if (isTwi) {
        summary = `Yɛasiesie wo nyinsɛn ho kyerɛwtohɔ. Sɛnea woyii nsɛm no mmaeɛ no, wo risk yɛ ${riskLevel}.`;
        
        if (riskLevel === 'HIGH') {
          riskExplanation = "Yɛahu sɛ anyinsɛn mu ho kyerɛwtohɔ yi kyerɛ sɛ wowɔ yadeɛ bi te sɛ " + 
            (hasBleeding ? "mogya a ɛreba, " : "") + 
            (hasHeadache ? "tipae kɛse, " : "") + 
            (hasFever ? "hohyee kɛse, " : "") + 
            "mu bi. Ɛsɛ sɛ wokɔ kurom ayaresabea sesei/ntɛm ara mma wo ne akokoaa no amfa nkwa tohɔ.";
        } else if (riskLevel === 'MEDIUM') {
          riskExplanation = "Yɛahu sɛ nsɛm bi te sɛ " + 
            (hasSwelling ? "asa mu honhon, " : "") + 
            (hasPainUrinating ? "dwonsɔ ya, " : "") + 
            (hasVomiting ? "afeafe pa ara, " : "") + 
            "wɔ hɔ a ɛsɛ sɛ yɛhwɛ ho yiye. Nkasa kyerɛ w'asoeɛ nurse bi nnansa yi ara.";
        } else {
          riskExplanation = "Wo nyinsɛn gu so fɛfɛɛfɛ na ahoɔden gu so. Yɛnhu yadeɛ bɔne ho nyinyian biara nnɛ. Kɔ so hwɛ wo ho yiye na kɔ ayaresabea daa.";
        }

        pregnancyTips = [
          "Nom nsuo pa pii na di nnuane a ɛmã nipadua no ahoɔden te sɛ kontomire, paya, kwadu ne garden eggs.",
          "Gye wo home yiye seesei na mmrɛ wo ho dodo mmra asoeɛ mu.",
          "Kɔ antenatal care daa na kɔhwɛ sɛnea akokoaa no yɛ ne ho mu kanyan bere biara."
        ];

        nextSteps = [
          riskLevel === 'HIGH' ? "Kɔ GHS (Ghana Health Service) ayaresabea a ɛbɛn wo ntɛmarã seesei." : "Kɔ ayaresabea mma w'asɛm nhia na kɔ antenatal care daa.",
          "Bisa wo nurse mmoa te sɛ Abena Mensah wɔ WhatsApp so."
        ];
      } else if (isGa) {
        summary = `Wɔgbe check-in lɛ naa ha bo. Saji ni oha lɛ kɛ̃ɔ akɛ o risk level ji ${riskLevel}.`;

        if (riskLevel === 'HIGH') {
          riskExplanation = "Wɔna okadii tamɔ " + 
            (hasBleeding ? "la ni baa, " : "") + 
            (hasHeadache ? "yitso wa ni eyaa, " : "") + 
            (hasFever ? "ohe dɔɔ waa, " : "") + 
            "lɛ bi ni yɛ osaji lɛ amli. Ya helatsū amrɔ nɛɛ ni dɔkta kɛ nurse ohwɛ.";
        } else if (riskLevel === 'MEDIUM') {
          riskExplanation = "Wɔna sɔ̃ji komɛi tamɔ " + 
            (hasSwelling ? "ohebulɛ, " : "") + 
            (hasPainUrinating ? "dwonsɔ̃mɔ mli waa ni enyɛɔ bo, " : "") + 
            "ni yaa nɔ ni esa akɛ o kɛ nurse awie he mra.";
        } else {
          riskExplanation = "Omusu eye shweshweeshwe. Wɔnakee helayeli okadi ko pɔtɛɛ ko nnɛ. Yaa dɔkta-tsu lɛ daa ni onum nu pii.";
        }

        pregnancyTips = [
          "Num nu pii kɛhã hewalɛnamɔ, ni oye nii kpakpa tamɔ kontomire kɛ amadaa.",
          "Joo ohe jɔmɔ waa ni kaatsu nitsumɔ ni fe ohewalɛ.",
          "Yaa antenatal daa nɛ okɛ dɔkta mra gbii fɛɛ amli."
        ];

        nextSteps = [
          riskLevel === 'HIGH' ? "Yaa helatsū aahu amrɔ nɛɛ kɛji ona pila ko." : "Bibi dɔkta nii kɛhã antenatal gbɛtsɔɔmɔ.",
          "Wiemɔ kɛ nurse Abena Mensah mli ni okɛ lɛ agba saji amli kuku."
        ];
      } else {
        // English
        summary = `We have compiled your personal pregnancy health report. Your estimated risk level is ${riskLevel}.`;

        if (riskLevel === 'HIGH') {
          riskExplanation = "We identified key danger symptoms including " + 
            (hasBleeding ? "bleeding/spotting, " : "") + 
            (hasHeadache ? "a persistent severe headache, " : "") + 
            (hasFever ? "high fever/body hotness, " : "") + 
            "which require immediate clinical evaluation by a midwife to keep you and your baby safe.";
        } else if (riskLevel === 'MEDIUM') {
          riskExplanation = "Certain symptoms like " + 
            (hasSwelling ? "unusual swelling of face or feet, " : "") + 
            (hasPainUrinating ? "pain or burning during urination, " : "") + 
            (hasDizziness ? "dizziness or faintness, " : "") + 
            "were reported. We strongly suggest discussing these with an antenatal officer soon.";
        } else {
          riskExplanation = "Your check-in responses look reassuring. No critical gestational danger signs were reported today. Excellent work maintaining your health!";
        }

        pregnancyTips = [
          "Ensure high hydration (3L of clean water daily) and eat iron-rich foods such as Kontomire (cocoyam leaves), garden eggs, and oranges.",
          "Prioritize physical rest. Avoid hard manual lifting and stressful tasks as you nurture your baby.",
          "Observe fetal kicks daily (if past 20 weeks) and attend your scheduled antenatal clinic visits."
        ];

        nextSteps = [
          riskLevel === 'HIGH' ? "Go to the nearest Ghana Health Service (GHS) clinic or emergency room immediately." : "Keep up with your scheduled antenatal care routine.",
          "Connect with Nurse Abena Mensah for ongoing guidance and advice."
        ];
      }

      res.json({
        summary,
        riskExplanation,
        pregnancyTips,
        nextSteps
      });
    }
  });

  // Database REST API Endpoints for Midwives & GHS visibility
  app.get("/api/nurses", (req, res) => {
    res.json(db.nurses);
  });

  app.post("/api/nurses", (req, res) => {
    const { name, licenseNumber, region, languages, whatsapp } = req.body;
    if (!name || !licenseNumber || !region || !whatsapp) {
      return res.status(400).json({ error: "Missing required registration parameters." });
    }
    
    const avatars = [
      "/src/assets/midwives/8c1548b0575f612e98c57d4a163d6d63.jpg",
      "/src/assets/midwives/download.jpg",
      "/src/assets/midwives/230d51c1dfcab904bad3f1d925b0e8b1.jpg",
      "/src/assets/midwives/a9da1dea6368ebb099100f489cc37cfe.jpg"
    ];
    const avatar = avatars[db.nurses.length % avatars.length];

    const newNurse = {
      id: "nurse_" + (db.nurses.length + 1) + "_" + Math.floor(Math.random() * 1000),
      name,
      licenseNumber,
      region,
      languages: Array.isArray(languages) ? languages : ["English"],
      availability: "Available",
      whatsapp: whatsapp.trim().replace(/^\+/, ""),
      status: "PENDING",
      avatar
    };

    db.nurses.push(newNurse);
    saveDB();
    res.status(201).json(newNurse);
  });

  app.post("/api/nurses/:id/verify", (req, res) => {
    const nurse = db.nurses.find(n => n.id === req.params.id);
    if (!nurse) {
      return res.status(404).json({ error: "Nurse not found." });
    }
    nurse.status = "VERIFIED";
    saveDB();
    res.json(nurse);
  });

  app.post("/api/nurses/:id/toggle", (req, res) => {
    const nurse = db.nurses.find(n => n.id === req.params.id);
    if (!nurse) {
      return res.status(404).json({ error: "Nurse not found." });
    }
    const { availability } = req.body;
    if (availability && ["Available", "Busy", "Off"].includes(availability)) {
      nurse.availability = availability;
    } else {
      nurse.availability = nurse.availability === "Available" ? "Busy" : "Available";
    }
    saveDB();
    res.json(nurse);
  });

  app.get("/api/check-ins", (req, res) => {
    res.json(db.checkIns);
  });

  app.post("/api/check-ins", (req, res) => {
    const { name, phone, language, gestationalWeeks, region, riskLevel, answers, summary, riskExplanation, pregnancyTips, nextSteps } = req.body;
    
    if (!name || !phone || !riskLevel) {
      return res.status(400).json({ error: "Missing required check-in fields." });
    }

    const sameRegionNurses = db.nurses.filter(n => n.region === region && n.status === "VERIFIED" && n.availability === "Available");
    
    let matchedNurse = null;
    if (sameRegionNurses.length > 0) {
      const targetLang = language === 'twi' ? 'Twi' : language === 'ga' ? 'Ga' : 'English';
      matchedNurse = sameRegionNurses.find(n => n.languages.map(l => l.toLowerCase()).includes(targetLang.toLowerCase()));
      if (!matchedNurse) matchedNurse = sameRegionNurses[0];
    }

    if (!matchedNurse) {
      const nationwideAvailable = db.nurses.filter(n => n.status === "VERIFIED" && n.availability === "Available");
      if (nationwideAvailable.length > 0) {
        matchedNurse = nationwideAvailable[0];
      }
    }

    const matchedNurseId = matchedNurse ? matchedNurse.id : "nurse_1";

    const newTriage = {
      id: "triage_" + (db.checkIns.length + 1) + "_" + Math.floor(Math.random() * 1000),
      name,
      phone,
      language: language || "english",
      gestationalWeeks: Number(gestationalWeeks) || 12,
      region: region || "Ashanti",
      riskLevel,
      answers: answers || {},
      summary: summary || "Completed prenatal maternal check-in evaluation.",
      riskExplanation: riskExplanation || "",
      pregnancyTips: Array.isArray(pregnancyTips) ? pregnancyTips : [],
      nextSteps: Array.isArray(nextSteps) ? nextSteps : [],
      timestamp: new Date().toISOString(),
      status: "pending",
      matchedNurseId
    };

    db.checkIns.push(newTriage);
    saveDB();
    res.status(201).json(newTriage);
  });

  app.post("/api/check-ins/:id/complete", (req, res) => {
    const triage = db.checkIns.find(c => c.id === req.params.id);
    if (!triage) {
      return res.status(404).json({ error: "Check-in record not found." });
    }
    triage.status = "completed";
    saveDB();
    res.json(triage);
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
