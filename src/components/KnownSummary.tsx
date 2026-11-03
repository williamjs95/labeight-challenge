import { displayValue } from "@/lib/engine/display";
import type { FieldDef } from "@/lib/types/fieldDef";
import type { FormValues } from "@/lib/types/formValues";
import type { Resolution } from "@/lib/types/resolution";

interface Props {
  fields: readonly FieldDef[];
  values: FormValues;
  resolutions: Readonly<Record<string, Resolution>>;
  onEdit: (key: string) => void;
}

/** Answers the profile already gives us. Shown, not asked again, but editable. */
export function KnownSummary({
  fields,
  values,
  resolutions,
  onEdit,
}: Readonly<Props>) {
  return (
    <section className="card" aria-labelledby="known-title">
      <h2 id="known-title" className="step-title">
        <span className="step-number" aria-hidden="true">
          2
        </span>
        <span>From your profile</span>
      </h2>
      {fields.length === 0 ? (
        <p className="hint">
          Your profile doesn&apos;t answer any of these questions directly.
        </p>
      ) : (
        <>
          <p className="hint">
            We already have these, so we won&apos;t ask again. Edit any that are
            out of date.
          </p>
          <dl className="known-list">
            {fields.map((field) => {
              const source = resolutions[field.key]?.source?.key;
              return (
                <div
                  key={field.key}
                  className="known-row"
                  data-testid={`known-${field.key}`}
                >
                  <dt>
                    {field.label}
                    {source && (
                      <span className="cell-sub mono">from {source}</span>
                    )}
                  </dt>
                  <dd className="known-value">
                    {displayValue(field, values[field.key])}
                  </dd>
                  <dd>
                    <button
                      type="button"
                      className="button-link"
                      onClick={() => onEdit(field.key)}
                      aria-label={`Edit ${field.label}`}
                    >
                      Edit
                    </button>
                  </dd>
                </div>
              );
            })}
          </dl>
        </>
      )}
    </section>
  );
}
