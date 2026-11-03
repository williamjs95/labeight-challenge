import { isValidIsoDate } from "../transforms/dates";
import { normalizeUsPhone } from "../transforms/phone";
import type { CarrierForm } from "../types/carrierForm";
import type { FieldDef } from "../types/fieldDef";
import type { FieldErrors } from "../types/fieldErrors";
import type { FieldValue } from "../types/fieldValue";
import type { FormValues } from "../types/formValues";
import type { ValidateContext } from "../types/validateContext";
import { isEmpty, visibleFields } from "./visibility";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Checks a single value against the carrier's field rules. Returns an error message or undefined. */
export function validateField(
  field: FieldDef,
  value: FieldValue,
  extraMin?: number,
): string | undefined {
  if (isEmpty(value))
    return field.required ? "This field is required." : undefined;

  switch (field.type) {
    case "text":
      if (typeof value !== "string") return "Enter text.";
      if (
        field.pattern !== undefined &&
        !new RegExp(field.pattern).test(value.trim())
      )
        return "Invalid format.";
      return undefined;
    case "email":
      return typeof value === "string" && EMAIL.test(value.trim())
        ? undefined
        : "Enter a valid email address.";
    case "tel":
      return typeof value === "string" && normalizeUsPhone(value)
        ? undefined
        : "Enter a 10-digit US phone number.";
    case "date":
      return typeof value === "string" && isValidIsoDate(value)
        ? undefined
        : "Enter a valid date.";
    case "number": {
      if (typeof value !== "number" || !Number.isInteger(value))
        return "Enter a whole number.";
      const min = Math.max(field.min ?? -Infinity, extraMin ?? -Infinity);
      return value < min ? `Must be at least ${min}.` : undefined;
    }
    case "select":
      return field.options.some((option) => option === value)
        ? undefined
        : "Choose one of the options.";
    case "multiselect":
      if (
        !Array.isArray(value) ||
        !value.every((v) => field.options.includes(v))
      )
        return "Choose from the options.";
      return value.includes("None") && value.length > 1
        ? '"None" can\'t be combined with other options.'
        : undefined;
    case "boolean":
      return typeof value === "boolean" ? undefined : "Choose yes or no.";
  }
}

/** Validates every visible field. Hidden fields are ignored (they won't be sent). */
export function validateForm(
  form: CarrierForm,
  values: FormValues,
  ctx: ValidateContext,
): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of visibleFields(form, values)) {
    const resolution = ctx.resolutions[field.key];
    const error = validateField(field, values[field.key], resolution?.min);
    if (error) {
      errors[field.key] = error;
    } else if (
      resolution?.status === "suggested" &&
      !ctx.confirmed.has(field.key)
    ) {
      errors[field.key] = "Please confirm this answer.";
    }
  }
  return errors;
}
