/** Normalizes a US phone number to 10 digits; returns undefined if it isn't one. */
export function normalizeUsPhone(input: string): string | undefined {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return undefined;
}
