"use client";

import { type FormEvent, useMemo, useState } from "react";
import { buildDraft } from "@/lib/engine/buildDraft";
import { checkEligibility } from "@/lib/engine/eligibility";
import { serialize } from "@/lib/engine/serialize";
import { validateForm } from "@/lib/engine/validate";
import { visibleFields } from "@/lib/engine/visibility";
import type { Carrier } from "@/lib/types/carrier";
import type { CarrierRequest } from "@/lib/types/carrierRequest";
import type { CustomerProfile } from "@/lib/types/customerProfile";
import type { FieldDef } from "@/lib/types/fieldDef";
import type { FieldErrors } from "@/lib/types/fieldErrors";
import type { FieldValue } from "@/lib/types/fieldValue";
import type { Resolution } from "@/lib/types/resolution";
import { EligibilityResult } from "./EligibilityResult";
import { FieldInput } from "./FieldInput";
import { KnownSummary } from "./KnownSummary";

interface Props {
  carrier: Carrier;
  profile: CustomerProfile;
  /** ISO date used for age checks. Injected so it's testable. */
  today: string;
}

type Outcome =
  | { kind: "request"; request: CarrierRequest }
  | { kind: "ineligible"; reasons: string[] };

export function QuoteFlow({ carrier, profile, today }: Props) {
  const draft = useMemo(
    () => buildDraft(profile, carrier, today),
    [profile, carrier, today],
  );
  const [values, setValues] = useState(draft.values);
  const [confirmed, setConfirmed] = useState<ReadonlySet<string>>(new Set());
  const [editing, setEditing] = useState<ReadonlySet<string>>(new Set());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  if (!draft.eligibility.eligible) {
    return (
      <EligibilityResult
        carrierName={carrier.displayName}
        reasons={draft.eligibility.reasons}
      />
    );
  }

  const visible = visibleFields(carrier.form, values);
  const isKnown = (f: FieldDef) =>
    draft.resolutions[f.key]?.status === "known" && !editing.has(f.key);
  const knownFields = visible.filter(isKnown);
  const askedFields = visible.filter((f) => !isKnown(f));

  const confirm = (key: string) => {
    setConfirmed((prev) => new Set(prev).add(key));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const change = (key: string, value: FieldValue) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    confirm(key); // editing a suggested answer counts as confirming it
    setOutcome(null);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateForm(carrier.form, values, {
      resolutions: draft.resolutions,
      confirmed,
    });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setOutcome(null);
      return;
    }
    // Re-check with what the customer actually entered (e.g. an edited birth date).
    const eligibility = checkEligibility(carrier, values, today);
    setOutcome(
      eligibility.eligible
        ? { kind: "request", request: serialize(carrier.form, values) }
        : { kind: "ineligible", reasons: eligibility.reasons },
    );
  };

  return (
    <>
      <KnownSummary
        fields={knownFields}
        values={values}
        onEdit={(key) => setEditing((prev) => new Set(prev).add(key))}
      />

      <form onSubmit={submit} noValidate aria-labelledby="questions-title">
        <h2 id="questions-title">A few more questions</h2>
        {askedFields.map((field) => (
          <Question
            key={field.key}
            field={field}
            value={values[field.key]}
            resolution={draft.resolutions[field.key]}
            confirmed={confirmed.has(field.key)}
            error={errors[field.key]}
            onChange={(value) => change(field.key, value)}
            onConfirm={() => confirm(field.key)}
          />
        ))}
        <button type="submit" className="primary">
          Get {carrier.displayName} quote
        </button>
      </form>

      {outcome?.kind === "ineligible" && (
        <EligibilityResult
          carrierName={carrier.displayName}
          reasons={outcome.reasons}
        />
      )}
      {outcome?.kind === "request" && (
        <section className="result" aria-labelledby="request-title">
          <h2 id="request-title">Request sent to {carrier.displayName}</h2>
          <pre data-testid="carrier-request">
            {JSON.stringify(outcome.request, null, 2)}
          </pre>
        </section>
      )}
    </>
  );
}

interface QuestionProps {
  field: FieldDef;
  value: FieldValue;
  resolution: Resolution | undefined;
  confirmed: boolean;
  error: string | undefined;
  onChange: (value: FieldValue) => void;
  onConfirm: () => void;
}

function Question({
  field,
  value,
  resolution,
  confirmed,
  error,
  onChange,
  onConfirm,
}: QuestionProps) {
  const id = `field-${field.key}`;
  const suggested = resolution?.status === "suggested";
  const describedBy =
    [resolution?.note && `${id}-note`, error && `${id}-error`]
      .filter(Boolean)
      .join(" ") || undefined;

  let badge: string;
  if (suggested) badge = confirmed ? "Confirmed" : "Suggested, please confirm";
  else if (resolution?.status === "known") badge = "From your profile";
  else badge = field.required ? "Required" : "Optional";

  return (
    <div className="question" data-testid={`question-${field.key}`}>
      <label id={`${id}-label`} htmlFor={id}>
        {field.label}{" "}
        <span className={`badge ${suggested && !confirmed ? "warn" : ""}`}>
          {badge}
        </span>
      </label>
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
        describedBy={describedBy}
      />
      {suggested && !confirmed && (
        <button type="button" className="link" onClick={onConfirm}>
          Looks right
        </button>
      )}
      {error && (
        <p id={`${id}-error`} className="error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
