import { isValidIsoDate } from "../transforms/dates";
import { isEmail } from "../transforms/email";
import { normalizeUsPhone } from "../transforms/phone";
import type { CarrierForm } from "../types/carrierForm";
import type { FieldDef } from "../types/fieldDef";
import type { FieldErrors } from "../types/fieldErrors";
import type { FieldType } from "../types/fieldType";
import type { FieldValue } from "../types/fieldValue";
import type { FormValues } from "../types/formValues";
import type { ValidateContext } from "../types/validateContext";
import { asList, isEmpty, visibleFields } from "./visibility";

type Validator<T extends FieldType> = (
  field: Extract<FieldDef, { type: T }>,
  value: Exclude<FieldValue, undefined>,
  extraMin?: number,
) => string | undefined;

/** One small validator per field type, so each rule stays easy to read and test. */
const VALIDATORS: { [T in FieldType]: Validator<T> } = {
  text: (field, value) => {
    if (typeof value !== "string") return "Enter text.";
    const matches =
      field.pattern === undefined ||
      new RegExp(field.pattern).test(value.trim());
    return matches ? undefined : "Invalid format.";
  },
  email: (_field, value) =>
    typeof value === "string" && isEmail(value)
      ? undefined
      : "Enter a valid email address.",
  tel: (_field, value) =>
    typeof value === "string" && normalizeUsPhone(value)
      ? undefined
      : "Enter a 10-digit US phone number.",
  date: (_field, value) =>
    typeof value === "string" && isValidIsoDate(value)
      ? undefined
      : "Enter a valid date.",
  number: (field, value, extraMin) => {
    if (typeof value !== "number" || !Number.isInteger(value))
      return "Enter a whole number.";
    const min = Math.max(field.min ?? -Infinity, extraMin ?? -Infinity);
    return value < min ? `Must be at least ${min}.` : undefined;
  },
  select: (field, value) =>
    (field.options as readonly unknown[]).includes(value)
      ? undefined
      : "Choose one of the options.",
  multiselect: (field, value) => {
    const list = asList(value);
    const options: readonly string[] = field.options;
    if (!list?.every((v) => options.includes(v)))
      return "Choose from the options.";
    return list.includes("None") && list.length > 1
      ? '"None" can\'t be combined with other options.'
      : undefined;
  },
  boolean: (_field, value) =>
    typeof value === "boolean" ? undefined : "Choose yes or no.",
};

/** Checks a single value against the carrier's field rules. Returns an error message or undefined. */
export function validateField(
  field: FieldDef,
  value: FieldValue,
  extraMin?: number,
): string | undefined {
  if (value === undefined || isEmpty(value))
    return field.required ? "This field is required." : undefined;
  // The mapped type guarantees VALIDATORS[field.type] accepts this exact field variant.
  const validate = VALIDATORS[field.type] as Validator<FieldType>;
  return validate(field as never, value, extraMin);
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
