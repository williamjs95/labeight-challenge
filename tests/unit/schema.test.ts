import harborForm from "@/lib/carriers/harbor/form.json";
import { parseCarrierForm } from "@/lib/schema";

const field = (extra: object) => ({
  key: "a",
  label: "A",
  type: "text",
  required: true,
  ...extra,
});
const form = (fields: object[]) => ({
  carrier: "x",
  product: "renters",
  fields,
});

describe("parseCarrierForm", () => {
  it("accepts Harbor's definition as-is", () => {
    expect(parseCarrierForm(harborForm).fields).toHaveLength(11);
  });

  it("rejects unsupported rules instead of ignoring them", () => {
    const bad = form([field({ type: "date", validation: { maxAge: 99 } })]);
    expect(() => parseCarrierForm(bad)).toThrow();
  });

  it("rejects unknown field types", () => {
    expect(() => parseCarrierForm(form([field({ type: "slider" })]))).toThrow();
  });

  it("rejects duplicate keys, bad regexes and dangling showIf", () => {
    expect(() => parseCarrierForm(form([field({}), field({})]))).toThrow(
      /Duplicate field key/,
    );
    expect(() => parseCarrierForm(form([field({ pattern: "(" })]))).toThrow(
      /Invalid regular expression/,
    );
    expect(() =>
      parseCarrierForm(
        form([field({ showIf: { field: "ghost", includes: "x" } })]),
      ),
    ).toThrow(/unknown field .*ghost/);
  });
});
