interface Props {
  carrierName: string;
  reasons: readonly string[];
}

export function EligibilityResult({ carrierName, reasons }: Props) {
  return (
    <section
      className="ineligible"
      role="alert"
      aria-labelledby="ineligible-title"
    >
      <h2 id="ineligible-title">
        {carrierName} can&apos;t quote this customer
      </h2>
      <ul>
        {reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      <p className="muted">Nothing was submitted.</p>
    </section>
  );
}
