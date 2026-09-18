import { NextResponse } from "next/server";
import { hasValidSession } from "@/app/lib/auth";
import {
  createConversation,
  listConversations,
} from "@/app/lib/conversations";

export async function GET() {
  if (!(await hasValidSession("treatment"))) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  return NextResponse.json({ conversations: await listConversations() });
}

export async function POST() {
  if (!(await hasValidSession("treatment"))) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const conversation = await createConversation();
  return NextResponse.json({ conversation }, { status: 201 });
}
