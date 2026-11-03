import type { FieldStatus } from "./fieldStatus";
import type { FieldValue } from "./fieldValue";

/** How the profile answers one carrier field. */
export interface Resolution {
  status: FieldStatus;
  value?: FieldValue;
  /** Short explanation shown to the customer (why we suggest it, or why it's blocked). */
  note?: string;
  /** Extra lower bound for number fields, derived from the profile. */
  min?: number;
}
