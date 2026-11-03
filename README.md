# Harbor Assurance renters adapter

Connects our standard customer profile to Harbor Assurance's renters quote form.

- **Adapter:** turns a profile into Harbor's exact request (their keys, `MM/DD/YYYY` dates, their option values).
- **Page:** a Next.js page renders Harbor's form from its JSON, pre-fills what the profile answers and asks only for the rest.
- **Eligibility check:** explains why Harbor can't quote a customer instead of submitting.

```bash
yarn install
yarn dev                # http://localhost:3000  (add ?today=YYYY-MM-DD to pin the date)
yarn test:coverage      # unit + component tests (100% coverage)
yarn e2e                # Playwright, builds and starts the app
yarn typecheck && yarn eslint
```

## Using the page

1. **Choose a customer profile.** Each card shows whether Harbor can quote that customer before you open it.
2. **From your profile.** These are the answers we already have. They aren't asked again, but each one can be edited.
3. **A few more questions.** Only what the profile can't answer, plus derived answers to confirm, with a progress bar.
4. **Ready to send.** The exact request Harbor receives, or a clear list of the reasons Harbor can't quote.

The **Behind the scenes** panel is for reviewers and updates live:
- **Field map:** every Harbor field, the profile field it came from, its status and the value that will be sent.
- **Live request:** the request in Harbor's format as you type, plus the required keys still missing.
- **Eligibility:** every rule checked, marked pass, fail or pending.

## How it works

```
CustomerProfile ──► carrier mapping ──► Draft (value + status per field) ──► form UI ──► serialize ──► Harbor request
  (ours)            (per carrier)         + eligibility                      (generic)     (carrier formats)
```

Only `src/lib/carriers/harbor/` is Harbor-specific. That folder holds the form JSON verbatim plus `mapping.ts`. Everything else (`engine/`, `transforms/`, `components/`) is generic and is driven by the JSON.

**Each field gets a status** that decides what the customer sees:

| Status | Meaning | UI |
|---|---|---|
| `known` | The profile answers it exactly | Shown under "From your profile", not asked again (editable) |
| `suggested` | Derived from a lookalike profile field | Pre-filled, but must be confirmed ("Looks right") or changed |
| `missing` | The profile can't answer it | Asked |
| `blocked` | The profile's answer isn't one of Harbor's options | The customer is ineligible, and we say why |

**Values stay carrier-neutral until the very end.** Dates are ISO inside the app and only become `MM/DD/YYYY` in `serialize()`. Validation, eligibility and the UI never parse carrier-formatted strings.

**Carrier JSON is validated with a strict zod schema when it's loaded.** If Harbor adds a rule we don't support yet (say `validation.maxAge`), loading fails loudly instead of silently skipping the rule.

## Field mapping

| Harbor field | From profile | Status | Why |
|---|---|---|---|
| `applicant_full_name` | `first_name + last_name` | known | |
| `date_of_birth` | `date_of_birth` | known | Converted to `MM/DD/YYYY` by splitting the string. No `Date`, so no timezone off-by-one. |
| `contact_email` | `email` | known | |
| `phone` | none | **asked** | Not in the profile |
| `residence_state` | `state` | known / **blocked** | `OR` becomes `Oregon`. `NV` isn't one of Harbor's options, so the customer is ineligible. |
| `postal_code` | `zip` | known | Checked against Harbor's regex |
| `contents_coverage` | `personal_property_value` | **suggested** | Lookalike, see below |
| `pets` | `has_dog` | **suggested / asked** | Lookalike, see below |
| `dog_breed` | `dog_breed` | known / suggested / asked | Only shown when `pets` includes Dog (`showIf`) |
| `claims_last_5_years` | `claims_last_3_years` | **suggested** | Lookalike, see below |
| `building_has_sprinklers` | none | asked (optional) | Left out of the request if unanswered, never defaulted to `false` |

