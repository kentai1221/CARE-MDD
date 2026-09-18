import { NextResponse } from "next/server";
import { getStudySession } from "@/app/lib/auth";
import { getControlChapter } from "@/app/lib/control-content";
import {
  recordControlEvent,
  type ControlEventType,
} from "@/app/lib/study-data";

const EVENT_TYPES: ControlEventType[] = [
  "open",
  "close",
  "complete",
  "image_error",
];

export async function POST(request: Request) {
  const session = await getStudySession();
  if (!session || session.arm !== "control") {
    return NextResponse.json({ error: "未獲授權" }, { status: 403 });
  }

  const body: unknown = await request.json();
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "記錄格式不正確" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  if (typeof raw.type !== "string" || !EVENT_TYPES.includes(raw.type as ControlEventType)) {
    return NextResponse.json({ error: "事件類型不正確" }, { status: 400 });
  }

  const chapter = Number(raw.chapter);
  if (!getControlChapter(chapter)) {
    return NextResponse.json({ error: "章節不存在" }, { status: 400 });
  }

  const durationSeconds =
    raw.durationSeconds === undefined
      ? undefined
      : Math.min(86400, Math.max(0, Math.round(Number(raw.durationSeconds))));
  if (durationSeconds !== undefined && !Number.isFinite(durationSeconds)) {
    return NextResponse.json({ error: "閱讀時間格式不正確" }, { status: 400 });
  }

  await recordControlEvent(session.username, raw.type as ControlEventType, {
    chapter,
    durationSeconds,
    details:
      typeof raw.details === "string" ? raw.details.trim().slice(0, 160) : undefined,
  });

  return NextResponse.json({ ok: true });
}
