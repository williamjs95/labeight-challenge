"use client";

import { useState } from "react";
import { SAMPLE_PROFILES } from "@/data/profiles";
import { harbor } from "@/lib/carriers";
import { QuoteFlow } from "./QuoteFlow";

export function QuoteApp({ today }: { today: string }) {
  const [profileId, setProfileId] = useState(SAMPLE_PROFILES[0]!.id);
  const sample =
    SAMPLE_PROFILES.find((p) => p.id === profileId) ?? SAMPLE_PROFILES[0]!;

  return (
    <>
      <div className="toolbar">
        <label htmlFor="profile-picker">Customer profile</label>
        <select
          id="profile-picker"
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
        >
          {SAMPLE_PROFILES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <details className="profile-json">
        <summary>Profile data</summary>
        <pre>{JSON.stringify(sample.profile, null, 2)}</pre>
      </details>
      {/* key resets all form state when switching profiles */}
      <QuoteFlow
        key={sample.id}
        carrier={harbor}
        profile={sample.profile}
        today={today}
      />
    </>
  );
}
