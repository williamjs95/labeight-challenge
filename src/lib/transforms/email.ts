const WHITESPACE = /\s/;

/**
 * Pragmatic email check: "local@domain.tld" with no whitespace, exactly one "@",
 * and a dot inside the domain (not at its start or end).
 * Written without a backtracking regex so it runs in linear time on any input.
 */
export function isEmail(input: string): boolean {
  const email = input.trim();
  if (WHITESPACE.test(email)) return false;

  const parts = email.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts as [string, string];

  const dot = domain.lastIndexOf(".");
  return local.length > 0 && dot > 0 && dot < domain.length - 1;
}
