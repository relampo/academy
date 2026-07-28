import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Circle,
  Clock3,
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
  listAssignmentSubmissionsByAssignmentIds,
  listCourseContent,
  markLessonViewed,
  unmarkLessonViewed,
  type AssignmentSubmission,
  type LessonAttendance,
  type LessonAssignment,
  type Resource,
  type ModuleWithLessons,
} from "../services/content";
import {
  getCourseWithEditions,
  type CourseWithEditions,
} from "../services/courses";
import { useAuth } from "../hooks/useAuth";

type CoursePlayerPageProps = {
  courseId: string;
};

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
  const [collapsedModuleIds, setCollapsedModuleIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [savingLessonId, setSavingLessonId] = useState<string | null>(null);
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
        const nextAssignmentSubmissions = user
          ? await listAssignmentSubmissionsByAssignmentIds(
              nextAssignments.map((assignment) => assignment.id),
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
            <span>Course completion requires</span>
            <div>
              <small>Instructor confirms attendance</small>
              <small>Student completes quiz</small>
              <small>Assignment reviewed</small>
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
                type="button"
                onClick={() => toggleModule(module.id)}
              >
                <span>Module {moduleIndex + 1}</span>
                <div>
                  <h2>{module.title}</h2>
                  <p>{module.description || "No description yet."}</p>
                </div>
                <small>
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
                    const submission = assignment
                      ? submissionByAssignment.get(assignment.id)
                      : null;
                    const assignmentStatusClass =
                      submission?.status === "reviewed"
                        ? "is-confirmed"
                        : submission
                          ? "is-submitted"
                          : "";
                    const assignmentStatusLabel =
                      submission?.status === "reviewed"
                        ? "Assignment reviewed"
                        : submission
                          ? "Assignment submitted"
                          : "Assignment pending";

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
                        {lesson.duration_minutes ? (
                          <span className="student-duration">
                            <Clock3 aria-hidden="true" size={15} />
                            {lesson.duration_minutes} min
                          </span>
                        ) : null}
                      </header>
                      <div className="student-lesson-body">
                        <div className="student-status-row">
                          <span
                            className={
                              attendanceRecord?.attended ? "is-confirmed" : ""
                            }
                          >
                            {attendanceRecord?.attended
                              ? "Attendance confirmed"
                              : "Attendance pending"}
                          </span>
                          <span>Quiz pending</span>
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
