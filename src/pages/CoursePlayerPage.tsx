import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  CircleHelp,
  File,
  FileText,
  Eye,
  EyeOff,
  Link,
  Package,
  PlayCircle,
  Presentation,
  type LucideIcon,
} from "lucide-react";
import {
  listLessonAttendance,
  listLessonAssignments,
  listLessonQuizzes,
  listAssignmentSubmissionsByAssignmentIds,
  listCourseContent,
  listQuizAttemptsByQuizIds,
  submitAssignment,
  submitQuizAttempt,
  type AssignmentSubmission,
  type LessonAttendance,
  type LessonAssignment,
  type LessonQuizWithQuestions,
  type Resource,
  type ModuleWithLessons,
  type QuizAnswerInput,
  type QuizAttempt,
} from "../services/content";
import {
  getCourseWithEditions,
  type CourseWithEditions,
} from "../services/courses";
import { useAuth } from "../hooks/useAuth";

type CoursePlayerPageProps = {
  courseId: string;
};

const attendancePoints = 10;
const partialAttendancePoints = 5;
const quizMaxPoints = 20;

const resourceTypeLabels: Record<string, string> = {
  external_link: "Enlace externo",
  video: "Video",
  pdf: "PDF",
  slides: "Presentación",
  zip: "ZIP",
  script: "Script",
  report: "Reporte",
};

const resourceTypeIcons: Record<string, LucideIcon> = {
  external_link: Link,
  video: PlayCircle,
  pdf: FileText,
  slides: Presentation,
  zip: Package,
  script: File,
  report: FileText,
};

function getResourceIcon(resourceType: string) {
  return resourceTypeIcons[resourceType] ?? File;
}

function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatAssignmentDescription(description: string | null) {
  if (description === "Submit the required evidence for this class.") {
    return "Envía la evidencia requerida para esta clase.";
  }

  return description;
}

function getAttendancePoints(record?: LessonAttendance) {
  if (!record?.attended) {
    return 0;
  }

  return record.stayed_until_end ? attendancePoints : partialAttendancePoints;
}

function getAttendanceLabel(record?: LessonAttendance) {
  if (!record) {
    return "pendiente";
  }

  if (!record.attended) {
    return "no asistió";
  }

  return record.stayed_until_end ? "clase completa" : "asistió";
}

function renderStudentResource(resource: Resource) {
  const ResourceIcon = getResourceIcon(resource.resource_type);
  const label = resourceTypeLabels[resource.resource_type] ?? resource.resource_type;
  const content = (
    <>
      <ResourceIcon aria-hidden="true" size={16} strokeWidth={2.2} />
      <span>{resource.title}</span>
    </>
  );

  return resource.external_url ? (
    <a
      aria-label={`${label}: ${resource.title}`}
      className="student-resource-chip"
      href={resource.external_url}
      key={resource.id}
      rel="noreferrer"
      target="_blank"
    >
      {content}
    </a>
  ) : (
    <div
      aria-label={`${label}: ${resource.title}`}
      className="student-resource-chip"
      key={resource.id}
    >
      {content}
    </div>
  );
}

