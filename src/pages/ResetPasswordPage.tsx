import { useState, type FormEvent } from "react";
import { supabase } from "../services/supabase";

export function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      setMessage("Contraseña actualizada. Ya puedes iniciar sesión.");
      window.sessionStorage.removeItem("relampo:passwordRecovery");
      window.setTimeout(() => {
        window.history.replaceState(null, "", window.location.pathname);
        window.location.hash = "/login";
      }, 1200);
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo actualizar la contraseña.";

      setError(
        errorMessage.includes("Auth session missing")
          ? "El enlace de recuperación no es válido o ya expiró. Solicita uno nuevo desde iniciar sesión."
          : errorMessage,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="reset-password-title">
        <div>
          <p className="eyebrow">Relampo Academy</p>
          <h1 id="reset-password-title">Restablecer contraseña</h1>
          <p>Define una nueva contraseña para volver a entrar a tu cuenta.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Nueva contraseña
            <input
              required
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nueva contraseña"
              type="password"
              value={password}
            />
          </label>
          <label>
            Confirmar contraseña
            <input
              required
              minLength={6}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="Repite la contraseña"
              type="password"
              value={confirmation}
            />
          </label>
          {error ? <p className="form-message error">{error}</p> : null}
          {message ? <p className="form-message success">{message}</p> : null}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar contraseña"}
          </button>
        </form>
      </section>
    </main>
  );
}
