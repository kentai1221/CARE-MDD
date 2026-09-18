import { NextResponse } from "next/server";
import { authenticateLogin, SESSION_COOKIE } from "@/app/lib/auth";
import { ensureParticipant } from "@/app/lib/study-data";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = typeof body?.username === "string" ? body.username : "";
    const password = typeof body?.password === "string" ? body.password : "";

    const login = authenticateLogin(username, password);

    if (!login) {
      return NextResponse.json(
        { error: "用戶名稱或密碼不正確" },
        { status: 401 }
      );
    }

    await ensureParticipant(login.username, login.arm);

    const response = NextResponse.json({
      ok: true,
      arm: login.arm,
      nextPath: "/mood?phase=pre",
    });
    response.cookies.set(SESSION_COOKIE, login.sessionValue, {
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
