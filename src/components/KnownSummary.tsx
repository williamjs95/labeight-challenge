import { displayValue } from "@/lib/engine/display";
import type { FieldDef } from "@/lib/types/fieldDef";
import type { FormValues } from "@/lib/types/formValues";

interface Props {
  fields: readonly FieldDef[];
  values: FormValues;
  onEdit: (key: string) => void;
}

/** Answers the profile already gives us. Shown, not asked again, but editable. */
export function KnownSummary({ fields, values, onEdit }: Props) {
  if (fields.length === 0) return null;
  return (
    <section className="known" aria-labelledby="known-title">
      <h2 id="known-title">From your profile</h2>
      <dl>
        {fields.map((field) => (
          <div
            key={field.key}
            className="known-row"
            data-testid={`known-${field.key}`}
          >
            <dt>{field.label}</dt>
            <dd>{displayValue(field, values[field.key])}</dd>
            <dd>
              <button
                type="button"
                className="link"
                onClick={() => onEdit(field.key)}
                aria-label={`Edit ${field.label}`}
              >
                Edit
              </button>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
