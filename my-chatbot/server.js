const express = require("express");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===============================
// CHECK GEMINI API KEY
// ===============================
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing in .env");
    process.exit(1);
}

// ===============================
// GEMINI AI
// ===============================
const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// ===============================
// MIDDLEWARE
// ===============================
app.use(express.json());
app.use(express.static("public"));

// ===============================
// HEALTH CHECK
// ===============================
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        message: "Chatbot server is running"
    });
});

// ===============================
// GEMINI CHAT FUNCTION
// ===============================
async function askGemini(message) {
    try {
        console.log("🤖 Sending message to Gemini...");

        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: message,
            config: {
                thinkingConfig: {
                    thinkingLevel: "low"
                },
                maxOutputTokens: 300
            }
        });

        console.log("✅ Gemini reply received");

        return response.text || "Sorry, I could not generate a response.";

    } catch (error) {
        console.error("❌ GEMINI ERROR:");
        console.error(error);

        throw error;
    }
}

// ===============================
// CHAT API
// ===============================
app.post("/chat", async (req, res) => {
    const message = req.body.message?.trim();

    if (!message) {
        return res.status(400).json({
            reply: "Please enter a message."
        });
    }

    console.log("👤 User:", message);

    try {
        const reply = await askGemini(message);

        res.json({
            reply: reply
        });

    } catch (error) {
        console.error("❌ Chat request failed");

        // Quota / rate limit error
        if (
            error?.status === 429 ||
            error?.error?.code === 429 ||
            error?.message?.includes("429")
        ) {
            return res.status(429).json({
                reply: "Gemini API quota is currently unavailable. Please try again later."
            });
        }

        res.status(500).json({
            reply: "Gemini is temporarily unavailable. Please try again."
        });
    }
});

// ===============================
// START SERVER
// ===============================
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log("");
    console.log("================================");
    console.log("🤖 CHATBOT SERVER STARTED");
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`🔗 http://localhost:${PORT}/health`);
    console.log("================================");
});

// ===============================
// SERVER ERROR
// ===============================
server.on("error", (error) => {
    console.error("❌ SERVER ERROR:");

    if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use.`);
    } else {
        console.error(error);
    }
});

// ===============================
// STOP SERVER
// ===============================
process.on("SIGINT", () => {
    console.log("\n🛑 Server stopped.");

    server.close(() => {
        process.exit(0);
    });
});

process.on("SIGTERM", () => {
    console.log("\n🛑 Server stopping...");

    server.close(() => {
        process.exit(0);
    });
});