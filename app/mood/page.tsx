import { redirect } from "next/navigation";
import { getStudySession } from "@/app/lib/auth";
import MoodRatingForm from "./MoodRatingForm";

type MoodPageProps = {
  searchParams: Promise<{ phase?: string }>;
};

export const dynamic = "force-dynamic";

export default async function MoodPage({ searchParams }: MoodPageProps) {
  const session = await getStudySession();
  if (!session) redirect("/login");

  const { phase } = await searchParams;
  if (phase !== "pre" && phase !== "post") redirect("/");

  return <MoodRatingForm phase={phase} />;
}
