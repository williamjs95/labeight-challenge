interface Props {
  carrierName: string;
  reasons: readonly string[];
}

/** Shown instead of submitting when the carrier can't quote. */
export function EligibilityResult({ carrierName, reasons }: Readonly<Props>) {
  return (
    <section
      className="card card-danger"
      role="alert"
      aria-labelledby="ineligible-title"
    >
      <h2 id="ineligible-title">
        {carrierName} can&apos;t quote this customer
      </h2>
      <p>
        {reasons.length === 1 ? "One rule" : `${reasons.length} rules`} in{" "}
        {carrierName}&apos;s form {reasons.length === 1 ? "isn't" : "aren't"}{" "}
        met:
      </p>
      <ul className="reasons">
        {reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <p className="hint">
        Nothing was sent to {carrierName}. The Eligibility tab shows every rule
        we checked.
      </p>
    </section>
  );
}
