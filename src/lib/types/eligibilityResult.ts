/** Whether a carrier can quote this customer, and every reason it can't. */
export interface EligibilityResult {
  eligible: boolean;
  reasons: string[];
}
