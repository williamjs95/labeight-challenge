import type { EligibilityCheckStatus } from "./eligibilityCheckStatus";

/** One eligibility rule, evaluated against the current answers. */
export interface EligibilityCheck {
  /** The carrier field key the rule belongs to. */
  id: string;
  label: string;
  status: EligibilityCheckStatus;
  detail: string;
}
