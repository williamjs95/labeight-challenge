import { buildDraft } from "@/lib/engine/buildDraft";
import { displayValue } from "@/lib/engine/display";
import { checkEligibility } from "@/lib/engine/eligibility";
import { serialize } from "@/lib/engine/serialize";
import { validateField, validateForm } from "@/lib/engine/validate";
import { isEmpty, isVisible, visibleFields } from "@/lib/engine/visibility";
import type { Carrier } from "@/lib/types/carrier";
import type { FieldDef } from "@/lib/types/fieldDef";
import type { FormValues } from "@/lib/types/formValues";
import { MAYA, TODAY, testCarrier } from "./fixtures";

const f = (key: string): FieldDef =>
  testCarrier.form.fields.find((x) => x.key === key)!;

const validValues: FormValues = {
  name: "Ana",
  email: "ana@example.com",
  tel: "503-555-0142",
  dob: "1990-05-01",
  tier: 2,
  pets: ["Cat"],
  count: 0,
};

describe("visibility", () => {
  it("treats undefined, blank strings and empty arrays as empty", () => {
    expect(isEmpty(undefined)).toBe(true);
    expect(isEmpty("  ")).toBe(true);
    expect(isEmpty([])).toBe(true);
    expect(isEmpty(false)).toBe(false);
    expect(isEmpty(0)).toBe(false);
  });

  it("evaluates showIf on arrays, scalars and chains", () => {
    const form = testCarrier.form;
    expect(isVisible(f("name"), {}, form)).toBe(true);
    expect(isVisible(f("dog"), { pets: ["Dog"] }, form)).toBe(true);
    expect(isVisible(f("dog"), { pets: ["Cat"] }, form)).toBe(false);
    expect(isVisible(f("dog_toy"), { pets: ["Dog"], dog: "Rex" }, form)).toBe(
      true,
    );
    // parent hidden -> child hidden, even if its own condition matches
    expect(isVisible(f("dog_toy"), { pets: ["Cat"], dog: "Rex" }, form)).toBe(
      false,
    );
    expect(visibleFields(form, { pets: [] }).map((x) => x.key)).not.toContain(
      "dog",
    );
  });

  it("hides a field whose showIf parent doesn't exist", () => {
    const orphan = {
      ...f("dog"),
      showIf: { field: "ghost", includes: "x" },
    } as FieldDef;
    expect(isVisible(orphan, {}, testCarrier.form)).toBe(false);
  });
});

describe("validateField", () => {
  it("handles required vs optional empties", () => {
    expect(validateField(f("name"), "")).toBe("This field is required.");
    expect(validateField(f("nickname"), undefined)).toBeUndefined();
  });

  it("validates text and patterns", () => {
    expect(validateField(f("name"), "ana")).toBe("Invalid format.");
    expect(validateField(f("name"), "Ana")).toBeUndefined();
    expect(validateField(f("nickname"), "anything")).toBeUndefined();
    expect(validateField(f("name"), 5)).toBe("Enter text.");
  });

  it("validates email, tel and date", () => {
    expect(validateField(f("email"), "nope")).toMatch(/email/);
    expect(validateField(f("email"), 5)).toMatch(/email/);
    expect(validateField(f("email"), "a@b.co")).toBeUndefined();
    expect(validateField(f("tel"), "555")).toMatch(/phone/);
    expect(validateField(f("tel"), 5)).toMatch(/phone/);
    expect(validateField(f("tel"), "(503) 555-0142")).toBeUndefined();
    expect(validateField(f("dob"), "2023-02-30")).toMatch(/date/);
    expect(validateField(f("dob"), 5)).toMatch(/date/);
    expect(validateField(f("dob"), "2000-01-01")).toBeUndefined();
  });

  it("validates numbers with field and mapping minimums", () => {
    expect(validateField(f("count"), "3")).toMatch(/whole number/);
    expect(validateField(f("count"), 1.5)).toMatch(/whole number/);
    expect(validateField(f("count"), -1)).toBe("Must be at least 0.");
    expect(validateField(f("count"), 1, 2)).toBe("Must be at least 2.");
    expect(validateField(f("count"), 2, 2)).toBeUndefined();
    expect(validateField(f("free_count"), -100)).toBeUndefined();
  });

  it("validates select, multiselect and boolean", () => {
    expect(validateField(f("tier"), "2")).toMatch(/options/); // type matters: 2 !== "2"
    expect(validateField(f("tier"), 2)).toBeUndefined();
    expect(validateField(f("pets"), ["Bird"])).toMatch(/options/);
    expect(validateField(f("pets"), "Dog")).toMatch(/options/);
    expect(validateField(f("pets"), ["None", "Dog"])).toMatch(/None/);
    expect(validateField(f("pets"), ["Dog", "Cat"])).toBeUndefined();
    expect(validateField(f("flag"), "yes")).toMatch(/yes or no/);
    expect(validateField(f("flag"), false)).toBeUndefined();
  });
});

