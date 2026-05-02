import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;

console.log("AI Keys Check:", { 
  gemini: GEMINI_KEY ? "EXISTS" : "MISSING", 
  openai: OPENAI_KEY ? "EXISTS" : "MISSING" 
});

const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;
const openai = OPENAI_KEY ? new OpenAI({ apiKey: OPENAI_KEY, dangerouslyAllowBrowser: true }) : null;

export const solveDoubtWithAI = async (text, imageBase64 = null, engine = 'gemini') => {
  if (engine === 'gemini') {
    if (!genAI) throw new Error("Gemini API Key missing in environment");
    
    // Ultimate Fallback Chain: Flash -> Flash-Latest -> Pro -> Pro-Latest
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-1.5-pro-latest"];
    
    const trySolve = async (modelIndex) => {
      const modelName = modelsToTry[modelIndex];
      console.log(`🤖 Attempting AI solve with: ${modelName} (Attempt ${modelIndex + 1}/${modelsToTry.length})`);
      
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        let result;
        if (imageBase64) {
          const prompt = `You are the PPR Education 'Logic-Scan' AI. Analyze this image and text: "${text}". 
          Return JSON format: { "steps": [ { "title": "...", "desc": "..." } ], "solution": "..." }. 
          Use LaTeX for math like $x^2$. Focus on logic breakdown.`;
          
          const part = {
            inlineData: {
              data: imageBase64.split(',')[1],
              mimeType: "image/jpeg"
            }
          };
          result = await model.generateContent([prompt, part]);
        } else {
          const prompt = `You are the PPR Education 'Logic-Scan' AI. Solve this: "${text}". 
          Return JSON format: { "steps": [ { "title": "...", "desc": "..." } ], "solution": "..." }. 
          Use LaTeX for math.`;
          result = await model.generateContent(prompt);
        }
        
        const response = await result.response;
        let rawText = response.text();
        rawText = rawText.replace(/```json|```/g, '').trim();
        return JSON.parse(rawText);
      } catch (err) {
        console.warn(`❌ Model ${modelName} failed:`, err.message);
        if (modelIndex < modelsToTry.length - 1) {
          return await trySolve(modelIndex + 1);
        }
        throw err;
      }
    };

    return await trySolve(0);
  } else {
    // OpenAI ChatGPT
    if (!openai) throw new Error("OpenAI API Key missing in environment");
    
    const messages = [
      { role: "system", content: "You are the PPR Education 'Logic-Scan' AI. Return ONLY JSON: { \"steps\": [ { \"title\": \"...\", \"desc\": \"...\" } ], \"solution\": \"...\" }. Use LaTeX for math." }
    ];

    if (imageBase64) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text },
          { type: "image_url", image_url: { url: imageBase64 } }
        ]
      });
    } else {
      messages.push({ role: "user", content: text });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  }
};
