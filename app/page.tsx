import { redirect } from "next/navigation";
import { hasValidSession } from "./lib/auth";

export default async function HomePage() {
  if (!(await hasValidSession())) {
    redirect("/login");
  }

  redirect("/threads");
}
