import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createCourse,
  createCourseEdition,
  getUniqueEditionSlug,
  listCoursesWithEditions,
  slugify,
  type CourseWithEditions,
} from "../services/courses";
import type { Enums } from "../types/database.types";

type CourseStatus = Enums<"course_status">;

function getErrorMessage(caughtError: unknown, fallback: string) {
  if (caughtError instanceof Error) {
    return caughtError.message;
  }

  if (
    caughtError &&
    typeof caughtError === "object" &&
    "message" in caughtError &&
    typeof caughtError.message === "string"
  ) {
    return caughtError.message;
  }

  return fallback;
}

export function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseWithEditions[]>([]);
  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [courseStatus, setCourseStatus] = useState<CourseStatus>("draft");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [editionTitle, setEditionTitle] = useState("");
  const [editionStatus, setEditionStatus] = useState<CourseStatus>("draft");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [capacity, setCapacity] = useState("");
  const [enrollmentOpen, setEnrollmentOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const courseOptions = useMemo(
    () => courses.map((course) => ({ id: course.id, title: course.title })),
    [courses],
  );

  const loadCourses = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextCourses = await listCoursesWithEditions();
      setCourses(nextCourses);
      setSelectedCourseId((current) => current || nextCourses[0]?.id || "");
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
      const createdCourse = await createCourse({
        title,
        slug: slugify(title),
        short_description: shortDescription || null,
        description: shortDescription || null,
        status: courseStatus,
      });

      setTitle("");
      setShortDescription("");
      setCourseStatus("draft");
      setSelectedCourseId(createdCourse.id);
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

  const handleCreateEdition = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      if (startDate && endDate && endDate < startDate) {
        throw new Error("End date must be after the start date.");
      }

      const editionSlug = await getUniqueEditionSlug(
        selectedCourseId,
        editionTitle,
      );

      await createCourseEdition({
        course_id: selectedCourseId,
        title: editionTitle,
        slug: editionSlug,
        status: editionStatus,
        start_date: startDate || null,
        end_date: endDate || null,
        capacity: capacity ? Number(capacity) : null,
        enrollment_open: enrollmentOpen,
        requires_approval: true,
      });

      setEditionTitle("");
      setEditionStatus("draft");
      setStartDate("");
      setEndDate("");
      setCapacity("");
      setEnrollmentOpen(false);
      setMessage("Course edition created.");
      await loadCourses();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Could not create edition."));
    } finally {
      setIsSubmitting(false);
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

      <div className="split-grid">
        <section className="content-panel">
          <h2>Create course</h2>
          <form className="stacked-form" onSubmit={handleCreateCourse}>
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
                <option value="archived">Archived</option>
              </select>
            </label>
            <button type="submit" disabled={isSubmitting}>
              Create course
            </button>
          </form>
        </section>

        <section className="content-panel">
          <h2>Create edition</h2>
          <form className="stacked-form" onSubmit={handleCreateEdition}>
            <label>
              Course
              <select
                required
                value={selectedCourseId}
                onChange={(event) => setSelectedCourseId(event.target.value)}
              >
                <option value="" disabled>
                  Select course
                </option>
                {courseOptions.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Edition title
              <input
                required
                type="text"
                value={editionTitle}
                onChange={(event) => setEditionTitle(event.target.value)}
              />
            </label>
            <div className="form-grid">
              <label>
                Start date
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </label>
              <label>
                End date
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </label>
            </div>
            <div className="form-grid">
              <label>
                Capacity
                <input
                  min="1"
                  type="number"
                  value={capacity}
                  onChange={(event) => setCapacity(event.target.value)}
                />
              </label>
              <label>
                Status
                <select
                  value={editionStatus}
                  onChange={(event) =>
                    setEditionStatus(event.target.value as CourseStatus)
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="enrollment_closed">Enrollment closed</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
            </div>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={enrollmentOpen}
                onChange={(event) => setEnrollmentOpen(event.target.checked)}
              />
              Enrollment open
            </label>
            <button type="submit" disabled={isSubmitting || !selectedCourseId}>
              Create edition
            </button>
          </form>
        </section>
      </div>

      <section className="content-panel">
        <h2>Course inventory</h2>
        {isLoading ? <p>Loading courses...</p> : null}
        {!isLoading && courses.length === 0 ? <p>No courses created yet.</p> : null}
        <div className="course-list">
          {courses.map((course) => (
            <article className="course-row" key={course.id}>
              <div>
                <h2>{course.title}</h2>
                <p>{course.short_description || "No description yet."}</p>
                <div className="mini-list">
                  {course.course_editions.length === 0 ? (
                    <span>No editions</span>
                  ) : (
                    course.course_editions.map((edition) => (
                      <span key={edition.id}>
                        {edition.title} · {edition.status}
                      </span>
                    ))
                  )}
                </div>
              </div>
              <div className="row-actions">
                <span className="status-chip">{course.status}</span>
                <a className="action-link" href={`#/admin/courses/${course.id}`}>
                  Open
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
