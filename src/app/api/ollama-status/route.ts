import { NextResponse } from "next/server";
import { checkOllamaStatus } from "@/lib/ollamaClient";

export async function GET() {
  try {
    const status = await checkOllamaStatus();
    return NextResponse.json(status);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        online: false,
        error: message,
        installedModels: [],
        targetModelInstalled: false,
      },
      { status: 500 }
    );
  }
}
