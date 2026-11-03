"use client";

import { type KeyboardEvent, useRef, useState } from "react";
import { checkEligibility } from "@/lib/engine/eligibility";
import type { Carrier } from "@/lib/types/carrier";
import type { FormValues } from "@/lib/types/formValues";
import type { Resolution } from "@/lib/types/resolution";
import { EligibilityChecks } from "./EligibilityChecks";
import { FieldMapTable } from "./FieldMapTable";
import { RequestPreview } from "./RequestPreview";

interface Props {
  carrier: Carrier;
  values: FormValues;
  resolutions: Readonly<Record<string, Resolution>>;
  confirmed: ReadonlySet<string>;
  today: string;
}

const TABS = [
  { id: "map", label: "Field map" },
  { id: "request", label: "Live request" },
  { id: "eligibility", label: "Eligibility" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/** "Behind the scenes": how the profile was mapped, the live request and the eligibility rules. */
export function Inspector({
  carrier,
  values,
  resolutions,
  confirmed,
  today,
}: Readonly<Props>) {
  const [tab, setTab] = useState<TabId>("map");
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});
  const eligibility = checkEligibility(carrier, values, today, resolutions);
  const failing = eligibility.checks.filter((c) => c.status === "fail").length;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const index = TABS.findIndex((t) => t.id === tab);
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = TABS[(index + step + TABS.length) % TABS.length]!.id;
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <aside className="inspector" aria-labelledby="inspector-title">
      <div className="inspector-head">
        <p className="eyebrow">For reviewers</p>
        <h2 id="inspector-title">Behind the scenes</h2>
        <p className="hint">
          {carrier.form.fields.length} Harbor fields · carrier{" "}
          <code>{carrier.form.carrier}</code> · product{" "}
          <code>{carrier.form.product}</code>
        </p>
      </div>

      <div
        className="tabs"
        role="tablist"
        aria-label="Inspector views"
        onKeyDown={onKeyDown}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[t.id] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            className="tab"
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === "eligibility" && failing > 0 && (
              <span className="tab-count" aria-label={`${failing} failing`}>
                {failing}
              </span>
            )}
          </button>
        ))}
      </div>

      <div
        className="tab-panel"
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
      >
        {tab === "map" && (
          <FieldMapTable
            form={carrier.form}
            values={values}
            resolutions={resolutions}
            confirmed={confirmed}
          />
        )}
        {tab === "request" && (
          <RequestPreview
            form={carrier.form}
            values={values}
            carrierName={carrier.displayName}
          />
        )}
        {tab === "eligibility" && (
          <EligibilityChecks checks={eligibility.checks} />
        )}
      </div>
    </aside>
  );
}
