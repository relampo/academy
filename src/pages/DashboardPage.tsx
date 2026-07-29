import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { RefreshCw } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
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
  updateLeaderboardProfile,
  type LeaderboardEntry,
  type LeaderboardVisibility,
} from "../services/leaderboard";

const attendancePoints = 10;
const quizMaxPoints = 20;

const stormAliases = [
  "Rayo Norte",
  "Centella Alta",
  "Trueno Claro",
  "Nube Ionica",
  "Chispa Azul",
  "Vortice Solar",
  "Pulso Electrico",
  "Relampago Delta",
  "Frente de Tormenta",
  "Arco Plasma",
];

const avatarPresets = [
  {
    label: "Rayo",
    background: "linear-gradient(135deg, #ffc712 0%, #fff3a3 100%)",
    radius: "999px",
    clipPath: "none",
  },
  {
    label: "Centella",
    background: "linear-gradient(135deg, #36a3ff 0%, #d7efff 100%)",
    radius: "12px",
    clipPath: "none",
  },
  {
    label: "Trueno",
    background: "linear-gradient(135deg, #1f2937 0%, #93a4ba 100%)",
    radius: "10px",
    clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
  },
  {
    label: "Aurora",
    background: "linear-gradient(135deg, #37a267 0%, #c8f7df 100%)",
    radius: "18px 8px 18px 8px",
    clipPath: "none",
  },
  {
    label: "Plasma",
    background: "linear-gradient(135deg, #7c5cff 0%, #f3d6ff 100%)",
    radius: "8px 18px 8px 18px",
    clipPath: "none",
  },
  {
    label: "Coral",
    background: "linear-gradient(135deg, #d46b53 0%, #ffe1d8 100%)",
    radius: "14px",
    clipPath: "polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0% 50%)",
  },
  {
    label: "Niebla",
    background: "linear-gradient(135deg, #64748b 0%, #e2e8f0 100%)",
    radius: "999px 999px 10px 999px",
    clipPath: "none",
  },
  {
    label: "Solar",
    background: "linear-gradient(135deg, #f59e0b 0%, #fef3c7 100%)",
    radius: "8px",
    clipPath: "none",
  },
  {
    label: "Oceano",
    background: "linear-gradient(135deg, #0ea5e9 0%, #bae6fd 100%)",
    radius: "999px 10px 999px 10px",
    clipPath: "none",
  },
  {
    label: "Magnetico",
    background: "linear-gradient(135deg, #db2777 0%, #fbcfe8 100%)",
    radius: "16px",
    clipPath: "polygon(50% 0%, 96% 28%, 82% 100%, 18% 100%, 4% 28%)",
  },
  {
    label: "Verde Ion",
    background: "linear-gradient(135deg, #16a34a 0%, #bbf7d0 100%)",
    radius: "999px",
    clipPath: "none",
  },
  {
    label: "Cobre",
    background: "linear-gradient(135deg, #b45309 0%, #fed7aa 100%)",
    radius: "12px 999px 12px 999px",
    clipPath: "none",
  },
  {
    label: "Cielo",
    background: "linear-gradient(135deg, #2563eb 0%, #dbeafe 100%)",
    radius: "10px",
    clipPath: "polygon(50% 0%, 100% 35%, 82% 100%, 18% 100%, 0% 35%)",
  },
  {
    label: "Lima",
    background: "linear-gradient(135deg, #84cc16 0%, #ecfccb 100%)",
    radius: "20px 8px 20px 8px",
    clipPath: "none",
  },
  {
    label: "Violeta",
    background: "linear-gradient(135deg, #9333ea 0%, #e9d5ff 100%)",
    radius: "8px 20px 8px 20px",
    clipPath: "none",
  },
  {
    label: "Grafito",
    background: "linear-gradient(135deg, #111827 0%, #cbd5e1 100%)",
    radius: "8px",
    clipPath: "none",
  },
  {
    label: "Fuego",
    background: "linear-gradient(135deg, #ef4444 0%, #fee2e2 100%)",
    radius: "999px 999px 999px 12px",
    clipPath: "none",
  },
  {
    label: "Menta",
    background: "linear-gradient(135deg, #14b8a6 0%, #ccfbf1 100%)",
    radius: "999px 12px 999px 12px",
    clipPath: "none",
  },
  {
    label: "Dorado",
    background: "linear-gradient(135deg, #ca8a04 0%, #fef08a 100%)",
    radius: "12px",
    clipPath: "polygon(50% 0%, 92% 18%, 100% 62%, 70% 100%, 30% 100%, 0% 62%, 8% 18%)",
  },
  {
    label: "Noche",
    background: "linear-gradient(135deg, #312e81 0%, #c7d2fe 100%)",
    radius: "999px",
    clipPath: "none",
  },
  {
    label: "Bruma",
    background: "linear-gradient(135deg, #475569 0%, #f1f5f9 100%)",
    radius: "18px 18px 8px 8px",
    clipPath: "none",
  },
  {
    label: "Nucleo",
    background: "linear-gradient(135deg, #f97316 0%, #ffedd5 100%)",
    radius: "999px",
    clipPath: "polygon(50% 0%, 88% 12%, 100% 50%, 88% 88%, 50% 100%, 12% 88%, 0% 50%, 12% 12%)",
  },
  {
    label: "Cristal",
    background: "linear-gradient(135deg, #06b6d4 0%, #cffafe 100%)",
    radius: "10px",
    clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
  },
  {
    label: "Voltio",
    background: "linear-gradient(135deg, #eab308 0%, #fef9c3 100%)",
    radius: "7px 18px 7px 18px",
    clipPath: "none",
  },
  {
    label: "Nebula",
    background: "linear-gradient(135deg, #4f46e5 0%, #f0abfc 100%)",
    radius: "18px 999px 18px 999px",
    clipPath: "none",
  },
  {
    label: "Terra",
    background: "linear-gradient(135deg, #15803d 0%, #fef3c7 100%)",
    radius: "10px 10px 20px 20px",
    clipPath: "none",
  },
  {
    label: "Lumen",
    background: "linear-gradient(135deg, #facc15 0%, #f0f9ff 100%)",
    radius: "999px 999px 999px 6px",
    clipPath: "none",
  },
  {
    label: "Polar",
    background: "linear-gradient(135deg, #0284c7 0%, #e0f2fe 100%)",
    radius: "6px 999px 999px 999px",
    clipPath: "none",
  },
  {
    label: "Granate",
    background: "linear-gradient(135deg, #be123c 0%, #ffe4e6 100%)",
    radius: "13px",
    clipPath: "polygon(50% 0%, 95% 35%, 78% 100%, 22% 100%, 5% 35%)",
  },
  {
    label: "Prisma",
    background: "linear-gradient(135deg, #a855f7 0%, #67e8f9 100%)",
    radius: "14px 6px 14px 6px",
    clipPath: "none",
  },
  {
    label: "Bosque",
    background: "linear-gradient(135deg, #166534 0%, #dcfce7 100%)",
    radius: "999px 8px 999px 8px",
    clipPath: "none",
  },
  {
    label: "Cobalto",
    background: "linear-gradient(135deg, #1d4ed8 0%, #bfdbfe 100%)",
    radius: "8px 8px 999px 999px",
    clipPath: "none",
  },
];

