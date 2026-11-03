/** The profile field(s) a carrier answer came from, and their raw value. */
export interface ProfileSource {
  /** e.g. "state" or "first_name + last_name" */
  key: string;
  /** Raw profile value as JSON, e.g. "\"OR\"" or "32000" */
  value: string;
}
