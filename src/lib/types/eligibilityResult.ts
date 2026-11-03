import type { EligibilityCheck } from "./eligibilityCheck";

/** Whether a carrier can quote this customer, every reason it can't, and each rule checked. */
export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
  checks: EligibilityCheck[];
}
