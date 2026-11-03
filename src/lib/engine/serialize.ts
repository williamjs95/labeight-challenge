import { formatDate, isValidIsoDate } from "../transforms/dates";
import { normalizeUsPhone } from "../transforms/phone";
import type { CarrierForm } from "../types/carrierForm";
import type { CarrierRequest } from "../types/carrierRequest";
import type { FieldDef } from "../types/fieldDef";
import type { FieldValue } from "../types/fieldValue";
import type { FormValues } from "../types/formValues";
import { isEmpty, visibleFields } from "./visibility";

/**
 * One value in the carrier's output format. This and `serialize` are the only
 * places carrier formats are applied.
 * - dates use the carrier's `format` (left as typed if not a valid date yet)
 * - phones are sent as 10 digits (left as typed if not a valid number yet)
 * - strings are trimmed; everything else is sent as-is
 */
export function serializeValue(
  field: FieldDef,
  value: Exclude<FieldValue, undefined>,
): unknown {
  if (typeof value !== "string") return value;
  if (field.type === "date" && field.format && isValidIsoDate(value))
    return formatDate(value, field.format);
  if (field.type === "tel") return normalizeUsPhone(value) ?? value;
  return value.trim();
}

/**
 * Turns internal values into the carrier's exact request.
 * - hidden fields (failed `showIf`) are dropped
 * - unanswered optional fields are omitted (never defaulted)
 * Expects values that already passed `validateForm`; also used for the live preview.
 */
export function serialize(
  form: CarrierForm,
  values: FormValues,
): CarrierRequest {
  const request: CarrierRequest = {};
  for (const field of visibleFields(form, values)) {
    const value = values[field.key];
    if (value === undefined || isEmpty(value)) continue;
    request[field.key] = serializeValue(field, value);
  }
  return request;
}
