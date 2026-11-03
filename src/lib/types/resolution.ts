import type { FieldStatus } from "./fieldStatus";
import type { FieldValue } from "./fieldValue";
import type { ProfileSource } from "./profileSource";

/** How the profile answers one carrier field. */
export interface Resolution {
  status: FieldStatus;
  value?: Exclude<FieldValue, undefined>;
  /** Short explanation shown to the customer (why we suggest it, or why it's blocked). */
  note?: string;
  /** Extra lower bound for number fields, derived from the profile. */
  min?: number;
  /** Which profile field(s) the answer was derived from. */
  source?: ProfileSource;
  /**
   * An eligibility rule this field enforces, in plain words
   * (e.g. "Harbor serves your state"). Fails when status is "blocked".
   */
  rule?: string;
}
