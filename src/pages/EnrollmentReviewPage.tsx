import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  listEnrollmentReviews,
  updateEnrollmentStatus,
  type EnrollmentReviewItem,
  type EnrollmentStatus,
} from "../services/courses";

const reviewStatuses: Array<"all" | EnrollmentStatus> = [
  "all",
  "pending",
  "approved",
  "rejected",
  "completed",
  "withdrawn",
];

function getStudentName(enrollment: EnrollmentReviewItem) {
  const profile = enrollment.profiles;

  if (!profile) {
    return "Unknown student";
  }

  return (
    profile.display_name ||
    `${profile.first_name} ${profile.last_name}`.trim() ||
    "Unnamed student"
  );
}

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}

function getCourseIdFilter() {
  const hashQuery = window.location.hash.split("?")[1] ?? "";
  return new URLSearchParams(hashQuery).get("courseId");
}

export function EnrollmentReviewPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentReviewItem[]>([]);
  const [courseIdFilter, setCourseIdFilter] = useState(getCourseIdFilter);
  const [statusFilter, setStatusFilter] = useState<"all" | EnrollmentStatus>(
    "pending",
  );
  const [updatingEnrollmentId, setUpdatingEnrollmentId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadEnrollments = async () => {
    setError(null);

    try {
      const nextEnrollments = await listEnrollmentReviews();
      setEnrollments(nextEnrollments);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load enrollment requests.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadEnrollments();
  }, []);

  useEffect(() => {
    const handleHashChange = () => setCourseIdFilter(getCourseIdFilter());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((enrollment) => {
      const matchesCourse =
        !courseIdFilter ||
        enrollment.course_editions?.course_id === courseIdFilter;
      const matchesStatus =
        statusFilter === "all" || enrollment.status === statusFilter;

      return matchesCourse && matchesStatus;
    });
  }, [courseIdFilter, enrollments, statusFilter]);

  const scopedEnrollments = useMemo(
    () =>
      courseIdFilter
        ? enrollments.filter(
            (enrollment) =>
              enrollment.course_editions?.course_id === courseIdFilter,
          )
        : enrollments,
    [courseIdFilter, enrollments],
  );

  const selectedCourseTitle =
    scopedEnrollments[0]?.course_editions?.courses?.title ?? null;

  const pendingCount = scopedEnrollments.filter(
    (enrollment) => enrollment.status === "pending",
  ).length;
  const approvedCount = scopedEnrollments.filter(
    (enrollment) => enrollment.status === "approved",
  ).length;

  const handleReview = async (
    enrollmentId: string,
    nextStatus: "approved" | "rejected",
  ) => {
    if (!user) {
      return;
    }

    setUpdatingEnrollmentId(enrollmentId);
    setError(null);
    setMessage(null);

    try {
      await updateEnrollmentStatus(enrollmentId, nextStatus, user.id);
      setMessage(
        nextStatus === "approved"
          ? "Enrollment approved."
          : "Enrollment rejected.",
      );
      await loadEnrollments();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update enrollment.",
      );
    } finally {
      setUpdatingEnrollmentId(null);
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Instructor</p>
          <h1>{selectedCourseTitle ?? "Enrollment Review"}</h1>
          {courseIdFilter ? (
            <p>Enrollment requests for this course.</p>
          ) : null}
        </div>
        {courseIdFilter ? (
          <a className="text-link" href="#/enrollments">
            All requests
          </a>
        ) : null}
      </div>

      {error ? <p className="form-message error">{error}</p> : null}
      {message ? <p className="form-message success">{message}</p> : null}

      <div className="stats-grid">
        <article className="stat-card">
          <span>Pending requests</span>
          <strong>{pendingCount}</strong>
        </article>
        <article className="stat-card">
          <span>Approved enrollments</span>
          <strong>{approvedCount}</strong>
        </article>
      </div>

      <section className="content-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Enrollment review</p>
            <h2>{courseIdFilter ? "Course requests" : "Requests"}</h2>
          </div>
          <select
            className="compact-select"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | EnrollmentStatus)
            }
          >
            {reviewStatuses.map((reviewStatus) => (
              <option key={reviewStatus} value={reviewStatus}>
                {reviewStatus === "all" ? "All statuses" : formatStatus(reviewStatus)}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? <p>Loading enrollment requests...</p> : null}
        {!isLoading && filteredEnrollments.length === 0 ? (
          <div className="empty-builder">
            <strong>No requests here</strong>
            <span>Enrollment requests will appear in this review queue.</span>
          </div>
        ) : null}

        <div className="enrollment-list">
          {filteredEnrollments.map((enrollment) => {
            const edition = enrollment.course_editions;
            const courseTitle = edition?.courses?.title ?? "Course";

            return (
              <article className="enrollment-row" key={enrollment.id}>
                <div>
                  <strong>{getStudentName(enrollment)}</strong>
                  <span>{courseTitle}</span>
                  <div className="mini-list">
                    <span>{formatStatus(enrollment.status)}</span>
                    <span>
                      Requested{" "}
                      {new Date(enrollment.requested_at).toLocaleDateString()}
                    </span>
                    {edition?.start_date ? (
                      <span>Starts {edition.start_date}</span>
                    ) : null}
                  </div>
                </div>
                <div className="row-actions">
                  <button
                    type="button"
                    disabled={
                      enrollment.status !== "pending" ||
                      updatingEnrollmentId === enrollment.id
                    }
                    onClick={() => void handleReview(enrollment.id, "approved")}
                  >
                    Approve
                  </button>
                  <button
                    className="danger-action"
                    type="button"
                    disabled={
                      enrollment.status !== "pending" ||
                      updatingEnrollmentId === enrollment.id
                    }
                    onClick={() => void handleReview(enrollment.id, "rejected")}
                  >
                    Reject
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}
