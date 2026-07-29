import { useEffect, useMemo, useState } from "react";
import { Check, ExternalLink, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
  listApprovedCourseStudents,
  getCourseWithEditions,
  type CourseStudentEnrollment,
  type CourseWithEditions,
} from "../services/courses";
import {
  listAssignmentSubmissionsByAssignmentIds,
  listCourseContent,
  listLessonAssignments,
  reviewAssignmentSubmission,
  type AssignmentSubmission,
  type LessonAssignment,
  type ModuleWithLessons,
} from "../services/content";
import {
  listTeachingCourses,
  type TeachingCourseAssignment,
} from "../services/instructors";

type AssignmentReviewPageProps = {
  courseId?: string;
};

type AssignmentColumn = {
  assignment: LessonAssignment;
  lessonIndex: number;
  lessonTitle: string;
  moduleTitle: string;
};

const pageSize = 50;

function getStudentName(enrollment: CourseStudentEnrollment) {
  const profile = enrollment.profiles;

  if (!profile) {
    return "Estudiante desconocido";
  }

  return (
    profile.display_name ||
    `${profile.first_name} ${profile.last_name}`.trim() ||
    "Estudiante sin nombre"
  );
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    draft: "borrador",
    published: "publicado",
    enrollment_closed: "inscripcion cerrada",
    completed: "completado",
    submitted: "enviada",
  };

  if (status === "reviewed") {
    return "Aprobada";
  }

  if (status === "needs_revision") {
    return "Fallada";
  }

  return labels[status] ?? status.replace(/_/g, " ");
}

