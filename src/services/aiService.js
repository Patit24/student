import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY;



const genAI = GEMINI_KEY ? new GoogleGenerativeAI(GEMINI_KEY) : null;
const openai = OPENAI_KEY ? new OpenAI({ apiKey: OPENAI_KEY, dangerouslyAllowBrowser: true }) : null;

export const solveDoubtWithAI = async (text, imageBase64 = null) => {
  // Check for keys - if missing, use Simulation Mode (Pedagogical Mock)
  if (!GEMINI_KEY && !OPENAI_KEY) {
    console.warn("AI Simulation Mode: No API keys found.");
    return mockSolve(text);
  }

  // Primary Engine: Gemini (Multi-modal)
  if (genAI) {
    const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro"];
    
    const trySolve = async (modelIndex) => {
      const modelName = modelsToTry[modelIndex];
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const systemPrompt = `You are the Antigravity Personal AI, a state-of-the-art assistant for students.
        You help with doubt solving, schedule management, and general study advice.
        Your mission is to provide crystal-clear, step-by-step logical explanations.
        Always use LaTeX for mathematical expressions (e.g., $E=mc^2$).
        Never mention Gemini, Google, OpenAI, or ChatGPT. You are a proprietary Antigravity AI.
        Return ONLY valid JSON in this format: 
        { 
          "steps": [ { "title": "...", "desc": "..." } ], 
          "solution": "Final concise answer or helpful guidance" 
        }`;

        let result;
        if (imageBase64) {
          const part = {
            inlineData: {
              data: imageBase64.split(',')[1],
              mimeType: "image/jpeg"
            }
          };
          result = await model.generateContent([systemPrompt + `\n\nAnalyze this problem/query: ${text}`, part]);
        } else {
          result = await model.generateContent(systemPrompt + `\n\nAssist with this: ${text}`);
        }
        
        const response = await result.response;
        let rawText = response.text();
        rawText = rawText.replace(/```json|```/g, '').trim();
        return JSON.parse(rawText);
      } catch (err) {
        if (modelIndex < modelsToTry.length - 1) return await trySolve(modelIndex + 1);
        throw err;
      }
    };
    return await trySolve(0);
  }

  // Secondary Engine: OpenAI (GPT-4o mini)
  if (openai) {
    const messages = [
      { 
        role: "system", 
        content: "You are the Antigravity Personal AI. Provide step-by-step logic in JSON format. Use LaTeX for math. Never mention OpenAI/ChatGPT." 
      }
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

  return mockSolve(text);
};

// Pedagogical Mock for Simulation Mode
const mockSolve = (text) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        steps: [
          { 
            title: "Analyzing Requirement", 
            desc: "I am currently in **Simulation Mode** (Antigravity Core V1). I have received your query: \"" + text + "\"" 
          },
          { 
            title: "Pedagogical Note", 
            desc: "To unlock my full **Neural Core (V2)** for deep problem solving, please ensure the system environment variables (API Keys) are configured by your administrator." 
          }
        ],
        solution: "I am the Antigravity Personal AI. I am ready to assist you as soon as the Neural Core is activated!"
      });
    }, 1500);
  });
};
