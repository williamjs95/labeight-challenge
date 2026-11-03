import { parseCarrierForm } from "../schema";
import type { Carrier } from "../types/carrier";
import harborForm from "./harbor/form.json";
import { harborMapping } from "./harbor/mapping";

export const harbor: Carrier = {
  id: "harbor",
  displayName: "Harbor Assurance",
  form: parseCarrierForm(harborForm),
  mapping: harborMapping,
};

export const carriers: Readonly<Record<string, Carrier>> = { harbor };