export function AssignmentReviewPage({ courseId }: AssignmentReviewPageProps) {
  const { user } = useAuth();
  const [teachingCourses, setTeachingCourses] = useState<
    TeachingCourseAssignment[]
  >([]);
  const [course, setCourse] = useState<CourseWithEditions | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [students, setStudents] = useState<CourseStudentEnrollment[]>([]);
  const [assignments, setAssignments] = useState<LessonAssignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [pointsBySubmission, setPointsBySubmission] = useState<
    Record<string, string>
  >({});
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [reviewingSubmissionId, setReviewingSubmissionId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadCourseList = async () => {
      if (!user || courseId) {
        return;
      }

      setError(null);
      setIsLoading(true);

      try {
        setTeachingCourses(await listTeachingCourses(user.id));
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

    void loadCourseList();
  }, [courseId, user]);

  useEffect(() => {
    const loadCourseAssignments = async () => {
      if (!courseId) {
        return;
      }

      setError(null);
      setIsLoading(true);

      try {
        const [nextCourse, nextModules, nextStudents, nextAssignments] =
          await Promise.all([
            getCourseWithEditions(courseId),
            listCourseContent(courseId),
            listApprovedCourseStudents(courseId),
            listLessonAssignments(courseId),
          ]);
        const nextSubmissions = await listAssignmentSubmissionsByAssignmentIds(
          nextAssignments.map((assignment) => assignment.id),
        );

        setCourse(nextCourse);
        setModules(nextModules);
        setStudents(nextStudents);
        setAssignments(nextAssignments);
        setSubmissions(nextSubmissions);
        setPointsBySubmission(
          Object.fromEntries(
            nextSubmissions.map((submission) => [
              submission.id,
              submission.points_awarded?.toString() ?? "",
            ]),
          ),
        );
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudo cargar la tabla de tareas.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadCourseAssignments();
  }, [courseId]);

  const columns = useMemo(() => {
    const assignmentByLesson = new Map(
      assignments.map((assignment) => [assignment.lesson_id, assignment]),
    );
    const nextColumns: AssignmentColumn[] = [];

    modules.forEach((module) => {
      module.lessons.forEach((lesson, lessonIndex) => {
        const assignment = assignmentByLesson.get(lesson.id);

        if (assignment) {
          nextColumns.push({
            assignment,
            lessonIndex: lessonIndex + 1,
            lessonTitle: lesson.title,
            moduleTitle: module.title,
          });
        }
      });
    });

    return nextColumns;
  }, [assignments, modules]);

  const submissionByStudentAndAssignment = useMemo(() => {
    return new Map(
      submissions.map((submission) => [
        `${submission.student_id}:${submission.assignment_id}`,
        submission,
      ]),
    );
  }, [submissions]);

  const filteredStudents = students.filter((student) =>
    getStudentName(student).toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const paginatedStudents = filteredStudents.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  );

  const handleReview = async (
    submission: AssignmentSubmission,
    status: "reviewed" | "needs_revision",
  ) => {
    if (!user) {
      return;
    }

    const pointsValue = pointsBySubmission[submission.id]?.trim() ?? "";
    const pointsAwarded = Number(pointsValue);

    if (!pointsValue || !Number.isFinite(pointsAwarded) || pointsAwarded < 0) {
      setError("Debes indicar puntos antes de marcar una tarea.");
      setMessage(null);
      return;
    }

    setError(null);
    setMessage(null);
    setReviewingSubmissionId(submission.id);

    try {
      const reviewedSubmission = await reviewAssignmentSubmission({
        submissionId: submission.id,
        status,
        pointsAwarded,
        reviewedBy: user.id,
      });

      setSubmissions((current) =>
        current.map((currentSubmission) =>
          currentSubmission.id === submission.id
            ? reviewedSubmission
            : currentSubmission,
        ),
      );
      setMessage(status === "reviewed" ? "Marcada como aprobada." : "Marcada como fallada.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo actualizar la tarea.",
      );
    } finally {
      setReviewingSubmissionId(null);
    }
  };

  if (!courseId) {
    return (
      <section className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Instructor</p>
            <h1>Tareas</h1>
          </div>
        </div>

        {error ? <p className="form-message error">{error}</p> : null}
        {isLoading ? <p>Cargando cursos...</p> : null}

        {!isLoading && teachingCourses.length === 0 ? (
          <section className="content-panel compact">
            <p>Todavia no tienes cursos asignados.</p>
          </section>
        ) : null}

        <div className="course-list">
          {teachingCourses.map((assignment) => {
            const assignedCourse = assignment.courses;

            if (!assignedCourse) {
              return null;
            }

            return (
              <article className="course-row" key={assignment.course_id}>
                <div>
                  <h2>{assignedCourse.title}</h2>
                  <p>{assignedCourse.short_description || "Sin descripcion todavia."}</p>
                  <div className="mini-list">
                    <span>{formatStatus(assignedCourse.status)}</span>
                  </div>
                </div>
                <div className="row-actions">
                  <a
                    className="action-link"
                    href={`#/assignments/${assignedCourse.id}`}
                  >
                    Tareas
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Tareas</p>
          <h1>{course?.title ?? "Tareas del curso"}</h1>
        </div>
        <a className="text-link" href="#/assignments">
          Volver a cursos
        </a>
      </div>

      {error ? <p className="form-message error">{error}</p> : null}
      {message ? <p className="form-message success">{message}</p> : null}
      {isLoading ? <p>Cargando tabla de tareas...</p> : null}

      {!isLoading ? (
        <section className="content-panel assignment-gradebook-panel">
          <div className="page-header compact-header">
            <div>
              <p className="eyebrow">Revision</p>
              <h2>Tabla de tareas por estudiante</h2>
            </div>
            <label className="assignment-search">
              <span>Buscar estudiante</span>
              <input
                placeholder="Nombre del estudiante"
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </label>
          </div>

          {students.length === 0 ? <p>Todavia no hay estudiantes aprobados.</p> : null}
          {students.length > 0 && columns.length === 0 ? (
            <p>Todavia no hay tareas configuradas para este curso.</p>
          ) : null}
          {students.length > 0 && columns.length > 0 ? (
            <>
              <div className="assignment-table-scroll">
                <table className="assignment-gradebook-table">
                  <thead>
                    <tr>
                      <th>Estudiante</th>
                      {columns.map((column) => (
                        <th key={column.assignment.id}>
                          <span>{column.moduleTitle}</span>
                          <strong>Clase {column.lessonIndex}</strong>
                          <small>{column.lessonTitle}</small>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStudents.map((student) => (
                      <tr key={student.id}>
                        <th>{getStudentName(student)}</th>
                        {columns.map((column) => {
                          const submission = submissionByStudentAndAssignment.get(
                            `${student.student_id}:${column.assignment.id}`,
                          );
                          const pointsValue = submission
                            ? (pointsBySubmission[submission.id] ?? "")
                            : "";
                          const hasReviewPoints =
                            pointsValue.trim() !== "" &&
                            Number.isFinite(Number(pointsValue)) &&
                            Number(pointsValue) >= 0;

                          return (
                            <td key={column.assignment.id}>
                              {submission ? (
                                <div
                                  className={`assignment-cell is-${submission.status}${
                                    hasReviewPoints ? "" : " is-missing-points"
                                  }`}
                                >
                                  <div className="assignment-cell-top">
                                    <span>{formatStatus(submission.status)}</span>
                                    {submission.submission_url ? (
                                      <a
                                        href={submission.submission_url}
                                        rel="noreferrer"
                                        target="_blank"
                                      >
                                        <ExternalLink
                                          aria-hidden="true"
                                          size={13}
                                          strokeWidth={2.4}
                                        />
                                        URL
                                      </a>
                                    ) : null}
                                  </div>
                                  <label>
                                    Puntos
                                    <input
                                      min="0"
                                      required
                                      type="number"
                                      value={pointsValue}
                                      onChange={(event) =>
                                        setPointsBySubmission((current) => ({
                                          ...current,
                                          [submission.id]: event.target.value,
                                        }))
                                      }
                                    />
                                  </label>
                                  <div className="assignment-cell-actions">
                                    <button
                                      disabled={
                                        reviewingSubmissionId === submission.id ||
                                        !hasReviewPoints
                                      }
                                      type="button"
                                      onClick={() =>
                                        void handleReview(submission, "reviewed")
                                      }
                                    >
                                      <Check
                                        aria-hidden="true"
                                        size={13}
                                        strokeWidth={2.5}
                                      />
                                      Aprobada
                                    </button>
                                    <button
                                      disabled={
                                        reviewingSubmissionId === submission.id ||
                                        !hasReviewPoints
                                      }
                                      type="button"
                                      onClick={() =>
                                        void handleReview(
                                          submission,
                                          "needs_revision",
                                        )
                                      }
                                    >
                                      <X
                                        aria-hidden="true"
                                        size={13}
                                        strokeWidth={2.5}
                                      />
                                      Fallada
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <span className="assignment-empty">
                                  Sin entrega
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="assignment-pagination">
                <span>
                  {filteredStudents.length} estudiantes · pagina {safeCurrentPage} de{" "}
                  {pageCount}
                </span>
                <div>
                  <button
                    disabled={safeCurrentPage === 1}
                    type="button"
                    onClick={() =>
                      setCurrentPage((current) => Math.max(1, current - 1))
                    }
                  >
                    Anterior
                  </button>
                  <button
                    disabled={safeCurrentPage === pageCount}
                    type="button"
                    onClick={() =>
                      setCurrentPage((current) =>
                        Math.min(pageCount, current + 1),
                      )
                    }
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
