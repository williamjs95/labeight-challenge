import type { CarrierForm } from "../types/carrierForm";
import type { FieldDef } from "../types/fieldDef";
import type { FieldValue } from "../types/fieldValue";
import type { FormValues } from "../types/formValues";

export function isEmpty(value: FieldValue): boolean {
  if (value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * A field is visible when it has no `showIf`, or when its controlling field is
 * itself visible and its value matches (array includes / scalar equals).
 */
export function isVisible(
  field: FieldDef,
  values: FormValues,
  form: CarrierForm,
): boolean {
  const { showIf } = field;
  if (!showIf) return true;
  const parent = form.fields.find((f) => f.key === showIf.field);
  if (!parent || !isVisible(parent, values, form)) return false;
  const value = values[showIf.field];
  const list = asList(value);
  return list ? list.includes(showIf.includes) : value === showIf.includes;
}

/** The value as a list of options when it is one (multiselect), otherwise undefined. */
export function asList(value: FieldValue): readonly string[] | undefined {
  return Array.isArray(value) ? value : undefined;
}

export function visibleFields(
  form: CarrierForm,
  values: FormValues,
): FieldDef[] {
  return form.fields.filter((field) => isVisible(field, values, form));
}
