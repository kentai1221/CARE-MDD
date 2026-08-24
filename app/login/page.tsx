import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { SESSION_COOKIE, SESSION_VALUE } from "@/app/lib/auth";

export default async function LoginPage() {
  const cookieStore = await cookies();

  if (cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE) {
    redirect("/threads");
  }

  return <LoginForm />;
}
