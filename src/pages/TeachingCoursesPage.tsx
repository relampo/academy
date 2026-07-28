import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  listTeachingCourses,
  type TeachingCourseAssignment,
} from "../services/instructors";

function formatStatus(value: string) {
  return value.replace(/_/g, " ");
}

export function TeachingCoursesPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<TeachingCourseAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAssignments = async () => {
      if (!user) {
        return;
      }

      setError(null);
      setIsLoading(true);

      try {
        setAssignments(await listTeachingCourses(user.id));
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not load teaching courses.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadAssignments();
  }, [user]);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Instructor</p>
          <h1>Teaching Courses</h1>
        </div>
      </div>

      {error ? <p className="form-message error">{error}</p> : null}
      {isLoading ? <p>Loading teaching courses...</p> : null}

      {!isLoading && assignments.length === 0 ? (
        <section className="content-panel compact">
          <p>No courses are assigned to you yet.</p>
        </section>
      ) : null}

      <div className="course-list">
        {assignments.map((assignment) => {
          const course = assignment.courses;

          if (!course) {
            return null;
          }

          return (
            <article className="course-row" key={assignment.course_id}>
              <div>
                <h2>{course.title}</h2>
                <p>{course.short_description || "No description yet."}</p>
                <div className="mini-list">
                  <span>{formatStatus(course.status)}</span>
                  <span>
                    Assigned{" "}
                    {new Date(assignment.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="row-actions">
                <a className="action-link" href={`#/admin/courses/${course.id}`}>
                  Open
                </a>
                <a
                  className="secondary-action"
                  href={`#/enrollments?courseId=${course.id}`}
                >
                  Requests
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