describe("validateForm", () => {
  it("validates only visible fields", () => {
    expect(
      validateForm(testCarrier.form, validValues, {
        resolutions: {},
        confirmed: new Set(),
      }),
    ).toEqual({});
    const withDog = { ...validValues, pets: ["Dog"] };
    expect(
      validateForm(testCarrier.form, withDog, {
        resolutions: {},
        confirmed: new Set(),
      }),
    ).toEqual({
      dog: "This field is required.",
    });
  });

  it("requires suggested answers to be confirmed, and applies mapping minimums", () => {
    const resolutions = {
      count: { status: "suggested" as const, value: 0, min: 1 },
      tier: { status: "suggested" as const },
    };
    const errors = validateForm(testCarrier.form, validValues, {
      resolutions,
      confirmed: new Set(),
    });
    expect(errors).toEqual({
      count: "Must be at least 1.",
      tier: "Please confirm this answer.",
    });
    const ok = validateForm(
      testCarrier.form,
      { ...validValues, count: 1 },
      { resolutions, confirmed: new Set(["tier"]) },
    );
    expect(ok).toEqual({ count: "Please confirm this answer." });
  });
});

describe("checkEligibility", () => {
  it("passes when no rule fails", () => {
    expect(checkEligibility(testCarrier, validValues, TODAY)).toMatchObject({
      eligible: true,
      reasons: [],
    });
  });

  it("reports minAge using the carrier's date format (ISO when none)", () => {
    const result = checkEligibility(testCarrier, { dob: "2010-01-01" }, TODAY);
    expect(result.eligible).toBe(false);
    expect(result.reasons[0]).toBe(
      "Test Mutual requires applicants to be at least 18 years old. With a birth date of 2010-01-01, you are 16.",
    );
  });

  it("ignores missing or invalid dates (validation handles those) and collects blocked reasons", () => {
    expect(checkEligibility(testCarrier, { dob: "bad" }, TODAY).eligible).toBe(
      true,
    );
    expect(checkEligibility(testCarrier, {}, TODAY).eligible).toBe(true);
    const result = checkEligibility(testCarrier, { dob: "2010-01-01" }, TODAY, {
      tier: { status: "blocked", note: "Not served." },
    });
    expect(result.reasons).toHaveLength(2);
    expect(result.reasons[0]).toBe("Not served.");
  });
});

describe("serialize", () => {
  it("applies output formats, trims, drops hidden and empty optional fields", () => {
    const values: FormValues = {
      ...validValues,
      name: "  Ana  ",
      dog: "Rex", // hidden: pets has no Dog
      nickname: "",
      plain_date: "2026-12-01", // no format: stays ISO
      flag: false,
    };
    expect(serialize(testCarrier.form, values)).toEqual({
      name: "Ana",
      email: "ana@example.com",
      tel: "5035550142",
      dob: "1990-05-01",
      plain_date: "2026-12-01",
      tier: 2,
      pets: ["Cat"],
      count: 0,
      flag: false,
    });
  });

  it("formats dates when the carrier specifies a format and keeps unparseable phones as typed", () => {
    const form = {
      ...testCarrier.form,
      fields: [{ ...f("dob"), format: "MM/DD/YYYY" } as FieldDef, f("tel")],
    };
    expect(serialize(form, { dob: "1990-05-01", tel: "555" })).toEqual({
      dob: "05/01/1990",
      tel: "555",
    });
  });
});

describe("buildDraft", () => {
  it("asks for unmapped fields and uses a fallback note for blocked fields without one", () => {
    const carrier: Carrier = {
      ...testCarrier,
      mapping: {
        name: () => ({ status: "known", value: "Ana" }),
        tier: () => ({ status: "blocked" }),
      },
    };
    const draft = buildDraft(MAYA, carrier, TODAY);
    expect(draft.resolutions.email).toEqual({ status: "missing" });
    expect(draft.values.name).toBe("Ana");
    expect(draft.eligibility).toMatchObject({
      eligible: false,
      reasons: [`We can't answer "Tier" in a way Test Mutual accepts.`],
    });
  });
});

describe("displayValue", () => {
  it("renders values for the summary", () => {
    expect(displayValue(f("name"), undefined)).toBe("-");
    expect(displayValue(f("name"), "")).toBe("-");
    expect(displayValue(f("pets"), ["Dog", "Cat"])).toBe("Dog, Cat");
    expect(displayValue(f("flag"), true)).toBe("Yes");
    expect(displayValue(f("flag"), false)).toBe("No");
    expect(displayValue(f("count"), 50000)).toBe("50,000");
    expect(displayValue(f("dob"), "1990-05-01")).toBe("1990-05-01");
    expect(
      displayValue(
        { ...f("dob"), format: "MM/DD/YYYY" } as FieldDef,
        "1990-05-01",
      ),
    ).toBe("05/01/1990");
    expect(displayValue(f("dob"), "garbage")).toBe("garbage");
    expect(displayValue(f("name"), "Ana")).toBe("Ana");
  });
});
