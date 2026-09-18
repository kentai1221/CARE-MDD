import { NextResponse } from "next/server";
import { hasValidSession } from "@/app/lib/auth";
import type { ChatMessage } from "@/app/lib/conversation-types";
import {
  deleteConversation,
  getConversation,
  updateConversation,
} from "@/app/lib/conversations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  const hasValidImage =
    message.imageDataUrl === undefined ||
    (typeof message.imageDataUrl === "string" &&
      message.imageDataUrl.length <= 7_000_000 &&
      /^data:image\/(png|jpeg|webp|gif|heic|heif);base64,[a-zA-Z0-9+/=]+$/.test(
        message.imageDataUrl
      ));

  return (
    typeof message.id === "string" &&
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    typeof message.createdAt === "string" &&
    hasValidImage
  );
}

export async function GET(_request: Request, context: RouteContext) {
  if (!(await hasValidSession("treatment"))) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const { id } = await context.params;
  const conversation = await getConversation(id);

  if (!conversation) {
    return NextResponse.json({ error: "找不到對話" }, { status: 404 });
  }

  return NextResponse.json({ conversation });
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await hasValidSession("treatment"))) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const rawBody: unknown = await request.json();
  if (!rawBody || typeof rawBody !== "object") {
    return NextResponse.json({ error: "更新資料格式不正確" }, { status: 400 });
  }

  const body = rawBody as Record<string, unknown>;
  const updates: {
    title?: string;
    messages?: ChatMessage[];
    sessionId?: string | null;
    charId?: string | null;
  } = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json({ error: "標題不能留空" }, { status: 400 });
    }
    updates.title = body.title.trim().slice(0, 60);
  }

  if (body.messages !== undefined) {
    if (!Array.isArray(body.messages) || !body.messages.every(isChatMessage)) {
      return NextResponse.json({ error: "訊息格式不正確" }, { status: 400 });
    }
    updates.messages = body.messages;
  }

  if (body.sessionId !== undefined) {
    if (body.sessionId !== null && typeof body.sessionId !== "string") {
      return NextResponse.json({ error: "Session 格式不正確" }, { status: 400 });
    }
    updates.sessionId = body.sessionId as string | null;
  }

  if (body.charId !== undefined) {
    if (body.charId !== null && typeof body.charId !== "string") {
      return NextResponse.json({ error: "角色格式不正確" }, { status: 400 });
    }
    updates.charId = body.charId as string | null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "沒有可更新的資料" }, { status: 400 });
  }

  const { id } = await context.params;
  const conversation = await updateConversation(id, updates);

  if (!conversation) {
    return NextResponse.json({ error: "找不到對話" }, { status: 404 });
  }

  return NextResponse.json({ conversation });
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await hasValidSession("treatment"))) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await deleteConversation(id);

  if (!deleted) {
    return NextResponse.json({ error: "找不到對話" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
