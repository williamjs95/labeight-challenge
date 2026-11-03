import type { CarrierForm } from "../types/carrierForm";
import type { DisplayStatus } from "../types/displayStatus";
import type { FieldDef } from "../types/fieldDef";
import type { FormValues } from "../types/formValues";
import type { QuestionProgress } from "../types/questionProgress";
import type { Resolution } from "../types/resolution";
import { validateField } from "./validate";
import { isEmpty, isVisible } from "./visibility";

/** Current state of a field, for chips in the form and the inspector. */
export function displayStatus(
  form: CarrierForm,
  field: FieldDef,
  values: FormValues,
  resolution: Resolution | undefined,
  confirmed: ReadonlySet<string>,
): DisplayStatus {
  if (!isVisible(field, values, form)) return "hidden";
  const status = resolution?.status ?? "missing";
  if (status === "known" || status === "blocked") return status;
  if (status === "suggested")
    return confirmed.has(field.key) ? "confirmed" : "suggested";

  const value = values[field.key];
  if (!isEmpty(value) && !validateField(field, value, resolution?.min))
    return "answered";
  return field.required ? "missing" : "optional";
}

/**
 * Questions the customer has to act on: every visible suggested field
 * and every visible required field the profile couldn't answer.
 */
export function questionProgress(
  form: CarrierForm,
  values: FormValues,
  resolutions: Readonly<Record<string, Resolution>>,
  confirmed: ReadonlySet<string>,
): QuestionProgress {
  let done = 0;
  let total = 0;
  for (const field of form.fields) {
    const status = displayStatus(
      form,
      field,
      values,
      resolutions[field.key],
      confirmed,
    );
    if (status === "suggested" || status === "missing") total += 1;
    if (status === "confirmed") {
      total += 1;
      if (!validateField(field, values[field.key], resolutions[field.key]?.min))
        done += 1;
    }
    if (status === "answered" && field.required) {
      total += 1;
      done += 1;
    }
  }
  return { done, total };
}
