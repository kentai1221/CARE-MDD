export type ControlChapter = {
  id: number;
  week: number;
  title: string;
  startPage: number;
  endPage: number;
};

export type ControlWeek = {
  week: number;
  title: string;
  chapterIds: number[];
};

export const CONTROL_CHAPTERS: ControlChapter[] = [
  { id: 1, week: 1, title: "情緒深海", startPage: 7, endPage: 14 },
  { id: 2, week: 1, title: "迷失森林", startPage: 15, endPage: 36 },
  { id: 3, week: 2, title: "孤單極地", startPage: 37, endPage: 54 },
  { id: 4, week: 2, title: "憤怒火山", startPage: 55, endPage: 60 },
  { id: 5, week: 3, title: "村公所", startPage: 61, endPage: 68 },
  { id: 6, week: 3, title: "診所", startPage: 69, endPage: 76 },
  { id: 7, week: 3, title: "安全小屋", startPage: 77, endPage: 86 },
  { id: 8, week: 4, title: "平靜湖水", startPage: 87, endPage: 90 },
  { id: 9, week: 4, title: "同行遊樂場", startPage: 91, endPage: 104 },
  { id: 10, week: 4, title: "生命道場", startPage: 105, endPage: 110 },
];

export const CONTROL_WEEKS: ControlWeek[] = [
  { week: 1, title: "認識情緒", chapterIds: [1, 2] },
  { week: 2, title: "面對情緒", chapterIds: [3, 4] },
  { week: 3, title: "尋找支援", chapterIds: [5, 6, 7] },
  { week: 4, title: "平靜與同行", chapterIds: [8, 9, 10] },
];

export function getControlChapter(id: number) {
  return CONTROL_CHAPTERS.find((chapter) => chapter.id === id) ?? null;
}

export function getChapterImagePaths(chapter: ControlChapter) {
  return Array.from(
    { length: chapter.endPage - chapter.startPage + 1 },
    (_, index) =>
      `/deer-emo/book-${String(chapter.startPage + index).padStart(3, "0")}.jpg`
  );
}

export function getAvailableStudyWeek(enrolledAt: string, now = new Date()) {
  const elapsed = Math.max(0, now.getTime() - new Date(enrolledAt).getTime());
  const elapsedWeeks = Math.floor(elapsed / (7 * 24 * 60 * 60 * 1000));
  return Math.min(4, elapsedWeeks + 1);
}

export function getWeekUnlockDate(enrolledAt: string, week: number) {
  const date = new Date(enrolledAt);
  date.setDate(date.getDate() + (week - 1) * 7);
  return date.toISOString();
}
