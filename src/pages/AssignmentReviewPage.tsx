import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  listAssignmentReviewItems,
  reviewAssignmentSubmission,
  type AssignmentReviewItem,
} from "../services/content";

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}

function getStudentName(submission: AssignmentReviewItem) {
  const profile = submission.profiles;

  if (!profile) {
    return "Unknown student";
  }

  return (
    profile.display_name ||
    `${profile.first_name} ${profile.last_name}`.trim() ||
    "Unnamed student"
  );
}

export function AssignmentReviewPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<AssignmentReviewItem[]>([]);
  const [pointsBySubmission, setPointsBySubmission] = useState<
    Record<string, string>
  >({});
  const [reviewingSubmissionId, setReviewingSubmissionId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadSubmissions = async () => {
      setError(null);
      setIsLoading(true);

      try {
        const nextSubmissions = await listAssignmentReviewItems();
        setSubmissions(nextSubmissions);
        setPointsBySubmission(
          Object.fromEntries(
            nextSubmissions.map((submission) => [
              submission.id,
              submission.points_awarded?.toString() ??
                submission.lesson_assignments?.points?.toString() ??
                "10",
            ]),
          ),
        );
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not load assignment submissions.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadSubmissions();
  }, []);

  const handleReview = async (
    submission: AssignmentReviewItem,
    status: "reviewed" | "needs_revision",
  ) => {
    if (!user) {
      return;
    }

    setError(null);
    setMessage(null);
    setReviewingSubmissionId(submission.id);

    try {
      const reviewedSubmission = await reviewAssignmentSubmission({
        submissionId: submission.id,
        status,
        pointsAwarded:
          status === "reviewed" && pointsBySubmission[submission.id]
            ? Number(pointsBySubmission[submission.id])
            : null,
        reviewedBy: user.id,
      });

      setSubmissions((current) =>
        current.map((currentSubmission) =>
          currentSubmission.id === submission.id
            ? { ...currentSubmission, ...reviewedSubmission }
            : currentSubmission,
        ),
      );
      setMessage(
        status === "reviewed"
          ? "Assignment reviewed."
          : "Revision requested.",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not review assignment.",
      );
    } finally {
      setReviewingSubmissionId(null);
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Instructor</p>
          <h1>Assignments</h1>
        </div>
      </div>

      {error ? <p className="form-message error">{error}</p> : null}
      {message ? <p className="form-message success">{message}</p> : null}
      {isLoading ? <p>Loading assignment submissions...</p> : null}

      {!isLoading ? (
        <section className="content-panel compact assignment-review-panel">
          <div className="page-header compact-header">
            <div>
              <p className="eyebrow">Review</p>
              <h2>Student submissions</h2>
            </div>
          </div>

          {submissions.length === 0 ? (
            <p>No assignment submissions yet.</p>
          ) : (
            <div className="assignment-review-list">
              {submissions.map((submission) => {
                const assignment = submission.lesson_assignments;
                const lesson = assignment?.lessons;

                return (
                  <article
                    className="assignment-review-row"
                    key={submission.id}
                  >
                    <div>
                      <div className="mini-list">
                        <span>{formatStatus(submission.status)}</span>
                        {lesson?.modules?.title ? (
                          <span>{lesson.modules.title}</span>
                        ) : null}
                      </div>
                      <h3>{assignment?.title ?? "Assignment"}</h3>
                      <p>
                        {getStudentName(submission)} ·{" "}
                        {lesson?.title ?? "Lesson"}
                      </p>
                      {submission.submission_url ? (
                        <a
                          className="text-link"
                          href={submission.submission_url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Open submission
                        </a>
                      ) : null}
                      {submission.notes ? <p>{submission.notes}</p> : null}
                    </div>
                    <div className="assignment-review-actions">
                      <label>
                        Points
                        <input
                          min="0"
                          type="number"
                          value={pointsBySubmission[submission.id] ?? ""}
                          onChange={(event) =>
                            setPointsBySubmission((current) => ({
                              ...current,
                              [submission.id]: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <button
                        className="primary-action"
                        disabled={reviewingSubmissionId === submission.id}
                        type="button"
                        onClick={() => void handleReview(submission, "reviewed")}
                      >
                        Approve
                      </button>
                      <button
                        className="secondary-action"
                        disabled={reviewingSubmissionId === submission.id}
                        type="button"
                        onClick={() =>
                          void handleReview(submission, "needs_revision")
                        }
                      >
                        Needs revision
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
    </section>
  );
}
