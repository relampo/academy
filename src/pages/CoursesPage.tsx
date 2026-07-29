import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { listPublishedCourseEditions } from "../services/courses";
import { listLessonProgress } from "../services/content";

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
    enrollment_closed: "inscripción cerrada",
  };

  return labels[value] ?? value.replace(/_/g, " ");
}

export function CoursesPage() {
  const { user } = useAuth();
  const [editions, setEditions] = useState<PublishedEdition[]>([]);
  const [startedCourseIds, setStartedCourseIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getStartedCoursesKey = (userId: string) =>
    `relampo:started-courses:${userId}`;

  const readStartedCourseIds = (userId: string) => {
    try {
      const savedValue = window.localStorage.getItem(getStartedCoursesKey(userId));
      const parsedValue = savedValue ? (JSON.parse(savedValue) as string[]) : [];

      return new Set(parsedValue);
    } catch {
      return new Set<string>();
    }
  };

  const writeStartedCourseIds = (userId: string, courseIds: Set<string>) => {
    window.localStorage.setItem(
      getStartedCoursesKey(userId),
      JSON.stringify(Array.from(courseIds)),
    );
  };

  const markCourseStarted = (courseId: string) => {
    if (!user) {
      return;
    }

    setStartedCourseIds((current) => {
      const nextCourseIds = new Set(current);
      nextCourseIds.add(courseId);
      writeStartedCourseIds(user.id, nextCourseIds);

      return nextCourseIds;
    });
  };

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
        const enrolledEditions = nextEditions.filter(
          (edition) => edition.enrollments.length > 0,
        );
        const startedIds = readStartedCourseIds(user.id);
        const approvedEditions = enrolledEditions.filter(
          (edition) => edition.enrollments[0]?.status === "approved",
        );
        const progressEntries = await Promise.all(
          approvedEditions.map(async (edition) => ({
            courseId: edition.course_id,
            progress: await listLessonProgress(edition.course_id, user.id),
          })),
        );

        progressEntries.forEach((entry) => {
          if (entry.progress.length > 0) {
            startedIds.add(entry.courseId);
          }
        });

        writeStartedCourseIds(user.id, startedIds);
        setStartedCourseIds(startedIds);
        setEditions(enrolledEditions);
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
          <p className="eyebrow">Catálogo</p>
          <h1>Mis cursos</h1>
        </div>
      </div>

      {error ? <p className="form-message error">{error}</p> : null}
      {isLoading ? <p>Cargando cursos...</p> : null}
      {!isLoading && editions.length === 0 ? (
        <section className="content-panel compact">
          <p>Todavía no tienes cursos inscritos o solicitados.</p>
        </section>
      ) : null}

      <div className="course-list">
        {editions.map((edition) => {
          const enrollment = edition.enrollments[0];
          const hasStartedCourse = startedCourseIds.has(edition.course_id);
          const buttonLabel = (() => {
            if (enrollment) {
              if (enrollment.status === "approved") {
                return hasStartedCourse ? "Continuar" : "Comenzar";
              }

              return formatStatus(enrollment.status);
            }

            if (edition.status !== "published") {
              return edition.status === "completed" ? "Completado" : "No disponible";
            }

            if (!edition.enrollment_open) {
              return "Inscripción cerrada";
            }

            return "Inscribirme";
          })();

          return (
            <article className="course-row" key={edition.id}>
              <div>
                <h2>{edition.courses?.title ?? edition.title}</h2>
                <div className="mini-list">
                  {edition.start_date ? (
                    <span>Inicia {edition.start_date}</span>
                  ) : null}
                  <span>
                    {edition.enrollment_open
                      ? "Inscripción abierta"
                      : "Inscripción cerrada"}
                  </span>
                  {enrollment ? <span>{formatStatus(enrollment.status)}</span> : null}
                </div>
              </div>
              <div className="row-actions">
                <span className="status-chip">{formatStatus(edition.status)}</span>
                {enrollment.status === "approved" && edition.courses ? (
                  <a
                    className="action-link"
                    href={`#/courses/${edition.courses.id}`}
                    onClick={() => markCourseStarted(edition.course_id)}
                  >
                    {buttonLabel}
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
