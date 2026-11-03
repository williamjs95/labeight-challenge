"use client";

import { type SyntheticEvent, useMemo, useState } from "react";
import { buildDraft } from "@/lib/engine/buildDraft";
import { checkEligibility } from "@/lib/engine/eligibility";
import { serialize } from "@/lib/engine/serialize";
import { displayStatus, questionProgress } from "@/lib/engine/status";
import { validateForm } from "@/lib/engine/validate";
import { visibleFields } from "@/lib/engine/visibility";
import type { Carrier } from "@/lib/types/carrier";
import type { CarrierRequest } from "@/lib/types/carrierRequest";
import type { CustomerProfile } from "@/lib/types/customerProfile";
import type { FieldDef } from "@/lib/types/fieldDef";
import type { FieldErrors } from "@/lib/types/fieldErrors";
import type { FieldValue } from "@/lib/types/fieldValue";
import { EligibilityResult } from "./EligibilityResult";
import { Inspector } from "./Inspector";
import { KnownSummary } from "./KnownSummary";
import { ProgressBar } from "./ProgressBar";
import { QuestionCard } from "./QuestionCard";

interface Props {
  carrier: Carrier;
  profile: CustomerProfile;
  /** ISO date used for age checks. Injected so it's testable. */
  today: string;
}

type Outcome =
  | { kind: "request"; request: CarrierRequest }
  | { kind: "ineligible"; reasons: string[] };

/** The customer flow on the left and the inspector on the right, sharing one set of answers. */
export function QuoteFlow({ carrier, profile, today }: Readonly<Props>) {
  const draft = useMemo(
    () => buildDraft(profile, carrier, today),
    [profile, carrier, today],
  );
  const [values, setValues] = useState(draft.values);
  const [confirmed, setConfirmed] = useState<ReadonlySet<string>>(new Set());
  const [editing, setEditing] = useState<ReadonlySet<string>>(new Set());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const visible = visibleFields(carrier.form, values);
  const isKnown = (f: FieldDef) =>
    draft.resolutions[f.key]?.status === "known" && !editing.has(f.key);
  const knownFields = visible.filter(isKnown);
  const askedFields = visible.filter((f) => !isKnown(f));
  const progress = questionProgress(
    carrier.form,
    values,
    draft.resolutions,
    confirmed,
  );

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

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
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
    const eligibility = checkEligibility(
      carrier,
      values,
      today,
      draft.resolutions,
    );
    setOutcome(
      eligibility.eligible
        ? { kind: "request", request: serialize(carrier.form, values) }
        : { kind: "ineligible", reasons: eligibility.reasons },
    );
  };

  return (
    <div className="workspace">
      <div className="flow">
        {draft.eligibility.eligible ? (
          <>
            <KnownSummary
              fields={knownFields}
              values={values}
              resolutions={draft.resolutions}
              onEdit={(key) => setEditing((prev) => new Set(prev).add(key))}
            />

            <form
              className="card"
              onSubmit={submit}
              noValidate
              aria-labelledby="questions-title"
            >
              <h2 id="questions-title" className="step-title">
                <span className="step-number" aria-hidden="true">
                  3
                </span>
                <span>A few more questions</span>
              </h2>
              <ProgressBar done={progress.done} total={progress.total} />
              <div className="questions">
                {askedFields.map((field) => (
                  <QuestionCard
                    key={field.key}
                    field={field}
                    value={values[field.key]}
                    status={displayStatus(
                      carrier.form,
                      field,
                      values,
                      draft.resolutions[field.key],
                      confirmed,
                    )}
                    resolution={draft.resolutions[field.key]}
                    error={errors[field.key]}
                    onChange={(value) => change(field.key, value)}
                    onConfirm={() => confirm(field.key)}
                  />
                ))}
              </div>
              <div className="form-footer">
                <button type="submit" className="button-primary">
                  Get {carrier.displayName} quote
                </button>
                <span className="hint">
                  Nothing is sent until every answer checks out.
                </span>
              </div>
            </form>

            {outcome?.kind === "ineligible" && (
              <EligibilityResult
                carrierName={carrier.displayName}
                reasons={outcome.reasons}
              />
            )}
            {outcome?.kind === "request" && (
              <section
                className="card card-success"
                aria-labelledby="request-title"
              >
                <h2 id="request-title" className="step-title">
                  <span className="step-number" aria-hidden="true">
                    4
                  </span>
                  <span>Ready to send to {carrier.displayName}</span>
                </h2>
                <p className="hint">
                  This is exactly what {carrier.displayName} receives: their
                  keys, formats and options.
                </p>
                <pre className="code-block" data-testid="carrier-request">
                  {JSON.stringify(outcome.request, null, 2)}
                </pre>
              </section>
            )}
          </>
        ) : (
          <EligibilityResult
            carrierName={carrier.displayName}
            reasons={draft.eligibility.reasons}
          />
        )}
      </div>

      <Inspector
        carrier={carrier}
        values={values}
        resolutions={draft.resolutions}
        confirmed={confirmed}
        today={today}
      />
    </div>
  );
}
