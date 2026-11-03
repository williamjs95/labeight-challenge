import type { CustomerProfile } from "./customerProfile";
import type { FieldDef } from "./fieldDef";
import type { Resolution } from "./resolution";

/** Answers one carrier field from the profile. */
export type Resolver = (
  profile: CustomerProfile,
  field: FieldDef,
) => Resolution;
