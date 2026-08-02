import type { ReactNode } from "react";
import { BrandMark } from "../components/BrandMark";
import { useAuth } from "../hooks/useAuth";
import { appRoutes } from "../routes";

type AppLayoutProps = {
  children: ReactNode;
  currentPath: string;
};

function formatRole(value: string) {
  const labels: Record<string, string> = {
    admin: "administrador",
    instructor: "instructor",
    student: "estudiante",
  };

  return labels[value] ?? value;
}

export function AppLayout({ children, currentPath }: AppLayoutProps) {
  const { profile, signOut, user } = useAuth();
  const role = profile?.role ?? "student";

  const navigationItems = appRoutes.filter((route) =>
    route.allowedRoles.includes(role),
  );

  const displayName =
    profile?.display_name || user?.email || "Usuario de Performance LATAM";

  const handleSignOut = () => {
    void signOut().then(() => {
      window.location.hash = "/login";
    });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegación principal">
        <div className="brand">
          <BrandMark />
          <div>
            <strong>Performance</strong>
            <span>LATAM</span>
          </div>
        </div>

        <nav className="nav-list">
          {navigationItems.map((item) => (
            <a
              key={item.path}
              href={`#${item.path}`}
              className={
                currentPath === item.path ? "nav-link nav-link-active" : "nav-link"
              }
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div>
            <strong>{displayName}</strong>
            <span>{formatRole(profile?.role ?? "student")}</span>
          </div>
          <button type="button" onClick={handleSignOut}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main-panel">
        {children}
      </main>
    </div>
  );
}
