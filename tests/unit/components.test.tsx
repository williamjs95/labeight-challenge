import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { FieldInput } from "@/components/FieldInput";
import { ProfilePicker } from "@/components/ProfilePicker";
import { ProgressBar } from "@/components/ProgressBar";
import { RequestPreview } from "@/components/RequestPreview";
import { QuoteApp } from "@/components/QuoteApp";
import { QuoteFlow } from "@/components/QuoteFlow";
import { harbor } from "@/lib/carriers";
import type { Carrier } from "@/lib/types/carrier";
import type { FieldDef } from "@/lib/types/fieldDef";
import type { FieldValue } from "@/lib/types/fieldValue";
import { MAYA, SAM, TODAY, testCarrier } from "./fixtures";

const requestJson = () =>
  JSON.parse(screen.getByTestId("carrier-request").textContent ?? "");
const liveJson = () =>
  JSON.parse(screen.getByTestId("live-request").textContent ?? "");
const submit = () =>
  userEvent.click(
    screen.getByRole("button", { name: /get harbor assurance quote/i }),
  );
const confirmAll = async () => {
  for (const button of screen.queryAllByRole("button", { name: "Looks right" }))
    await userEvent.click(button);
};
const openTab = (name: RegExp) =>
  userEvent.click(screen.getByRole("tab", { name }));

