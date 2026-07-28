import { useEffect, useMemo, useState } from "react";
import { Check, ExternalLink, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
  listApprovedCourseStudents,
  getCourseWithEditions,
  type CourseStudentEnrollment,
  type CourseWithEditions,
} from "../services/courses";
import {
  listAssignmentSubmissionsByAssignmentIds,
  listCourseContent,
  listLessonAssignments,
  reviewAssignmentSubmission,
  type AssignmentSubmission,
  type LessonAssignment,
  type ModuleWithLessons,
} from "../services/content";
import {
  listTeachingCourses,
  type TeachingCourseAssignment,
} from "../services/instructors";

type AssignmentReviewPageProps = {
  courseId?: string;
};

type AssignmentColumn = {
  assignment: LessonAssignment;
  lessonIndex: number;
  lessonTitle: string;
  moduleTitle: string;
};

const pageSize = 50;

function getStudentName(enrollment: CourseStudentEnrollment) {
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

function formatStatus(status: string) {
  if (status === "reviewed") {
    return "Passed";
  }

  if (status === "needs_revision") {
    return "Failed";
  }

  return status.replace(/_/g, " ");
}

export function AssignmentReviewPage({ courseId }: AssignmentReviewPageProps) {
  const { user } = useAuth();
  const [teachingCourses, setTeachingCourses] = useState<
    TeachingCourseAssignment[]
  >([]);
  const [course, setCourse] = useState<CourseWithEditions | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [students, setStudents] = useState<CourseStudentEnrollment[]>([]);
  const [assignments, setAssignments] = useState<LessonAssignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [pointsBySubmission, setPointsBySubmission] = useState<
    Record<string, string>
  >({});
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [reviewingSubmissionId, setReviewingSubmissionId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadCourseList = async () => {
      if (!user || courseId) {
        return;
      }

      setError(null);
      setIsLoading(true);

      try {
        setTeachingCourses(await listTeachingCourses(user.id));
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

    void loadCourseList();
  }, [courseId, user]);

  useEffect(() => {
    const loadCourseAssignments = async () => {
      if (!courseId) {
        return;
      }

      setError(null);
      setIsLoading(true);

      try {
        const [nextCourse, nextModules, nextStudents, nextAssignments] =
          await Promise.all([
            getCourseWithEditions(courseId),
            listCourseContent(courseId),
            listApprovedCourseStudents(courseId),
            listLessonAssignments(courseId),
          ]);
        const nextSubmissions = await listAssignmentSubmissionsByAssignmentIds(
          nextAssignments.map((assignment) => assignment.id),
        );

        setCourse(nextCourse);
        setModules(nextModules);
        setStudents(nextStudents);
        setAssignments(nextAssignments);
        setSubmissions(nextSubmissions);
        setPointsBySubmission(
          Object.fromEntries(
            nextSubmissions.map((submission) => [
              submission.id,
              submission.points_awarded?.toString() ?? "",
            ]),
          ),
        );
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not load assignment table.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadCourseAssignments();
  }, [courseId]);

  const columns = useMemo(() => {
    const assignmentByLesson = new Map(
      assignments.map((assignment) => [assignment.lesson_id, assignment]),
    );
    const nextColumns: AssignmentColumn[] = [];

    modules.forEach((module) => {
      module.lessons.forEach((lesson, lessonIndex) => {
        const assignment = assignmentByLesson.get(lesson.id);

        if (assignment) {
          nextColumns.push({
            assignment,
            lessonIndex: lessonIndex + 1,
            lessonTitle: lesson.title,
            moduleTitle: module.title,
          });
        }
      });
    });

    return nextColumns;
  }, [assignments, modules]);

  const submissionByStudentAndAssignment = useMemo(() => {
    return new Map(
      submissions.map((submission) => [
        `${submission.student_id}:${submission.assignment_id}`,
        submission,
      ]),
    );
  }, [submissions]);

  const filteredStudents = students.filter((student) =>
    getStudentName(student).toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, pageCount);
  const paginatedStudents = filteredStudents.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  );

  const handleReview = async (
    submission: AssignmentSubmission,
    status: "reviewed" | "needs_revision",
  ) => {
    if (!user) {
      return;
    }

    const pointsValue = pointsBySubmission[submission.id]?.trim() ?? "";
    const pointsAwarded = Number(pointsValue);

    if (!pointsValue || !Number.isFinite(pointsAwarded) || pointsAwarded < 0) {
      setError("Points are required before marking an assignment.");
      setMessage(null);
      return;
    }

    setError(null);
    setMessage(null);
    setReviewingSubmissionId(submission.id);

    try {
      const reviewedSubmission = await reviewAssignmentSubmission({
        submissionId: submission.id,
        status,
        pointsAwarded,
        reviewedBy: user.id,
      });

      setSubmissions((current) =>
        current.map((currentSubmission) =>
          currentSubmission.id === submission.id
            ? reviewedSubmission
            : currentSubmission,
        ),
      );
      setMessage(status === "reviewed" ? "Marked as passed." : "Marked as failed.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update assignment.",
      );
    } finally {
      setReviewingSubmissionId(null);
    }
  };

  if (!courseId) {
    return (
      <section className="page">
        <div className="page-header">
          <div>
            <p className="eyebrow">Instructor</p>
            <h1>Assignments</h1>
          </div>
        </div>

        {error ? <p className="form-message error">{error}</p> : null}
        {isLoading ? <p>Loading courses...</p> : null}

        {!isLoading && teachingCourses.length === 0 ? (
          <section className="content-panel compact">
            <p>No courses are assigned to you yet.</p>
          </section>
        ) : null}

        <div className="course-list">
          {teachingCourses.map((assignment) => {
            const assignedCourse = assignment.courses;

            if (!assignedCourse) {
              return null;
            }

            return (
              <article className="course-row" key={assignment.course_id}>
                <div>
                  <h2>{assignedCourse.title}</h2>
                  <p>{assignedCourse.short_description || "No description yet."}</p>
                  <div className="mini-list">
                    <span>{assignedCourse.status.replace(/_/g, " ")}</span>
                  </div>
                </div>
                <div className="row-actions">
                  <a
                    className="action-link"
                    href={`#/assignments/${assignedCourse.id}`}
                  >
                    Assignments
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Assignments</p>
          <h1>{course?.title ?? "Course assignments"}</h1>
        </div>
        <a className="text-link" href="#/assignments">
          Back to courses
        </a>
      </div>

      {error ? <p className="form-message error">{error}</p> : null}
      {message ? <p className="form-message success">{message}</p> : null}
      {isLoading ? <p>Loading assignment table...</p> : null}

      {!isLoading ? (
        <section className="content-panel assignment-gradebook-panel">
          <div className="page-header compact-header">
            <div>
              <p className="eyebrow">Review</p>
              <h2>Student assignment table</h2>
            </div>
            <label className="assignment-search">
              <span>Search student</span>
              <input
                placeholder="Student name"
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </label>
          </div>

          {students.length === 0 ? <p>No approved students yet.</p> : null}
          {students.length > 0 && columns.length === 0 ? (
            <p>No assignments are configured for this course yet.</p>
          ) : null}
          {students.length > 0 && columns.length > 0 ? (
            <>
              <div className="assignment-table-scroll">
                <table className="assignment-gradebook-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      {columns.map((column) => (
                        <th key={column.assignment.id}>
                          <span>{column.moduleTitle}</span>
                          <strong>Lesson {column.lessonIndex}</strong>
                          <small>{column.lessonTitle}</small>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStudents.map((student) => (
                      <tr key={student.id}>
                        <th>{getStudentName(student)}</th>
                        {columns.map((column) => {
                          const submission = submissionByStudentAndAssignment.get(
                            `${student.student_id}:${column.assignment.id}`,
                          );
                          const pointsValue = submission
                            ? (pointsBySubmission[submission.id] ?? "")
                            : "";
                          const hasReviewPoints =
                            pointsValue.trim() !== "" &&
                            Number.isFinite(Number(pointsValue)) &&
                            Number(pointsValue) >= 0;

                          return (
                            <td key={column.assignment.id}>
                              {submission ? (
                                <div
                                  className={`assignment-cell is-${submission.status}${
                                    hasReviewPoints ? "" : " is-missing-points"
                                  }`}
                                >
                                  <div className="assignment-cell-top">
                                    <span>{formatStatus(submission.status)}</span>
                                    {submission.submission_url ? (
                                      <a
                                        href={submission.submission_url}
                                        rel="noreferrer"
                                        target="_blank"
                                      >
                                        <ExternalLink
                                          aria-hidden="true"
                                          size={13}
                                          strokeWidth={2.4}
                                        />
                                        URL
                                      </a>
                                    ) : null}
                                  </div>
                                  <label>
                                    Points
                                    <input
                                      min="0"
                                      required
                                      type="number"
                                      value={pointsValue}
                                      onChange={(event) =>
                                        setPointsBySubmission((current) => ({
                                          ...current,
                                          [submission.id]: event.target.value,
                                        }))
                                      }
                                    />
                                  </label>
                                  <div className="assignment-cell-actions">
                                    <button
                                      disabled={
                                        reviewingSubmissionId === submission.id ||
                                        !hasReviewPoints
                                      }
                                      type="button"
                                      onClick={() =>
                                        void handleReview(submission, "reviewed")
                                      }
                                    >
                                      <Check
                                        aria-hidden="true"
                                        size={13}
                                        strokeWidth={2.5}
                                      />
                                      Passed
                                    </button>
                                    <button
                                      disabled={
                                        reviewingSubmissionId === submission.id ||
                                        !hasReviewPoints
                                      }
                                      type="button"
                                      onClick={() =>
                                        void handleReview(
                                          submission,
                                          "needs_revision",
                                        )
                                      }
                                    >
                                      <X
                                        aria-hidden="true"
                                        size={13}
                                        strokeWidth={2.5}
                                      />
                                      Failed
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <span className="assignment-empty">
                                  No submission
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="assignment-pagination">
                <span>
                  {filteredStudents.length} students · page {safeCurrentPage} of{" "}
                  {pageCount}
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
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
