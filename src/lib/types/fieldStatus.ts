/**
 * Where a field's value came from:
 * - known:     answered exactly by the profile, so we don't ask again
 * - suggested: derived from a lookalike profile field, so the customer must confirm it
 * - missing:   the profile can't answer it, so we ask
 * - blocked:   the profile's answer can't be expressed in the carrier's options (ineligible)
 */
export type FieldStatus = "known" | "suggested" | "missing" | "blocked";
