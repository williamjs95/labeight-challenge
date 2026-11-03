import type { DisplayStatus } from "@/lib/types/displayStatus";
import { StatusChip } from "./StatusChip";

const ENTRIES: readonly { status: DisplayStatus; meaning: string }[] = [
  {
    status: "known",
    meaning: "The profile answers it exactly. We don't ask again.",
  },
  {
    status: "suggested",
    meaning:
      "Close, but not the same question. We pre-fill it and you confirm.",
  },
  { status: "missing", meaning: "The profile can't answer it, so we ask." },
  {
    status: "blocked",
    meaning:
      "The profile's answer isn't one Harbor accepts, so there's no quote.",
  },
];

/** Explains the four statuses used across the form and the inspector. */
export function StatusLegend() {
  return (
    <section className="legend" aria-labelledby="legend-title">
      <h2 id="legend-title" className="eyebrow">
        How to read the statuses
      </h2>
      <dl className="legend-list">
        {ENTRIES.map(({ status, meaning }) => (
          <div key={status} className="legend-item">
            <dt>
              <StatusChip status={status} />
            </dt>
            <dd>{meaning}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
