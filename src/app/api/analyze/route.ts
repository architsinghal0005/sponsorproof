import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  analyzeDeterministicOnly,
  analyzeWithOllama,
  getOllamaConfig,
  OllamaConnectionError,
  OllamaModelNotFoundError,
} from "@/lib/ollamaClient";
import { DeliverableType } from "@/lib/types";

const AnalyzeRequestSchema = z.object({
  brief: z.string().min(10, "Brand brief must be at least 10 characters"),
  content: z.string().min(10, "Content script or caption must be at least 10 characters"),
  deliverableType: z
    .enum([
      "YOUTUBE_INTEGRATION",
      "YOUTUBE_DEDICATED",
      "TIKTOK_REELS",
      "PODCAST_READ",
      "INSTAGRAM_POST",
      "NEWSLETTER",
    ])
    .default("YOUTUBE_INTEGRATION"),
  campaignName: z.string().default("Sponsored Campaign"),
  mode: z.enum(["auto", "deterministic"]).default("auto"),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const validationResult = AnalyzeRequestSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input data",
          details: validationResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { brief, content, deliverableType, campaignName, mode } =
      validationResult.data;

    // Deterministic only mode requested by user
    if (mode === "deterministic") {
      const report = analyzeDeterministicOnly(
        brief,
        content,
        deliverableType as DeliverableType,
        campaignName
      );
      return NextResponse.json({
        success: true,
        report,
      });
    }

    // Auto mode: attempt Ollama with configured Gemma 3 model
    try {
      const report = await analyzeWithOllama(
        brief,
        content,
        deliverableType as DeliverableType,
        campaignName,
        req.signal
      );
      return NextResponse.json({
        success: true,
        report,
      });
    } catch (ollamaErr: unknown) {
      const { baseUrl, model } = getOllamaConfig();

      if (ollamaErr instanceof OllamaModelNotFoundError) {
        return NextResponse.json(
          {
            success: false,
            errorType: "MODEL_NOT_FOUND",
            error: ollamaErr.message,
            model,
            baseUrl,
            helpInstructions: [
              `Ollama is running, but model '${model}' is not pulled.`,
              `Run: ollama run ${model} (or ollama pull ${model})`,
              `Once downloaded, rerun Analyze Campaign.`,
            ],
          },
          { status: 404 }
        );
      }

      if (ollamaErr instanceof OllamaConnectionError) {
        const isTimeout = ollamaErr.message.toLowerCase().includes("timed out");
        return NextResponse.json(
          {
            success: false,
            errorType: isTimeout ? "TIMEOUT" : "OLLAMA_UNREACHABLE",
            error: ollamaErr.message,
            baseUrl,
            model,
            helpInstructions: isTimeout
              ? [
                  `Model '${model}' took longer than expected on local CPU/GPU hardware.`,
                  "You can increase OLLAMA_TIMEOUT_MS in .env.local (e.g., 240000 for 4 minutes).",
                  "Or use 'Run Deterministic Audit' for instant zero-latency checks of codes, hashtags, and disclosures.",
                ]
              : [
                  `Ensure Ollama is installed from https://ollama.com`,
                  `Start Ollama with: ollama serve`,
                  `Make sure model is available: ollama run ${model}`,
                  `Or use 'Run Deterministic Audit' for instant code/hashtag/disclosure checks.`,
                ],
          },
          { status: isTimeout ? 504 : 503 }
        );
      }

      // General error during LLM response parsing or execution
      const generalMessage =
        ollamaErr instanceof Error ? ollamaErr.message : "Analysis failed";

      return NextResponse.json(
        {
          success: false,
          errorType: "ANALYSIS_FAILED",
          error: generalMessage,
          helpInstructions: [
            "Check that your brief and script have valid promotional text.",
            "Verify Ollama logs for details.",
          ],
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
