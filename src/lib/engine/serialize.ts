import { formatDate } from "../transforms/dates";
import { normalizeUsPhone } from "../transforms/phone";
import type { CarrierForm } from "../types/carrierForm";
import type { CarrierRequest } from "../types/carrierRequest";
import type { FormValues } from "../types/formValues";
import { isEmpty, visibleFields } from "./visibility";

/**
 * Turns internal values into the carrier's exact request format.
 * This is the only place carrier output formats are applied.
 * - hidden fields (failed `showIf`) are dropped
 * - unanswered optional fields are omitted (never defaulted)
 * - dates use the carrier's `format`; phones are sent as 10 digits
 * Expects values that already passed `validateForm`.
 */
export function serialize(
  form: CarrierForm,
  values: FormValues,
): CarrierRequest {
  const request: CarrierRequest = {};
  for (const field of visibleFields(form, values)) {
    const value = values[field.key];
    if (isEmpty(value)) continue;

    if (field.type === "date" && field.format && typeof value === "string") {
      request[field.key] = formatDate(value, field.format);
    } else if (field.type === "tel" && typeof value === "string") {
      request[field.key] = normalizeUsPhone(value) ?? value;
    } else if (typeof value === "string") {
      request[field.key] = value.trim();
    } else {
      request[field.key] = value;
    }
  }
  return request;
}
