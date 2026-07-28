import { useAuth } from "../hooks/useAuth";

export function ProfilePage() {
  const { profile, user } = useAuth();

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Profile</h1>
        </div>
      </div>

      <section className="content-panel compact">
        <dl className="profile-list">
          <div>
            <dt>Email</dt>
            <dd>{user?.email}</dd>
          </div>
          <div>
            <dt>Name</dt>
            <dd>{profile?.display_name || "Not set"}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{profile?.role ?? "student"}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{profile?.status ?? "active"}</dd>
          </div>
          <div>
            <dt>Leaderboard display</dt>
            <dd>{profile?.leaderboard_visibility ?? "alias"}</dd>
          </div>
        </dl>
      </section>
    </section>
  );
}
