import type { Resolution } from "./resolution";

/** Extra context `validateForm` needs beyond the values. */
export interface ValidateContext {
  resolutions: Record<string, Resolution>;
  /** Suggested fields the customer has explicitly confirmed (or edited). */
  confirmed: ReadonlySet<string>;
}
