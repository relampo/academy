export function AdminSettingsPage() {
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Settings</h1>
        </div>
      </div>

      <section className="content-panel compact">
        <dl className="profile-list">
          <div>
            <dt>Auth provider</dt>
            <dd>Supabase email/password</dd>
          </div>
          <div>
            <dt>Hosting target</dt>
            <dd>GitHub Pages</dd>
          </div>
          <div>
            <dt>Validation engine</dt>
            <dd>Planned for final sprint</dd>
          </div>
        </dl>
      </section>
    </section>
  );
}
