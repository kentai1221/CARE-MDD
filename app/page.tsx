import { redirect } from "next/navigation";
import { getStudyHomePath, getStudySession } from "./lib/auth";

export default async function HomePage() {
  const session = await getStudySession();

  if (!session) {
    redirect("/login");
  }

  redirect(getStudyHomePath(session.arm));
}
