
import { GoogleGenAI } from "@google/genai";

// FIX: Always use process.env.API_KEY directly as per the @google/genai SDK guidelines.
export const sendMessageToBuddy = async (userMessage: string) => {
  // FIX: Initializing GoogleGenAI with a named parameter object.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-3-pro-preview';
  
  try {
    // FIX: Using ai.models.generateContent with model name and prompt as per guidelines.
    const response = await ai.models.generateContent({
      model: modelName,
      contents: userMessage,
      config: {
        // Thinking budget for Gemini 3 series models.
        thinkingConfig: { thinkingBudget: 32768 },
        systemInstruction: `
          Siz "Buddy Team" tizimining aqlli yordamchisisiz. 
          Bizning tizimda Kuratorlar (Buddy mentors) va O'quvchilar (Students) mavjud.
          
          Sizning asosiy vazifalaringiz:
          1. Kuratorlarga o'quvchilarning haftalik maqsadlarini (goals) shakllantirishda yordam berish.
          2. O'quvchilar qiynalayotgan texnik yoki motivatsion muammolarga kreativ va aniq yechimlar find (Thinking mode yordamida chuqur tahlil qiling).
          3. Haftalik uchrashuvlar (meetings) uchun kun tartibini (agenda) tuzish.
          4. O'zbek tilida, do'stona va professional tonda muloqot qiling.
          
          Jamoa a'zolari: 
          - Asadbek (Lead)
          - Madina (UI/UX)
          - Javohir (Backend)
          
          Siz o'ta aqlli va tahliliy javoblar berishingiz kerak, chunki sizda "Thinking" imkoniyati bor.
        `,
      },
    });

    // FIX: Accessing .text property directly instead of calling it as a function.
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
