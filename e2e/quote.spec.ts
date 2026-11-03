import { expect, test } from "@playwright/test";

// Pin "today" so age checks are deterministic.
const URL = "/?today=2026-11-03";

test("profile A: pre-fills, asks only for gaps, and submits Harbor's exact request", async ({
  page,
}) => {
  await page.goto(URL);

  const known = page.getByRole("region", { name: "From your profile" });
  await expect(known).toContainText("Maya Torres");
  await expect(known).toContainText("03/12/1994");
  await expect(known).toContainText("Oregon");

  await page
    .getByRole("button", { name: /Get Harbor Assurance quote/ })
    .click();
  await expect(page.getByText("Please confirm this answer.")).toHaveCount(3);

  await page.getByLabel(/Mobile number/).fill("(503) 555-0142");
  // Each confirm button disappears once clicked, so always click the first one.
  const confirmButtons = page.getByRole("button", { name: "Looks right" });
  for (let i = 0; i < 3; i++) await confirmButtons.first().click();
  await expect(confirmButtons).toHaveCount(0);
  await page
    .getByRole("button", { name: /Get Harbor Assurance quote/ })
    .click();

  const request = JSON.parse(
    (await page.getByTestId("carrier-request").textContent()) ?? "",
  );
  expect(request).toEqual({
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

test("profile A: unchecking Dog hides the breed", async ({ page }) => {
  await page.goto(URL);
  await expect(page.getByTestId("known-dog_breed")).toBeVisible();
  await page.getByRole("checkbox", { name: "Dog" }).uncheck();
  await expect(page.getByTestId("known-dog_breed")).toHaveCount(0);
});

test("profile B: explains both reasons and shows no form", async ({ page }) => {
  await page.goto(URL);
  await page.getByLabel(/Profile B/).check();

  const alert = page.getByRole("alert", { name: /can't quote/ });
  await expect(alert).toContainText("Your profile says you live in Nevada");
  await expect(alert).toContainText("at least 21 years old");
  await expect(alert).toContainText("you are 20");
  await expect(
    page.getByRole("button", { name: /Get Harbor Assurance quote/ }),
  ).toHaveCount(0);

  // Reviewers can still see why, in the inspector.
  await page.getByRole("tab", { name: /Eligibility/ }).click();
  await expect(page.getByText("Fails")).toHaveCount(2);
});

test("inspector: the live request updates as the customer types", async ({
  page,
}) => {
  await page.goto(URL);
  await page.getByRole("tab", { name: "Live request" }).click();
  const live = page.getByTestId("live-request");
  await expect(live).toContainText('"date_of_birth": "03/12/1994"');
  await expect(live).not.toContainText("phone");

  await page.getByLabel(/Mobile number/).fill("503-555-0142");
  await expect(live).toContainText('"phone": "5035550142"');
  await expect(page.getByTestId("still-needed")).toHaveText(
    "Every required field has a value.",
  );
});

test("ignores an invalid ?today and falls back to the real date", async ({
  page,
}) => {
  await page.goto("/?today=not-a-date");
  await expect(
    page.getByRole("heading", { level: 1, name: "Harbor Assurance quote" }),
  ).toBeVisible();
});
