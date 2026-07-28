import { useEffect, useState } from "react";
import { Check, ExternalLink, RotateCcw } from "lucide-react";
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

const pageSize = 20;

export function AssignmentReviewPage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<AssignmentReviewItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
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

  const filteredSubmissions = submissions.filter((submission) => {
    const assignment = submission.lesson_assignments;
    const lesson = assignment?.lessons;
    const searchableText = [
      assignment?.title,
      lesson?.title,
      lesson?.modules?.title,
      getStudentName(submission),
      submission.status,
      submission.notes,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(searchTerm.trim().toLowerCase());
  });
  const pageCount = Math.max(1, Math.ceil(filteredSubmissions.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const paginatedSubmissions = filteredSubmissions.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  );

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
            <label className="assignment-search">
              <span>Search</span>
              <input
                placeholder="Student, lesson or status"
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </label>
          </div>

          {submissions.length === 0 ? (
            <p>No assignment submissions yet.</p>
          ) : filteredSubmissions.length === 0 ? (
            <p>No submissions match your search.</p>
          ) : (
            <>
            <div className="assignment-review-grid">
              {paginatedSubmissions.map((submission) => {
                const assignment = submission.lesson_assignments;
                const lesson = assignment?.lessons;

                return (
                  <article
                    className={`assignment-review-card is-${submission.status}`}
                    key={submission.id}
                  >
                    <div>
                      <div className="assignment-card-meta">
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
                          className="assignment-open-link"
                          href={submission.submission_url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <ExternalLink
                            aria-hidden="true"
                            size={14}
                            strokeWidth={2.4}
                          />
                          Open
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
                        <Check aria-hidden="true" size={15} strokeWidth={2.5} />
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
                        <RotateCcw
                          aria-hidden="true"
                          size={15}
                          strokeWidth={2.4}
                        />
                        Revision
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="assignment-pagination">
              <span>
                {filteredSubmissions.length} submissions · page{" "}
                {safeCurrentPage} of {pageCount}
              </span>
              <div>
                <button
                  disabled={safeCurrentPage === 1}
                  type="button"
                  onClick={() =>
                    setCurrentPage((current) => Math.max(1, current - 1))
                  }
                >
                  Previous
                </button>
                <button
                  disabled={safeCurrentPage === pageCount}
                  type="button"
                  onClick={() =>
                    setCurrentPage((current) =>
                      Math.min(pageCount, current + 1),
                    )
                  }
                >
                  Next
                </button>
              </div>
            </div>
            </>
          )}
        </section>
      ) : null}
    </section>
  );
}
