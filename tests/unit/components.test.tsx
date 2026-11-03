import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { FieldInput } from "@/components/FieldInput";
import { QuoteApp } from "@/components/QuoteApp";
import { QuoteFlow } from "@/components/QuoteFlow";
import { harbor } from "@/lib/carriers";
import type { FieldDef } from "@/lib/types/fieldDef";
import type { FieldValue } from "@/lib/types/fieldValue";
import { MAYA, SAM, TODAY, testCarrier } from "./fixtures";

const requestJson = () =>
  JSON.parse(screen.getByTestId("carrier-request").textContent ?? "");
const submit = () =>
  userEvent.click(
    screen.getByRole("button", { name: /get harbor assurance quote/i }),
  );
const confirmAll = async () => {
  for (const button of screen.queryAllByRole("button", { name: "Looks right" }))
    await userEvent.click(button);
};

describe("QuoteFlow with Harbor", () => {
  it("shows what the profile answers and only asks for the rest", () => {
    render(<QuoteFlow carrier={harbor} profile={MAYA} today={TODAY} />);

    const known = screen.getByRole("region", { name: "From your profile" });
    expect(within(known).getByText("Maya Torres")).toBeInTheDocument();
    expect(within(known).getByText("03/12/1994")).toBeInTheDocument();
    expect(within(known).getByText("Oregon")).toBeInTheDocument();
    expect(within(known).getByText("Labrador")).toBeInTheDocument();

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
      screen.getByText(/\$32,000\. \$50,000 is the smallest option/),
    ).toBeInTheDocument();
  });

  it("requires the phone and confirmation of suggested answers before submitting", async () => {
    render(<QuoteFlow carrier={harbor} profile={MAYA} today={TODAY} />);
    await submit();
    expect(screen.getByText("This field is required.")).toBeInTheDocument();
    expect(screen.getAllByText("Please confirm this answer.")).toHaveLength(3);
    expect(screen.queryByTestId("carrier-request")).not.toBeInTheDocument();
  });

  it("builds Harbor's exact request", async () => {
    render(<QuoteFlow carrier={harbor} profile={MAYA} today={TODAY} />);
    await userEvent.type(
      screen.getByLabelText(/Mobile number/),
      "(503) 555-0142",
    );
    await confirmAll();
    await userEvent.click(screen.getByLabelText("Yes"));
    await submit();

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
        "From your profile",
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
    await submit();
    expect(screen.getByText("Must be at least 1.")).toBeInTheDocument();
    await userEvent.clear(claims);
    expect(claims).toHaveValue(null);
  });

  it("explains why Harbor can't quote profile B and shows no form", () => {
    render(<QuoteFlow carrier={harbor} profile={SAM} today={TODAY} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Your profile says you live in Nevada");
    expect(alert).toHaveTextContent("at least 21 years old");
    expect(
      screen.queryByRole("button", { name: /quote/i }),
    ).not.toBeInTheDocument();
  });
});

const SAM_IN_OREGON = { ...SAM, state: "OR", date_of_birth: "1990-01-20" };

describe("QuoteFlow with a carrier that has no mapping", () => {
  it("asks everything and shows no summary", () => {
    render(<QuoteFlow carrier={testCarrier} profile={MAYA} today={TODAY} />);
    expect(
      screen.queryByRole("region", { name: "From your profile" }),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId("question-nickname")).getByText("Optional"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId("question-name")).getByText("Required"),
    ).toBeInTheDocument();
  });
});

describe("QuoteApp", () => {
  it("switches between sample profiles", async () => {
    render(<QuoteApp today={TODAY} />);
    expect(
      screen.getByRole("region", { name: "From your profile" }),
    ).toBeInTheDocument();
    await userEvent.selectOptions(
      screen.getByLabelText("Customer profile"),
      "B",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Nevada");
    // Unknown id falls back to the first profile.
    fireEvent.change(screen.getByLabelText("Customer profile"), {
      target: { value: "nope" },
    });
    expect(
      screen.getByRole("region", { name: "From your profile" }),
    ).toBeInTheDocument();
  });
});

function Harness({
  field,
  initial,
}: {
  field: FieldDef;
  initial?: FieldValue;
}) {
  const [value, setValue] = useState<FieldValue>(initial);
  return (
    <>
      <label htmlFor={`field-${field.key}`} id={`field-${field.key}-label`}>
        {field.label}
      </label>
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
