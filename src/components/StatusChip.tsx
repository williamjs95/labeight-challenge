import type { DisplayStatus } from "@/lib/types/displayStatus";

export const STATUS_LABELS: Readonly<Record<DisplayStatus, string>> = {
  known: "From profile",
  suggested: "Please confirm",
  confirmed: "Confirmed",
  missing: "Needed",
  answered: "Answered",
  optional: "Optional",
  blocked: "Blocks quote",
  hidden: "Hidden",
};

/** Colored pill for a field's status. Color comes from the status, not the accent. */
export function StatusChip({ status }: Readonly<{ status: DisplayStatus }>) {
  return (
    <span className="chip" data-status={status}>
      <span className="chip-dot" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}
