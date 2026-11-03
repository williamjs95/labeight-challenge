import { formatDate, isValidIsoDate } from "../transforms/dates";
import type { FieldDef } from "../types/fieldDef";
import type { FieldValue } from "../types/fieldValue";

/** Human-readable value for summaries. */
export function displayValue(field: FieldDef, value: FieldValue): string {
  if (value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString("en-US");
  if (field.type === "date" && isValidIsoDate(value))
    return formatDate(value, field.format ?? "YYYY-MM-DD");
  return value;
}
