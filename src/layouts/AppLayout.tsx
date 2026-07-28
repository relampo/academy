import type { ReactNode } from "react";
import { BrandMark } from "../components/BrandMark";
import { useAuth } from "../hooks/useAuth";
import { appRoutes } from "../routes";

type AppLayoutProps = {
  children: ReactNode;
  currentPath: string;
};

export function AppLayout({ children, currentPath }: AppLayoutProps) {
  const { profile, signOut, user } = useAuth();
  const role = profile?.role ?? "student";

  const navigationItems = appRoutes.filter((route) =>
    route.allowedRoles.includes(role),
  );

  const displayName =
    profile?.display_name || user?.email || "Relampo Academy user";

  const handleSignOut = () => {
    void signOut().then(() => {
      window.location.hash = "/login";
    });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <BrandMark />
          <div>
            <strong>Relampo</strong>
            <span>Academy</span>
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
            <span>{profile?.role ?? "student"}</span>
          </div>
          <button type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-panel">
        {children}
      </main>
    </div>
  );
}
