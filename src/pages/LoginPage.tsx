import { useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { sendPasswordReset } from "../services/users";

type AuthMode = "sign-in" | "sign-up";

function getFriendlyAuthError(errorMessage: string) {
  const normalizedMessage = errorMessage.toLowerCase();

  if (normalizedMessage.includes("email rate limit exceeded")) {
    return "Se alcanzó el límite de correos por ahora. Intenta nuevamente más tarde.";
  }

  if (
    normalizedMessage.includes("already registered") ||
    normalizedMessage.includes("already exists") ||
    normalizedMessage.includes("already has an account") ||
    normalizedMessage.includes("ya tiene una cuenta")
  ) {
    return "Este email ya tiene una cuenta. Inicia sesión para inscribirte.";
  }

  return errorMessage;
}

function getInitialMode(): AuthMode {
  const storedMode = window.sessionStorage.getItem("relampo:authMode");

  if (storedMode === "sign-up" || storedMode === "sign-in") {
    window.sessionStorage.removeItem("relampo:authMode");
    return storedMode;
  }

  return "sign-in";
}

function getReturnPath() {
  const returnTo = window.sessionStorage.getItem("relampo:returnTo");
  window.sessionStorage.removeItem("relampo:returnTo");
  return returnTo || "/";
}

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>(getInitialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const isSignUp = mode === "sign-up";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await signUp({ email, password, firstName, lastName });
        const returnTo = getReturnPath();
        const successMessage =
          "Cuenta creada. Revisa tu email si la confirmación está activa.";
        setMessage(successMessage);
        window.sessionStorage.setItem("relampo:notice", successMessage);
        window.location.hash = returnTo;
      } else {
        await signIn(email, password);
        window.location.hash = getReturnPath();
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? getFriendlyAuthError(caughtError.message)
          : "No se pudo autenticar.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    setError(null);
    setMessage(null);

    if (!email.trim()) {
      setError("Escribe tu email para enviarte el enlace de recuperación.");
      return;
    }

    setIsSendingReset(true);

    try {
      await sendPasswordReset(email.trim());
      setMessage("Te enviamos un correo para restablecer tu contraseña.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? getFriendlyAuthError(caughtError.message)
          : "No se pudo enviar el correo de recuperación.",
      );
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="login-title">
        <div>
          <p className="eyebrow">Relampo Academy</p>
          <h1 id="login-title">
            {isSignUp ? "Crear cuenta" : "Iniciar sesión"}
          </h1>
          <p>
            Usa tu cuenta de la academia para acceder a cursos, progreso y
            prácticas.
          </p>
        </div>

        <div className="segmented-control" aria-label="Modo de autenticación">
          <button
            type="button"
            className={mode === "sign-in" ? "selected" : ""}
            onClick={() => setMode("sign-in")}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            className={mode === "sign-up" ? "selected" : ""}
            onClick={() => setMode("sign-up")}
          >
            Registrarme
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignUp ? (
            <div className="form-grid">
              <label>
                Nombre
                <input
                  required
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                />
              </label>
              <label>
                Apellido
                <input
                  required
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                />
              </label>
            </div>
          ) : null}
          <label>
            Email
            <input
              required
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Contraseña
            <input
              required
              minLength={6}
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {!isSignUp ? (
            <div className="auth-helper-row">
              <span>¿No puedes entrar?</span>
              <button
                className="auth-reset-button"
                disabled={isSendingReset}
                onClick={handlePasswordReset}
                type="button"
              >
                {isSendingReset ? "Enviando..." : "Restablecer contraseña"}
              </button>
            </div>
          ) : null}
          {error ? <p className="form-message error">{error}</p> : null}
          {message ? <p className="form-message success">{message}</p> : null}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Procesando..." : "Continuar"}
          </button>
        </form>
      </section>
    </main>
  );
}
