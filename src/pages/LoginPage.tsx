import { useState, type FormEvent } from "react";
import { MessageCircle, MessagesSquare } from "lucide-react";
import { CommunityMap, type CountryCount } from "../components/CommunityMap";
import { SponsorSection } from "../components/SponsorSection";
import { useAuth } from "../hooks/useAuth";
import { countryOptions } from "../lib/countries";
import { sendPasswordReset } from "../services/users";

type AuthMode = "sign-in" | "sign-up";

const communityCountries: CountryCount[] = [
  { code: "PE", name: "Perú", count: 41, flag: "🇵🇪" },
  { code: "CO", name: "Colombia", count: 26, flag: "🇨🇴" },
  { code: "AR", name: "Argentina", count: 24, flag: "🇦🇷" },
  { code: "MX", name: "México", count: 16, flag: "🇲🇽" },
  { code: "BO", name: "Bolivia", count: 14, flag: "🇧🇴" },
  { code: "UY", name: "Uruguay", count: 11, flag: "🇺🇾" },
  { code: "CL", name: "Chile", count: 9, flag: "🇨🇱" },
  { code: "PA", name: "Panamá", count: 8, flag: "🇵🇦" },
  { code: "CR", name: "Costa Rica", count: 4, flag: "🇨🇷" },
  { code: "ES", name: "España", count: 3, flag: "🇪🇸" },
  { code: "CU", name: "Cuba", count: 2, flag: "🇨🇺" },
  { code: "EC", name: "Ecuador", count: 2, flag: "🇪🇨" },
  { code: "PY", name: "Paraguay", count: 2, flag: "🇵🇾" },
  { code: "US", name: "Estados Unidos", count: 2, flag: "🇺🇸" },
  { code: "BR", name: "Brasil", count: 1, flag: "🇧🇷" },
  { code: "CA", name: "Canadá", count: 1, flag: "🇨🇦" },
  { code: "NI", name: "Nicaragua", count: 1, flag: "🇳🇮" },
  { code: "VE", name: "Venezuela", count: 1, flag: "🇻🇪" },
];

function isExistingAccountError(errorMessage: string) {
  const normalizedMessage = errorMessage.toLowerCase();

  return (
    normalizedMessage.includes("already registered") ||
    normalizedMessage.includes("already exists") ||
    normalizedMessage.includes("already has an account") ||
    normalizedMessage.includes("ya tiene una cuenta")
  );
}

