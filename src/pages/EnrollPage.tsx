import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  getCourseEnrollmentOffering,
  requestEnrollment,
  type CourseEnrollmentOffering,
} from "../services/courses";

type EnrollPageProps = {
  courseRef: string;
};

function formatStatus(value: string) {
  const labels: Record<string, string> = {
    pending: "pendiente",
    approved: "aprobado",
    rejected: "rechazado",
    withdrawn: "retirado",
    completed: "completado",
    published: "publicado",
    enrollment_closed: "inscripción cerrada",
  };

  return labels[value] ?? value.replace(/_/g, " ");
}

export function EnrollPage({ courseRef }: EnrollPageProps) {
  const { session, user } = useAuth();
  const [course, setCourse] = useState<CourseEnrollmentOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const offering = course?.course_editions[0] ?? null;
  const enrollment = offering?.enrollments[0] ?? null;
  const canRequestAgain =
    enrollment?.status === "rejected" || enrollment?.status === "withdrawn";
  const canRequest =
    Boolean(user) &&
    offering?.status === "published" &&
    offering.enrollment_open &&
    (!enrollment || canRequestAgain);
  const unavailableReason = (() => {
    if (!offering) {
      return "Este curso todavía no tiene una oferta publicada para inscripción.";
    }

    if (offering.status !== "published") {
      return "La inscripción no está disponible porque la oferta del curso no está publicada.";
    }

    if (!offering.enrollment_open) {
      return "La inscripción está cerrada para este curso.";
    }

    return null;
  })();

  useEffect(() => {
    const notice = window.sessionStorage.getItem("relampo:notice");

    if (notice) {
      window.sessionStorage.removeItem("relampo:notice");
      setMessage(notice);
    }
  }, []);

  const requestEnrollmentForOffering = async () => {
    if (!user || !offering) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await requestEnrollment(offering.id, user.id);
      setMessage("Solicitud enviada. Un instructor debe aprobar tu acceso.");
      const nextCourse = await getCourseEnrollmentOffering(courseRef, user.id);
      setCourse(nextCourse);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo solicitar la inscripción.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const loadCourse = async () => {
      setError(null);
      setIsLoading(true);

      try {
        const nextCourse = await getCourseEnrollmentOffering(
          courseRef,
          user?.id,
        );
        setCourse(nextCourse);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudo cargar el curso.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadCourse();
  }, [courseRef, user?.id]);

  useEffect(() => {
    if (isLoading || isSubmitting || !canRequest) {
      return;
    }

    window.sessionStorage.removeItem("relampo:autoEnroll");
    void requestEnrollmentForOffering();
  }, [canRequest, courseRef, isLoading, isSubmitting, offering?.id, user?.id]);

  const goToLogin = (mode: "sign-in" | "sign-up") => {
    const currentPath = window.location.hash.replace(/^#/, "") || "/";
    window.sessionStorage.setItem("relampo:returnTo", currentPath);
    window.sessionStorage.setItem("relampo:authMode", mode);
    window.sessionStorage.setItem("relampo:autoEnroll", courseRef);
    window.location.hash = "/login";
  };

  const handleRequestEnrollment = async () => {
    await requestEnrollmentForOffering();
  };

  const buttonLabel = (() => {
    if (isSubmitting) {
      return "Solicitando...";
    }

    if (!offering) {
      return "No disponible";
    }

    if (enrollment) {
      if (canRequestAgain) {
        return "Solicitar de nuevo";
      }

      if (enrollment.status === "approved") {
        return "Ir al curso";
      }

      return formatStatus(enrollment.status);
    }

    if (offering.status !== "published") {
      return "No disponible";
    }

    if (!offering.enrollment_open) {
      return "Inscripción cerrada";
    }

    return "Solicitar inscripción";
  })();

  return (
    <section className="page enroll-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Inscripción</p>
          <h1>{course?.title ?? "Curso"}</h1>
          {course?.short_description ? <p>{course.short_description}</p> : null}
        </div>
      </div>

      {error ? <p className="form-message error">{error}</p> : null}
      {message ? <p className="form-message success">{message}</p> : null}
      {isLoading ? <p>Cargando curso...</p> : null}

      {!isLoading && !course ? (
        <section className="content-panel compact">
          <p>No encontramos este curso o ya no está disponible.</p>
        </section>
      ) : null}

      {!isLoading && course ? (
        <section className="content-panel enroll-panel">
          <div>
            <p className="eyebrow">Acceso al curso</p>
            <h2>{course.title}</h2>
            <p>{course.description || course.short_description}</p>
          </div>

          <div className="enroll-status-grid">
            <span>{formatStatus(course.status)}</span>
            <span>
              {offering?.enrollment_open
                ? "Inscripción abierta"
                : "Inscripción cerrada"}
            </span>
            {enrollment ? <span>{formatStatus(enrollment.status)}</span> : null}
          </div>
          {unavailableReason && !enrollment ? (
            <p className="form-message error">{unavailableReason}</p>
          ) : null}

          {!session ? (
            <div className="enroll-actions">
              <button type="button" onClick={() => goToLogin("sign-up")}>
                Crear cuenta
              </button>
              <button type="button" onClick={() => goToLogin("sign-in")}>
                Iniciar sesión
              </button>
            </div>
          ) : enrollment?.status === "approved" ? (
            <div className="enroll-actions">
              <a className="action-link" href={`#/courses/${course.id}`}>
                {buttonLabel}
              </a>
            </div>
          ) : (
            <div className="enroll-actions">
              <button
                disabled={!canRequest || isSubmitting}
                type="button"
                onClick={() => void handleRequestEnrollment()}
              >
                {buttonLabel}
              </button>
            </div>
          )}
        </section>
      ) : null}
    </section>
  );
}
