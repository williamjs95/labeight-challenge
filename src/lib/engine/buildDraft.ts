import type { Carrier } from "../types/carrier";
import type { CustomerProfile } from "../types/customerProfile";
import type { Draft } from "../types/draft";
import type { FormValues } from "../types/formValues";
import type { Resolution } from "../types/resolution";
import { checkEligibility } from "./eligibility";

/**
 * Runs every carrier field through its mapping resolver.
 * Fields without a resolver can't be answered from the profile, so they're asked.
 */
export function buildDraft(
  profile: CustomerProfile,
  carrier: Carrier,
  today: string,
): Draft {
  const resolutions: Record<string, Resolution> = {};
  const values: FormValues = {};

  for (const field of carrier.form.fields) {
    const resolver = carrier.mapping[field.key];
    const resolution: Resolution = resolver
      ? resolver(profile, field)
      : { status: "missing" };
    resolutions[field.key] = resolution;
    values[field.key] = resolution.value;
  }

  return {
    resolutions,
    values,
    eligibility: checkEligibility(carrier, values, today, resolutions),
  };
}
