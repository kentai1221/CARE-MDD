import { cookies } from "next/headers";

export const SESSION_COOKIE = "care_mdd_session";
export const SESSION_VALUE = "care-mdd-treatment-authenticated";
export const CONTROL_SESSION_VALUE = "care-mdd-control-authenticated";
const LEGACY_SESSION_VALUE = "care-mdd-admin-authenticated";

export type StudyArm = "treatment" | "control";

export type StudySession = {
  username: "polyu" | "polyu2";
  arm: StudyArm;
};

export function authenticateLogin(
  username: string,
  password: string
): (StudySession & { sessionValue: string }) | null {
  if (password !== "caremdd") return null;

  if (username === "polyu") {
    return {
      username: "polyu",
      arm: "treatment",
      sessionValue: SESSION_VALUE,
    };
  }

  if (username === "polyu2") {
    return {
      username: "polyu2",
      arm: "control",
      sessionValue: CONTROL_SESSION_VALUE,
    };
  }

  return null;
}

export async function getStudySession(): Promise<StudySession | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE)?.value;

  if (value === SESSION_VALUE || value === LEGACY_SESSION_VALUE) {
    return { username: "polyu", arm: "treatment" };
  }

  if (value === CONTROL_SESSION_VALUE) {
    return { username: "polyu2", arm: "control" };
  }

  return null;
}

export async function hasValidSession(requiredArm?: StudyArm) {
  const session = await getStudySession();
  return Boolean(session && (!requiredArm || session.arm === requiredArm));
}

export function getStudyHomePath(arm: StudyArm) {
  return arm === "control" ? "/control" : "/threads";
}