function getFriendlyAuthError(errorMessage: string) {
  const normalizedMessage = errorMessage.toLowerCase();

  if (normalizedMessage.includes("email rate limit exceeded")) {
    return "Se alcanzó el límite de correos por ahora. Intenta nuevamente más tarde.";
  }

  if (isExistingAccountError(errorMessage)) {
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
  const returnTo =
    window.sessionStorage.getItem("relampo:returnTo") ||
    window.localStorage.getItem("relampo:returnTo");
  window.sessionStorage.removeItem("relampo:returnTo");
  window.localStorage.removeItem("relampo:returnTo");
  return returnTo || "/";
}

function peekReturnPath() {
  return (
    window.sessionStorage.getItem("relampo:returnTo") ||
    window.localStorage.getItem("relampo:returnTo") ||
    "/"
  );
}

function navigateToReturnPath(returnTo: string) {
  if (returnTo.startsWith("/enroll/")) {
    window.location.assign(
      `${window.location.origin}${window.location.pathname}${window.location.search}#${returnTo}`,
    );
    return;
  }

  window.location.hash = returnTo;
}

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>(getInitialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const isSignUp = mode === "sign-up";

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const returnTo = peekReturnPath();

      if (isSignUp) {
        const result = await signUp({
          email,
          password,
          firstName,
          lastName,
          country,
        });
        const successMessage =
          result.hasSession
            ? "Cuenta creada. Solicitud de inscripción en proceso."
            : "Cuenta creada. Revisa tu email, inicia sesión y volverás al curso.";
        setMessage(successMessage);
        window.sessionStorage.setItem("relampo:notice", successMessage);
        navigateToReturnPath(returnTo);
      } else {
        await signIn(email, password);
        getReturnPath();
        navigateToReturnPath(returnTo);
      }
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof Error
          ? getFriendlyAuthError(caughtError.message)
          : "No se pudo autenticar.";

      if (
        isSignUp &&
        caughtError instanceof Error &&
        isExistingAccountError(caughtError.message)
      ) {
        setMode("sign-in");
        setPassword("");
        setMessage("Ya tienes cuenta. Inicia sesión y te llevamos al curso.");
        setError(null);
      } else {
        setError(errorMessage);
      }
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
      <section className="auth-landing-shell" aria-labelledby="login-title">
        <div className="auth-landing-copy">
          <p className="eyebrow">Performance LATAM</p>
          <h1>Únete a nuestra comunidad</h1>
          <p>
            Aprende performance testing con una red de estudiantes, testers,
            automatizadores e instructores que ya están creciendo juntos en
            Latinoamérica y más allá.
          </p>
        </div>

        <section className="auth-panel" aria-labelledby="login-title">
          <div>
            <p className="eyebrow">Acceso a la academia</p>
            <h2 id="login-title">
              {isSignUp ? "Crear cuenta" : "Iniciar sesión"}
            </h2>
            <p>
              Entra para acceder a cursos, progreso, prácticas y actividades de
              la comunidad.
            </p>
          </div>

          <div className="segmented-control" aria-label="Modo de autenticación">
            <button
              type="button"
              className={mode === "sign-in" ? "selected" : ""}
              onClick={() => handleModeChange("sign-in")}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              className={mode === "sign-up" ? "selected" : ""}
              onClick={() => handleModeChange("sign-up")}
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
            {isSignUp ? (
              <label>
                País
                <select
                  required
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
      </section>

      <section className="landing-section communication-section" aria-labelledby="communication-title">
        <div className="section-heading">
          <p className="eyebrow">Canales de comunicación</p>
          <h2 id="communication-title">Conversa, pregunta y comparte avances</h2>
          <p>
            Mantente cerca de la comunidad entre clases, coordina prácticas y
            resuelve dudas con otros estudiantes.
          </p>
        </div>

        <div className="communication-grid">
          <a
            className="communication-card"
            href="https://discord.com/invite/gPudDvuUBd"
            rel="noreferrer"
            target="_blank"
          >
            <span><MessagesSquare aria-hidden="true" /> Discord</span>
            <strong>Comunidad y recursos</strong>
            <p>Canales por temas, soporte entre pares, anuncios y materiales compartidos.</p>
          </a>
          <a
            className="communication-card"
            href="https://chat.whatsapp.com/L7WCN1t9iBKBerjwyMYmBY"
            rel="noreferrer"
            target="_blank"
          >
            <span><MessageCircle aria-hidden="true" /> WhatsApp</span>
            <strong>Comunicación rápida</strong>
            <p>Recordatorios, coordinación de encuentros y mensajes importantes del grupo.</p>
          </a>
        </div>
      </section>

      <section className="landing-section meetings-section" aria-labelledby="meetings-title">
        <div className="section-heading">
          <p className="eyebrow">Próximos encuentros</p>
        </div>
        <article className="meeting-card">
          <div>
            <span>Agosto 5</span>
            <strong>7:30pm EST</strong>
          </div>
          <div>
            <h3>Fundamentos de Pruebas de performance</h3>
            <p>
              Primera clase del curso actual en la plataforma. Veremos las bases
              del performance testing y cómo avanzar dentro de la comunidad.
            </p>
          </div>
        </article>
      </section>

      <section className="landing-section map-section" aria-labelledby="map-title">
        <div className="section-heading">
          <p className="eyebrow">Mapa de la comunidad</p>
          <h2 id="map-title">Una comunidad que crece en toda la región</h2>
        </div>
        <div className="map-section-frame">
          <CommunityMap
            className="auth-community-map"
            countries={communityCountries}
            eyebrow="Mapa de la comunidad"
            showCredit={false}
            showExpand
            showList={false}
            showTotal={false}
            title="Comunidad en crecimiento"
            variant="hero"
          />
        </div>
      </section>

      <section className="landing-section sponsors-landing-section" aria-label="Sponsors">
        <SponsorSection />
      </section>
    </main>
  );
}
