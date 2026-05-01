import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;
const openai = OPENAI_KEY ? new OpenAI({ apiKey: OPENAI_KEY, dangerouslyAllowBrowser: true }) : null;

export const solveDoubtWithAI = async (text, imageBase64 = null, engine = 'gemini') => {
  if (engine === 'gemini') {
    if (!genAI) throw new Error("Gemini API Key missing in .env");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
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
    // Cleanup JSON if AI wraps it in markdown
    rawText = rawText.replace(/```json|```/g, '').trim();
    return JSON.parse(rawText);
  } else {
    // OpenAI ChatGPT
    if (!openai) throw new Error("OpenAI API Key missing in .env");
    
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
