/** Our platform's standard customer profile. */
export interface CustomerProfile {
  first_name: string;
  last_name: string;
  /** YYYY-MM-DD */
  date_of_birth: string;
  email: string;
  /** Two-letter USPS code, e.g. "CA" */
  state: string;
  /** 5 digits */
  zip: string;
  /** USD */
  personal_property_value: number;
  has_dog: boolean;
  dog_breed: string | null;
  claims_last_3_years: number;
}
