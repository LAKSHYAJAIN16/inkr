import { z } from "zod";

const AiResultSchema = z.object({
  flagged: z.boolean(),
  confidence: z.number().min(0).max(1),
  reasons: z.array(z.string()).default([]),
  model: z.string().optional(),
});

export type AiResult = z.infer<typeof AiResultSchema>;

// Simple heuristics: measure burstiness, rare word ratio, sentence length variance
export function heuristicDetectAI(plainText: string): AiResult {
  const text = (plainText || "").replace(/\s+/g, " ").trim();
  if (!text) return { flagged: false, confidence: 0, reasons: [] };

  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const words = text.toLowerCase().match(/\b[\p{L}']+\b/gu) || [];
  const wordCount = words.length || 1;

  const avgSentenceLen = sentences.reduce((a, s) => a + s.split(/\s+/).length, 0) / (sentences.length || 1);
  const sentenceLens = sentences.map((s) => s.split(/\s+/).length);
  const mean = avgSentenceLen;
  const variance = sentenceLens.reduce((a, n) => a + Math.pow(n - mean, 2), 0) / (sentenceLens.length || 1);
  const stddev = Math.sqrt(variance);

  const unique = new Set(words);
  const uniqueRatio = unique.size / wordCount;
  const longWordRatio = words.filter((w) => w.length >= 10).length / wordCount;

  let score = 0;
  const reasons: string[] = [];

  if (avgSentenceLen >= 25) {
    score += 0.25;
    reasons.push("Long average sentence length");
  }
  if (stddev <= 4) {
    score += 0.25;
    reasons.push("Low sentence length variance");
  }
  if (uniqueRatio <= 0.35) {
    score += 0.25;
    reasons.push("Low lexical diversity");
  }
  if (longWordRatio >= 0.08) {
    score += 0.2;
    reasons.push("High proportion of long words");
  }

  const flagged = score >= 0.5;
  const confidence = Math.min(1, Math.max(0, score));
  return { flagged, confidence, reasons };
}

export async function openAiDetectAI(plainText: string): Promise<AiResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return heuristicDetectAI(plainText);
  // Lightweight classification without sending whole doc: summarize key features
  const features = summarizeFeatures(plainText);
  const prompt = `You are a classifier. Given features of a student essay, estimate if it was likely AI-written. Respond JSON with keys: flagged (boolean), confidence (0..1), reasons (string[]).\nFeatures:\n${JSON.stringify(
    features
  )}`;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: "Return only a strict JSON object." },
          { role: "user", content: prompt },
        ],
        temperature: 0,
      }),
    });
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content || "{}";
    const parsed = AiResultSchema.safeParse(JSON.parse(content));
    if (parsed.success) return { ...parsed.data, model: json.model || "openai" };
  } catch {
    // fall through
  }
  return heuristicDetectAI(plainText);
}

function summarizeFeatures(text: string) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  const sentences = t.split(/(?<=[.!?])\s+/).filter(Boolean);
  const words = t.toLowerCase().match(/\b[\p{L}']+\b/gu) || [];
  const wordCount = words.length || 1;
  const avgSentenceLen = sentences.reduce((a, s) => a + s.split(/\s+/).length, 0) / (sentences.length || 1);
  const sentenceLens = sentences.map((s) => s.split(/\s+/).length);
  const mean = avgSentenceLen;
  const variance = sentenceLens.reduce((a, n) => a + Math.pow(n - mean, 2), 0) / (sentenceLens.length || 1);
  const stddev = Math.sqrt(variance);
  const unique = new Set(words);
  const uniqueRatio = unique.size / wordCount;
  const longWordRatio = words.filter((w) => w.length >= 10).length / wordCount;
  return { wordCount, sentences: sentences.length, avgSentenceLen, stddev, uniqueRatio, longWordRatio };
}


