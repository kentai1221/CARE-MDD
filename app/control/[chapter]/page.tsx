import { notFound, redirect } from "next/navigation";
import { getStudySession } from "@/app/lib/auth";
import {
  getAvailableStudyWeek,
  getChapterImagePaths,
  getControlChapter,
} from "@/app/lib/control-content";
import { getParticipant } from "@/app/lib/study-data";
import ControlReader from "./ControlReader";

type ControlReaderPageProps = {
  params: Promise<{ chapter: string }>;
};

export const dynamic = "force-dynamic";

export default async function ControlReaderPage({ params }: ControlReaderPageProps) {
  const session = await getStudySession();
  if (!session) redirect("/login");
  if (session.arm === "treatment") redirect("/threads");

  const { chapter: rawChapter } = await params;
  const chapter = getControlChapter(Number(rawChapter));
  if (!chapter) notFound();

  const participant = await getParticipant(session.username, session.arm);
  if (chapter.week > getAvailableStudyWeek(participant.enrolledAt)) {
    redirect("/control?locked=1");
  }

  return (
    <ControlReader
      chapter={chapter}
      imagePaths={getChapterImagePaths(chapter)}
      initiallyComplete={participant.controlProgress.completedChapters.includes(
        chapter.id
      )}
    />
  );
}
