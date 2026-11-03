"use client";

import { buildDraft } from "@/lib/engine/buildDraft";
import { ageOn, isValidIsoDate } from "@/lib/transforms/dates";
import type { Carrier } from "@/lib/types/carrier";
import type { SampleProfile } from "@/lib/types/sampleProfile";

interface Props {
  carrier: Carrier;
  profiles: readonly SampleProfile[];
  selectedId: string;
  today: string;
  onSelect: (sample: SampleProfile) => void;
}

function blockerLabel(blockers: number, carrierName: string): string {
  if (blockers === 0) return `${carrierName} can quote`;
  return blockers === 1 ? "1 blocker" : `${blockers} blockers`;
}

/** Radio cards for the sample profiles, each with a preview of its eligibility. */
export function ProfilePicker({
  carrier,
  profiles,
  selectedId,
  today,
  onSelect,
}: Readonly<Props>) {
  return (
    <fieldset className="picker">
      <legend className="step-title">
        <span className="step-number" aria-hidden="true">
          1
        </span>
        <span>Choose a customer profile</span>
      </legend>
      <div className="picker-cards">
        {profiles.map((sample) => {
          const { id, profile } = sample;
          const { eligibility } = buildDraft(profile, carrier, today);
          const blockers = eligibility.reasons.length;
          const age = isValidIsoDate(profile.date_of_birth)
            ? ageOn(profile.date_of_birth, today)
            : undefined;
          return (
            <label
              key={id}
              className="picker-card"
              data-selected={id === selectedId}
            >
              <input
                type="radio"
                name="profile"
                value={id}
                checked={id === selectedId}
                onChange={() => onSelect(sample)}
                aria-label={`Profile ${id}: ${profile.first_name} ${profile.last_name}`}
              />
              <span className="picker-head">
                <span className="picker-name">
                  {profile.first_name} {profile.last_name}
                </span>
                <span className="mono picker-id">Profile {id}</span>
              </span>
              <span className="picker-meta">
                {profile.state} ·{" "}
                {age === undefined ? "age unknown" : `${age} yrs`} ·{" "}
                {profile.email}
              </span>
              <span
                className="chip"
                data-status={blockers === 0 ? "known" : "blocked"}
              >
                <span className="chip-dot" aria-hidden="true" />
                {blockerLabel(blockers, carrier.displayName)}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
