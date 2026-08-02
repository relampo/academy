import { useEffect, useMemo, useState } from "react";
import { SponsorSection } from "../components/SponsorSection";
import { useAuth } from "../hooks/useAuth";
import { getCountryByCode } from "../lib/countries";
import {
  listEnrollmentReviews,
  listApprovedCourseStudents,
  listPublishedCourseEditions,
} from "../services/courses";
import {
  listAssignmentSubmissionsByAssignmentIds,
  listCourseContent,
  listLessonAssignments,
  listLessonAttendance,
  listLessonProgress,
  listLessonQuizzes,
  listQuizAttemptsByQuizIds,
} from "../services/content";
import { listTeachingCourses } from "../services/instructors";
import {
  getCourseLeaderboard,
  type LeaderboardEntry,
} from "../services/leaderboard";
import { listStudentCountryCounts } from "../services/users";
import { formatPoints } from "../lib/leaderboardIdentity";

const attendancePoints = 10;
const quizMaxPoints = 20;

const getStartedCoursesKey = (userId: string) =>
  `relampo:started-courses:${userId}`;

function readStartedCourseIds(userId: string) {
  try {
    const savedValue = window.localStorage.getItem(getStartedCoursesKey(userId));
    const parsedValue = savedValue ? (JSON.parse(savedValue) as string[]) : [];

    return new Set(parsedValue);
  } catch {
    return new Set<string>();
  }
}

function writeStartedCourseIds(userId: string, courseIds: Set<string>) {
  window.localStorage.setItem(
    getStartedCoursesKey(userId),
    JSON.stringify(Array.from(courseIds)),
  );
}

function formatRole(value: string) {
  const labels: Record<string, string> = {
    admin: "administrador",
    instructor: "instructor",
    student: "estudiante",
  };

  return labels[value] ?? value;
}

type CourseDashboardSummary = {
  courseId: string;
  title: string;
  totalLessons: number;
  viewedLessons: number;
  earnedPoints: number;
  maxPoints: number;
  progressPercent: number;
  attendancePending: number;
  quizPending: number;
  assignmentPending: number;
  nextLessonTitle: string | null;
  nextLessonHref: string;
};

type InstructorCourseSummary = {
  courseId: string;
  title: string;
  studentsCount: number;
  lessonsCount: number;
  pendingEnrollments: number;
  attendancePending: number;
  assignmentsToReview: number;
  quizzesMissing: number;
};

type CountryCount = {
  code: string;
  name: string;
  count: number;
  x: number;
  y: number;
};

