import { useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";

type AuthMode = "sign-in" | "sign-up";

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignUp = mode === "sign-up";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        await signUp({ email, password, firstName, lastName });
        setMessage("Account created. Check your email if confirmation is enabled.");
      } else {
        await signIn(email, password);
        window.location.hash = "/";
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Authentication failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="login-title">
        <div>
          <p className="eyebrow">Relampo Academy</p>
          <h1 id="login-title">{isSignUp ? "Create account" : "Sign in"}</h1>
          <p>
            Use your academy account to access courses, progress and practical
            assignments.
          </p>
        </div>

        <div className="segmented-control" aria-label="Authentication mode">
          <button
            type="button"
            className={mode === "sign-in" ? "selected" : ""}
            onClick={() => setMode("sign-in")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === "sign-up" ? "selected" : ""}
            onClick={() => setMode("sign-up")}
          >
            Sign up
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignUp ? (
            <div className="form-grid">
              <label>
                First name
                <input
                  required
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                />
              </label>
              <label>
                Last name
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
            Password
            <input
              required
              minLength={6}
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error ? <p className="form-message error">{error}</p> : null}
          {message ? <p className="form-message success">{message}</p> : null}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Working..." : "Continue"}
          </button>
        </form>
      </section>
    </main>
  );
}
