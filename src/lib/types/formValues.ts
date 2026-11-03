import type { FieldValue } from "./fieldValue";

/** Internal values of a whole form, keyed by carrier field key. */
export type FormValues = Record<string, FieldValue>;
