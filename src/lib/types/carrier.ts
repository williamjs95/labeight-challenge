import type { CarrierForm } from "./carrierForm";
import type { CarrierMapping } from "./carrierMapping";

/** A carrier: its form definition plus how our profile maps onto it. */
export interface Carrier {
  id: string;
  displayName: string;
  form: CarrierForm;
  mapping: CarrierMapping;
}
