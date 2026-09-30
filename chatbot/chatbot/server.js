const express = require("express");
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing in .env");
    process.exit(1);
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

app.use(express.json());
app.use(express.static("public"));

async function askGemini(message) {

    const models = [
        "gemini-3.8-flash",
        "gemini-3.7-flash",
        "gemini-3.5-flash-lite"
    ];

    let lastError;

    for (const model of models) {

        for (let attempt = 1; attempt <= 3; attempt++) {

            try {

                console.log(`Trying ${model} - attempt ${attempt}`);

                const response = await ai.models.generateContent({
                    model: model,
                    contents: message
                });

                console.log(`✅ Success with ${model}`);

                return response.text;

            } catch (error) {

                lastError = error;

                console.log(
                    `❌ ${model} failed:`,
                    error.message
                );

                // Retry only temporary server errors
                if (
                    error.message &&
                    (
                        error.message.includes("503") ||
                        error.message.includes("UNAVAILABLE") ||
                        error.message.includes("429")
                    )
                ) {
                    const waitTime = attempt * 2000;

                    console.log(
                        `Waiting ${waitTime}ms before retry...`
                    );

                    await new Promise(resolve =>
                        setTimeout(resolve, waitTime)
                    );

                    continue;
                }

                // Don't retry authentication / bad request errors
                break;
            }
        }

        console.log(`➡️ Moving to next model...`);
    }

    throw lastError;
}

app.post("/chat", async (req, res) => {

    try {

        const message = req.body.message;

        if (!message) {
            return res.status(400).json({
                reply: "Please enter a message."
            });
        }

        console.log("\nUser:", message);

        const reply = await askGemini(message);

        res.json({
            reply: reply
        });

    } catch (error) {

        console.error("\n========== GEMINI ERROR ==========");
        console.error(error);
        console.error("==================================\n");

        res.status(500).json({
            reply:
                "Gemini is temporarily busy. Please try again after a few seconds."
        });
    }
});

app.listen(PORT, () => {
    console.log("");
    console.log("================================");
    console.log("🤖 CHATBOT SERVER STARTED");
    console.log(`🌐 http://localhost:${PORT}`);
    console.log("================================");
});