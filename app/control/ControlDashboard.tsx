"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CONTROL_CHAPTERS,
  CONTROL_WEEKS,
  getWeekUnlockDate,
} from "@/app/lib/control-content";

type ControlDashboardProps = {
  enrolledAt: string;
  availableWeek: number;
  completedChapters: number[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-HK", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Hong_Kong",
  }).format(new Date(value));
}

export default function ControlDashboard({
  enrolledAt,
  availableWeek,
  completedChapters,
}: ControlDashboardProps) {
  const router = useRouter();
  const completedCount = completedChapters.length;

  function logout() {
    if (!window.confirm("確定要登出嗎？")) return;
    router.push("/mood?phase=post");
  }

  return (
    <main className="control-page">
      <header className="control-header">
        <div className="control-header-inner">
          <button
            className="chat-back-button"
            type="button"
            onClick={logout}
            aria-label="登出"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m15 5-7 7 7 7" />
            </svg>
          </button>
          <h1>另存心檔</h1>
          <span className="control-header-spacer" aria-hidden="true" />
        </div>
      </header>

      <section className="control-content">
        <div className="control-intro">
          <p className="control-eyebrow">心理教育閱讀內容</p>
          <h2>四星期情緒學習旅程</h2>
          <p>
            閱讀指定的 Deer EMO 小冊子內容。新一星期的內容會按研究進度自動解鎖。
          </p>
          <div className="control-progress-summary">
            <div>
              <strong>第 {availableWeek} 星期</strong>
              <span>目前進度</span>
            </div>
            <div>
              <strong>{completedCount} / 10</strong>
              <span>已完成章節</span>
            </div>
          </div>
        </div>

        <div className="control-weeks">
          {CONTROL_WEEKS.map((week) => {
            const isLocked = week.week > availableWeek;
            const chapters = CONTROL_CHAPTERS.filter((chapter) =>
              week.chapterIds.includes(chapter.id)
            );
            const weekComplete = chapters.every((chapter) =>
              completedChapters.includes(chapter.id)
            );

            return (
              <section
                className={`control-week-card ${isLocked ? "is-locked" : ""}`}
                key={week.week}
                aria-labelledby={`control-week-${week.week}`}
              >
                <div className="control-week-heading">
                  <div>
                    <span>第 {week.week} 星期</span>
                    <h3 id={`control-week-${week.week}`}>{week.title}</h3>
                  </div>
                  {isLocked ? (
                    <span className="week-status">尚未解鎖</span>
                  ) : weekComplete ? (
                    <span className="week-status is-complete">已完成</span>
                  ) : (
                    <span className="week-status is-active">進行中</span>
                  )}
                </div>

                {isLocked ? (
                  <p className="control-unlock-date">
                    將於 {formatDate(getWeekUnlockDate(enrolledAt, week.week))} 解鎖
                  </p>
                ) : (
                  <div className="control-chapter-list">
                    {chapters.map((chapter) => {
                      const isComplete = completedChapters.includes(chapter.id);
                      return (
                        <Link
                          className="control-chapter-link"
                          href={`/control/${chapter.id}`}
                          key={chapter.id}
                        >
                          <span className="chapter-number">CH.{chapter.id}</span>
                          <span className="chapter-name">{chapter.title}</span>
                          <span className={`chapter-state ${isComplete ? "is-complete" : ""}`}>
                            {isComplete ? "完成" : "閱讀"}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <p className="control-static-notice">
          此區提供固定心理教育閱讀內容，不設聊天或個人化治療回應。
        </p>
      </section>
    </main>
  );
}
