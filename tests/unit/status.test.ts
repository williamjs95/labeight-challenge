import { harbor } from "@/lib/carriers";
import { buildDraft } from "@/lib/engine/buildDraft";
import { checkEligibility } from "@/lib/engine/eligibility";
import { serializeValue } from "@/lib/engine/serialize";
import { displayStatus, questionProgress } from "@/lib/engine/status";
import type { FieldDef } from "@/lib/types/fieldDef";
import { MAYA, SAM, TODAY, testCarrier } from "./fixtures";

const f = (key: string): FieldDef =>
  testCarrier.form.fields.find((x) => x.key === key)!;
const none = new Set<string>();

describe("displayStatus", () => {
  const form = testCarrier.form;

  it("reports hidden, known and blocked fields as-is", () => {
    expect(
      displayStatus(form, f("dog"), { pets: ["Cat"] }, undefined, none),
    ).toBe("hidden");
    expect(displayStatus(form, f("name"), {}, { status: "known" }, none)).toBe(
      "known",
    );
    expect(
      displayStatus(form, f("tier"), {}, { status: "blocked" }, none),
    ).toBe("blocked");
  });

  it("tracks suggestions until confirmed", () => {
    expect(
      displayStatus(form, f("count"), {}, { status: "suggested" }, none),
    ).toBe("suggested");
    expect(
      displayStatus(
        form,
        f("count"),
        {},
        { status: "suggested" },
        new Set(["count"]),
      ),
    ).toBe("confirmed");
  });

  it("marks missing fields answered only once the value is valid", () => {
    expect(displayStatus(form, f("name"), {}, undefined, none)).toBe("missing");
    expect(
      displayStatus(form, f("name"), { name: "ana" }, undefined, none),
    ).toBe("missing"); // fails pattern
    expect(
      displayStatus(form, f("name"), { name: "Ana" }, undefined, none),
    ).toBe("answered");
    expect(displayStatus(form, f("nickname"), {}, undefined, none)).toBe(
      "optional",
    );
    expect(
      displayStatus(form, f("nickname"), { nickname: "A" }, undefined, none),
    ).toBe("answered");
  });
});

describe("questionProgress", () => {
  it("counts suggested and required missing fields, ignoring optional ones", () => {
    const draft = buildDraft(MAYA, harbor, TODAY);
    expect(
      questionProgress(harbor.form, draft.values, draft.resolutions, none),
    ).toEqual({ done: 0, total: 4 });

    const values = {
      ...draft.values,
      phone: "5035550142",
      building_has_sprinklers: true,
    };
    const confirmed = new Set([
      "contents_coverage",
      "pets",
      "claims_last_5_years",
    ]);
    expect(
      questionProgress(harbor.form, values, draft.resolutions, confirmed),
    ).toEqual({ done: 4, total: 4 });
  });

  it("doesn't count a confirmed answer that is invalid", () => {
    const draft = buildDraft(MAYA, harbor, TODAY);
    const values = { ...draft.values, contents_coverage: undefined };
    const progress = questionProgress(
      harbor.form,
      values,
      draft.resolutions,
      new Set(["contents_coverage"]),
    );
    expect(progress).toEqual({ done: 0, total: 4 });
  });
});

describe("eligibility checks", () => {
  it("lists the state rule and the age rule for profile A", () => {
    const { eligibility } = buildDraft(MAYA, harbor, TODAY);
    expect(eligibility.checks).toEqual([
      {
        id: "residence_state",
        label:
          "Harbor serves the applicant's state (California, Oregon, Washington and Arizona)",
        status: "pass",
        detail: "State of residence: Oregon",
      },
      {
        id: "date_of_birth",
        label: "Applicant is at least 21 years old",
        status: "pass",
        detail: "Age 32",
      },
    ]);
  });

  it("fails both rules for profile B", () => {
    const { eligibility } = buildDraft(SAM, harbor, TODAY);
    expect(eligibility.checks.map((c) => c.status)).toEqual(["fail", "fail"]);
  });

  it("is pending when the date isn't there and labels blocked fields without a rule", () => {
    const result = checkEligibility(testCarrier, {}, TODAY, {
      tier: { status: "blocked", value: undefined },
    });
    expect(result.checks).toEqual([
      {
        id: "tier",
        label: "Tier is one Test Mutual accepts",
        status: "fail",
        detail: `We can't answer "Tier" in a way Test Mutual accepts.`,
      },
      {
        id: "dob",
        label: "Applicant is at least 18 years old",
        status: "pending",
        detail: `Waiting for "DOB".`,
      },
    ]);
  });

  it("falls back to the resolution value when the answer was cleared", () => {
    const result = checkEligibility(testCarrier, {}, TODAY, {
      tier: { status: "known", value: 2, rule: "Tier ok" },
    });
    expect(result.checks[0]).toMatchObject({
      status: "pass",
      detail: "Tier: 2",
    });
  });
});

describe("serializeValue", () => {
  it("leaves a not-yet-valid date as typed", () => {
    const dob = { ...f("dob"), format: "MM/DD/YYYY" } as FieldDef;
    expect(serializeValue(dob, "2001-02-30")).toBe("2001-02-30");
    expect(serializeValue(dob, "2001-02-03")).toBe("02/03/2001");
  });
});

describe("Harbor mapping sources", () => {
  it("records which profile field each answer came from", () => {
    const { resolutions } = buildDraft(MAYA, harbor, TODAY);
    expect(resolutions.applicant_full_name?.source).toEqual({
      key: "first_name + last_name",
      value: '"Maya Torres"',
    });
    expect(resolutions.residence_state?.source).toEqual({
      key: "state",
      value: '"OR"',
    });
    expect(resolutions.contents_coverage?.source).toEqual({
      key: "personal_property_value",
      value: "32000",
    });
    expect(resolutions.phone?.source).toBeUndefined();
  });
});
