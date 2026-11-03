import { ageOn, formatDate, isValidIsoDate } from "../transforms/dates";
import type { Carrier } from "../types/carrier";
import type { EligibilityResult } from "../types/eligibilityResult";
import type { FormValues } from "../types/formValues";
import { visibleFields } from "./visibility";

/**
 * Can this carrier quote this customer at all?
 *
 * Rules come from the carrier definition, not from the page:
 * - `blocked` fields: the profile's answer can't be expressed in the carrier's options
 *   (e.g. a state the carrier doesn't serve). Reasons are provided by the mapping.
 * - `validation.minAge` on date fields.
 *
 * All reasons are collected so the customer sees everything at once.
 */
export function checkEligibility(
  carrier: Carrier,
  values: FormValues,
  today: string,
  blocked: Readonly<Record<string, string>> = {},
): EligibilityResult {
  const reasons: string[] = Object.values(blocked);

  for (const field of visibleFields(carrier.form, values)) {
    if (field.type !== "date" || field.validation?.minAge === undefined)
      continue;
    const value = values[field.key];
    if (typeof value !== "string" || !isValidIsoDate(value)) continue;

    const age = ageOn(value, today);
    const minAge = field.validation.minAge;
    if (age < minAge) {
      const shown = formatDate(value, field.format ?? "YYYY-MM-DD");
      reasons.push(
        `${carrier.displayName} requires applicants to be at least ${minAge} years old. ` +
          `With a birth date of ${shown}, you are ${age}.`,
      );
    }
  }

  return { eligible: reasons.length === 0, reasons };
}
