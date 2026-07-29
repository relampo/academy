import { useEffect, useState, type FormEvent } from "react";
import {
  createCourseWithDefaultOffering,
  duplicateCourse,
  getUniqueCourseSlug,
  listCoursesWithEditions,
  type CourseWithEditions,
} from "../services/courses";
import type { Enums } from "../types/database.types";

type CourseStatus = Enums<"course_status">;

function formatStatus(value: string) {
  const labels: Record<string, string> = {
    draft: "borrador",
    published: "publicado",
    enrollment_closed: "inscripción cerrada",
    completed: "completado",
  };

  return labels[value] ?? value.replace(/_/g, " ");
}

export function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseWithEditions[]>([]);
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [courseStatus, setCourseStatus] = useState<CourseStatus>("draft");
  const [enrollmentOpen, setEnrollmentOpen] = useState(false);
  const [duplicatingCourseId, setDuplicatingCourseId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = async () => {
    setIsLoading(true);
    setError(null);

    try {
      setCourses(await listCoursesWithEditions());
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "No se pudieron cargar los cursos.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCourses();
  }, []);

  const handleCreateCourse = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const slug = await getUniqueCourseSlug(title);

      await createCourseWithDefaultOffering(
        {
          title,
          slug,
          short_description: shortDescription || null,
          description: shortDescription || null,
          status: courseStatus,
        },
        enrollmentOpen,
      );

      setTitle("");
      setShortDescription("");
      setCourseStatus("draft");
      setEnrollmentOpen(false);
      setMessage("Curso creado.");
      await loadCourses();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo crear el curso.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicateCourse = async (courseId: string) => {
    setError(null);
    setMessage(null);
    setDuplicatingCourseId(courseId);

    try {
      const copiedCourse = await duplicateCourse(courseId);
      setMessage(`Duplicado "${copiedCourse.title}".`);
      await loadCourses();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo duplicar el curso.",
      );
    } finally {
      setDuplicatingCourseId(null);
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Cursos</h1>
        </div>
      </div>

      {error ? <p className="form-message error">{error}</p> : null}
      {message ? <p className="form-message success">{message}</p> : null}

      <div className="course-admin-grid">
        <section className="content-panel compact-panel course-create-panel">
          <h2>Crear curso</h2>
          <form
            className="stacked-form compact-course-form"
            onSubmit={handleCreateCourse}
          >
            <label>
              Título
              <input
                required
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label>
              Descripción corta
              <textarea
                value={shortDescription}
                onChange={(event) => setShortDescription(event.target.value)}
              />
            </label>
            <label>
              Estado
              <select
                value={courseStatus}
                onChange={(event) =>
                  setCourseStatus(event.target.value as CourseStatus)
                }
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
                <option value="enrollment_closed">Inscripción cerrada</option>
              </select>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={enrollmentOpen}
                onChange={(event) => setEnrollmentOpen(event.target.checked)}
              />
              Inscripción abierta
            </label>
            <button type="submit" disabled={isSubmitting}>
              Crear curso
            </button>
          </form>
        </section>

        <section className="content-panel course-inventory-panel">
          <h2>Inventario de cursos</h2>
          {isLoading ? <p>Cargando cursos...</p> : null}
          {!isLoading && courses.length === 0 ? <p>Todavía no hay cursos creados.</p> : null}
          <div className="course-list">
            {courses.map((course) => {
              const offering = course.course_editions[0];

              return (
                <article className="course-row" key={course.id}>
                  <div>
                    <h2>{course.title}</h2>
                    <div className="mini-list">
                      <span>{formatStatus(course.status)}</span>
                      <span>
                        {offering?.enrollment_open
                          ? "Inscripción abierta"
                          : "Inscripción cerrada"}
                      </span>
                      {offering?.capacity ? (
                        <span>{offering.capacity} cupos</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="row-actions">
                    <button
                      className="secondary-action"
                      type="button"
                      disabled={duplicatingCourseId === course.id}
                      onClick={() => void handleDuplicateCourse(course.id)}
                    >
                      {duplicatingCourseId === course.id
                        ? "Duplicando..."
                        : "Duplicar"}
                    </button>
                    <a className="action-link" href={`#/admin/courses/${course.id}`}>
                      Abrir
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}
