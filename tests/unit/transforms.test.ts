import {
  ageOn,
  formatDate,
  isValidIsoDate,
  parseIsoDate,
  toIsoDate,
} from "@/lib/transforms/dates";
import {
  formatUsd,
  humanList,
  matchOption,
  smallestOptionAtLeast,
  toggleOption,
} from "@/lib/transforms/options";
import { normalizeUsPhone } from "@/lib/transforms/phone";
import { stateName } from "@/lib/transforms/states";

describe("dates", () => {
  it("parses strict ISO calendar dates", () => {
    expect(parseIsoDate("1994-03-12")).toEqual({
      year: 1994,
      month: 3,
      day: 12,
    });
    expect(parseIsoDate("03/12/1994")).toBeNull();
    expect(parseIsoDate("2023-02-29")).toBeNull();
    expect(parseIsoDate("2023-13-01")).toBeNull();
    expect(parseIsoDate("2023-04-31")).toBeNull();
    expect(isValidIsoDate("2024-02-29")).toBe(true);
    expect(isValidIsoDate("nope")).toBe(false);
  });

  it("formats to the carrier format without timezone shifts", () => {
    expect(formatDate("1994-03-12", "MM/DD/YYYY")).toBe("03/12/1994");
    expect(formatDate("2006-01-20", "DD.MM.YYYY")).toBe("20.01.2006");
    expect(() => formatDate("1994-3-12", "MM/DD/YYYY")).toThrow(
      "Invalid ISO date",
    );
  });

  it("computes age around birthdays", () => {
    expect(ageOn("2006-01-20", "2026-11-03")).toBe(20);
    expect(ageOn("2005-11-03", "2026-11-03")).toBe(21); // birthday today
    expect(ageOn("2005-11-04", "2026-11-03")).toBe(20); // birthday tomorrow
    expect(ageOn("2005-10-04", "2026-11-03")).toBe(21); // earlier month
    expect(ageOn("2004-02-29", "2025-02-28")).toBe(20); // leap day, non-leap year
    expect(ageOn("2004-02-29", "2025-03-01")).toBe(21);
    expect(() => ageOn("bad", "2026-11-03")).toThrow();
    expect(() => ageOn("2004-02-29", "bad")).toThrow();
  });

  it("converts a local Date to ISO", () => {
    expect(toIsoDate(new Date(2026, 10, 3))).toBe("2026-11-03");
  });
});

describe("options", () => {
  it("matches options case-insensitively", () => {
    expect(matchOption(" labrador ", ["Labrador", "Other"])).toBe("Labrador");
    expect(matchOption("Poodle", ["Labrador", "Other"])).toBeUndefined();
    expect(matchOption("25000", [10000, 25000])).toBe(25000);
  });

  it("picks the smallest tier that covers an amount", () => {
    const tiers = [75000, 10000, 50000, 25000, "n/a"];
    expect(smallestOptionAtLeast(32000, tiers)).toBe(50000);
    expect(smallestOptionAtLeast(12000, tiers)).toBe(25000);
    expect(smallestOptionAtLeast(25000, tiers)).toBe(25000);
    expect(smallestOptionAtLeast(0, tiers)).toBe(10000);
    expect(smallestOptionAtLeast(80000, tiers)).toBeUndefined();
  });

  it("toggles multiselect options with an exclusive None", () => {
    expect(toggleOption([], "Dog")).toEqual(["Dog"]);
    expect(toggleOption(["Dog"], "Cat")).toEqual(["Dog", "Cat"]);
    expect(toggleOption(["Dog", "Cat"], "Dog")).toEqual(["Cat"]);
    expect(toggleOption(["Dog", "Cat"], "None")).toEqual(["None"]);
    expect(toggleOption(["None"], "Cat")).toEqual(["Cat"]);
  });

  it("formats lists and money", () => {
    expect(humanList([])).toBe("");
    expect(humanList(["A"])).toBe("A");
    expect(humanList(["A", "B", "C"])).toBe("A, B and C");
    expect(formatUsd(32000)).toBe("$32,000");
  });
});

describe("states and phones", () => {
  it("maps USPS codes to names", () => {
    expect(stateName("OR")).toBe("Oregon");
    expect(stateName(" nv ")).toBe("Nevada");
    expect(stateName("XX")).toBeUndefined();
  });

  it("normalizes US phone numbers", () => {
    expect(normalizeUsPhone("(503) 555-0142")).toBe("5035550142");
    expect(normalizeUsPhone("+1 503 555 0142")).toBe("5035550142");
    expect(normalizeUsPhone("555-0142")).toBeUndefined();
    expect(normalizeUsPhone("25035550142")).toBeUndefined();
  });
});
