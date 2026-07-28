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
        caughtError instanceof Error ? caughtError.message : "Could not load courses.",
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
      setMessage("Course created.");
      await loadCourses();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not create course.",
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
      setMessage(`Duplicated "${copiedCourse.title}".`);
      await loadCourses();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not duplicate course.",
      );
    } finally {
      setDuplicatingCourseId(null);
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Courses</h1>
        </div>
      </div>

      {error ? <p className="form-message error">{error}</p> : null}
      {message ? <p className="form-message success">{message}</p> : null}

      <div className="course-admin-grid">
        <section className="content-panel compact-panel course-create-panel">
          <h2>Create course</h2>
          <form
            className="stacked-form compact-course-form"
            onSubmit={handleCreateCourse}
          >
            <label>
              Title
              <input
                required
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label>
              Short description
              <textarea
                value={shortDescription}
                onChange={(event) => setShortDescription(event.target.value)}
              />
            </label>
            <label>
              Status
              <select
                value={courseStatus}
                onChange={(event) =>
                  setCourseStatus(event.target.value as CourseStatus)
                }
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="enrollment_closed">Enrollment closed</option>
              </select>
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={enrollmentOpen}
                onChange={(event) => setEnrollmentOpen(event.target.checked)}
              />
              Enrollment open
            </label>
            <button type="submit" disabled={isSubmitting}>
              Create course
            </button>
          </form>
        </section>

        <section className="content-panel course-inventory-panel">
          <h2>Course inventory</h2>
          {isLoading ? <p>Loading courses...</p> : null}
          {!isLoading && courses.length === 0 ? <p>No courses created yet.</p> : null}
          <div className="course-list">
            {courses.map((course) => {
              const offering = course.course_editions[0];

              return (
                <article className="course-row" key={course.id}>
                  <div>
                    <h2>{course.title}</h2>
                    <p>{course.short_description || "No description yet."}</p>
                    <div className="mini-list">
                      <span>{course.status}</span>
                      <span>
                        {offering?.enrollment_open
                          ? "Enrollment open"
                          : "Enrollment closed"}
                      </span>
                      {offering?.capacity ? (
                        <span>{offering.capacity} seats</span>
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
                        ? "Duplicating..."
                        : "Duplicate"}
                    </button>
                    <a className="action-link" href={`#/admin/courses/${course.id}`}>
                      Open
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
