
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractNamesFromTranscript = async (transcript: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `استخرج أسماء الأشخاص فقط من النص التالي وقم بإرجاعها كمصفوفة JSON. 
      إذا كان النص يحتوي على جمل مثل "سجل محمد" أو "أضف أحمد"، استخرج فقط "محمد" و "أحمد".
      النص: "${transcript}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            names: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["names"]
        }
      }
    });

    const data = JSON.parse(response.text);
    return data.names || [];
  } catch (error) {
    console.error("Gemini processing error:", error);
    // Fallback: If AI fails, return the original transcript as a single name if it looks like one
    return transcript.trim() ? [transcript.trim()] : [];
  }
};
