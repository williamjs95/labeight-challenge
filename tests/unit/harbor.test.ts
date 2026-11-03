import { carriers, harbor } from "@/lib/carriers";
import { harborMapping } from "@/lib/carriers/harbor/mapping";
import { buildDraft } from "@/lib/engine/buildDraft";
import { serialize } from "@/lib/engine/serialize";
import { validateForm } from "@/lib/engine/validate";
import type { FieldDef } from "@/lib/types/fieldDef";
import { MAYA, SAM, TODAY, profile } from "./fixtures";

const draftFor = (p = MAYA) => buildDraft(p, harbor, TODAY);
const field = (key: string): FieldDef =>
  harbor.form.fields.find((f) => f.key === key)!;

describe("Harbor + profile A (Maya)", () => {
  const draft = draftFor();

  it("is eligible", () => {
    expect(draft.eligibility).toMatchObject({ eligible: true, reasons: [] });
  });

  it("classifies every field", () => {
    const statuses = Object.fromEntries(
      Object.entries(draft.resolutions).map(([k, r]) => [k, r.status]),
    );
    expect(statuses).toEqual({
      applicant_full_name: "known",
      date_of_birth: "known",
      contact_email: "known",
      phone: "missing",
      residence_state: "known",
      postal_code: "known",
      contents_coverage: "suggested",
      pets: "suggested",
      dog_breed: "known",
      claims_last_5_years: "suggested",
      building_has_sprinklers: "missing",
    });
  });

  it("produces Harbor's exact request once the gaps are filled and confirmed", () => {
    const values = { ...draft.values, phone: "(503) 555-0142" };
    const confirmed = new Set([
      "contents_coverage",
      "pets",
      "claims_last_5_years",
    ]);
    expect(
      validateForm(harbor.form, values, {
        resolutions: draft.resolutions,
        confirmed,
      }),
    ).toEqual({});
    expect(serialize(harbor.form, values)).toEqual({
      applicant_full_name: "Maya Torres",
      date_of_birth: "03/12/1994",
      contact_email: "maya@example.com",
      phone: "5035550142",
      residence_state: "Oregon",
      postal_code: "97205",
      contents_coverage: 50000,
      pets: ["Dog"],
      dog_breed: "Labrador",
      claims_last_5_years: 0,
    });
  });

  it("blocks submission until suggestions are confirmed and phone is given", () => {
    const errors = validateForm(harbor.form, draft.values, {
      resolutions: draft.resolutions,
      confirmed: new Set(),
    });
    expect(Object.keys(errors).sort()).toEqual([
      "claims_last_5_years",
      "contents_coverage",
      "pets",
      "phone",
    ]);
  });
});

describe("Harbor + profile B (Sam)", () => {
  it("is ineligible for both age and state, with clear reasons", () => {
    const { eligibility } = draftFor(SAM);
    expect(eligibility.eligible).toBe(false);
    expect(eligibility.reasons).toEqual([
      "Harbor Assurance only offers renters insurance in California, Oregon, Washington and Arizona. Your profile says you live in Nevada.",
      "Harbor Assurance requires applicants to be at least 21 years old. With a birth date of 01/20/2006, you are 20.",
    ]);
  });

  it("still maps the lookalike fields correctly", () => {
    const { resolutions } = draftFor(SAM);
    expect(resolutions.contents_coverage).toMatchObject({
      status: "suggested",
      value: 25000,
    });
    expect(resolutions.pets).toMatchObject({ status: "missing" }); // no dog != no pets
    expect(resolutions.dog_breed).toMatchObject({ status: "missing" });
    expect(resolutions.claims_last_5_years).toMatchObject({
      status: "suggested",
      value: 1,
      min: 1,
    });
  });
});

describe("Harbor mapping edge cases", () => {
  it("handles names", () => {
    expect(
      draftFor(profile({ first_name: " Maya ", last_name: "" })).resolutions
        .applicant_full_name,
    ).toMatchObject({
      status: "known",
      value: "Maya",
    });
    expect(
      draftFor(profile({ first_name: "", last_name: " " })).resolutions
        .applicant_full_name?.status,
    ).toBe("missing");
  });

  it("asks when DOB, email, state or zip can't be used", () => {
    const r = draftFor(
      profile({
        date_of_birth: "12/03/1994",
        email: " ",
        state: "ZZ",
        zip: "9720",
      }),
    ).resolutions;
    expect(r.date_of_birth?.status).toBe("missing");
    expect(r.contact_email?.status).toBe("missing");
    expect(r.residence_state).toMatchObject({
      status: "missing",
      note: expect.stringContaining('"ZZ"'),
    });
    expect(r.postal_code).toMatchObject({
      status: "missing",
      note: expect.stringContaining('"9720"'),
    });
  });

  it("accepts a ZIP+4", () => {
    expect(
      draftFor(profile({ zip: "97205-1234" })).resolutions.postal_code,
    ).toMatchObject({ status: "known", value: "97205-1234" });
  });

  it("doesn't suggest coverage above Harbor's highest tier", () => {
    const r = draftFor(profile({ personal_property_value: 90000 })).resolutions
      .contents_coverage;
    expect(r).toMatchObject({
      status: "missing",
      note: expect.stringContaining("$90,000"),
    });
    expect(r?.value).toBeUndefined();
  });

  it("maps breeds: case-insensitive match, unknown to Other, missing breed is asked", () => {
    expect(
      draftFor(profile({ dog_breed: "pit bull" })).resolutions.dog_breed,
    ).toMatchObject({ status: "known", value: "Pit Bull" });
    expect(
      draftFor(profile({ dog_breed: "Poodle" })).resolutions.dog_breed,
    ).toMatchObject({
      status: "suggested",
      value: "Other",
      note: expect.stringContaining("Poodle"),
    });
    expect(
      draftFor(profile({ dog_breed: null })).resolutions.dog_breed?.status,
    ).toBe("missing");
    expect(
      draftFor(profile({ dog_breed: "  " })).resolutions.dog_breed?.status,
    ).toBe("missing");
  });

  it("treats non-option fields defensively", () => {
    // A resolver that expects options gets [] for a field without them.
    expect(harborMapping.residence_state!(MAYA, field("phone")).status).toBe(
      "blocked",
    );
    // No pattern: any ZIP is accepted.
    expect(
      harborMapping.postal_code!(profile({ zip: "x" }), field("phone")),
    ).toMatchObject({ status: "known", value: "x" });
  });

  it("is registered", () => {
    expect(carriers.harbor).toBe(harbor);
  });
});
