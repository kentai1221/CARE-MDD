import { cookies } from "next/headers";

export const SESSION_COOKIE = "care_mdd_session";
export const SESSION_VALUE = "care-mdd-admin-authenticated";

export function isValidLogin(username: string, password: string) {
  return username === "admin" && password === "admin";
}

export async function hasValidSession() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE;
}