function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function getGeneratedAlias(seed: string) {
  const total = seed
    .split("")
    .reduce((sum, character) => sum + character.charCodeAt(0), 0);

  return stormAliases[total % stormAliases.length];
}

function getGeneratedAvatarPreset(seed: string) {
  const total = seed
    .split("")
    .reduce((sum, character) => sum + character.charCodeAt(0), 0);

  return avatarPresets[total % avatarPresets.length];
}

function getAvatarPreset(savedValue: string | null | undefined, seed: string) {
  return (
    avatarPresets.find(
      (preset) =>
        preset.label === savedValue || preset.background === savedValue,
    ) || getGeneratedAvatarPreset(seed)
  );
}

function getInitials(value: string) {
  const initials = value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "RA";
}

function getLevelClass(level: string) {
  return `is-${level.toLowerCase()}`;
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

export function DashboardPage() {
  const { profile, user, refreshProfile } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [courses, setCourses] = useState<
    Awaited<ReturnType<typeof listPublishedCourseEditions>>
  >([]);
  const [courseSummaries, setCourseSummaries] = useState<
    CourseDashboardSummary[]
  >([]);
  const [instructorSummaries, setInstructorSummaries] = useState<
    InstructorCourseSummary[]
  >([]);
  const [leaderboardName, setLeaderboardName] = useState("");
  const [leaderboardVisibility, setLeaderboardVisibility] =
    useState<LeaderboardVisibility>("alias");
  const [avatarPresetLabel, setAvatarPresetLabel] = useState(
    avatarPresets[0].label,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const name = profile?.first_name || profile?.display_name || "there";
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

            lessonList.forEach((lesson) => {
              const attendanceRecord = attendanceByLesson.get(lesson.id);
              const quiz = quizByLesson.get(lesson.id);
              const quizAttempt = quiz ? attemptByQuiz.get(quiz.id) : null;
              const assignment = assignmentByLesson.get(lesson.id);
              const submission = assignment
                ? submissionByAssignment.get(assignment.id)
                : null;
              const assignmentMaxPoints = assignment?.points ?? 10;

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
              viewedLessons: viewedLessonIds.size,
              earnedPoints,
              maxPoints,
              progressPercent:
                lessonList.length > 0
                  ? Math.round((viewedLessonIds.size / lessonList.length) * 100)
                  : 0,
              attendancePending,
              quizPending,
              assignmentPending,
              nextLessonTitle: nextLesson?.title ?? null,
              nextLessonHref: `#/courses/${courseId}`,
            };
          }),
        );

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
    if (!profile) {
      return;
    }

    setLeaderboardName(
      profile.leaderboard_name || getGeneratedAlias(profile.id),
    );
    setLeaderboardVisibility(
      profile.leaderboard_visibility === "hidden"
        ? "alias"
        : profile.leaderboard_visibility,
    );
    setAvatarPresetLabel(getAvatarPreset(profile.avatar_url, profile.id).label);
  }, [profile]);

  const currentEntry = useMemo(
    () => leaderboard.find((entry) => entry.student_id === user?.id),
    [leaderboard, user?.id],
  );
  const currentRank = leaderboard.findIndex((entry) => entry.student_id === user?.id) + 1;
  const topLeaderboard = leaderboard.slice(0, 10);
  const selectedAvatarPreset =
    avatarPresets.find((preset) => preset.label === avatarPresetLabel) ||
    avatarPresets[0];
  const previewDisplayName =
    leaderboardVisibility === "alias"
      ? leaderboardName
      : profile?.display_name || name;
  const scorePercent =
    currentEntry && currentEntry.max_score > 0
      ? Math.min(100, Math.round((currentEntry.total_score / currentEntry.max_score) * 100))
      : 0;
  const startedCourseSummaries = courseSummaries
    .filter((summary) => summary.viewedLessons > 0)
    .slice(0, 2);
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

  const handleSaveLeaderboardProfile = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!user) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsSaving(true);

    try {
      await updateLeaderboardProfile(user.id, {
        leaderboard_name: leaderboardName || getGeneratedAlias(user.id),
        leaderboard_visibility: leaderboardVisibility,
        avatar_url: avatarPresetLabel,
      });
      await refreshProfile();
      if (selectedCourseId) {
        setLeaderboard(await getCourseLeaderboard(selectedCourseId));
      }
      setMessage("Perfil de la tabla de posiciones actualizado.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo actualizar el perfil de la tabla de posiciones.",
      );
    } finally {
      setIsSaving(false);
    }
  };

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
      {message ? <p className="form-message success">{message}</p> : null}
      {isLoading ? <p>Cargando inicio...</p> : null}

      <div className="stats-grid">
        <article className="stat-card">
          <span>Cursos activos</span>
          <strong>{courses.length}</strong>
        </article>
        <article className="stat-card">
          <span>Posicion</span>
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
              <span>Todos tus cursos asignados estan al dia.</span>
            </div>
          ) : (
            <div className="instructor-course-grid">
              {priorityInstructorCourses.map((summary) => (
                <article className="instructor-course-card" key={summary.courseId}>
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
                      className={summary.quizzesMissing === 0 ? "is-clear" : ""}
                    >
                      Quiz {summary.quizzesMissing}
                    </span>
                  </div>
                  <div className="instructor-course-actions">
                    <a href={`#/attendance/${summary.courseId}`}>Asistencia</a>
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

      {hasStudentCourses ? (
        <section className="content-panel student-overview-panel">
          <div className="page-header compact-header">
            <div>
              <p className="eyebrow">Panel del estudiante</p>
              <h2>Que sigue ahora</h2>
            </div>
          </div>

          {courseSummaries.length === 0 ? (
            <p>Cargando progreso de cursos...</p>
          ) : startedCourseSummaries.length === 0 ? (
            <p>Todavia no hay cursos iniciados.</p>
          ) : (
            <div className="student-course-grid">
              {startedCourseSummaries.map((summary) => (
                <article className="student-course-card" key={summary.courseId}>
                  <div className="student-course-card-header">
                    <div>
                      <strong>{summary.title}</strong>
                      <span>
                        {summary.viewedLessons}/{summary.totalLessons} clases
                        vistas
                      </span>
                    </div>
                    <a href={summary.nextLessonHref}>
                      {summary.nextLessonTitle ? "Continuar" : "Revisar"}
                    </a>
                  </div>

                  <div className="student-course-progress">
                    <span>{summary.progressPercent}% visto</span>
                    <strong>
                      {formatPoints(summary.earnedPoints)}/
                      {formatPoints(summary.maxPoints)} pts
                    </strong>
                    <div>
                      <i style={{ width: `${summary.progressPercent}%` }} />
                    </div>
                  </div>

                  <div className="student-next-lesson">
                    <span>Proxima clase</span>
                    <strong>{summary.nextLessonTitle ?? "Curso revisado"}</strong>
                  </div>

                  <div className="student-pending-grid">
                    <span
                      className={
                        summary.attendancePending === 0 ? "is-clear" : ""
                      }
                    >
                      Asistencia {summary.attendancePending}
                    </span>
                    <span className={summary.quizPending === 0 ? "is-clear" : ""}>
                      Quiz {summary.quizPending}
                    </span>
                    <span
                      className={
                        summary.assignmentPending === 0 ? "is-clear" : ""
                      }
                    >
                      Tarea {summary.assignmentPending}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <section
        className={`leaderboard-shell${
          hasStudentCourses ? "" : " single-column"
        }`}
      >
        <div className="content-panel leaderboard-panel">
          <div className="page-header compact-header">
            <div>
              <p className="eyebrow">Tabla de posiciones</p>
              <h2>Ranking del curso</h2>
            </div>
            <label className="assignment-search">
              <span>Curso</span>
              <select
                value={selectedCourseId}
                onChange={(event) => setSelectedCourseId(event.target.value)}
              >
                {courses.length === 0 ? (
                  <option value="">No hay cursos aprobados</option>
                ) : null}
                {courses.map((edition) => (
                  <option key={edition.course_id} value={edition.course_id}>
                    {edition.courses?.title ?? edition.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {topLeaderboard.length === 0 ? (
            <p>Todavia no hay datos de ranking.</p>
          ) : (
            <>
              {currentEntry ? (
                <div className="leaderboard-summary-card">
                  <div>
                    <span>Tu posicion</span>
                    <strong>
                      {currentRank > 0 ? `#${currentRank}` : "-"} ·{" "}
                      {currentEntry.level}
                    </strong>
                  </div>
                  <div className="leaderboard-progress">
                    <span>{scorePercent}%</span>
                    <div>
                      <i style={{ width: `${scorePercent}%` }} />
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="leaderboard-list">
                {topLeaderboard.map((entry, index) => {
                  const avatarPreset = getAvatarPreset(
                    entry.avatar_url,
                    entry.student_id,
                  );

                  return (
                    <article
                      className={`leaderboard-row ${getLevelClass(entry.level)}${
                        entry.student_id === user?.id ? " is-current" : ""
                      }`}
                      key={entry.student_id}
                    >
                      <span className="leaderboard-rank">{index + 1}</span>
                      <span
                        className="leaderboard-avatar"
                        style={
                          {
                            "--avatar-color": avatarPreset.background,
                            "--avatar-radius": avatarPreset.radius,
                            "--avatar-clip": avatarPreset.clipPath,
                          } as CSSProperties
                        }
                        title={avatarPreset.label}
                      >
                        {getInitials(entry.display_name)}
                      </span>
                      <div>
                        <strong>{entry.display_name}</strong>
                        <span>{entry.level}</span>
                      </div>
                      <div className="leaderboard-score">
                        <strong>{formatPoints(entry.total_score)}</strong>
                        <span>
                          /{formatPoints(entry.max_score)} pts
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {hasStudentCourses ? (
          <form
            className="content-panel leaderboard-profile-card"
            onSubmit={handleSaveLeaderboardProfile}
          >
            <div className="leaderboard-profile-header">
              <p className="eyebrow">Perfil publico</p>
              <h2>Identidad en la tabla</h2>
            </div>
            <div
              className="leaderboard-profile-preview"
              style={
                {
                  "--avatar-color": selectedAvatarPreset.background,
                  "--avatar-radius": selectedAvatarPreset.radius,
                  "--avatar-clip": selectedAvatarPreset.clipPath,
                } as CSSProperties
              }
            >
              <span>{getInitials(previewDisplayName)}</span>
              <strong>{previewDisplayName}</strong>
            </div>
            <label>
              Mostrar como
              <select
                value={leaderboardVisibility}
                onChange={(event) =>
                  setLeaderboardVisibility(
                    event.target.value as LeaderboardVisibility,
                  )
                }
              >
                <option value="alias">Alias</option>
                <option value="first_name">Nombre</option>
                <option value="full_name">Nombre completo</option>
              </select>
            </label>
            <label>
              Alias
              <div className="inline-picker">
                <input
                  value={leaderboardName}
                  onChange={(event) => setLeaderboardName(event.target.value)}
                />
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() =>
                    setLeaderboardName(
                      stormAliases[
                        Math.floor(Math.random() * stormAliases.length)
                      ],
                    )
                  }
                >
                  <RefreshCw aria-hidden="true" size={16} strokeWidth={2.4} />
                </button>
              </div>
            </label>
            <div className="avatar-picker">
              <span>Avatar</span>
              <div>
                {avatarPresets.map((preset) => (
                  <button
                    aria-label={`Usar avatar ${preset.label}`}
                    className={
                      avatarPresetLabel === preset.label ? "selected" : ""
                    }
                    key={preset.label}
                    style={
                      {
                        "--avatar-color": preset.background,
                        "--avatar-radius": preset.radius,
                        "--avatar-clip": preset.clipPath,
                      } as CSSProperties
                    }
                    title={preset.label}
                    type="button"
                    onClick={() => setAvatarPresetLabel(preset.label)}
                  />
                ))}
              </div>
            </div>
            <div className="leaderboard-profile-actions">
              <button
                className="primary-action"
                disabled={isSaving}
                type="submit"
              >
                Guardar identidad
              </button>
            </div>
          </form>
        ) : null}
      </section>
    </section>
  );
}
