export function UnauthorizedPage() {
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Access control</p>
          <h1>Not authorized</h1>
        </div>
      </div>

      <section className="content-panel compact">
        <p>
          Your current academy role does not include access to this workspace.
        </p>
        <a className="text-link" href="#/">
          Return to dashboard
        </a>
      </section>
    </section>
  );
}
