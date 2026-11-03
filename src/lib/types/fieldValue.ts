/**
 * Internal (carrier-neutral) value of a form field.
 * Dates are ISO `YYYY-MM-DD`; carrier formats are only applied in `serialize`.
 */
export type FieldValue = string | number | boolean | string[] | undefined;
