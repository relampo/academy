export function AdminUsersPage() {
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Usuarios</h1>
        </div>
      </div>

      <section className="content-panel">
        <h2>Gestión de usuarios</h2>
        <div className="task-list">
          <div>
            <strong>Perfiles</strong>
            <span>Revisa usuarios de la academia y estado de cuenta.</span>
          </div>
          <div>
            <strong>Roles</strong>
            <span>Asigna instructores y administra accesos.</span>
          </div>
          <div>
            <strong>Auditoría</strong>
            <span>Da seguimiento a cambios sensibles de cuenta.</span>
          </div>
        </div>
      </section>
    </section>
  );
}
