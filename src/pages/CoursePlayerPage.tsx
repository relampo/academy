import { useEffect, useState } from "react";
import {
  listCourseContent,
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

export function CoursePlayerPage({ courseId }: CoursePlayerPageProps) {
  const [course, setCourse] = useState<CourseWithEditions | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="page-header course-detail-header">
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

      <div className="content-tree">
        {modules.map((module, moduleIndex) => (
          <article className="module-block" key={module.id}>
            <div className="module-heading">
              <div>
                <h2>
                  Module {moduleIndex + 1}: <span>{module.title}</span>
                </h2>
                <p>{module.description || "No description yet."}</p>
              </div>
            </div>
            <div className="lesson-list">
              {module.lessons.length === 0 ? (
                <p className="tree-empty">No lessons in this module.</p>
              ) : null}
              {module.lessons.map((lesson, lessonIndex) => (
                <div className="lesson-row" key={lesson.id}>
                  <div className="lesson-heading">
                    <div>
                      <strong>
                        Lesson {lessonIndex + 1}: <span>{lesson.title}</span>
                      </strong>
                    </div>
                  </div>
                  <div className="lesson-details">
                    {lesson.description ? <span>{lesson.description}</span> : null}
                    {lesson.content ? <p>{lesson.content}</p> : null}
                    <div className="mini-list">
                      {lesson.duration_minutes ? (
                        <span>{lesson.duration_minutes} min</span>
                      ) : null}
                      {lesson.video_url ? (
                        <a href={lesson.video_url} rel="noreferrer" target="_blank">
                          Video
                        </a>
                      ) : null}
                    </div>
                    {lesson.resources.length > 0 ? (
                      <div className="resource-list">
                        {lesson.resources.map((resource) =>
                          resource.external_url ? (
                            <a
                              href={resource.external_url}
                              key={resource.id}
                              rel="noreferrer"
                              target="_blank"
                            >
                              <span>
                                {resourceTypeLabels[resource.resource_type] ??
                                  resource.resource_type}
                              </span>
                              {resource.title}
                            </a>
                          ) : (
                            <div className="resource-item" key={resource.id}>
                              <span>
                                {resourceTypeLabels[resource.resource_type] ??
                                  resource.resource_type}
                              </span>
                              {resource.title}
                            </div>
                          ),
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
