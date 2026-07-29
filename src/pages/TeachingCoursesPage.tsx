import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  listAssignmentSubmissionsByAssignmentIds,
  listCourseContent,
  listLessonAssignments,
  listLessonAttendance,
  listLessonQuizzes,
} from "../services/content";
import {
  listApprovedCourseStudents,
  listEnrollmentReviews,
} from "../services/courses";
import {
  listTeachingCourses,
  type TeachingCourseAssignment,
} from "../services/instructors";

function formatStatus(value: string) {
  const labels: Record<string, string> = {
    draft: "borrador",
    published: "publicado",
    enrollment_closed: "inscripcion cerrada",
    completed: "completado",
  };

  return labels[value] ?? value.replace(/_/g, " ");
}

type TeachingCourseSummary = {
  studentsCount: number;
  lessonsCount: number;
  pendingEnrollments: number;
  attendancePending: number;
  assignmentsToReview: number;
  quizzesMissing: number;
};

export function TeachingCoursesPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<TeachingCourseAssignment[]>([]);
  const [summaryByCourseId, setSummaryByCourseId] = useState<
    Record<string, TeachingCourseSummary>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAssignments = async () => {
      if (!user) {
        return;
      }

      setError(null);
      setIsLoading(true);

      try {
        const [nextAssignments, enrollments] = await Promise.all([
          listTeachingCourses(user.id),
          listEnrollmentReviews(),
        ]);
        const nextSummaries = await Promise.all(
          nextAssignments
            .filter((assignment) => assignment.courses)
            .map(async (assignment) => {
              const course = assignment.courses!;
              const [modules, students, attendance, courseAssignments, quizzes] =
                await Promise.all([
                  listCourseContent(course.id),
                  listApprovedCourseStudents(course.id),
                  listLessonAttendance(course.id),
                  listLessonAssignments(course.id),
                  listLessonQuizzes(course.id),
                ]);
              const lessons = modules.flatMap((module) => module.lessons);
              const submissions =
                await listAssignmentSubmissionsByAssignmentIds(
                  courseAssignments.map((courseAssignment) => courseAssignment.id),
                );
              const attendanceKeys = new Set(
                attendance.map(
                  (record) => `${record.lesson_id}:${record.student_id}`,
                ),
              );

              return [
                course.id,
                {
                  studentsCount: students.length,
                  lessonsCount: lessons.length,
                  pendingEnrollments: enrollments.filter(
                    (enrollment) =>
                      enrollment.status === "pending" &&
                      enrollment.course_editions?.course_id === course.id,
                  ).length,
                  attendancePending: Math.max(
                    0,
                    lessons.length * students.length - attendanceKeys.size,
                  ),
                  assignmentsToReview: submissions.filter(
                    (submission) => submission.status === "submitted",
                  ).length,
                  quizzesMissing: lessons.filter((lesson) => {
                    const quiz = quizzes.find(
                      (candidate) => candidate.lesson_id === lesson.id,
                    );

                    return (quiz?.quiz_questions.length ?? 0) < 10;
                  }).length,
                },
              ] as const;
            }),
        );

        setAssignments(nextAssignments);
        setSummaryByCourseId(Object.fromEntries(nextSummaries));
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudieron cargar los cursos asignados.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadAssignments();
  }, [user]);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Instructor</p>
          <h1>Cursos que imparto</h1>
        </div>
      </div>

      {error ? <p className="form-message error">{error}</p> : null}
      {isLoading ? <p>Cargando cursos asignados...</p> : null}

      {!isLoading && assignments.length === 0 ? (
        <section className="content-panel compact">
          <p>Todavia no tienes cursos asignados.</p>
        </section>
      ) : null}

      {!isLoading && assignments.length > 0 ? (
        <section className="content-panel teaching-panel">
          <div className="page-header compact-header">
            <div>
              <p className="eyebrow">Vista operativa</p>
              <h2>Seguimiento por curso</h2>
            </div>
          </div>

          <div className="teaching-course-grid">
            {assignments.map((assignment) => {
              const course = assignment.courses;

              if (!course) {
                return null;
              }

              const summary = summaryByCourseId[course.id];
              const assignedDate = new Date(
                assignment.created_at,
              ).toLocaleDateString();

              return (
                <article
                  className="teaching-course-card"
                  key={assignment.course_id}
                >
                  <div className="teaching-course-card-header">
                    <div>
                      <strong>{course.title}</strong>
                      <span>
                        {formatStatus(course.status)} - Asignado {assignedDate}
                      </span>
                    </div>
                    <a href={`#/admin/courses/${course.id}`}>Abrir</a>
                  </div>

                  <p>{course.short_description || "Sin descripcion todavia."}</p>

                  <div
                    className="teaching-metric-row"
                    aria-label="Resumen del curso"
                  >
                    <span>{summary?.studentsCount ?? 0} estudiantes</span>
                    <span>{summary?.lessonsCount ?? 0} clases</span>
                    <span>{summary?.pendingEnrollments ?? 0} solicitudes</span>
                    <span>{summary?.attendancePending ?? 0} asistencias</span>
                    <span>{summary?.assignmentsToReview ?? 0} tareas</span>
                    <span>{summary?.quizzesMissing ?? 0} quizzes</span>
                  </div>

                  <div className="teaching-course-actions">
                    <a href={`#/attendance/${course.id}`}>Asistencia</a>
                    <a href={`#/assignments/${course.id}`}>Tareas</a>
                    <a href={`#/enrollments?courseId=${course.id}`}>
                      Solicitudes
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </section>
  );
}
