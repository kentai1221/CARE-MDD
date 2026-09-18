import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StudyArm } from "./auth";

export type MoodPhase = "pre" | "post";
export type ControlEventType = "open" | "close" | "complete" | "image_error";

export type ParticipantRecord = {
  username: string;
  arm: StudyArm;
  enrolledAt: string;
  moodRatings: Array<{
    id: string;
    phase: MoodPhase;
    score: number;
    createdAt: string;
  }>;
  controlProgress: {
    completedChapters: number[];
    events: Array<{
      id: string;
      type: ControlEventType;
      chapter?: number;
      durationSeconds?: number;
      details?: string;
      createdAt: string;
    }>;
  };
};

type StudyData = {
  participants: ParticipantRecord[];
};

const DATA_DIRECTORY = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIRECTORY, "study.json");
let mutationQueue: Promise<void> = Promise.resolve();

async function readStudyData(): Promise<StudyData> {
  try {
    const contents = await readFile(DATA_FILE, "utf8");
    const parsed: unknown = JSON.parse(contents);
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as StudyData).participants)
    ) {
      return parsed as StudyData;
    }
    return { participants: [] };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { participants: [] };
    }
    throw error;
  }
}

async function writeStudyData(data: StudyData) {
  await mkdir(DATA_DIRECTORY, { recursive: true });
  await writeFile(DATA_FILE, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function mutateStudyData<T>(
  mutation: (data: StudyData) => T | Promise<T>
): Promise<T> {
  let result: T;
  const task = mutationQueue.then(async () => {
    const data = await readStudyData();
    result = await mutation(data);
    await writeStudyData(data);
  });

  mutationQueue = task.catch(() => undefined);
  await task;
  return result!;
}

function createParticipant(username: string, arm: StudyArm): ParticipantRecord {
  return {
    username,
    arm,
    enrolledAt: new Date().toISOString(),
    moodRatings: [],
    controlProgress: {
      completedChapters: [],
      events: [],
    },
  };
}

export async function ensureParticipant(username: string, arm: StudyArm) {
  return mutateStudyData((data) => {
    let participant = data.participants.find((item) => item.username === username);
    if (!participant) {
      participant = createParticipant(username, arm);
      data.participants.push(participant);
    }
    return participant;
  });
}

export async function recordMoodRating(
  username: string,
  arm: StudyArm,
  phase: MoodPhase,
  score: number
) {
  return mutateStudyData((data) => {
    let participant = data.participants.find((item) => item.username === username);
    if (!participant) {
      participant = createParticipant(username, arm);
      data.participants.push(participant);
    }
    participant.moodRatings.push({
      id: crypto.randomUUID(),
      phase,
      score,
      createdAt: new Date().toISOString(),
    });
    return participant;
  });
}

export async function getParticipant(username: string, arm: StudyArm) {
  const data = await readStudyData();
  return (
    data.participants.find((participant) => participant.username === username) ??
    ensureParticipant(username, arm)
  );
}

export async function recordControlEvent(
  username: string,
  type: ControlEventType,
  options: { chapter?: number; durationSeconds?: number; details?: string } = {}
) {
  return mutateStudyData((data) => {
    let participant = data.participants.find((item) => item.username === username);
    if (!participant) {
      participant = createParticipant(username, "control");
      data.participants.push(participant);
    }
    participant.controlProgress.events.push({
      id: crypto.randomUUID(),
      type,
      chapter: options.chapter,
      durationSeconds: options.durationSeconds,
      details: options.details,
      createdAt: new Date().toISOString(),
    });
    return participant;
  });
}

export async function completeControlChapter(username: string, chapter: number) {
  return mutateStudyData((data) => {
    let participant = data.participants.find((item) => item.username === username);
    if (!participant) {
      participant = createParticipant(username, "control");
      data.participants.push(participant);
    }
    if (!participant.controlProgress.completedChapters.includes(chapter)) {
      participant.controlProgress.completedChapters.push(chapter);
      participant.controlProgress.events.push({
        id: crypto.randomUUID(),
        type: "complete",
        chapter,
        createdAt: new Date().toISOString(),
      });
    }
    return participant;
  });
}
