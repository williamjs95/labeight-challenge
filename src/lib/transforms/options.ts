/** Finds the carrier option equal to `value`, ignoring case and surrounding whitespace. */
export function matchOption<T extends string | number>(
  value: string,
  options: readonly T[],
): T | undefined {
  const needle = value.trim().toLowerCase();
  return options.find((option) => String(option).toLowerCase() === needle);
}

/** Smallest numeric option that is >= amount (e.g. coverage tiers). */
export function smallestOptionAtLeast(
  amount: number,
  options: readonly (string | number)[],
): number | undefined {
  return options
    .filter((option): option is number => typeof option === "number")
    .sort((a, b) => a - b)
    .find((option) => option >= amount);
}

/** Toggles a multiselect option. An option named "None" can't be combined with the others. */
export function toggleOption(
  current: readonly string[],
  option: string,
  exclusive = "None",
): string[] {
  if (current.includes(option)) return current.filter((o) => o !== option);
  if (option === exclusive) return [option];
  return [...current.filter((o) => o !== exclusive), option];
}

/** Human-readable list: "A, B and C". */
export function humanList(items: readonly (string | number)[]): string {
  const strings = items.map(String);
  if (strings.length <= 1) return strings.join("");
  return `${strings.slice(0, -1).join(", ")} and ${strings.at(-1)}`;
}

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}
