import { OpenAI } from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function analyzeHandler(req, res) {
  try {
    const { text } = req.body || {};

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "A 'text' field of type string is required." });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Extract the user's key interests or hobbies from the provided text. Return a concise list in JSON.",
        },
        { role: "user", content: text },
      ],
    });

    return res.status(200).json({ interests: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
