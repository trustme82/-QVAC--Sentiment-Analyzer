// QVAC Sentiment Analyzer — core logic.
// Takes any text and asks the on-device model to classify sentiment
// plus give a one-sentence explanation, in a structured reply we parse.

import { completion } from "@qvac/sdk";

const VALID = ["positive", "negative", "neutral", "mixed"];

export async function analyzeSentiment(modelId, inputText) {
  const truncated = inputText.length > 3000 ? inputText.slice(0, 3000) : inputText;

  const run = completion({
    modelId,
    history: [
      {
        role: "system",
        content:
          "You are a sentiment analysis assistant. Classify the sentiment of the given text as exactly one of: " +
          "Positive, Negative, Neutral, or Mixed. Reply in EXACTLY this two-line format, nothing else:\n" +
          "SENTIMENT: <one word from Positive/Negative/Neutral/Mixed>\n" +
          "REASON: <one sentence explaining why, referencing specific words or tone from the text>",
      },
      { role: "user", content: `Text:\n\n${truncated}` },
    ],
    stream: true,
    completionOpts: { temperature: 0.2, maxTokens: 200 },
  });

  let text = "";
  for await (const token of run.tokenStream) text += token;
  text = text.trim();

  const sentimentMatch = text.match(/SENTIMENT:\s*(\w+)/i);
  const reasonMatch = text.match(/REASON:\s*([\s\S]*)/i);

  let sentiment = sentimentMatch ? sentimentMatch[1].toLowerCase() : "";
  if (!VALID.includes(sentiment)) {
    const lower = text.toLowerCase();
    sentiment = VALID.find((v) => lower.includes(v)) || "neutral";
  }
  const reason = reasonMatch ? reasonMatch[1].trim().split("\n")[0] : text.split("\n").slice(-1)[0] || "No explanation available.";

  return {
    sentiment: sentiment.charAt(0).toUpperCase() + sentiment.slice(1),
    reason,
  };
}
