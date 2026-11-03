/**
 * What a field looks like right now, combining where its value came from
 * with what the customer has done since:
 * - known / blocked: straight from the profile mapping
 * - suggested -> confirmed once the customer accepts or edits it
 * - missing -> answered once it has a valid value; optional when not required
 * - hidden: its showIf condition isn't met, so it isn't asked or sent
 */
export type DisplayStatus =
  | "known"
  | "suggested"
  | "confirmed"
  | "missing"
  | "answered"
  | "optional"
  | "blocked"
  | "hidden";
