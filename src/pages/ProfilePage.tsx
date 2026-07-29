import { useAuth } from "../hooks/useAuth";

function formatValue(value: string) {
  const labels: Record<string, string> = {
    admin: "administrador",
    instructor: "instructor",
    student: "estudiante",
    active: "activo",
    suspended: "suspendido",
    pending: "pendiente",
    alias: "alias",
    first_name: "nombre",
    full_name: "nombre completo",
    hidden: "oculto",
  };

  return labels[value] ?? value.replace(/_/g, " ");
}

export function ProfilePage() {
  const { profile, user } = useAuth();

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Cuenta</p>
          <h1>Perfil</h1>
        </div>
      </div>

      <section className="content-panel compact">
        <dl className="profile-list">
          <div>
            <dt>Email</dt>
            <dd>{user?.email}</dd>
          </div>
          <div>
            <dt>Nombre</dt>
            <dd>{profile?.display_name || "Sin configurar"}</dd>
          </div>
          <div>
            <dt>Rol</dt>
            <dd>{formatValue(profile?.role ?? "student")}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>{formatValue(profile?.status ?? "active")}</dd>
          </div>
          <div>
            <dt>Nombre en tabla de posiciones</dt>
            <dd>{formatValue(profile?.leaderboard_visibility ?? "alias")}</dd>
          </div>
        </dl>
      </section>
    </section>
  );
}
