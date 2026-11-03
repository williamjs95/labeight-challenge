import { isValidIsoDate } from "../../transforms/dates";
import {
  formatUsd,
  humanList,
  matchOption,
  smallestOptionAtLeast,
} from "../../transforms/options";
import { stateName } from "../../transforms/states";
import type { CarrierMapping } from "../../types/carrierMapping";
import type { CustomerProfile } from "../../types/customerProfile";
import type { FieldDef } from "../../types/fieldDef";
import type { Resolution } from "../../types/resolution";
import type { Resolver } from "../../types/resolver";

const known = (value: Resolution["value"]): Resolution => ({
  status: "known",
  value,
});
const missing = (note?: string): Resolution => ({ status: "missing", note });

function optionsOf(field: FieldDef): readonly (string | number)[] {
  return field.type === "select" || field.type === "multiselect"
    ? field.options
    : [];
}

/** Tags a resolver with the profile field(s) it reads, for the "behind the scenes" view. */
function from(
  key: string,
  read: (p: CustomerProfile) => unknown,
  resolve: Resolver,
): Resolver {
  return (profile, field) => ({
    ...resolve(profile, field),
    source: { key, value: JSON.stringify(read(profile)) },
  });
}

/**
 * How our standard profile answers Harbor's renters form.
 * Anything not listed here (phone, building_has_sprinklers) can't be answered and is asked.
 */
export const harborMapping: CarrierMapping = {
  // Assumes the profile name is the legal name.
  applicant_full_name: from(
    "first_name + last_name",
    (p) => `${p.first_name} ${p.last_name}`,
    (p) => {
      const name = [p.first_name, p.last_name]
        .map((s) => s.trim())
        .filter(Boolean)
        .join(" ");
      return name ? known(name) : missing();
    },
  ),

  // Kept as ISO internally; serialize() writes Harbor's MM/DD/YYYY.
  date_of_birth: from(
    "date_of_birth",
    (p) => p.date_of_birth,
    (p) =>
      isValidIsoDate(p.date_of_birth) ? known(p.date_of_birth) : missing(),
  ),

  contact_email: from(
    "email",
    (p) => p.email,
    (p) => (p.email.trim() ? known(p.email.trim()) : missing()),
  ),

  // Code -> full name, then it must be one of the states Harbor serves.
  residence_state: from(
    "state",
    (p) => p.state,
    (p, field) => {
      const name = stateName(p.state);
      if (!name)
        return missing(
          `We couldn't recognize the state "${p.state}" in your profile.`,
        );
      const rule = `Harbor serves the applicant's state (${humanList(optionsOf(field))})`;
      const option = matchOption(name, optionsOf(field));
      if (option !== undefined) return { ...known(option), rule };
      return {
        status: "blocked",
        rule,
        note: `Harbor Assurance only offers renters insurance in ${humanList(optionsOf(field))}. Your profile says you live in ${name}.`,
      };
    },
  ),

  postal_code: from(
    "zip",
    (p) => p.zip,
    (p, field) => {
      const zip = p.zip.trim();
      const pattern =
        field.type === "text" && field.pattern
          ? new RegExp(field.pattern)
          : undefined;
      return !pattern || pattern.test(zip)
        ? known(zip)
        : missing(`The ZIP code in your profile ("${p.zip}") isn't valid.`);
    },
  ),

  // LOOKALIKE: what your belongings are worth isn't the coverage limit you choose.
  // We suggest the smallest tier that covers them, and the customer confirms.
  contents_coverage: from(
    "personal_property_value",
    (p) => p.personal_property_value,
    (p, field) => {
      const value = p.personal_property_value;
      const tier = smallestOptionAtLeast(value, optionsOf(field));
      if (tier === undefined) {
        return missing(
          `Your belongings are valued at ${formatUsd(value)}, which is more than Harbor's highest option. ` +
            "Any coverage you pick will leave some of it uninsured.",
        );
      }
      return {
        status: "suggested",
        value: tier,
        note: `Your belongings are valued at ${formatUsd(value)}. ${formatUsd(tier)} is the smallest option that covers them.`,
      };
    },
  ),

  // LOOKALIKE: the profile only knows about dogs. No dog doesn't mean no pets.
  pets: from(
    "has_dog",
    (p) => p.has_dog,
    (p) =>
      p.has_dog
        ? {
            status: "suggested",
            value: ["Dog"],
            note: "Your profile says you have a dog. Add any other pets you have.",
          }
        : missing(
            "Your profile has no dog on file. Tell us if you have any other pets.",
          ),
  ),

  // Free-text breed vs Harbor's list. Unknown breeds become "Other" (needs confirmation).
  dog_breed: from(
    "dog_breed",
    (p) => p.dog_breed,
    (p, field) => {
      if (!p.has_dog || !p.dog_breed?.trim()) return missing();
      const option = matchOption(p.dog_breed, optionsOf(field));
      if (option !== undefined) return known(option);
      return {
        status: "suggested",
        value: "Other",
        note: `Your profile says "${p.dog_breed.trim()}", which isn't on Harbor's list.`,
      };
    },
  ),

  // LOOKALIKE: 3 years vs 5 years. Our count is only a lower bound.
  claims_last_5_years: from(
    "claims_last_3_years",
    (p) => p.claims_last_3_years,
    (p) => ({
      status: "suggested",
      value: p.claims_last_3_years,
      min: p.claims_last_3_years,
      note:
        `You reported ${p.claims_last_3_years} claim(s) in the last 3 years. ` +
        "Harbor asks about the last 5 years, so add any claims from 3 to 5 years ago.",
    }),
  ),
};
