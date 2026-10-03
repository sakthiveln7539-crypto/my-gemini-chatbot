UPDATED CHATBOT

Run:
npm install
npm start
Open http://localhost:3000

Changes:
- Mobile-first full phone layout
- Better small-screen responsiveness
- 50 successful AI replies/day app-side counter
- Clear 429 Gemini quota message

IMPORTANT:
The 50-message counter does NOT increase Google's Gemini API quota.
If Gemini returns 429, the provider quota/rate limit has been reached.
Keep your real API key only in .env and never upload .env to GitHub.
