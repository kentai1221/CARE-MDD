import { redirect } from "next/navigation";
import LoginForm from "./LoginForm";
import { getStudyHomePath, getStudySession } from "@/app/lib/auth";

export default async function LoginPage() {
  const session = await getStudySession();

  if (session) {
    redirect(getStudyHomePath(session.arm));
  }

  return <LoginForm />;
}
