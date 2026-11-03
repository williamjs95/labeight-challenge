import { ageOn, formatDate, isValidIsoDate } from "../transforms/dates";
import type { Carrier } from "../types/carrier";
import type { EligibilityCheck } from "../types/eligibilityCheck";
import type { EligibilityResult } from "../types/eligibilityResult";
import type { FieldDef } from "../types/fieldDef";
import type { FormValues } from "../types/formValues";
import type { Resolution } from "../types/resolution";
import { visibleFields } from "./visibility";

/**
 * Can this carrier quote this customer at all?
 *
 * Rules come from the carrier definition and its mapping, not from the page:
 * - mapping rules: a resolution with a `rule` (e.g. "Harbor serves your state"),
 *   or any `blocked` resolution, which means the profile's answer isn't one of the options
 * - `validation.minAge` on date fields
 *
 * Every rule becomes a check (pass / fail / pending), and every failure a reason,
 * so the customer sees everything at once.
 */
export function checkEligibility(
  carrier: Carrier,
  values: FormValues,
  today: string,
  resolutions: Readonly<Record<string, Resolution>> = {},
): EligibilityResult {
  const checks: EligibilityCheck[] = [];
  const reasons: string[] = [];

  for (const field of carrier.form.fields) {
    const resolution = resolutions[field.key];
    if (!resolution || (resolution.status !== "blocked" && !resolution.rule))
      continue;
    const blocked = resolution.status === "blocked";
    const note =
      resolution.note ??
      `We can't answer "${field.label}" in a way ${carrier.displayName} accepts.`;
    checks.push({
      id: field.key,
      label:
        resolution.rule ??
        `${field.label} is one ${carrier.displayName} accepts`,
      status: blocked ? "fail" : "pass",
      detail: blocked
        ? note
        : `${field.label}: ${String(values[field.key] ?? resolution.value)}`,
    });
    if (blocked) reasons.push(note);
  }

  for (const field of visibleFields(carrier.form, values)) {
    if (field.type !== "date" || field.validation?.minAge === undefined)
      continue;
    const check = minAgeCheck(
      carrier,
      field,
      field.validation.minAge,
      values[field.key],
      today,
    );
    checks.push(check);
    if (check.status === "fail") reasons.push(check.detail);
  }

  return { eligible: reasons.length === 0, reasons, checks };
}

function minAgeCheck(
  carrier: Carrier,
  field: FieldDef & { type: "date" },
  minAge: number,
  value: FormValues[string],
  today: string,
): EligibilityCheck {
  const label = `Applicant is at least ${minAge} years old`;
  if (typeof value !== "string" || !isValidIsoDate(value)) {
    return {
      id: field.key,
      label,
      status: "pending",
      detail: `Waiting for "${field.label}".`,
    };
  }
  const age = ageOn(value, today);
  if (age >= minAge)
    return { id: field.key, label, status: "pass", detail: `Age ${age}` };
  const shown = formatDate(value, field.format ?? "YYYY-MM-DD");
  return {
    id: field.key,
    label,
    status: "fail",
    detail:
      `${carrier.displayName} requires applicants to be at least ${minAge} years old. ` +
      `With a birth date of ${shown}, you are ${age}.`,
  };
}
