import { useEffect, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Circle,
  CircleHelp,
  File,
  FileText,
  Link,
  Package,
  PlayCircle,
  Presentation,
  type LucideIcon,
} from "lucide-react";
import {
  listLessonAttendance,
  listLessonAssignments,
  listLessonProgress,
  listLessonQuizzes,
  listAssignmentSubmissionsByAssignmentIds,
  listCourseContent,
  listQuizAttemptsByQuizIds,
  markLessonViewed,
  submitAssignment,
  submitQuizAttempt,
  unmarkLessonViewed,
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
  external_link: "External link",
  video: "Video",
  pdf: "PDF",
  slides: "Slides",
  zip: "ZIP",
  script: "Script",
  report: "Report",
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

function getAttendancePoints(record?: LessonAttendance) {
  if (!record?.attended) {
    return 0;
  }

  return record.stayed_until_end ? attendancePoints : partialAttendancePoints;
}

function getAttendanceLabel(record?: LessonAttendance) {
  if (!record?.attended) {
    return "pending";
  }

  return record.stayed_until_end ? "full class" : "attended";
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
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(
    () => new Set(),
  );
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
  const [savingLessonId, setSavingLessonId] = useState<string | null>(null);
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
  const [activeQuizQuestionIndex, setActiveQuizQuestionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswerInput[]>([]);
  const [selectedQuizOption, setSelectedQuizOption] = useState("");
  const [questionStartedAt, setQuestionStartedAt] = useState<number | null>(null);
  const [savingQuizId, setSavingQuizId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lessons = modules.flatMap((module) => module.lessons);
  const completedCount = lessons.filter((lesson) =>
    completedLessonIds.has(lesson.id),
  ).length;
  const progress =
    lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
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
      !attendanceRecord?.attended ||
      !quizAttempt ||
      submission?.points_awarded === null ||
      submission?.points_awarded === undefined;

    return {
      earned,
      max,
      label: hasPending
        ? "Points pending"
        : `${formatPoints(earned)}/${formatPoints(max)} pts`,
      tooltip: [
        `Attendance: ${
          attendanceRecord?.attended
            ? `${getAttendanceLabel(attendanceRecord)} · ${formatPoints(
                earnedAttendancePoints,
              )}/${attendancePoints} pts`
            : "pending"
        }`,
        `Quiz: ${
          quizAttempt
            ? `${formatPoints(quizAttempt.total_score)}/${quizMaxPoints} pts`
            : "pending"
        }`,
        `Assignment: ${
          submission?.points_awarded !== null &&
          submission?.points_awarded !== undefined
            ? `${formatPoints(submission.points_awarded)}/${formatPoints(
                assignmentMaxPoints,
              )} pts`
            : "pending"
        }`,
      ].join("\n"),
    };
  };

  const getModuleTooltip = (module: ModuleWithLessons) =>
    module.lessons
      .map((lesson, index) => {
        const summary = getLessonPointSummary(lesson.id);
        return `Lesson ${index + 1}: ${summary.label}\n${summary.tooltip}`;
      })
      .join("\n\n");
  const coursePointSummaries = lessons.map((lesson) =>
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
    summary.label.includes("pending"),
  );

  const toggleLessonComplete = async (lessonId: string) => {
    if (!user) {
      return;
    }

    const wasCompleted = completedLessonIds.has(lessonId);

    setCompletedLessonIds((current) => {
      const next = new Set(current);

      if (wasCompleted) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }

      return next;
    });

    setSavingLessonId(lessonId);
    setError(null);

    try {
      if (wasCompleted) {
        await unmarkLessonViewed(lessonId, user.id);
      } else {
        await markLessonViewed(lessonId, user.id);
      }
    } catch (caughtError) {
      setCompletedLessonIds((current) => {
        const next = new Set(current);

        if (wasCompleted) {
          next.add(lessonId);
        } else {
          next.delete(lessonId);
        }

        return next;
      });
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update lesson progress.",
      );
    } finally {
      setSavingLessonId(null);
    }
  };

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

  const startAssignmentSubmission = (
    lessonId: string,
    submission: AssignmentSubmission | null,
  ) => {
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
          : "Could not submit assignment.",
      );
    } finally {
      setSavingAssignmentId(null);
    }
  };

  const startQuiz = (lessonId: string) => {
    setActiveQuizLessonId(lessonId);
    setActiveQuizQuestionIndex(0);
    setQuizAnswers([]);
    setSelectedQuizOption("");
    setQuestionStartedAt(Date.now());
  };

  const handleQuizAnswer = async (quiz: LessonQuizWithQuestions) => {
    if (!user || !selectedQuizOption || questionStartedAt === null) {
      return;
    }

    const question = quiz.quiz_questions[activeQuizQuestionIndex];
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
      setActiveQuizQuestionIndex(nextQuestionIndex);
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
      setActiveQuizLessonId(null);
      setQuizAnswers([]);
      setSelectedQuizOption("");
      setQuestionStartedAt(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not submit quiz.",
      );
    } finally {
      setSavingQuizId(null);
    }
  };

  useEffect(() => {
    const loadCourse = async () => {
      setError(null);
      setIsLoading(true);

      try {
        const [nextCourse, nextModules] = await Promise.all([
          getCourseWithEditions(courseId),
          listCourseContent(courseId),
        ]);
        const nextProgress = user
          ? await listLessonProgress(courseId, user.id).catch(() => [])
          : [];
        const nextAttendance = user
          ? await listLessonAttendance(courseId, user.id).catch(() => [])
          : [];
        const nextAssignments = await listLessonAssignments(courseId).catch(
          () => [],
        );
        const nextQuizzes = await listLessonQuizzes(courseId).catch(() => []);
        const nextAssignmentSubmissions = user
          ? await listAssignmentSubmissionsByAssignmentIds(
              nextAssignments.map((assignment) => assignment.id),
              user.id,
            ).catch(() => [])
          : [];
        const nextQuizAttempts = user
          ? await listQuizAttemptsByQuizIds(
              nextQuizzes.map((quiz) => quiz.id),
              user.id,
            ).catch(() => [])
          : [];

        setCourse(nextCourse);
        setModules(nextModules);
        setCompletedLessonIds(
          new Set(nextProgress.map((progressItem) => progressItem.lesson_id)),
        );
        setAttendance(nextAttendance);
        setAssignments(nextAssignments);
        setAssignmentSubmissions(nextAssignmentSubmissions);
        setQuizzes(nextQuizzes);
        setQuizAttempts(nextQuizAttempts);
        setCollapsedModuleIds(new Set(nextModules.map((module) => module.id)));
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not load course.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadCourse();
  }, [courseId, user?.id]);

  return (
    <section className="page">
      <div className="page-header course-detail-header student-course-header">
        <div>
          <p className="eyebrow">Course</p>
          <h1>{course?.title ?? "Course"}</h1>
          {course?.description ? <p>{course.description}</p> : null}
        </div>
        <a className="text-link" href="#/courses">
          Back to my courses
        </a>
      </div>

      {error ? <p className="form-message error">{error}</p> : null}
      {isLoading ? <p>Loading course...</p> : null}

      {!isLoading && modules.length === 0 ? (
        <section className="content-panel compact">
          <p>No course content is available yet.</p>
        </section>
      ) : null}

      {!isLoading && modules.length > 0 ? (
        <section className="student-progress-panel">
          <div>
            <span>Lesson progress</span>
            <strong>{progress}%</strong>
          </div>
          <div className="student-progress-track">
            <span style={{ width: `${progress}%` }} />
          </div>
          <p>
            {completedCount} of {lessons.length} lessons viewed
          </p>
          <div className="student-requirements">
            <div>
              <span>Course completion requires</span>
              <div>
                <small>Instructor confirms attendance</small>
                <small>Student completes quiz</small>
                <small>Assignment reviewed</small>
              </div>
            </div>
            <div className="student-course-points">
              <span>Total accumulated</span>
              <strong>
                {formatPoints(courseEarnedPoints)}/
                {formatPoints(courseMaxPoints)} pts
              </strong>
              {courseHasPendingPoints ? <small>Some items pending</small> : null}
            </div>
          </div>
        </section>
      ) : null}

      <div className="student-course-shell">
        {modules.map((module, moduleIndex) => {
          const isModuleCollapsed = collapsedModuleIds.has(module.id);
          const moduleCompletedCount = module.lessons.filter((lesson) =>
            completedLessonIds.has(lesson.id),
          ).length;

          return (
            <article className="student-module" key={module.id}>
              <button
                aria-expanded={!isModuleCollapsed}
                className="student-module-header"
                title={getModuleTooltip(module)}
                type="button"
                onClick={() => toggleModule(module.id)}
              >
                <span>Module {moduleIndex + 1}</span>
                <div>
                  <h2>{module.title}</h2>
                  <p>{module.description || "No description yet."}</p>
                </div>
                <small title={getModuleTooltip(module)}>
                  {moduleCompletedCount}/{module.lessons.length}
                </small>
                {isModuleCollapsed ? (
                  <ChevronRight aria-hidden="true" size={20} />
                ) : (
                  <ChevronDown aria-hidden="true" size={20} />
                )}
              </button>
              {!isModuleCollapsed ? (
                <div className="student-lesson-list">
                  {module.lessons.length === 0 ? (
                    <p className="tree-empty">No lessons in this module.</p>
                  ) : null}
                  {module.lessons.map((lesson, lessonIndex) => {
                    const attendanceRecord = attendanceByLesson.get(lesson.id);
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
                      ? "Quiz completed"
                      : isQuizReady
                        ? "Quiz pending"
                        : "Quiz setup pending";
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
                        ? "Assignment reviewed"
                        : submission?.status === "needs_revision"
                          ? "Assignment needs revision"
                          : submission
                            ? "Assignment submitted"
                            : "Assignment pending";
                    const lessonPointSummary = getLessonPointSummary(lesson.id);

                    return (
                    <article
                      className={`student-lesson${
                        completedLessonIds.has(lesson.id) ? " is-viewed" : ""
                      }`}
                      key={lesson.id}
                    >
                      <header className="student-lesson-header">
                        <button
                          aria-label={
                            completedLessonIds.has(lesson.id)
                              ? "Mark lesson not viewed"
                              : "Mark lesson viewed"
                          }
                          className="student-complete-toggle"
                          disabled={savingLessonId === lesson.id}
                          type="button"
                          onClick={() => void toggleLessonComplete(lesson.id)}
                        >
                          {completedLessonIds.has(lesson.id) ? (
                            <CheckCircle2 aria-hidden="true" size={22} />
                          ) : (
                            <Circle aria-hidden="true" size={22} />
                          )}
                        </button>
                        <div>
                          <span>Lesson {lessonIndex + 1}</span>
                          <h3>{lesson.title}</h3>
                        </div>
                        <span
                          className="student-points-badge"
                          title={lessonPointSummary.tooltip}
                        >
                          {lessonPointSummary.label}
                        </span>
                      </header>
                      <div className="student-lesson-body">
                        <div className="student-status-row">
                          <span
                            className={
                              attendanceRecord?.attended ? "is-confirmed" : ""
                            }
                          >
                            {attendanceRecord?.attended
                              ? attendanceRecord.stayed_until_end
                                ? "Full class confirmed"
                                : "Attendance confirmed"
                              : "Attendance pending"}
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
                        {lesson.description ? (
                          <span>{lesson.description}</span>
                        ) : null}
                        {assignment ? (
                          <section className="student-assignment-panel">
                            <div className="student-assignment-main">
                              <ClipboardCheck
                                aria-hidden="true"
                                size={17}
                                strokeWidth={2.4}
                              />
                              <div>
                              <small>Assignment</small>
                              <strong>{assignment.title}</strong>
                              {assignment.description ? (
                                <p>{assignment.description}</p>
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
                                        )}/${formatPoints(assignment.points)} pts`
                                      : "Points pending"}
                                  </span>
                                  {submission?.submission_url ? (
                                    <a
                                      href={submission.submission_url}
                                      rel="noreferrer"
                                      target="_blank"
                                    >
                                      Submitted link
                                    </a>
                                  ) : null}
                                </div>
                                {submission?.status === "reviewed" ||
                                submission?.status === "needs_revision" ? (
                                  <span className="student-assignment-locked">
                                    Locked
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
                                    {submission ? "Update" : "Submit"}
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
                                  Submission link
                                  <input
                                    placeholder="Google Drive, GitHub, document or video link"
                                    type="url"
                                    value={assignmentUrl}
                                    onChange={(event) =>
                                      setAssignmentUrl(event.target.value)
                                    }
                                  />
                                </label>
                                <label>
                                  Notes
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
                                    Submit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveAssignmentLessonId(null)
                                    }
                                  >
                                    Cancel
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
                                <small>Quiz</small>
                                <strong>{quiz.title}</strong>
                                <p>10 questions. Score changes by response time.</p>
                              </div>
                            </div>
                            {quizAttempt ? (
                              <div className="student-assignment-meta">
                                <span className="student-quiz-result">
                                  Completed
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
                                  const question =
                                    quiz.quiz_questions[activeQuizQuestionIndex];

                                  return (
                                    <>
                                      <div className="student-quiz-progress">
                                        <span>
                                          Question {activeQuizQuestionIndex + 1}/
                                          {quiz.quiz_questions.length}
                                        </span>
                                        <span>
                                          2 pts under 30s · 1.5 under 60s · 1 after
                                        </span>
                                      </div>
                                      <strong>{question.question_text}</strong>
                                      <div className="student-quiz-options">
                                        {(["a", "b", "c", "d"] as const).map(
                                          (option) => (
                                            <label key={option}>
                                              <input
                                                checked={
                                                  selectedQuizOption === option
                                                }
                                                name={`quiz-${quiz.id}`}
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
                                            ? "Finish quiz"
                                            : "Next question"}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setActiveQuizLessonId(null)
                                          }
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            ) : (
                              <div className="student-assignment-side">
                                <div className="student-assignment-meta">
                                  <span>Points pending</span>
                                </div>
                                <button
                                  className="secondary-action student-submit-action"
                                  disabled={!isQuizReady}
                                  type="button"
                                  onClick={() => startQuiz(lesson.id)}
                                >
                                  {isQuizReady ? "Start quiz" : "Quiz pending"}
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
                                <span>Lesson video</span>
                              </a>
                            ) : null}
                            {lesson.resources.map((resource) =>
                              renderStudentResource(resource),
                            )}
                          </div>
                        ) : null}
                      </div>
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
