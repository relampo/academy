import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { countryOptions, getCountryByCode } from "../lib/countries";
import { updateUserProfile } from "../services/users";

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
  const { profile, user, refreshProfile } = useAuth();
  const [country, setCountry] = useState(profile?.country ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setCountry(profile?.country ?? "");
  }, [profile?.country]);

  const handleCountrySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!user) {
      return;
    }

    setIsSaving(true);

    try {
      await updateUserProfile(user.id, { country: country || null });
      await refreshProfile();
      setMessage("País actualizado.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo actualizar el país.",
      );
    } finally {
      setIsSaving(false);
    }
  };

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
            <dt>País</dt>
            <dd>
              {getCountryByCode(profile?.country)?.name || "Sin configurar"}
            </dd>
          </div>
          <div>
            <dt>Nombre en tabla de posiciones</dt>
            <dd>{formatValue(profile?.leaderboard_visibility ?? "alias")}</dd>
          </div>
        </dl>
      </section>

      <section className="content-panel compact">
        <div className="page-header compact-header">
          <div>
            <p className="eyebrow">Comunidad</p>
            <h2>País</h2>
          </div>
        </div>
        <form className="auth-form profile-country-form" onSubmit={handleCountrySubmit}>
          <label>
            País
            <select
              value={country}
              onChange={(event) => setCountry(event.target.value)}
            >
              <option value="">Selecciona tu país</option>
              {countryOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
          {error ? <p className="form-message error">{error}</p> : null}
          {message ? <p className="form-message success">{message}</p> : null}
          <button type="submit" disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar país"}
          </button>
        </form>
      </section>
    </section>
  );
}