describe("QuoteFlow with Harbor", () => {
  it("shows what the profile answers and only asks for the rest", () => {
    render(<QuoteFlow carrier={harbor} profile={MAYA} today={TODAY} />);

    const known = screen.getByRole("region", { name: "From your profile" });
    expect(within(known).getByText("Maya Torres")).toBeInTheDocument();
    expect(within(known).getByText("03/12/1994")).toBeInTheDocument();
    expect(within(known).getByText("Oregon")).toBeInTheDocument();
    expect(within(known).getByText("from state")).toBeInTheDocument();

    const asked = screen
      .getAllByTestId(/^question-/)
      .map((el) => el.dataset.testid);
    expect(asked).toEqual([
      "question-phone",
      "question-contents_coverage",
      "question-pets",
      "question-claims_last_5_years",
      "question-building_has_sprinklers",
    ]);
    expect(screen.getByLabelText(/Contents coverage/)).toHaveValue("50000");
    expect(
      within(screen.getByTestId("question-pets")).getByText("Please confirm"),
    ).toBeInTheDocument();
    expect(screen.getByText("0 of 4 questions done")).toBeInTheDocument();
  });

  it("requires the phone and confirmation of suggested answers before submitting", async () => {
    render(<QuoteFlow carrier={harbor} profile={MAYA} today={TODAY} />);
    await submit();
    expect(screen.getByText("This field is required.")).toBeInTheDocument();
    expect(screen.getAllByText("Please confirm this answer.")).toHaveLength(3);
    expect(screen.queryByTestId("carrier-request")).not.toBeInTheDocument();
  });

  it("builds Harbor's exact request and tracks progress", async () => {
    render(<QuoteFlow carrier={harbor} profile={MAYA} today={TODAY} />);
    await userEvent.type(
      screen.getByLabelText(/Mobile number/),
      "(503) 555-0142",
    );
    await confirmAll();
    expect(screen.getByText("4 of 4 questions done")).toBeInTheDocument();
    expect(
      within(screen.getByTestId("question-pets")).getByText("Confirmed"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("question-phone")).getByText("Answered"),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText("Yes"));
    await submit();

    expect(
      screen.getByRole("heading", { name: /Ready to send/ }),
    ).toBeInTheDocument();
    expect(requestJson()).toEqual({
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
      building_has_sprinklers: true,
    });
  });

  it("hides and drops dog_breed when Dog is unchecked, and clears the result on change", async () => {
    render(<QuoteFlow carrier={harbor} profile={MAYA} today={TODAY} />);
    await userEvent.type(screen.getByLabelText(/Mobile number/), "5035550142");
    await confirmAll();
    await userEvent.click(screen.getByRole("checkbox", { name: "Dog" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Cat" }));
    expect(screen.queryByTestId("known-dog_breed")).not.toBeInTheDocument();
    expect(screen.getByTestId("map-dog_breed")).toHaveAttribute(
      "data-status",
      "hidden",
    );
    expect(
      within(screen.getByTestId("map-dog_breed")).getByText(/Shown when/),
    ).toBeInTheDocument();

    await submit();
    expect(requestJson()).toMatchObject({ pets: ["Cat"] });
    expect(requestJson()).not.toHaveProperty("dog_breed");

    await userEvent.click(screen.getByRole("checkbox", { name: "Other" }));
    expect(screen.queryByTestId("carrier-request")).not.toBeInTheDocument();
  });

  it("re-checks eligibility with edited answers on submit", async () => {
    render(<QuoteFlow carrier={harbor} profile={MAYA} today={TODAY} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Edit Birth date" }),
    );
    expect(
      within(screen.getByTestId("question-date_of_birth")).getByText(
        "From profile",
      ),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Birth date/), {
      target: { value: "2010-01-01" },
    });
    await userEvent.type(screen.getByLabelText(/Mobile number/), "5035550142");
    await confirmAll();
    await submit();

    expect(
      screen.getByRole("alert", { name: /can't quote/ }),
    ).toHaveTextContent("you are 16");
    expect(screen.queryByTestId("carrier-request")).not.toBeInTheDocument();
  });

  it("raises the claims minimum to the 3-year count", async () => {
    render(
      <QuoteFlow carrier={harbor} profile={SAM_IN_OREGON} today={TODAY} />,
    );
    const claims = screen.getByLabelText(/Number of claims/);
    expect(claims).toHaveAttribute("min", "1");
    await userEvent.clear(claims);
    await userEvent.type(claims, "0");
    expect(screen.getByText("0 of 4 questions done")).toBeInTheDocument(); // confirmed but below the minimum, so not done
    await submit();
    expect(screen.getByText("Must be at least 1.")).toBeInTheDocument();
    await userEvent.clear(claims);
    expect(claims).toHaveValue(null);
  });

  it("explains why Harbor can't quote profile B, with no form but a full inspector", async () => {
    render(<QuoteFlow carrier={harbor} profile={SAM} today={TODAY} />);
    const alert = screen.getByRole("alert", { name: /can't quote/ });
    expect(alert).toHaveTextContent(
      "2 rules in Harbor Assurance's form aren't met",
    );
    expect(alert).toHaveTextContent("Your profile says you live in Nevada");
    expect(alert).toHaveTextContent("at least 21 years old");
    expect(
      screen.queryByRole("button", { name: /quote/i }),
    ).not.toBeInTheDocument();

    expect(screen.getByTestId("map-residence_state")).toHaveAttribute(
      "data-status",
      "blocked",
    );
    expect(screen.getByRole("tab", { name: /Eligibility/ })).toHaveTextContent(
      "2",
    );
    await openTab(/Eligibility/);
    expect(screen.getAllByText("Fails")).toHaveLength(2);
  });
});

const SAM_IN_OREGON = { ...SAM, state: "OR", date_of_birth: "1990-01-20" };

describe("Inspector", () => {
  it("shows the live request and what's still needed", async () => {
    render(<QuoteFlow carrier={harbor} profile={MAYA} today={TODAY} />);
    await openTab(/Live request/);
    expect(screen.getByTestId("still-needed")).toHaveTextContent(
      "Still needed: phone",
    );
    expect(liveJson()).toMatchObject({
      date_of_birth: "03/12/1994",
      residence_state: "Oregon",
    });

    await userEvent.type(
      screen.getByLabelText(/Mobile number/),
      "503-555-0142",
    );
    expect(liveJson()).toMatchObject({ phone: "5035550142" });
    expect(screen.getByTestId("still-needed")).toHaveTextContent(
      "Every required field has a value.",
    );
  });

  it("lists eligibility rules with pass and pending states", async () => {
    render(<QuoteFlow carrier={harbor} profile={MAYA} today={TODAY} />);
    await openTab(/Eligibility/);
    expect(
      screen.getByText(/Harbor serves the applicant's state/),
    ).toBeInTheDocument();
    expect(screen.getByText("Age 32")).toBeInTheDocument();
    expect(screen.getAllByText("Passes")).toHaveLength(2);
  });

  it("moves between tabs with the arrow keys", async () => {
    render(<QuoteFlow carrier={harbor} profile={MAYA} today={TODAY} />);
    const map = screen.getByRole("tab", { name: "Field map" });
    map.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Live request" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Live request" })).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(screen.getByRole("tab", { name: /Eligibility/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("tab", { name: /Eligibility/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});

describe("QuoteFlow with a carrier that has no mapping", () => {
  it("asks everything and says the profile answers nothing", async () => {
    render(<QuoteFlow carrier={testCarrier} profile={MAYA} today={TODAY} />);
    expect(
      screen.getByText(/doesn't answer any of these questions/),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("question-nickname")).getByText("Optional"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("question-name")).getByText("Needed"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("map-name")).getByText("Not in profile"),
    ).toBeInTheDocument();
    await openTab(/Eligibility/);
    expect(screen.getByText(`Waiting for "DOB".`)).toBeInTheDocument();
  });

  it("uses the carrier name when nothing is left to answer", () => {
    const empty: Carrier = {
      ...testCarrier,
      form: { ...testCarrier.form, fields: [testCarrier.form.fields[1]!] },
    };
    render(<QuoteFlow carrier={empty} profile={MAYA} today={TODAY} />);
    expect(screen.getByText("Nothing left to answer")).toBeInTheDocument();
  });

  it("explains a single blocker in the singular", () => {
    const blocked: Carrier = {
      ...testCarrier,
      mapping: { tier: () => ({ status: "blocked", note: "No." }) },
    };
    render(<QuoteFlow carrier={blocked} profile={MAYA} today={TODAY} />);
    expect(
      screen.getByRole("alert", { name: /can't quote/ }),
    ).toHaveTextContent("One rule in Test Mutual's form isn't met");
  });
});

describe("QuoteApp", () => {
  it("switches between sample profiles with eligibility previews", async () => {
    render(<QuoteApp today={TODAY} />);
    expect(screen.getByText("Harbor Assurance can quote")).toBeInTheDocument();
    expect(screen.getByText("2 blockers")).toBeInTheDocument();
    expect(screen.getByText(/NV · 20 yrs/)).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "From your profile" }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText(/Profile B/));
    expect(
      screen.getByRole("alert", { name: /can't quote/ }),
    ).toHaveTextContent("Nevada");
    await userEvent.click(screen.getByLabelText(/Profile A/));
    expect(
      screen.getByRole("region", { name: "From your profile" }),
    ).toBeInTheDocument();
  });

  it("explains the statuses", () => {
    render(<QuoteApp today={TODAY} />);
    const legend = screen.getByRole("region", {
      name: "How to read the statuses",
    });
    expect(within(legend).getByText("Blocks quote")).toBeInTheDocument();
  });
});

describe("ProfilePicker and RequestPreview edge cases", () => {
  it("handles one blocker and an unknown age", () => {
    const blocked: Carrier = {
      ...testCarrier,
      mapping: { tier: () => ({ status: "blocked" }) },
    };
    const odd = {
      id: "Z",
      label: "Odd",
      profile: { ...MAYA, date_of_birth: "unknown" },
    };
    render(
      <ProfilePicker
        carrier={blocked}
        profiles={[odd]}
        selectedId="Z"
        today={TODAY}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText("1 blocker")).toBeInTheDocument();
    expect(screen.getByText(/age unknown/)).toBeInTheDocument();
  });

  it("lists several missing keys", () => {
    render(
      <RequestPreview
        form={testCarrier.form}
        values={{}}
        carrierName="Test Mutual"
      />,
    );
    expect(screen.getByTestId("still-needed")).toHaveTextContent(
      "Still needed: name, email, tel",
    );
  });
});

describe("Small components", () => {
  it("renders the header", () => {
    render(<AppHeader />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Harbor Assurance quote" }),
    ).toBeInTheDocument();
  });

  it("shows progress", () => {
    render(<ProgressBar done={1} total={4} />);
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "1",
    );
  });
});

function Harness({
  field,
  initial,
}: Readonly<{ field: FieldDef; initial?: FieldValue }>) {
  const [value, setValue] = useState<FieldValue>(initial);
  return (
    <>
      <label htmlFor={`field-${field.key}`}>{field.label}</label>
      <FieldInput field={field} value={value} onChange={setValue} />
      <output data-testid="value">
        {JSON.stringify(value) ?? "undefined"}
      </output>
    </>
  );
}

const field = (key: string) =>
  testCarrier.form.fields.find((f) => f.key === key)!;
const shown = () => screen.getByTestId("value").textContent;

describe("FieldInput", () => {
  it("renders text-like inputs and ignores non-string values", async () => {
    render(<Harness field={field("name")} initial={5} />);
    expect(screen.getByLabelText("Name")).toHaveValue("");
    await userEvent.type(screen.getByLabelText("Name"), "Ana");
    expect(shown()).toBe('"Ana"');
  });

  it("renders numbers without a minimum when none applies", async () => {
    render(<Harness field={field("free_count")} initial="x" />);
    const input = screen.getByLabelText("Free count");
    expect(input).not.toHaveAttribute("min");
    await userEvent.type(input, "7");
    expect(shown()).toBe("7");
  });

  it("maps select values back to typed options", async () => {
    render(<Harness field={field("tier")} />);
    await userEvent.selectOptions(screen.getByLabelText("Tier"), "2");
    expect(shown()).toBe("2"); // number, not "2"
    await userEvent.selectOptions(screen.getByLabelText("Tier"), "");
    expect(shown()).toBe("undefined");
  });

  it("treats a non-array multiselect value as empty", async () => {
    render(<Harness field={field("pets")} initial="Dog" />);
    expect(screen.getByRole("checkbox", { name: "Dog" })).not.toBeChecked();
    await userEvent.click(screen.getByRole("checkbox", { name: "Dog" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "None" }));
    expect(shown()).toBe('["None"]');
  });

  it("offers 'Not sure' only for optional booleans", async () => {
    const { unmount } = render(
      <Harness field={field("flag")} initial={true} />,
    );
    await userEvent.click(screen.getByLabelText("No"));
    expect(shown()).toBe("false");
    await userEvent.click(screen.getByLabelText("Not sure"));
    expect(shown()).toBe("undefined");
    unmount();

    render(
      <Harness field={{ ...field("flag"), required: true } as FieldDef} />,
    );
    expect(screen.queryByLabelText("Not sure")).not.toBeInTheDocument();
  });
});