function CommunityMap({ countries }: { countries: CountryCount[] }) {
  const activeCountries = countries.filter((country) => country.count > 0);
  const totalStudents = activeCountries.reduce(
    (total, country) => total + country.count,
    0,
  );

  return (
    <section className="content-panel community-panel">
      <div className="page-header compact-header">
        <div>
          <p className="eyebrow">Comunidad LATAM</p>
          <h2>Estudiantes por país</h2>
        </div>
        <strong>{totalStudents}</strong>
      </div>

      <div className="world-map" aria-label="Mapa de estudiantes por país">
        <svg viewBox="0 0 100 56" role="presentation" aria-hidden="true">
          <path d="M14 16c8-8 23-9 30-2 5 5 1 13-7 15-9 2-11 10-20 7-7-2-10-14-3-20Z" />
          <path d="M47 13c9-7 28-6 35 1 7 8 1 18-12 19-10 1-15 7-24 2-8-5-8-15 1-22Z" />
          <path d="M50 36c8-3 19-2 23 4 4 5-1 11-12 11-9 0-17-5-11-15Z" />
        </svg>
        {activeCountries.map((country) => (
          <button
            key={country.code}
            type="button"
            className="country-marker"
            style={{ left: `${country.x}%`, top: `${country.y}%` }}
            aria-label={`${country.name}: ${country.count} estudiantes`}
            data-tooltip={`${country.name}: ${country.count} estudiantes`}
          >
            <span>{country.count}</span>
          </button>
        ))}
      </div>

      {activeCountries.length === 0 ? (
        <p className="community-empty">Aún no hay países registrados.</p>
      ) : (
        <div className="country-count-list">
          {activeCountries.slice(0, 6).map((country) => (
            <span key={country.code}>
              {country.name} <strong>{country.count}</strong>
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

export function DashboardPage() {
  const { profile, user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [courses, setCourses] = useState<
    Awaited<ReturnType<typeof listPublishedCourseEditions>>
  >([]);
  const [courseSummaries, setCourseSummaries] = useState<
    CourseDashboardSummary[]
  >([]);
  const [startedCourseIds, setStartedCourseIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [instructorSummaries, setInstructorSummaries] = useState<
    InstructorCourseSummary[]
  >([]);
  const [countryCounts, setCountryCounts] = useState<CountryCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const name = profile?.first_name || profile?.display_name || "Relampo";
  const hasStudentCourses = courses.length > 0;

  useEffect(() => {
    const loadCourses = async () => {
      if (!user) {
        return;
      }

      setError(null);
      setIsLoading(true);

      try {
        const nextCourses = (await listPublishedCourseEditions(user.id)).filter(
          (edition) =>
            edition.enrollments.some(
              (enrollment) => enrollment.status === "approved",
            ),
        );
        setCourses(nextCourses);
        setStartedCourseIds(readStartedCourseIds(user.id));
        setSelectedCourseId((current) => current || nextCourses[0]?.course_id || "");
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudo cargar el inicio.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadCourses();
  }, [user]);

  useEffect(() => {
    const loadCourseSummaries = async () => {
      if (!user || courses.length === 0) {
        setCourseSummaries([]);
        return;
      }

      try {
        const summaries = await Promise.all(
          courses.map(async (edition) => {
            const courseId = edition.course_id;
            const [
              modules,
              progress,
              attendance,
              assignments,
              quizzes,
            ] = await Promise.all([
              listCourseContent(courseId),
              listLessonProgress(courseId, user.id),
              listLessonAttendance(courseId, user.id),
              listLessonAssignments(courseId),
              listLessonQuizzes(courseId),
            ]);
            const lessonList = modules.flatMap((module) => module.lessons);
            const assignmentIds = assignments.map((assignment) => assignment.id);
            const quizIds = quizzes.map((quiz) => quiz.id);
            const [submissions, attempts] = await Promise.all([
              listAssignmentSubmissionsByAssignmentIds(assignmentIds, user.id),
              listQuizAttemptsByQuizIds(quizIds, user.id),
            ]);
            const viewedLessonIds = new Set(
              progress.map((record) => record.lesson_id),
            );
            const attendanceByLesson = new Map(
              attendance.map((record) => [record.lesson_id, record]),
            );
            const assignmentByLesson = new Map(
              assignments.map((assignment) => [assignment.lesson_id, assignment]),
            );
            const submissionByAssignment = new Map(
              submissions.map((submission) => [
                submission.assignment_id,
                submission,
              ]),
            );
            const quizByLesson = new Map(
              quizzes.map((quiz) => [quiz.lesson_id, quiz]),
            );
            const attemptByQuiz = new Map(
              attempts.map((attempt) => [attempt.quiz_id, attempt]),
            );

            let attendancePending = 0;
            let quizPending = 0;
            let assignmentPending = 0;
            let earnedPoints = 0;
            let maxPoints = 0;
            let completedLessons = 0;

            lessonList.forEach((lesson) => {
              const attendanceRecord = attendanceByLesson.get(lesson.id);
              const quiz = quizByLesson.get(lesson.id);
              const quizAttempt = quiz ? attemptByQuiz.get(quiz.id) : null;
              const assignment = assignmentByLesson.get(lesson.id);
              const submission = assignment
                ? submissionByAssignment.get(assignment.id)
                : null;
              const assignmentMaxPoints = assignment?.points ?? 10;
              const isQuizConfigured = (quiz?.quiz_questions.length ?? 0) === 10;

              maxPoints += attendancePoints + quizMaxPoints + assignmentMaxPoints;
              earnedPoints += attendanceRecord?.attended
                ? attendanceRecord.stayed_until_end
                  ? attendancePoints
                  : 5
                : 0;
              earnedPoints += quizAttempt?.total_score ?? 0;
              earnedPoints += submission?.points_awarded ?? 0;

              if (!attendanceRecord?.attended) {
                attendancePending += 1;
              }

              if (!quizAttempt) {
                quizPending += 1;
              }

              if (submission?.status !== "reviewed") {
                assignmentPending += 1;
              }

              if (
                attendanceRecord?.attended &&
                assignment &&
                ["reviewed", "needs_revision"].includes(
                  submission?.status ?? "",
                ) &&
                isQuizConfigured &&
                quizAttempt
              ) {
                completedLessons += 1;
              }
            });

            const nextLesson =
              lessonList.find((lesson, index) => {
                const previousLesson = lessonList[index - 1];
                return (
                  !viewedLessonIds.has(lesson.id) &&
                  (!previousLesson || viewedLessonIds.has(previousLesson.id))
                );
              }) || null;

            return {
              courseId,
              title: edition.courses?.title ?? edition.title,
              totalLessons: lessonList.length,
              viewedLessons: completedLessons,
              earnedPoints,
              maxPoints,
              progressPercent:
                lessonList.length > 0
                  ? Math.round((completedLessons / lessonList.length) * 100)
                  : 0,
              attendancePending,
              quizPending,
              assignmentPending,
              nextLessonTitle: nextLesson?.title ?? null,
              nextLessonHref: `#/courses/${courseId}`,
            };
          }),
        );

        setStartedCourseIds((current) => {
          const nextCourseIds = new Set(current);
          summaries.forEach((summary) => {
            if (summary.viewedLessons > 0) {
              nextCourseIds.add(summary.courseId);
            }
          });
          writeStartedCourseIds(user.id, nextCourseIds);

          return nextCourseIds;
        });
        setCourseSummaries(summaries);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudo cargar el resumen de cursos.",
        );
      }
    };

    void loadCourseSummaries();
  }, [courses, user]);

  useEffect(() => {
    const loadInstructorSummaries = async () => {
      if (!user || !["admin", "instructor"].includes(profile?.role ?? "")) {
        setInstructorSummaries([]);
        return;
      }

      try {
        const [teachingCourses, enrollments] = await Promise.all([
          listTeachingCourses(user.id),
          listEnrollmentReviews(),
        ]);
        const summaries = await Promise.all(
          teachingCourses
            .filter((assignment) => assignment.courses)
            .map(async (assignment) => {
              const course = assignment.courses!;
              const [modules, students, attendance, assignments, quizzes] =
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
                  assignments.map((courseAssignment) => courseAssignment.id),
                );
              const attendanceKeys = new Set(
                attendance.map(
                  (record) => `${record.lesson_id}:${record.student_id}`,
                ),
              );
              const pendingEnrollments = enrollments.filter(
                (enrollment) =>
                  enrollment.status === "pending" &&
                  enrollment.course_editions?.course_id === course.id,
              ).length;
              const expectedAttendance = lessons.length * students.length;
              const attendancePending = Math.max(
                0,
                expectedAttendance - attendanceKeys.size,
              );
              const assignmentsToReview = submissions.filter(
                (submission) => submission.status === "submitted",
              ).length;
              const quizzesMissing = lessons.filter((lesson) => {
                const quiz = quizzes.find(
                  (candidate) => candidate.lesson_id === lesson.id,
                );

                return (quiz?.quiz_questions.length ?? 0) < 10;
              }).length;

              return {
                courseId: course.id,
                title: course.title,
                studentsCount: students.length,
                lessonsCount: lessons.length,
                pendingEnrollments,
                attendancePending,
                assignmentsToReview,
                quizzesMissing,
              };
            }),
        );

        setInstructorSummaries(summaries);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudo cargar el panel del profesor.",
        );
      }
    };

    void loadInstructorSummaries();
  }, [profile?.role, user]);

  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!selectedCourseId) {
        setLeaderboard([]);
        return;
      }

      setError(null);

      try {
        setLeaderboard(await getCourseLeaderboard(selectedCourseId));
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudo cargar el leaderboard.",
        );
      }
    };

    void loadLeaderboard();
  }, [selectedCourseId]);

  useEffect(() => {
    const loadCountryCounts = async () => {
      if (!user) {
        setCountryCounts([]);
        return;
      }

      try {
        const counts = await listStudentCountryCounts();
        setCountryCounts(
          counts.map((record) => {
            const country = getCountryByCode(record.country);

            return {
              code: record.country,
              name: country?.name ?? record.country,
              count: record.student_count,
              x: country?.x ?? 50,
              y: country?.y ?? 50,
            };
          }),
        );
      } catch {
        setCountryCounts([]);
      }
    };

    void loadCountryCounts();
  }, [user]);

  const currentEntry = useMemo(
    () => leaderboard.find((entry) => entry.student_id === user?.id),
    [leaderboard, user?.id],
  );
  const currentRank = leaderboard.findIndex((entry) => entry.student_id === user?.id) + 1;
  const hasStartedCourse = (courseId: string, viewedLessons: number) =>
    viewedLessons > 0 || startedCourseIds.has(courseId);
  const startedCourseSummaries = courseSummaries.filter(
    (summary) => hasStartedCourse(summary.courseId, summary.viewedLessons),
  );
  const visibleStudentCourseSummaries =
    startedCourseSummaries.length > 0
      ? startedCourseSummaries.slice(0, 2)
      : courseSummaries.slice(0, 2);
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
  const hasInstructorBoard =
    ["admin", "instructor"].includes(profile?.role ?? "") &&
    instructorSummaries.length > 0;
  const instructorTotals = instructorSummaries.reduce(
    (totals, summary) => ({
      pendingEnrollments:
        totals.pendingEnrollments + summary.pendingEnrollments,
      assignmentsToReview:
        totals.assignmentsToReview + summary.assignmentsToReview,
      attendancePending: totals.attendancePending + summary.attendancePending,
      quizzesMissing: totals.quizzesMissing + summary.quizzesMissing,
    }),
    {
      pendingEnrollments: 0,
      assignmentsToReview: 0,
      attendancePending: 0,
      quizzesMissing: 0,
    },
  );
  const priorityInstructorCourses = instructorSummaries
    .filter(
      (summary) =>
        summary.pendingEnrollments > 0 ||
        summary.assignmentsToReview > 0 ||
        summary.attendancePending > 0 ||
        summary.quizzesMissing > 0,
    )
    .slice(0, 4);

  return (
    <section className="page dashboard-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Academia</p>
          <h1>Bienvenido, {name}</h1>
        </div>
        <span className="status-pill">{formatRole(profile?.role ?? "student")}</span>
      </div>

      {error ? <p className="form-message error">{error}</p> : null}
      {isLoading ? <p>Cargando inicio...</p> : null}

      <div className="dashboard-home-grid">
        <div className="dashboard-main-column">
          <div className="stats-grid">
            <article className="stat-card">
              <span>Cursos activos</span>
              <strong>{courses.length}</strong>
            </article>
            <article className="stat-card">
              <span>Posición</span>
              <strong>{currentRank > 0 ? `#${currentRank}` : "-"}</strong>
            </article>
            <article className="stat-card">
              <span>Nivel actual</span>
              <strong>{currentEntry?.level ?? "Chispa"}</strong>
            </article>
            <article className="stat-card">
              <span>Acumulado</span>
              <strong>
                {formatPoints(currentEntry?.total_score ?? 0)}
                <small> pts</small>
              </strong>
            </article>
          </div>

          {hasStudentCourses ? (
            <section className="content-panel student-overview-panel">
              <div className="page-header compact-header">
                <div>
                  <p className="eyebrow">Panel del estudiante</p>
                  <h2>Qué sigue ahora</h2>
                </div>
              </div>

              {courseSummaries.length === 0 ? (
                <p>Cargando progreso de cursos...</p>
              ) : (
                <div className="student-course-grid">
                  {visibleStudentCourseSummaries.map((summary) => (
                    <article
                      className="student-course-card"
                      key={summary.courseId}
                    >
                      <div className="student-course-card-header">
                        <div>
                          <strong>{summary.title}</strong>
                          <span>
                            {summary.viewedLessons}/{summary.totalLessons} clases
                            completadas
                          </span>
                        </div>
                        <a
                          href={summary.nextLessonHref}
                          onClick={() => markCourseStarted(summary.courseId)}
                        >
                          {!hasStartedCourse(
                            summary.courseId,
                            summary.viewedLessons,
                          )
                            ? "Comenzar"
                            : summary.nextLessonTitle
                              ? "Continuar"
                              : "Revisar"}
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {hasInstructorBoard ? (
            <section className="content-panel instructor-overview-panel">
              <div className="page-header compact-header">
                <div>
                  <p className="eyebrow">Panel del profesor</p>
                  <h2>Pendientes de hoy</h2>
                </div>
                <a className="secondary-action" href="#/teaching">
                  Ver cursos
                </a>
              </div>

              <div className="instructor-metric-grid">
                <article>
                  <span>Solicitudes</span>
                  <strong>{instructorTotals.pendingEnrollments}</strong>
                </article>
                <article>
                  <span>Tareas por revisar</span>
                  <strong>{instructorTotals.assignmentsToReview}</strong>
                </article>
                <article>
                  <span>Asistencias pendientes</span>
                  <strong>{instructorTotals.attendancePending}</strong>
                </article>
                <article>
                  <span>Quizzes incompletos</span>
                  <strong>{instructorTotals.quizzesMissing}</strong>
                </article>
              </div>

              {priorityInstructorCourses.length === 0 ? (
                <div className="empty-builder">
                  <strong>No hay pendientes urgentes</strong>
                  <span>Todos tus cursos asignados están al día.</span>
                </div>
              ) : (
                <div className="instructor-course-grid">
                  {priorityInstructorCourses.map((summary) => (
                    <article
                      className="instructor-course-card"
                      key={summary.courseId}
                    >
                      <div className="instructor-course-card-header">
                        <div>
                          <strong>{summary.title}</strong>
                          <span>
                            {summary.studentsCount} estudiantes ·{" "}
                            {summary.lessonsCount} clases
                          </span>
                        </div>
                        <a href={`#/admin/courses/${summary.courseId}`}>Abrir</a>
                      </div>
                      <div className="student-pending-grid instructor-pending-grid">
                        <span
                          className={
                            summary.pendingEnrollments === 0 ? "is-clear" : ""
                          }
                        >
                          Solicitudes {summary.pendingEnrollments}
                        </span>
                        <span
                          className={
                            summary.assignmentsToReview === 0 ? "is-clear" : ""
                          }
                        >
                          Tareas {summary.assignmentsToReview}
                        </span>
                        <span
                          className={
                            summary.attendancePending === 0 ? "is-clear" : ""
                          }
                        >
                          Asistencia {summary.attendancePending}
                        </span>
                        <span
                          className={
                            summary.quizzesMissing === 0 ? "is-clear" : ""
                          }
                        >
                          Quiz {summary.quizzesMissing}
                        </span>
                      </div>
                      <div className="instructor-course-actions">
                        <a href={`#/attendance/${summary.courseId}`}>
                          Asistencia
                        </a>
                        <a href={`#/assignments/${summary.courseId}`}>Tareas</a>
                        <a href={`#/enrollments?courseId=${summary.courseId}`}>
                          Solicitudes
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          <section className="content-panel dashboard-leaderboard-card">
            <div>
              <p className="eyebrow">Leaderboard</p>
              <h2>Compite por una licencia Relampo</h2>
              <p>
                Los 3 primeros lugares reciben una licencia para generar más de
                1000 usuarios gratis durante 2 meses.
              </p>
            </div>
            <a className="primary-action" href="#/leaderboard">
              Abrir leaderboard
            </a>
          </section>
        </div>

        <aside className="dashboard-side-column">
          <SponsorSection />
          <CommunityMap countries={countryCounts} />
        </aside>
      </div>
    </section>
  );
}
