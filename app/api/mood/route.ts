import { NextResponse } from "next/server";
import { getStudyHomePath, getStudySession } from "@/app/lib/auth";
import { recordMoodRating, type MoodPhase } from "@/app/lib/study-data";

export async function POST(request: Request) {
  const session = await getStudySession();
  if (!session) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const body: unknown = await request.json();
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "心情記錄格式不正確" }, { status: 400 });
  }

  const { phase, score } = body as { phase?: unknown; score?: unknown };
  if (phase !== "pre" && phase !== "post") {
    return NextResponse.json({ error: "記錄階段不正確" }, { status: 400 });
  }
  if (!Number.isInteger(score) || Number(score) < 0 || Number(score) > 100) {
    return NextResponse.json({ error: "心情評分必須為 0 至 100" }, { status: 400 });
  }

  await recordMoodRating(
    session.username,
    session.arm,
    phase as MoodPhase,
    Number(score)
  );

  return NextResponse.json({
    ok: true,
    nextPath: phase === "post" ? "/login" : getStudyHomePath(session.arm),
  });
}
