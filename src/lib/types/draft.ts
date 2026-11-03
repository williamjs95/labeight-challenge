import type { EligibilityResult } from "./eligibilityResult";
import type { FormValues } from "./formValues";
import type { Resolution } from "./resolution";

/** The profile run through a carrier's mapping: per-field resolutions, initial values and eligibility. */
export interface Draft {
  resolutions: Record<string, Resolution>;
  values: FormValues;
  eligibility: EligibilityResult;
}
