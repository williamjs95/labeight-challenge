import type { QuestionProgress } from "@/lib/types/questionProgress";

/** "3 of 4 questions done", with a bar. */
export function ProgressBar({ done, total }: Readonly<QuestionProgress>) {
  const percent = total === 0 ? 100 : Math.round((done / total) * 100);
  const label =
    total === 0
      ? "Nothing left to answer"
      : `${done} of ${total} questions done`;
  return (
    <div className="progress">
      <div className="progress-label">
        <span>{label}</span>
        <span className="mono">{percent}%</span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Questions done"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
