import { Request, Response, NextFunction } from "express";
import { HfInference } from "@huggingface/inference";
import createHttpError from "http-errors";
import { config } from "../config/config";

// Initialize Hugging Face Inference client
const hf = config.hfToken ? new HfInference(config.hfToken) : null;

export type ExplainMode = "explain" | "simplify" | "summary" | "key_terms";

interface ExplainRequestBody {
  passage: string;
  bookTitle?: string;
  author?: string;
  mode?: ExplainMode;
}

/**
 * Intelligent fallback generator when HF token is missing or API limit is reached.
 * Ensures the app and interview demonstrations never crash even without active internet/tokens.
 */
const generateLocalFallbackExplanation = (
  passage: string,
  bookTitle: string = "the book",
  mode: ExplainMode = "explain"
): string => {
  const cleanPassage = passage.trim();
  const wordCount = cleanPassage.split(/\s+/).length;

  if (mode === "simplify") {
    return `**Simplified Meaning (ELI5):**\n\nIn simple words, this excerpt from *${bookTitle}* emphasizes how the author wants readers to understand the core sentiment behind: "${cleanPassage.slice(
      0,
      120
    )}..."\n\nIt conveys that deeper underlying themes reflect real-world human emotions and decision-making.`;
  }

  if (mode === "summary") {
    return `**Key Takeaway (TL;DR):**\n\n• **Core Idea:** The passage (${wordCount} words) highlights critical character motivation and thematic conflict.\n• **Context in *${bookTitle}*:** Represents a pivotal realization or descriptive moment.\n• **Reader Reflection:** Pay close attention to how this connects with subsequent chapters.`;
  }

  if (mode === "key_terms") {
    const words = cleanPassage
      .replace(/[^\w\s]/gi, "")
      .split(/\s+/)
      .filter((w) => w.length > 5)
      .slice(0, 4);

    return `**Key Concept & Terminology Breakdown:**\n\n${words
      .map(
        (word, idx) =>
          `**${idx + 1}. ${word.charAt(0).toUpperCase() + word.slice(1)}**: Central thematic anchor representing tone and style in *${bookTitle}*.`
      )
      .join("\n")}\n\n*Study Tip: Look for recurring appearances of these motifs.*`;
  }

  return `**Contextual Passage Analysis:**\n\nIn *${bookTitle}*, this passage offers rich literary insight: "${cleanPassage.slice(
    0,
    140
  )}..."\n\n• **Tone & Atmosphere:** Reflective, nuanced, and structurally deliberate.\n• **Subtext:** The author highlights thematic contrasts to deepen the reader's immersion.`;
};

export const explainPassage = async (
  req: Request<{}, {}, ExplainRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { passage, bookTitle = "this book", author = "the author", mode = "explain" } = req.body;

    if (!passage || typeof passage !== "string" || passage.trim().length === 0) {
      return next(createHttpError(400, "A valid passage or text snippet is required."));
    }

    if (passage.length > 4000) {
      return next(
        createHttpError(400, "Passage is too long. Please select a passage under 4000 characters.")
      );
    }

    // Determine prompt guidelines based on selected mode
    let systemInstruction = "";
    let userPrompt = "";

    switch (mode) {
      case "simplify":
        systemInstruction =
          "You are an expert reading assistant and tutor. Explain complex ideas simply (ELI5 - Explain Like I'm 5) in clear, friendly language without losing core meaning.";
        userPrompt = `Passage from "${bookTitle}" by ${author}:\n"""${passage}"""\n\nTask: Explain this passage in simple, everyday language that anyone can easily understand. Keep it concise (2-3 short paragraphs max).`;
        break;

      case "summary":
        systemInstruction =
          "You are an executive book summarizer. Provide structured, high-signal bullet-point summaries of book passages.";
        userPrompt = `Passage from "${bookTitle}" by ${author}:\n"""${passage}"""\n\nTask: Provide a 3-bullet point executive summary capturing the core premise, key takeaway, and narrative significance.`;
        break;

      case "key_terms":
        systemInstruction =
          "You are a literary analyst and vocabulary expert. Identify key vocabulary, concepts, metaphors, or terminology in passages and define them in context.";
        userPrompt = `Passage from "${bookTitle}" by ${author}:\n"""${passage}"""\n\nTask: Identify 2-4 key words, metaphors, or concepts from this passage and explain their contextual significance in "${bookTitle}".`;
        break;

      case "explain":
      default:
        systemInstruction =
          "You are an insightful literary companion and deep-dive reading assistant. Analyze passages for nuance, subtext, context, and character/thematic depth.";
        userPrompt = `Passage from "${bookTitle}" by ${author}:\n"""${passage}"""\n\nTask: Provide an insightful, engaging breakdown of what this passage means, its tone, and its thematic depth in the context of "${bookTitle}". Keep the formatting clean and readable using Markdown.`;
        break;
    }

    // Call Hugging Face Serverless Inference if token is configured
    if (hf && config.hfToken) {
      try {
        const response = await hf.chatCompletion({
          model: config.hfModel,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 600,
          temperature: 0.6,
        });

        const explanation =
          response.choices?.[0]?.message?.content?.trim() ||
          generateLocalFallbackExplanation(passage, bookTitle, mode);

        return res.status(200).json({
          success: true,
          model: config.hfModel,
          mode,
          explanation,
          isLiveModel: true,
        });
      } catch (hfError: any) {
        console.warn(
          "Hugging Face Inference call failed or rate-limited, switching to resilient fallback:",
          hfError?.message || hfError
        );
        // Fallback gracefully without breaking the user experience
        const fallbackText = generateLocalFallbackExplanation(passage, bookTitle, mode);
        return res.status(200).json({
          success: true,
          model: `${config.hfModel} (Resilient Fallback Mode)`,
          mode,
          explanation: fallbackText,
          isLiveModel: false,
          notice: "Delivered via fallback heuristic engine (configure HUGGINGFACE_API_KEY in backend/.env for live SOTA inference).",
        });
      }
    }

    // If no token is provided in .env yet
    const fallbackText = generateLocalFallbackExplanation(passage, bookTitle, mode);
    return res.status(200).json({
      success: true,
      model: "LibroVerse AI Heuristic Engine",
      mode,
      explanation: fallbackText,
      isLiveModel: false,
      notice: "Configure HUGGINGFACE_API_KEY in backend/.env to connect Qwen 2.5 72B live model.",
    });
  } catch (error) {
    return next(error);
  }
};

