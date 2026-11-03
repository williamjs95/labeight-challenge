/** Page intro: what this tool does, in one breath. */
export function AppHeader() {
  return (
    <header className="app-header">
      <p className="eyebrow">Carrier integration · Renters</p>
      <h1>Harbor Assurance quote</h1>
      <p className="lede">
        We fill Harbor&apos;s quote form from the customer&apos;s profile and
        only ask for what the profile can&apos;t answer. The{" "}
        <strong>Behind the scenes</strong> panel shows how each Harbor field was
        mapped and exactly what Harbor will receive.
      </p>
    </header>
  );
}
