import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini
// Using your provided key as fallback
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyCNllW4cUmrprPA5HqkwcnEM0uZqhvr-KI");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// 1. Serve static files from the frontend folder
app.use(express.static(path.join(__dirname, "frontend")));

// 2. Test API route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working" });
});

// 3. AI Assistant Endpoint (COMBINED & CORRECTED)
app.post("/api/ai", async (req, res) => {
  const { prompt, context } = req.body;

  try {
    // We provide Gemini with a "System Instruction" and the Classroom Context
    const systemInstruction = `
      You are an AI Assistant for a school research project. 
      Current Database Context (JSON): ${JSON.stringify(context)}.
      
      Rules:
      - Be concise, professional, and helpful.
      - A score below 75% (e.g., 7/10 is 70%) is "struggling".
      - Use the specific student names and task titles found in the data.
      - If the context is empty, tell the teacher/student to add tasks first.
    `;

    const result = await model.generateContent([systemInstruction, prompt]);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ 
      reply: "I'm having trouble thinking right now. Ensure your server has internet access and the API key is valid." 
    });
  }
});

// 4. THE CATCH-ALL (Must be LAST)
// This serves your dashboard.html/index.html if no API route is matched
app.get("*", (req, res) => {
  // If the request isn't for an API, send the frontend
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, "frontend", "dashboard.html"));
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
🚀 Server running at: http://localhost:${PORT}
✅ Static files served from: ${path.join(__dirname, "frontend")}
🤖 AI Endpoint active at: http://localhost:${PORT}/api/ai
  `);
});