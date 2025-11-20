import { OpenAI } from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function analyzeHandler(req, res) {
  // --- CORS HEADERS (allow frontend hosted elsewhere) ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Simple health check for GET in the browser
  if (req.method === "GET") {
    return res.status(200).json({
      status: "ok",
      message: "Vero interest analysis endpoint is running.",
      usage: "Send POST request with { text: \"your text\" }",
    });
  }

  // Only POST for analysis
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  try {
    const { text } = req.body || {};

    if (!text || typeof text !== "string") {
      return res
        .status(400)
        .json({ error: "A 'text' field of type string is required." });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an interest extraction engine. From the user's text, extract a concise array of interests and hobbies. Respond ONLY with a valid JSON array of strings, no preamble.",
        },
        { role: "user", content: text },
      ],
      max_tokens: 150,
    });

    let raw = completion.choices[0]?.message?.content || "[]";
    let interests;

    try {
      interests = JSON.parse(raw);
    } catch (e) {
      // Strip possible ```json ... ``` wrappers
      raw = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
      interests = JSON.parse(raw);
    }

    if (!Array.isArray(interests)) {
      return res
        .status(500)
        .json({ error: "Unexpected response format from model." });
    }

    return res.status(200).json({ interests });
  } catch (err) {
    console.error("Analyze error:", err);
    return res
      .status(500)
      .json({ error: "Failed to analyze interests. Please try again later." });
  }
}
