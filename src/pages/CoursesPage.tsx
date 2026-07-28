import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  listPublishedCourseEditions,
  requestEnrollment,
} from "../services/courses";

type PublishedEdition = Awaited<
  ReturnType<typeof listPublishedCourseEditions>
>[number];

export function CoursesPage() {
  const { user } = useAuth();
  const [editions, setEditions] = useState<PublishedEdition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestingEditionId, setRequestingEditionId] = useState<string | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEditions = async () => {
      setError(null);

      try {
        const nextEditions = await listPublishedCourseEditions(user?.id);
        setEditions(nextEditions);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not load courses.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadEditions();
  }, [user?.id]);

  const handleRequestEnrollment = async (courseEditionId: string) => {
    if (!user) {
      return;
    }

    setRequestingEditionId(courseEditionId);
    setError(null);
    setMessage(null);

    try {
      await requestEnrollment(courseEditionId, user.id);
      setMessage("Enrollment requested.");
      const nextEditions = await listPublishedCourseEditions(user.id);
      setEditions(nextEditions);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not request enrollment.",
      );
    } finally {
      setRequestingEditionId(null);
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1>My Courses</h1>
        </div>
      </div>

      {error ? <p className="form-message error">{error}</p> : null}
      {message ? <p className="form-message success">{message}</p> : null}
      {isLoading ? <p>Loading courses...</p> : null}
      {!isLoading && editions.length === 0 ? (
        <section className="content-panel compact">
          <p>No published courses are available yet.</p>
        </section>
      ) : null}

      <div className="course-list">
        {editions.map((edition) => {
          const enrollment = edition.enrollments[0];
          const canRequestAgain =
            enrollment?.status === "rejected" ||
            enrollment?.status === "withdrawn";
          const canRequest =
            edition.enrollment_open &&
            edition.status === "published" &&
            (!enrollment || canRequestAgain);
          const buttonLabel = enrollment
            ? canRequestAgain
              ? "Request again"
              : enrollment.status === "approved"
                ? "Start"
              : enrollment.status
            : "Enroll";

          return (
            <article className="course-row" key={edition.id}>
              <div>
                <h2>{edition.courses?.title ?? edition.title}</h2>
                <p>
                  {edition.courses?.short_description || "Course open."}
                </p>
                <div className="mini-list">
                  {edition.start_date ? (
                    <span>Starts {edition.start_date}</span>
                  ) : null}
                  <span>
                    {edition.enrollment_open
                      ? "Enrollment open"
                      : "Enrollment closed"}
                  </span>
                  {enrollment ? <span>{enrollment.status}</span> : null}
                </div>
              </div>
              <div className="row-actions">
                <span className="status-chip">{edition.status}</span>
                {enrollment?.status === "approved" && edition.courses ? (
                  <a className="action-link" href={`#/courses/${edition.courses.id}`}>
                    Start
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled={!canRequest || requestingEditionId === edition.id}
                    onClick={() => void handleRequestEnrollment(edition.id)}
                  >
                    {requestingEditionId === edition.id
                      ? "Requesting..."
                      : buttonLabel}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
