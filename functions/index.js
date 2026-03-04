const { onRequest } = require("firebase-functions/v2/https");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// This is the Cloud Function "Brain"
exports.askGemini = onRequest({ cors: true }, async (req, res) => {
  // 1. Get the prompt and data from your Dashboard
  const { prompt, context } = req.body;

  try {
    // 2. Initialize Gemini (The key is stored safely in Firebase settings)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 3. Create the instructions for Gemini
    const systemInstruction = `
      You are an AI Assistant for a school research project. 
      Data: ${JSON.stringify(context)}.
      A score below 75% is struggling. Be concise.
    `;

    // 4. Ask Gemini and get the text response
    const result = await model.generateContent([systemInstruction, prompt]);
    const response = await result.response;
    
    // 5. Send the answer back to your Dashboard
    res.json({ reply: response.text() });

  } catch (error) {
    console.error("Cloud Function Error:", error);
    res.status(500).json({ reply: "I'm having trouble connecting to Gemini." });
  }
});