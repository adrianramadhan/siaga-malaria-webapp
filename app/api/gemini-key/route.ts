import { NextResponse } from "next/server";

export async function GET() {
  // Check if the environment variable exists
  const apiKey = process.env.GEMINI_API_KEY;

  // Return whether the key exists (but not the key itself for security)
  return NextResponse.json({
    hasKey: !!apiKey,
  });
}
