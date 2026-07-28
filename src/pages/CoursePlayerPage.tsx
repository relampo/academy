import { useEffect, useState } from "react";
import {
  CheckCircle2,
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
  listCourseContent,
  type Resource,
  type ModuleWithLessons,
} from "../services/content";
import {
  getCourseWithEditions,
  type CourseWithEditions,
} from "../services/courses";

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
      <small>{label}</small>
    </>
  );

  return resource.external_url ? (
    <a
      className="student-resource-chip"
      href={resource.external_url}
      key={resource.id}
      rel="noreferrer"
      target="_blank"
    >
      {content}
    </a>
  ) : (
    <div className="student-resource-chip" key={resource.id}>
      {content}
    </div>
  );
}

export function CoursePlayerPage({ courseId }: CoursePlayerPageProps) {
  const [course, setCourse] = useState<CourseWithEditions | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lessons = modules.flatMap((module) => module.lessons);
  const completedCount = lessons.filter((lesson) =>
    completedLessonIds.has(lesson.id),
  ).length;
  const progress =
    lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  const toggleLessonComplete = (lessonId: string) => {
    setCompletedLessonIds((current) => {
      const next = new Set(current);

      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
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

        setCourse(nextCourse);
        setModules(nextModules);
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
  }, [courseId]);

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
            <span>Progress</span>
            <strong>{progress}%</strong>
          </div>
          <div className="student-progress-track">
            <span style={{ width: `${progress}%` }} />
          </div>
          <p>
            {completedCount} of {lessons.length} lessons completed
          </p>
        </section>
      ) : null}

      <div className="student-course-shell">
        {modules.map((module, moduleIndex) => (
          <article className="student-module" key={module.id}>
            <header className="student-module-header">
              <span>Module {moduleIndex + 1}</span>
              <div>
                <h2>{module.title}</h2>
                <p>{module.description || "No description yet."}</p>
              </div>
            </header>
            <div className="student-lesson-list">
              {module.lessons.length === 0 ? (
                <p className="tree-empty">No lessons in this module.</p>
              ) : null}
              {module.lessons.map((lesson, lessonIndex) => (
                <article className="student-lesson" key={lesson.id}>
                  <header className="student-lesson-header">
                    <button
                      aria-label={
                        completedLessonIds.has(lesson.id)
                          ? "Mark lesson incomplete"
                          : "Mark lesson complete"
                      }
                      className="student-complete-toggle"
                      type="button"
                      onClick={() => toggleLessonComplete(lesson.id)}
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
                    {lesson.description ? <span>{lesson.description}</span> : null}
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
                            <small>Video</small>
                          </a>
                        ) : null}
                        {lesson.resources.map((resource) =>
                          renderStudentResource(resource),
                        )}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
