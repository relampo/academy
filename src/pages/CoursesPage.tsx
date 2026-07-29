import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { listPublishedCourseEditions } from "../services/courses";

type PublishedEdition = Awaited<
  ReturnType<typeof listPublishedCourseEditions>
>[number];

function formatStatus(value: string) {
  const labels: Record<string, string> = {
    pending: "pendiente",
    approved: "aprobado",
    rejected: "rechazado",
    withdrawn: "retirado",
    completed: "completado",
    published: "publicado",
    enrollment_closed: "inscripcion cerrada",
  };

  return labels[value] ?? value.replace(/_/g, " ");
}

export function CoursesPage() {
  const { user } = useAuth();
  const [editions, setEditions] = useState<PublishedEdition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEditions = async () => {
      setError(null);
      setIsLoading(true);

      if (!user) {
        setEditions([]);
        setIsLoading(false);
        return;
      }

      try {
        const nextEditions = await listPublishedCourseEditions(user.id);
        setEditions(
          nextEditions.filter((edition) => edition.enrollments.length > 0),
        );
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudieron cargar los cursos.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadEditions();
  }, [user?.id]);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Catalogo</p>
          <h1>Mis cursos</h1>
        </div>
      </div>

      {error ? <p className="form-message error">{error}</p> : null}
      {isLoading ? <p>Cargando cursos...</p> : null}
      {!isLoading && editions.length === 0 ? (
        <section className="content-panel compact">
          <p>Todavia no tienes cursos inscritos o solicitados.</p>
        </section>
      ) : null}

      <div className="course-list">
        {editions.map((edition) => {
          const enrollment = edition.enrollments[0];
          const buttonLabel = (() => {
            if (enrollment) {
              if (enrollment.status === "approved") {
                return "Comenzar";
              }

              return formatStatus(enrollment.status);
            }

            if (edition.status !== "published") {
              return edition.status === "completed" ? "Completado" : "No disponible";
            }

            if (!edition.enrollment_open) {
              return "Inscripcion cerrada";
            }

            return "Inscribirme";
          })();

          return (
            <article className="course-row" key={edition.id}>
              <div>
                <h2>{edition.courses?.title ?? edition.title}</h2>
                <p>
                  {edition.courses?.short_description || "Curso abierto."}
                </p>
                <div className="mini-list">
                  {edition.start_date ? (
                    <span>Inicia {edition.start_date}</span>
                  ) : null}
                  <span>
                    {edition.enrollment_open
                      ? "Inscripcion abierta"
                      : "Inscripcion cerrada"}
                  </span>
                  {enrollment ? <span>{formatStatus(enrollment.status)}</span> : null}
                </div>
              </div>
              <div className="row-actions">
                <span className="status-chip">{formatStatus(edition.status)}</span>
                {enrollment.status === "approved" && edition.courses ? (
                  <a className="action-link" href={`#/courses/${edition.courses.id}`}>
                    Comenzar
                  </a>
                ) : (
                  <button type="button" disabled>
                    {buttonLabel}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
