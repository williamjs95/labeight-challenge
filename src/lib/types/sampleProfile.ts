import type { CustomerProfile } from "./customerProfile";

/** A demo profile selectable on the page. */
export interface SampleProfile {
  id: string;
  label: string;
  profile: CustomerProfile;
}