export function CoursePlayerPage({ courseId }: CoursePlayerPageProps) {
  const { user } = useAuth();
  const [course, setCourse] = useState<CourseWithEditions | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [attendance, setAttendance] = useState<LessonAttendance[]>([]);
  const [assignments, setAssignments] = useState<LessonAssignment[]>([]);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<
    AssignmentSubmission[]
  >([]);
  const [quizzes, setQuizzes] = useState<LessonQuizWithQuestions[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [collapsedModuleIds, setCollapsedModuleIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [collapsedLessonIds, setCollapsedLessonIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [activeAssignmentLessonId, setActiveAssignmentLessonId] = useState<
    string | null
  >(null);
  const [assignmentUrl, setAssignmentUrl] = useState("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [savingAssignmentId, setSavingAssignmentId] = useState<string | null>(
    null,
  );
  const [activeQuizLessonId, setActiveQuizLessonId] = useState<string | null>(
    null,
  );
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswerInput[]>([]);
  const [selectedQuizOption, setSelectedQuizOption] = useState("");
  const [questionStartedAt, setQuestionStartedAt] = useState<number | null>(null);
  const [savingQuizId, setSavingQuizId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const courseLessons = modules.flatMap((module) => module.lessons);
  const attendanceByLesson = new Map(
    attendance.map((record) => [record.lesson_id, record]),
  );
  const assignmentByLesson = new Map(
    assignments.map((assignment) => [assignment.lesson_id, assignment]),
  );
  const submissionByAssignment = new Map(
    assignmentSubmissions.map((submission) => [
      submission.assignment_id,
      submission,
    ]),
  );
  const quizByLesson = new Map(quizzes.map((quiz) => [quiz.lesson_id, quiz]));
  const attemptByQuiz = new Map(
    quizAttempts.map((attempt) => [attempt.quiz_id, attempt]),
  );

  const isLessonSystemComplete = (lessonId: string) => {
    const attendanceRecord = attendanceByLesson.get(lessonId);
    const assignment = assignmentByLesson.get(lessonId);
    const submission = assignment
      ? submissionByAssignment.get(assignment.id)
      : null;
    const quiz = quizByLesson.get(lessonId);
    const quizAttempt = quiz ? attemptByQuiz.get(quiz.id) : null;
    const isQuizConfigured = (quiz?.quiz_questions.length ?? 0) === 10;

    return Boolean(
      attendanceRecord?.attended &&
        assignment &&
        ["reviewed", "needs_revision"].includes(submission?.status ?? "") &&
        isQuizConfigured &&
        quizAttempt,
    );
  };

  const completedCount = courseLessons.filter((lesson) =>
    isLessonSystemComplete(lesson.id),
  ).length;
  const progress =
    courseLessons.length > 0
      ? Math.round((completedCount / courseLessons.length) * 100)
      : 0;

  const getLessonPointSummary = (lessonId: string) => {
    const attendanceRecord = attendanceByLesson.get(lessonId);
    const assignment = assignmentByLesson.get(lessonId);
    const submission = assignment
      ? submissionByAssignment.get(assignment.id)
      : null;
    const quiz = quizByLesson.get(lessonId);
    const quizAttempt = quiz ? attemptByQuiz.get(quiz.id) : null;
    const assignmentMaxPoints = assignment?.points ?? 10;
    const earnedAttendancePoints = getAttendancePoints(attendanceRecord);
    const earned =
      earnedAttendancePoints +
      (quizAttempt?.total_score ?? 0) +
      (submission?.points_awarded ?? 0);
    const max = attendancePoints + quizMaxPoints + assignmentMaxPoints;
    const hasPending =
      !attendanceRecord ||
      !quizAttempt ||
      submission?.points_awarded === null ||
      submission?.points_awarded === undefined;

    return {
      earned,
      max,
      label: hasPending
        ? "Puntos pendientes"
        : `${formatPoints(earned)}/${formatPoints(max)} pts`,
      tooltip: [
        `Asistencia: ${
          attendanceRecord
            ? `${getAttendanceLabel(attendanceRecord)} · ${formatPoints(
                earnedAttendancePoints,
              )}/${attendancePoints} pts`
            : "pendiente"
        }`,
        `Quiz: ${
          quizAttempt
            ? `${formatPoints(quizAttempt.total_score)}/${quizMaxPoints} pts`
            : "pendiente"
        }`,
        `Tarea: ${
          submission?.points_awarded !== null &&
          submission?.points_awarded !== undefined
            ? `${formatPoints(submission.points_awarded)}/${formatPoints(
                assignmentMaxPoints,
              )} pts`
            : "pendiente"
        }`,
      ].join("\n"),
    };
  };

  const getModuleTooltip = (module: ModuleWithLessons) =>
    module.lessons
      .map((lesson, index) => {
        const summary = getLessonPointSummary(lesson.id);
        return `Clase ${index + 1}: ${summary.label}\n${summary.tooltip}`;
      })
      .join("\n\n");
  const coursePointSummaries = courseLessons.map((lesson) =>
    getLessonPointSummary(lesson.id),
  );
  const courseEarnedPoints = coursePointSummaries.reduce(
    (sum, summary) => sum + summary.earned,
    0,
  );
  const courseMaxPoints = coursePointSummaries.reduce(
    (sum, summary) => sum + summary.max,
    0,
  );
  const courseHasPendingPoints = coursePointSummaries.some((summary) =>
    summary.label.includes("pendientes"),
  );

  const toggleModule = (moduleId: string) => {
    setCollapsedModuleIds((current) => {
      const next = new Set(current);

      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }

      return next;
    });
  };

  const toggleLesson = (lessonId: string) => {
    setCollapsedLessonIds((current) => {
      const next = new Set(current);

      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }

      return next;
    });
  };

  const startAssignmentSubmission = (
    lessonId: string,
    submission: AssignmentSubmission | null,
  ) => {
    setCollapsedLessonIds((current) => {
      const next = new Set(current);
      next.delete(lessonId);
      return next;
    });
    setActiveAssignmentLessonId(lessonId);
    setAssignmentUrl(submission?.submission_url ?? "");
    setAssignmentNotes(submission?.notes ?? "");
  };

  const handleSubmitAssignment = async (
    event: FormEvent<HTMLFormElement>,
    assignmentId: string,
  ) => {
    event.preventDefault();

    if (!user) {
      return;
    }

    setError(null);
    setSavingAssignmentId(assignmentId);

    try {
      const submission = await submitAssignment({
        assignmentId,
        studentId: user.id,
        submissionUrl: assignmentUrl || null,
        notes: assignmentNotes || null,
      });

      setAssignmentSubmissions((current) => {
        const withoutCurrent = current.filter(
          (currentSubmission) =>
            currentSubmission.assignment_id !== assignmentId,
        );
        return [...withoutCurrent, submission];
      });
      setActiveAssignmentLessonId(null);
      setAssignmentUrl("");
      setAssignmentNotes("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo enviar la tarea.",
      );
    } finally {
      setSavingAssignmentId(null);
    }
  };

  const startQuiz = (lessonId: string) => {
    setCollapsedLessonIds((current) => {
      const next = new Set(current);
      next.delete(lessonId);
      return next;
    });
    setActiveQuizLessonId(lessonId);
    setQuizAnswers([]);
    setSelectedQuizOption("");
    setQuestionStartedAt(Date.now());
  };

  const cancelQuiz = () => {
    setActiveQuizLessonId(null);
    setQuizAnswers([]);
    setSelectedQuizOption("");
    setQuestionStartedAt(null);
  };

  const handleQuizAnswer = async (quiz: LessonQuizWithQuestions) => {
    if (!user || !selectedQuizOption || questionStartedAt === null) {
      return;
    }

    const activeQuizQuestionIndex = quizAnswers.length;
    const question = quiz.quiz_questions[activeQuizQuestionIndex];

    if (!question) {
      return;
    }

    const nextAnswers = [
      ...quizAnswers,
      {
        questionId: question.id,
        selectedOption: selectedQuizOption,
        secondsSpent: (Date.now() - questionStartedAt) / 1000,
      },
    ];
    const nextQuestionIndex = activeQuizQuestionIndex + 1;

    if (nextQuestionIndex < quiz.quiz_questions.length) {
      setQuizAnswers(nextAnswers);
      setSelectedQuizOption("");
      setQuestionStartedAt(Date.now());
      return;
    }

    setSavingQuizId(quiz.id);
    setError(null);

    try {
      const attempt = await submitQuizAttempt({
        quiz,
        studentId: user.id,
        answers: nextAnswers,
      });

      setQuizAttempts((current) => {
        const withoutCurrent = current.filter(
          (currentAttempt) => currentAttempt.quiz_id !== quiz.id,
        );
        return [...withoutCurrent, attempt];
      });
      cancelQuiz();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo enviar el quiz.",
      );
    } finally {
      setSavingQuizId(null);
    }
  };

  // Depend on the id, not on the user object. Supabase refreshes the token when
  // the tab regains focus, which hands useAuth a brand new session object; with
  // the object as a dependency loadCourse was recreated on every refresh, the
  // effect below re-ran with resetCollapsed and every module closed on the
  // student mid-lesson.
  const userId = user?.id ?? null;

  const loadCourse = useCallback(
    async (options: { resetCollapsed: boolean; showLoading: boolean }) => {
      setError(null);

      if (options.showLoading) {
        setIsLoading(true);
      }

      try {
        const [nextCourse, nextModules] = await Promise.all([
          getCourseWithEditions(courseId),
          listCourseContent(courseId),
        ]);
        const nextAttendance = userId
          ? await listLessonAttendance(courseId, userId).catch(() => [])
          : [];
        const nextAssignments = await listLessonAssignments(courseId).catch(
          () => [],
        );
        const nextQuizzes = await listLessonQuizzes(courseId).catch(() => []);
        const nextAssignmentSubmissions = userId
          ? await listAssignmentSubmissionsByAssignmentIds(
              nextAssignments.map((assignment) => assignment.id),
              userId,
            ).catch(() => [])
          : [];
        const nextQuizAttempts = userId
          ? await listQuizAttemptsByQuizIds(
              nextQuizzes.map((quiz) => quiz.id),
              userId,
            ).catch(() => [])
          : [];

        setCourse(nextCourse);
        setModules(nextModules);
        setAttendance(nextAttendance);
        setAssignments(nextAssignments);
        setAssignmentSubmissions(nextAssignmentSubmissions);
        setQuizzes(nextQuizzes);
        setQuizAttempts(nextQuizAttempts);

        if (options.resetCollapsed) {
          setCollapsedModuleIds(new Set(nextModules.map((module) => module.id)));
          setCollapsedLessonIds(
            new Set(
              nextModules.flatMap((module) =>
                module.lessons.map((lesson) => lesson.id),
              ),
            ),
          );
        }
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudo cargar el curso.",
        );
      } finally {
        if (options.showLoading) {
          setIsLoading(false);
        }
      }
    },
    [courseId, userId],
  );

  useEffect(() => {
    void loadCourse({ resetCollapsed: true, showLoading: true });
  }, [loadCourse]);

  useEffect(() => {
    const handleDataChanged = () => {
      void loadCourse({ resetCollapsed: false, showLoading: false });
    };

    window.addEventListener("relampo:data-changed", handleDataChanged);
    return () =>
      window.removeEventListener("relampo:data-changed", handleDataChanged);
  }, [loadCourse]);

  return (
    <section className="page">
      <div className="page-header course-detail-header student-course-header">
        <div>
          <p className="eyebrow">Curso</p>
          <h1>{course?.title ?? "Curso"}</h1>
          {course?.description ? <p>{course.description}</p> : null}
        </div>
        <a className="text-link" href="#/courses">
          Volver a mis cursos
        </a>
      </div>

      {error ? <p className="form-message error">{error}</p> : null}
      {isLoading ? <p>Cargando curso...</p> : null}

      {!isLoading && modules.length === 0 ? (
        <section className="content-panel compact">
          <p>Todavía no hay contenido disponible para este curso.</p>
        </section>
      ) : null}

      {!isLoading && modules.length > 0 ? (
        <section className="student-progress-panel">
          <div>
            <span>Progreso de clases</span>
            <strong>{progress}%</strong>
          </div>
          <div className="student-progress-track">
            <span style={{ width: `${progress}%` }} />
          </div>
          <p>
            {completedCount} de {courseLessons.length} clases completadas
          </p>
          <div className="student-requirements">
            <div>
              <span>Para completar el curso se requiere</span>
              <div>
                <small>Instructor confirma asistencia</small>
                <small>El estudiante completa el quiz</small>
                <small>Tarea revisada</small>
              </div>
            </div>
            <div className="student-course-points">
              <span>Total acumulado</span>
              <strong>
                {formatPoints(courseEarnedPoints)}/
                {formatPoints(courseMaxPoints)} pts
              </strong>
              {courseHasPendingPoints ? <small>Hay elementos pendientes</small> : null}
            </div>
          </div>
        </section>
      ) : null}

      <div className="student-course-shell">
        {modules.map((module, moduleIndex) => {
          const isModuleCollapsed = collapsedModuleIds.has(module.id);
          const isModulePublished = module.status === "published";
          const moduleAvailableLessons = isModulePublished
            ? module.lessons.filter((lesson) => lesson.status === "published")
            : [];
          const moduleCompletedCount = moduleAvailableLessons.filter((lesson) =>
            isLessonSystemComplete(lesson.id),
          ).length;

          return (
            <article
              className={`student-module${
                isModulePublished ? "" : " is-disabled"
              }`}
              key={module.id}
            >
              <button
                aria-expanded={!isModuleCollapsed}
                className="student-module-header"
                title={getModuleTooltip(module)}
                type="button"
                onClick={() => toggleModule(module.id)}
              >
                <span>Módulo {moduleIndex + 1}</span>
                <div>
                  <h2>{module.title}</h2>
                  <p>{module.description || "Sin descripción todavía."}</p>
                </div>
                <small title={isModulePublished ? getModuleTooltip(module) : ""}>
                  {isModulePublished
                    ? `${moduleCompletedCount}/${moduleAvailableLessons.length}`
                    : "No disponible"}
                </small>
                {isModulePublished ? (
                  <Eye
                    aria-label="Módulo disponible"
                    className="student-availability-icon is-visible"
                    size={18}
                    strokeWidth={2.2}
                  />
                ) : (
                  <EyeOff
                    aria-label="Módulo no disponible"
                    className="student-availability-icon is-hidden"
                    size={18}
                    strokeWidth={2.2}
                  />
                )}
                {isModuleCollapsed ? (
                  <ChevronRight aria-hidden="true" size={20} />
                ) : (
                  <ChevronDown aria-hidden="true" size={20} />
                )}
              </button>
              {!isModuleCollapsed ? (
                <div className="student-lesson-list">
                  {module.lessons.length === 0 ? (
                    <p className="tree-empty">No hay clases en este módulo.</p>
                  ) : null}
                  {module.lessons.map((lesson, lessonIndex) => {
                    const attendanceRecord = attendanceByLesson.get(lesson.id);
                    const isLessonPublished =
                      isModulePublished && lesson.status === "published";
                    const assignment = assignmentByLesson.get(lesson.id);
                    const quiz = quizByLesson.get(lesson.id);
                    const quizAttempt = quiz ? attemptByQuiz.get(quiz.id) : null;
                    const isQuizReady =
                      (quiz?.quiz_questions.length ?? 0) === 10;
                    const submission = assignment
                      ? submissionByAssignment.get(assignment.id)
                      : null;
                    const quizStatusClass = quizAttempt
                      ? "is-confirmed"
                      : isQuizReady
                        ? ""
                        : "is-needs-revision";
                    const quizStatusLabel = quizAttempt
                      ? "Quiz completado"
                      : isQuizReady
                        ? "Quiz pendiente"
                        : "Configuración de quiz pendiente";
                    const assignmentStatusClass =
                      submission?.status === "reviewed"
                        ? "is-confirmed"
                        : submission?.status === "needs_revision"
                          ? "is-needs-revision"
                          : submission
                            ? "is-submitted"
                            : "";
                    const assignmentStatusLabel =
                      submission?.status === "reviewed"
                        ? "Tarea revisada"
                        : submission?.status === "needs_revision"
                          ? "Tarea fallada"
                          : submission
                            ? "Tarea enviada"
                            : "Tarea pendiente";
                    const lessonPointSummary = getLessonPointSummary(lesson.id);
                    const isLessonComplete = isLessonSystemComplete(lesson.id);
                    const isLessonCollapsed =
                      collapsedLessonIds.has(lesson.id) &&
                      activeAssignmentLessonId !== lesson.id &&
                      activeQuizLessonId !== lesson.id;

                    return (
                      <article
                        className={`student-lesson${
                          isLessonComplete ? " is-complete" : ""
                        }${isLessonPublished ? "" : " is-disabled"}`}
                        key={lesson.id}
                      >
                        <header className="student-lesson-header">
                          <span
                            aria-label={
                              isLessonComplete
                                ? "Clase completada por requisitos"
                                : "Clase pendiente por requisitos"
                            }
                            className={`student-system-status${
                              isLessonComplete ? " is-complete" : ""
                            }`}
                            title={
                              isLessonComplete
                                ? "El sistema completó esta clase"
                                : "Se completa cuando hay asistencia, quiz completado y tarea revisada"
                            }
                          >
                            {isLessonComplete ? (
                              <CheckCircle2 aria-hidden="true" size={22} />
                            ) : (
                              <CircleHelp aria-hidden="true" size={20} />
                            )}
                          </span>
                          <div>
                            <span>Clase {lessonIndex + 1}</span>
                            <h3>{lesson.title}</h3>
                          </div>
                          <span
                            className="student-points-badge"
                            title={lessonPointSummary.tooltip}
                          >
                            {isLessonPublished
                              ? lessonPointSummary.label
                              : "No disponible"}
                          </span>
                          {isLessonPublished ? (
                            <Eye
                              aria-label="Clase disponible"
                              className="student-availability-icon is-visible"
                              size={18}
                              strokeWidth={2.2}
                            />
                          ) : (
                            <EyeOff
                              aria-label="Clase no disponible"
                              className="student-availability-icon is-hidden"
                              size={18}
                              strokeWidth={2.2}
                            />
                          )}
                        </header>
                        <div className="student-lesson-summary">
                          {isLessonPublished ? (
                            <div className="student-status-row">
                              <span
                                className={
                                  attendanceRecord?.attended
                                    ? "is-confirmed"
                                    : attendanceRecord
                                      ? "is-needs-revision"
                                    : ""
                                }
                              >
                                {attendanceRecord?.attended
                                  ? "Asistencia confirmada"
                                  : attendanceRecord
                                    ? "No asistió"
                                  : "Asistencia pendiente"}
                              </span>
                              <span className={quizStatusClass}>
                                {quizStatusLabel}
                              </span>
                              <span className={assignmentStatusClass}>
                                <ClipboardCheck
                                  aria-hidden="true"
                                  size={14}
                                  strokeWidth={2.4}
                                />
                                {assignmentStatusLabel}
                              </span>
                            </div>
                          ) : (
                            <div className="student-status-row">
                              <span className="is-disabled">
                                Contenido no publicado
                              </span>
                            </div>
                          )}
                          {lesson.description ? (
                            <span className="student-lesson-description">
                              {lesson.description}
                            </span>
                          ) : null}
                          {isLessonPublished ? (
                            <button
                              aria-expanded={!isLessonCollapsed}
                              aria-label={
                                isLessonCollapsed
                                  ? "Expandir contenido de la clase"
                                  : "Colapsar contenido de la clase"
                              }
                              className="student-lesson-expand"
                              type="button"
                              onClick={() => toggleLesson(lesson.id)}
                            >
                              {isLessonCollapsed ? (
                                <>
                                  <span>Ver contenido</span>
                                  <ChevronRight aria-hidden="true" size={18} />
                                </>
                              ) : (
                                <>
                                  <span>Ocultar contenido</span>
                                  <ChevronDown aria-hidden="true" size={18} />
                                </>
                              )}
                            </button>
                          ) : null}
                        </div>
                        {!isLessonCollapsed && isLessonPublished ? (
                          <div className="student-lesson-body">
                            {assignment ? (
                              <section className="student-assignment-panel">
                                <div className="student-assignment-main">
                                  <ClipboardCheck
                                    aria-hidden="true"
                                    size={17}
                                    strokeWidth={2.4}
                                  />
                                  <div>
                                    <small>Tarea obligatoria</small>
                                    <span className="student-required-title">
                                      {assignment.title}
                                    </span>
                                    {formatAssignmentDescription(
                                      assignment.description,
                                    ) ? (
                                      <p>
                                        {formatAssignmentDescription(
                                          assignment.description,
                                        )}
                                      </p>
                                    ) : null}
                                  </div>
                                </div>
                                {activeAssignmentLessonId !== lesson.id ? (
                                  <div className="student-assignment-side">
                                    <div className="student-assignment-meta">
                                      <span>{assignment.assignment_type}</span>
                                      <span>
                                        {submission?.points_awarded !== null &&
                                        submission?.points_awarded !== undefined
                                          ? `${formatPoints(
                                              submission.points_awarded,
                                            )}/${formatPoints(
                                              assignment.points,
                                            )} pts`
                                          : "Puntos pendientes"}
                                      </span>
                                      {submission?.submission_url ? (
                                        <a
                                          href={submission.submission_url}
                                          rel="noreferrer"
                                          target="_blank"
                                        >
                                          Enlace enviado
                                        </a>
                                      ) : null}
                                    </div>
                                    {submission?.status === "reviewed" ? (
                                      <span className="student-assignment-locked">
                                        Tarea revisada
                                      </span>
                                    ) : (
                                      <button
                                        className="secondary-action student-submit-action"
                                        type="button"
                                        onClick={() =>
                                          startAssignmentSubmission(
                                            lesson.id,
                                            submission ?? null,
                                          )
                                        }
                                      >
                                        {submission ? "Editar entrega" : "Enviar"}
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <form
                                    className="student-assignment-form"
                                    onSubmit={(event) =>
                                      void handleSubmitAssignment(
                                        event,
                                        assignment.id,
                                      )
                                    }
                                  >
                                <label>
                                  Enlace de Google Drive
                                  <input
                                    placeholder="Pega aquí el enlace compartido de Google Drive"
                                    required
                                    type="url"
                                    value={assignmentUrl}
                                    onChange={(event) =>
                                      setAssignmentUrl(event.target.value)
                                    }
                                  />
                                </label>
                                <label>
                                  Notas
                                  <textarea
                                    value={assignmentNotes}
                                    onChange={(event) =>
                                      setAssignmentNotes(event.target.value)
                                    }
                                  />
                                </label>
                                <div className="inline-actions">
                                  <button
                                    className="primary-action"
                                    disabled={
                                      savingAssignmentId === assignment.id
                                    }
                                    type="submit"
                                  >
                                    {submission ? "Guardar cambios" : "Enviar"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveAssignmentLessonId(null)
                                    }
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </form>
                            )}
                          </section>
                        ) : null}
                        {quiz ? (
                          <section className="student-quiz-panel">
                            <div className="student-assignment-main">
                              <CircleHelp
                                aria-hidden="true"
                                size={17}
                                strokeWidth={2.4}
                              />
                              <div>
                                <small>Quiz obligatorio</small>
                                <span className="student-required-title">
                                  {quiz.title}
                                </span>
                                <p>10 preguntas. El puntaje cambia según el tiempo de respuesta.</p>
                              </div>
                            </div>
                            {quizAttempt ? (
                              <div className="student-assignment-meta">
                                <span className="student-quiz-result">
                                  Completado
                                </span>
                                <span>
                                  {formatPoints(quizAttempt.total_score)}/
                                  {quizMaxPoints} pts
                                </span>
                              </div>
                            ) : activeQuizLessonId === lesson.id &&
                              isQuizReady ? (
                              <div className="student-quiz-runner">
                                {(() => {
                                  const activeQuizQuestionIndex = Math.min(
                                    quizAnswers.length,
                                    quiz.quiz_questions.length - 1,
                                  );
                                  const question =
                                    quiz.quiz_questions[activeQuizQuestionIndex];

                                  return (
                                    <div key={question.id}>
                                      <div className="student-quiz-progress">
                                        <span>
                                          Pregunta {activeQuizQuestionIndex + 1}/
                                          {quiz.quiz_questions.length}
                                        </span>
                                        <span>
                                          2 pts antes de 30s · 1.5 antes de 60s · 1 después
                                        </span>
                                      </div>
                                      <strong>{question.question_text}</strong>
                                      <div className="student-quiz-options">
                                        {(["a", "b", "c", "d"] as const).map(
                                          (option) => (
                                            <label key={`${question.id}-${option}`}>
                                              <input
                                                checked={
                                                  selectedQuizOption === option
                                                }
                                                name={`quiz-${quiz.id}-${question.id}`}
                                                type="radio"
                                                value={option}
                                                onChange={(event) =>
                                                  setSelectedQuizOption(
                                                    event.target.value,
                                                  )
                                                }
                                              />
                                              {
                                                question[
                                                  `option_${option}` as keyof typeof question
                                                ] as string
                                              }
                                            </label>
                                          ),
                                        )}
                                      </div>
                                      <div className="inline-actions">
                                        <button
                                          className="primary-action"
                                          disabled={
                                            !selectedQuizOption ||
                                            savingQuizId === quiz.id
                                          }
                                          type="button"
                                          onClick={() =>
                                            void handleQuizAnswer(quiz)
                                          }
                                        >
                                          {activeQuizQuestionIndex ===
                                          quiz.quiz_questions.length - 1
                                            ? "Finalizar quiz"
                                            : "Siguiente pregunta"}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={cancelQuiz}
                                        >
                                          Cancelar
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            ) : (
                              <div className="student-assignment-side">
                                <div className="student-assignment-meta">
                                  <span>Puntos pendientes</span>
                                </div>
                                <button
                                  className="secondary-action student-submit-action"
                                  disabled={!isQuizReady}
                                  type="button"
                                  onClick={() => startQuiz(lesson.id)}
                                >
                                  {isQuizReady ? "Iniciar quiz" : "Quiz pendiente"}
                                </button>
                              </div>
                            )}
                          </section>
                        ) : null}
                        {lesson.content ? <p>{lesson.content}</p> : null}
                        {lesson.video_url || lesson.resources.length > 0 ? (
                          <div className="student-resource-list">
                            {lesson.video_url ? (
                              <a
                                className="student-resource-chip"
                                href={lesson.video_url}
                                rel="noreferrer"
                                target="_blank"
                              >
                                <PlayCircle aria-hidden="true" size={16} />
                                <span>Video de la clase</span>
                              </a>
                            ) : null}
                            {lesson.resources.map((resource) =>
                              renderStudentResource(resource),
                            )}
                          </div>
                        ) : null}
                      </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
