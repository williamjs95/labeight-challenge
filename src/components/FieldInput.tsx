"use client";

import { toggleOption } from "@/lib/transforms/options";
import type { FieldDef } from "@/lib/types/fieldDef";
import type { FieldValue } from "@/lib/types/fieldValue";

interface Props {
  field: FieldDef;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  /** Extra lower bound for number fields (from the mapping). */
  min?: number;
  invalid?: boolean;
  describedBy?: string;
}

/** Renders one carrier field, purely from its definition. Knows nothing about any carrier. */
export function FieldInput({
  field,
  value,
  onChange,
  min,
  invalid,
  describedBy,
}: Props) {
  const id = `field-${field.key}`;
  const common = {
    id,
    name: field.key,
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
  };

  switch (field.type) {
    case "text":
    case "email":
    case "tel":
    case "date":
      return (
        <input
          {...common}
          type={field.type}
          required={field.required}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "number": {
      const lowerBound = Math.max(field.min ?? -Infinity, min ?? -Infinity);
      return (
        <input
          {...common}
          type="number"
          step={1}
          min={Number.isFinite(lowerBound) ? lowerBound : undefined}
          required={field.required}
          value={typeof value === "number" ? value : ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? undefined : Number(e.target.value))
          }
        />
      );
    }

    case "select":
      return (
        <select
          {...common}
          required={field.required}
          value={value === undefined ? "" : String(value)}
          onChange={(e) =>
            onChange(field.options.find((o) => String(o) === e.target.value))
          }
        >
          <option value="">Select…</option>
          {field.options.map((option) => (
            <option key={String(option)} value={String(option)}>
              {typeof option === "number"
                ? option.toLocaleString("en-US")
                : option}
            </option>
          ))}
        </select>
      );

    case "multiselect": {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div
          className="choices"
          id={id}
          role="group"
          aria-labelledby={`${id}-label`}
          aria-describedby={describedBy}
        >
          {field.options.map((option) => (
            <label key={option} className="choice">
              <input
                type="checkbox"
                name={field.key}
                value={option}
                checked={selected.includes(option)}
                onChange={() => onChange(toggleOption(selected, option))}
              />
              {option}
            </label>
          ))}
        </div>
      );
    }

    case "boolean": {
      const choices: { label: string; value: FieldValue }[] = [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ];
      if (!field.required)
        choices.push({ label: "Not sure", value: undefined });
      return (
        <div
          className="choices"
          id={id}
          role="radiogroup"
          aria-labelledby={`${id}-label`}
          aria-describedby={describedBy}
        >
          {choices.map((choice) => (
            <label key={choice.label} className="choice">
              <input
                type="radio"
                name={field.key}
                checked={value === choice.value}
                onChange={() => onChange(choice.value)}
              />
              {choice.label}
            </label>
          ))}
        </div>
      );
    }
  }
}
