import { NextResponse } from "next/server";
import { getStudySession } from "@/app/lib/auth";
import { getControlChapter, getAvailableStudyWeek } from "@/app/lib/control-content";
import { completeControlChapter, getParticipant } from "@/app/lib/study-data";

export async function GET() {
  const session = await getStudySession();
  if (!session || session.arm !== "control") {
    return NextResponse.json({ error: "未獲授權" }, { status: 403 });
  }

  const participant = await getParticipant(session.username, session.arm);
  return NextResponse.json({
    enrolledAt: participant.enrolledAt,
    availableWeek: getAvailableStudyWeek(participant.enrolledAt),
    completedChapters: participant.controlProgress.completedChapters,
  });
}

export async function POST(request: Request) {
  const session = await getStudySession();
  if (!session || session.arm !== "control") {
    return NextResponse.json({ error: "未獲授權" }, { status: 403 });
  }

  const body: unknown = await request.json();
  const chapterId =
    body && typeof body === "object" ? Number((body as { chapter?: unknown }).chapter) : NaN;
  const chapter = getControlChapter(chapterId);
  if (!chapter) {
    return NextResponse.json({ error: "章節不存在" }, { status: 400 });
  }

  const participant = await getParticipant(session.username, session.arm);
  if (chapter.week > getAvailableStudyWeek(participant.enrolledAt)) {
    return NextResponse.json({ error: "本章尚未解鎖" }, { status: 403 });
  }

  const updated = await completeControlChapter(session.username, chapter.id);
  return NextResponse.json({
    ok: true,
    completedChapters: updated.controlProgress.completedChapters,
  });
}
