export function AdminSettingsPage() {
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Configuración</h1>
        </div>
      </div>

      <section className="content-panel compact">
        <dl className="profile-list">
          <div>
            <dt>Proveedor de acceso</dt>
            <dd>Supabase email/password</dd>
          </div>
          <div>
            <dt>Destino de hosting</dt>
            <dd>GitHub Pages</dd>
          </div>
          <div>
            <dt>Motor de validación</dt>
            <dd>Planificado para la fase final</dd>
          </div>
        </dl>
      </section>
    </section>
  );
}
