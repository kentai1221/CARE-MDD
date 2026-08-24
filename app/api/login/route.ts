import { NextResponse } from "next/server";
import { isValidLogin, SESSION_COOKIE, SESSION_VALUE } from "@/app/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = typeof body?.username === "string" ? body.username : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!isValidLogin(username, password)) {
      return NextResponse.json(
        { error: "用戶名稱或密碼不正確" },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, SESSION_VALUE, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "登入資料格式不正確" }, { status: 400 });
  }
}