interface HookRequestBody {
  topic?: string;
  bookTitle?: string;
  draftText?: string;
}

export const generatePostHooks = async (
  req: Request<{}, {}, HookRequestBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { topic = "General Discussion", bookTitle, draftText = "" } = req.body;

    const fallbackHooks = [
      `🔥 Hot Take: What's one opinion about ${bookTitle ? `"${bookTitle}"` : "recent books"} that will have everyone in #${topic.replace(/\s+/g, "")} debating?`,
      `🤔 Reading poll: If you had to recommend just ONE must-read for someone exploring #${topic.replace(/\s+/g, "")}, what would it be?`,
      `💭 Unpopular realization: Did anyone else notice how the pacing in ${bookTitle ? `"${bookTitle}"` : "this book"} shifted completely halfway through? What were your thoughts?`,
    ];

    if (hf && config.hfToken) {
      try {
        const systemPrompt =
          "You are a social media community strategist for a digital reading and book club platform. Generate exactly 3 irresistible, highly engaging discussion questions/hooks for readers. Return ONLY a valid JSON array of 3 strings, e.g. [\"Hook 1\", \"Hook 2\", \"Hook 3\"]. No markdown code block quotes, just pure JSON array.";

        const userPrompt = `Topic / Channel: ${topic}\nReferenced Book: ${
          bookTitle || "Not specified"
        }\nUser Draft Note: "${draftText}"\n\nGenerate 3 distinct, thought-provoking conversation starters for our reader feed.`;

        const response = await hf.chatCompletion({
          model: config.hfModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 350,
          temperature: 0.7,
        });

        const rawContent = response.choices?.[0]?.message?.content?.trim() || "";
        const jsonMatch = rawContent.match(/\[[\s\S]*\]/);

        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return res.status(200).json({
                success: true,
                model: config.hfModel,
                hooks: parsed.slice(0, 3),
                isLiveModel: true,
              });
            }
          } catch (pErr) {
            console.warn("JSON parse failed on LLM response", pErr);
          }
        }

        // If JSON parsing wasn't clean, split lines
        const lines = rawContent
          .split("\n")
          .map((l) => l.replace(/^\d+[\.\)]\s*/, "").replace(/^[-*]\s*/, "").replace(/^"/, "").replace(/"$/, "").trim())
          .filter((l) => l.length > 15)
          .slice(0, 3);

        return res.status(200).json({
          success: true,
          model: config.hfModel,
          hooks: lines.length >= 2 ? lines : fallbackHooks,
          isLiveModel: true,
        });
      } catch (err: any) {
        console.warn("Hugging Face hook generation fallback:", err?.message);
        return res.status(200).json({
          success: true,
          model: `${config.hfModel} (Fallback Mode)`,
          hooks: fallbackHooks,
          isLiveModel: false,
        });
      }
    }

    return res.status(200).json({
      success: true,
      model: "LibroVerse AI Heuristic Engine",
      hooks: fallbackHooks,
      isLiveModel: false,
    });
  } catch (error) {
    return next(error);
  }
};

