import { redirect } from "next/navigation";
import { getStudySession } from "@/app/lib/auth";
import { getAvailableStudyWeek } from "@/app/lib/control-content";
import { getParticipant } from "@/app/lib/study-data";
import ControlDashboard from "./ControlDashboard";

export const dynamic = "force-dynamic";

export default async function ControlPage() {
  const session = await getStudySession();
  if (!session) redirect("/login");
  if (session.arm === "treatment") redirect("/threads");

  const participant = await getParticipant(session.username, session.arm);

  return (
    <ControlDashboard
      enrolledAt={participant.enrolledAt}
      availableWeek={getAvailableStudyWeek(participant.enrolledAt)}
      completedChapters={participant.controlProgress.completedChapters}
    />
  );
}