### Fields that look alike but aren't the same
- **Property value vs coverage amount.** What your belongings are worth isn't the coverage limit you choose, and Harbor only offers fixed tiers. We suggest the smallest tier that covers the value ($32,000 → $50,000) and the customer confirms it. Above $75,000 there's no suggestion, and we warn that they'll be under-insured.
- **`has_dog` vs pets.** The profile only knows about dogs. `has_dog: true` suggests `["Dog"]` and asks the customer to add other pets. `has_dog: false` does **not** become `["None"]` (they might have a cat), so we ask.
- **Claims in 3 years vs 5 years.** Our count is only a lower bound for Harbor's window. We pre-fill it, ask the customer to confirm, and set the input's minimum to that count so it can't go lower.
- **Dog breed.** Our profile stores free text and Harbor has a fixed list. A case-insensitive match is `known`. Anything else (e.g. "Poodle") is suggested as `"Other"`, showing the original text so the customer can confirm.

## Eligibility
The rules come from the carrier JSON plus the mapping, not from the page:
- `validation.minAge` on the birth date. Age is computed against an injectable `today`, including Feb 29 birthdays.
- A profile answer that can't be mapped into Harbor's options (the state).

All reasons are shown at once. Sample profile **B (Sam)** gets two: Nevada isn't served, and he's 20 (Harbor's minimum is 21). The check runs when the page loads and again on submit, using whatever the customer edited.

## Assumptions
- The profile's first and last name together are the "full legal name".
- The phone is a US mobile number, sent as 10 digits (Harbor doesn't specify a format).
- Harbor's `minAge` is an eligibility rule (we can't quote), not a typo to fix in the form.
- An option named `"None"` in a multiselect can't be combined with the others.
- Optional fields left blank are omitted from the request rather than sent as `null`/`false`.
- There's no backend: "submitting" shows the request JSON that would be sent.

## With more time
- Real submission with Harbor's error responses mapped back onto fields.
- Phone handling with libphonenumber/E.164, and a ZIP-to-state consistency check.
- Saving newly collected answers (phone, other pets, 5-year claims) back to the profile so the next carrier doesn't ask again.
- An accessibility pass with axe and screen-reader testing, plus nicer UI for the confirm flow.
- Measured e2e coverage (Istanbul-instrumented build). Today the e2e suite covers every route and both sample profiles, but it isn't measured.

## Scaling to 50 carriers
- **A carrier = `form.json` + `mapping.ts`.** The engine, renderer, validation and eligibility are shared. Onboarding is mostly writing resolvers from a shared transform library (state codes ↔ names, date formats, "smallest tier ≥ value", case-insensitive option matching, phone normalization).
- **Schema-validated carrier configs.** A strict schema catches new field types or rules in CI before they reach customers.
- **Contract tests per carrier.** Run the same sample profiles through every carrier and snapshot the exact request plus eligibility reasons. Golden files make a mapping regression obvious.
- **Ask once, quote many.** Build the drafts for all carriers, then ask the union of `missing`/`suggested` questions once, keyed by meaning rather than by carrier key. Answers flow back into an extended canonical profile.
- **Find gaps in the profile.** Reporting which fields are `missing` across carriers shows which questions are worth adding to the standard profile.
- **Later: mappings as data.** Most resolvers fit a small declarative DSL (`from`, `transform`, `status`), so non-engineers could onboard simple carriers without a deploy. Code resolvers would stay as an escape hatch.

## Project layout
```
src/lib/schema.ts               strict zod schema for carrier forms
src/lib/types/                  one file per shared type (customerProfile.ts, resolution.ts, carrier.ts, …)
src/lib/transforms/             carrier-agnostic helpers (dates, states, options, phone)
src/lib/engine/                 buildDraft, eligibility, validate, visibility, serialize, display
src/lib/carriers/harbor/        form.json (verbatim) + mapping.ts
src/components/                 generic form renderer + flow
src/app/page.tsx                the page
src/app/tokens.css              design tokens (primitives + semantic); globals.css only uses var(--…)
tests/unit/                     Vitest (lib + components)
e2e/                            Playwright
```
