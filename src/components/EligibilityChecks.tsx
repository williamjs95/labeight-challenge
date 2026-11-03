import type { EligibilityCheck } from "@/lib/types/eligibilityCheck";
import type { EligibilityCheckStatus } from "@/lib/types/eligibilityCheckStatus";

const MARK: Readonly<Record<EligibilityCheckStatus, string>> = {
  pass: "✓",
  fail: "✕",
  pending: "…",
};
const WORD: Readonly<Record<EligibilityCheckStatus, string>> = {
  pass: "Passes",
  fail: "Fails",
  pending: "Pending",
};

/** Each eligibility rule and how the current answers do against it. */
export function EligibilityChecks({
  checks,
}: Readonly<{ checks: readonly EligibilityCheck[] }>) {
  return (
    <div className="stack">
      <p className="hint">
        These rules come from Harbor&apos;s form definition and our mapping, not
        from this page. A single failure means Harbor can&apos;t quote.
      </p>
      <ul className="checks">
        {checks.map((check) => (
          <li
            key={`${check.id}-${check.label}`}
            className="check"
            data-result={check.status}
          >
            <span className="check-mark" aria-hidden="true">
              {MARK[check.status]}
            </span>
            <span className="check-body">
              <span className="check-label">
                {check.label}{" "}
                <span className="visually-hidden">{WORD[check.status]}</span>
              </span>
              <span className="cell-sub">{check.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
