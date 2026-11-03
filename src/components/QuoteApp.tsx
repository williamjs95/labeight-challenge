"use client";

import { useState } from "react";
import { SAMPLE_PROFILES } from "@/data/profiles";
import { harbor } from "@/lib/carriers";
import { ProfilePicker } from "./ProfilePicker";
import { QuoteFlow } from "./QuoteFlow";
import { StatusLegend } from "./StatusLegend";

export function QuoteApp({ today }: Readonly<{ today: string }>) {
  const [sample, setSample] = useState(SAMPLE_PROFILES[0]!);

  return (
    <>
      <div className="intro-grid">
        <ProfilePicker
          carrier={harbor}
          profiles={SAMPLE_PROFILES}
          selectedId={sample.id}
          today={today}
          onSelect={setSample}
        />
        <StatusLegend />
      </div>
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
