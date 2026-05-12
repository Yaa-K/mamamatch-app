import { GoogleGenAI, Type } from "@google/genai";
import { Language, RiskLevel, TriageResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const TRIAGE_SYSTEM_INSTRUCTION = `
You are the MamaMatch GH Triage Assistant. Your job is to assess the health risk of pregnant women in Ghana through a friendly, empathetic conversation.

CRITICAL COMMUNICATION RULES (STRICTLY ENFORCED):
1. Zero Medical Jargon: You must use 6th-grade level, everyday language. Do not use words like "gestation," "preeclampsia," "hemorrhage," or "abdomen." Instead, use "pregnancy," "headache," "bleeding," and "stomach."
2. Ultra-Short Questions: Your questions must be a maximum of ONE sentence and under 15 words.
3. One Concept at a Time: Never ask compound questions (e.g., Do NOT ask: "Do you have a headache, fever, or bleeding?"). Ask about one single symptom per message.
4. Yes/No Alignment: Every question you ask (except for asking the number of weeks pregnant) MUST be answerable with a simple "Yes", "No", or "Not sure".

THE 5-STEP QUESTION CHECKLIST:
You must ask about these 5 areas, one by one, waiting for the user's response after each:
1. "How many weeks pregnant are you? Please type the number."
2. "Are you bleeding or spotting from your vagina?"
3. "Do you have a very bad headache today?"
4. (If over 20 weeks): "Is your baby moving less than usual?"
5. "Do you have a fever or bad stomach pain?"

RED FLAG OVERRIDE: If the user answers "Yes" to bleeding, reduced baby movement, or severe pain at ANY point, STOP the questionnaire and immediately output the HIGH risk score.

OUTPUT FORMAT:
Do NOT provide a risk score until the checklist is complete OR a Red Flag is triggered. End the conversation by outputting a brief, comforting closing message followed by exactly one of these tokens: [FINAL_RATING: LOW], [FINAL_RATING: MEDIUM], or [FINAL_RATING: HIGH]
`;

export async function getAmaResponse(messages: { role: 'user' | 'assistant'; content: string }[], language: Language) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: messages.map(m => (m.role === 'user' ? `User: ${m.content}` : `Ama: ${m.content}`)).join("\n"),
      config: {
        systemInstruction: `${TRIAGE_SYSTEM_INSTRUCTION}\nUser's preferred language: ${language}. Current step: The conversation is in progress. Ensure you follow the 5-area checklist.`,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Ama Chat Error:", error);
    throw error;
  }
}

export async function getFinalTriageSummary(messages: { role: string; content: string }[], language: Language, riskLevel: RiskLevel): Promise<TriageResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on this triage conversation, generate a structured surgical summary for the patient card. Risk Level is already determined as ${riskLevel}.\n\nConversation:\n${messages.map(m => m.content).join("\n")}`,
      config: {
        systemInstruction: `You are an expert obstetrician summarizing a triage report for MamaMatch GH in ${language}.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING, enum: [riskLevel] },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            concerns: { type: Type.ARRAY, items: { type: Type.STRING } },
            nearestFacility: { type: Type.STRING }
          },
          required: ["riskLevel", "title", "description", "recommendations"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
     console.error("Final Summary Error:", error);
     // Fallback
     return {
       riskLevel,
       title: `${riskLevel} Risk Assessment`,
       description: "Assessment completed based on reported symptoms.",
       recommendations: ["Speak with a nurse soon", "Monitor for changes"]
     };
  }
}

export async function translateText(text: string, targetLanguage: Language) {
  if (targetLanguage === 'English') return text;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following health-related text to ${targetLanguage}. Keep it simple and supportive for someone with low literacy:\n\n${text}`
    });
    return response.text;
  } catch (error) {
    console.error("Translation Error:", error);
    return text;
  }
}
