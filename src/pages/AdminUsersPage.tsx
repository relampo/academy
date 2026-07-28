export function AdminUsersPage() {
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Users</h1>
        </div>
      </div>

      <section className="content-panel">
        <h2>User management</h2>
        <div className="task-list">
          <div>
            <strong>Profiles</strong>
            <span>Review academy users and account status.</span>
          </div>
          <div>
            <strong>Roles</strong>
            <span>Promote instructors and manage administrative access.</span>
          </div>
          <div>
            <strong>Audit</strong>
            <span>Track sensitive account changes.</span>
          </div>
        </div>
      </section>
    </section>
  );
}
