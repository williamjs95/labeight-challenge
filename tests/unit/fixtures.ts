import { SAMPLE_PROFILES } from "@/data/profiles";
import { parseCarrierForm } from "@/lib/schema";
import type { Carrier } from "@/lib/types/carrier";
import type { CustomerProfile } from "@/lib/types/customerProfile";

export const TODAY = "2026-11-03";
export const MAYA: CustomerProfile = SAMPLE_PROFILES[0]!.profile;
export const SAM: CustomerProfile = SAMPLE_PROFILES[1]!.profile;

export const profile = (
  overrides: Partial<CustomerProfile> = {},
): CustomerProfile => ({ ...MAYA, ...overrides });

/** A tiny carrier exercising every field type, independent of Harbor. */
export const testCarrier: Carrier = {
  id: "test",
  displayName: "Test Mutual",
  mapping: {},
  form: parseCarrierForm({
    carrier: "test",
    product: "renters",
    fields: [
      {
        key: "name",
        label: "Name",
        type: "text",
        required: true,
        pattern: "^[A-Z]",
      },
      { key: "nickname", label: "Nickname", type: "text", required: false },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "tel", label: "Phone", type: "tel", required: true },
      {
        key: "dob",
        label: "DOB",
        type: "date",
        required: true,
        validation: { minAge: 18 },
      },
      { key: "plain_date", label: "Move-in", type: "date", required: false },
      {
        key: "tier",
        label: "Tier",
        type: "select",
        options: ["Low", 2],
        required: true,
      },
      {
        key: "pets",
        label: "Pets",
        type: "multiselect",
        options: ["None", "Dog", "Cat"],
        required: true,
      },
      {
        key: "dog",
        label: "Dog name",
        type: "text",
        required: true,
        showIf: { field: "pets", includes: "Dog" },
      },
      {
        key: "dog_toy",
        label: "Dog toy",
        type: "text",
        required: false,
        showIf: { field: "dog", includes: "Rex" },
      },
      { key: "count", label: "Count", type: "number", required: true, min: 0 },
      {
        key: "free_count",
        label: "Free count",
        type: "number",
        required: false,
      },
      { key: "flag", label: "Flag", type: "boolean", required: false },
    ],
  }),
};
