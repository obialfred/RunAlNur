import { NextResponse } from "next/server";
import { generateDailyBriefing } from "@/lib/ai/briefings";

export async function GET() {
  const briefing = await generateDailyBriefing();
  return NextResponse.json({ success: true, briefing });
}
