import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function analyzeHandler(req, res) {
  // Handle GET requests for quick testing
  if (req.method === "GET") {
    return res.status(200).json({
      status: "ok",
      message: "Vero interest analysis endpoint is running.",
      usage: "Send POST request with { text: \"your text\" }",
    });
  }

  // Only allow POST
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

    // Call OpenAI API
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Extract the user's key interests or hobbies from the provided text. Return ONLY a JSON array of strings, with no explanation, no markdown.",
        },
        { role: "user", content: text },
      ],
    });

    let interests = completion.choices[0].message.content;

    // Remove markdown formatting if present:
    // ```json ... ```
    interests = interests
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // Parse into actual JSON
    let parsedInterests;
    try {
      parsedInterests = JSON.parse(interests);
    } catch (err) {
      return res.status(500).json({
        error: "Failed to parse model response as JSON.",
        raw: interests,
      });
    }

    return res.status(200).json({ interests: parsedInterests });
  } catch (err) {
    console.error("API ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
}
