"use client";

import type { DisplayStatus } from "@/lib/types/displayStatus";
import type { FieldDef } from "@/lib/types/fieldDef";
import type { FieldValue } from "@/lib/types/fieldValue";
import type { Resolution } from "@/lib/types/resolution";
import { FieldInput, isGroupField } from "./FieldInput";
import { StatusChip } from "./StatusChip";

interface Props {
  field: FieldDef;
  value: FieldValue;
  status: DisplayStatus;
  resolution: Resolution | undefined;
  error: string | undefined;
  onChange: (value: FieldValue) => void;
  onConfirm: () => void;
}

/** One question: label, status, why we're asking, the input, and confirm for suggestions. */
export function QuestionCard({
  field,
  value,
  status,
  resolution,
  error,
  onChange,
  onConfirm,
}: Readonly<Props>) {
  const id = `field-${field.key}`;
  const describedBy =
    [resolution?.note && `${id}-note`, error && `${id}-error`]
      .filter(Boolean)
      .join(" ") || undefined;
  const group = isGroupField(field);

  const heading = (
    <>
      <span className="question-label">{field.label}</span>
      <StatusChip status={status} />
    </>
  );

  const body = (
    <>
      {resolution?.note && (
        <p id={`${id}-note`} className="note">
          {resolution.note}
        </p>
      )}
      <FieldInput
        field={field}
        value={value}
        onChange={onChange}
        min={resolution?.min}
        invalid={Boolean(error)}
        describedBy={group ? undefined : describedBy}
      />
      {status === "suggested" && (
        <button type="button" className="button-secondary" onClick={onConfirm}>
          Looks right
        </button>
      )}
      {error && (
        <p id={`${id}-error`} className="error" role="alert">
          {error}
        </p>
      )}
    </>
  );

  return (
    <div
      className="question"
      data-testid={`question-${field.key}`}
      data-status={status}
    >
      {group ? (
        <fieldset
          className="question-group"
          aria-describedby={describedBy}
          aria-invalid={Boolean(error) || undefined}
        >
          <legend className="question-head">{heading}</legend>
          {body}
        </fieldset>
      ) : (
        <>
          <label className="question-head" htmlFor={id}>
            {heading}
          </label>
          {body}
        </>
      )}
    </div>
  );
}
