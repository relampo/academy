import { useAuth } from "../hooks/useAuth";

const dashboardStats = [
  { label: "Active courses", value: "0" },
  { label: "Pending assignments", value: "0" },
  { label: "Progress", value: "0%" },
];

export function DashboardPage() {
  const { profile } = useAuth();
  const name = profile?.first_name || profile?.display_name || "there";

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Sprint 1</p>
          <h1>Welcome, {name}</h1>
        </div>
        <span className="status-pill">{profile?.role ?? "student"}</span>
      </div>

      <div className="stats-grid">
        {dashboardStats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </article>
        ))}
      </div>

      <section className="content-panel">
        <h2>Next build focus</h2>
        <div className="task-list">
          <div>
            <strong>Authentication</strong>
            <span>Login, signup, profile lookup and role-aware navigation.</span>
          </div>
          <div>
            <strong>Course operations</strong>
            <span>Admin course setup, duplication and enrollment workflow.</span>
          </div>
          <div>
            <strong>Learning content</strong>
            <span>Modules, lessons and resources for the first course.</span>
          </div>
        </div>
      </section>
    </section>
  );
}
