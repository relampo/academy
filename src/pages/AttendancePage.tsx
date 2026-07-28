import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  listCourseContent,
  listLessonAttendance,
  saveLessonAttendance,
  type LessonAttendance,
  type LessonWithResources,
  type ModuleWithLessons,
} from "../services/content";
import {
  getCourseWithEditions,
  listApprovedCourseStudents,
  type CourseStudentEnrollment,
  type CourseWithEditions,
} from "../services/courses";

type AttendancePageProps = {
  courseId: string;
};

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

function getLessonLabel(lesson: LessonWithResources, modules: ModuleWithLessons[]) {
  const moduleIndex = modules.findIndex((module) => module.id === lesson.module_id);
  const module = modules[moduleIndex];
  const lessonIndex = module?.lessons.findIndex((item) => item.id === lesson.id) ?? -1;

  return `M${moduleIndex + 1} · L${lessonIndex + 1} · ${lesson.title}`;
}

export function AttendancePage({ courseId }: AttendancePageProps) {
  const { user } = useAuth();
  const [course, setCourse] = useState<CourseWithEditions | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [students, setStudents] = useState<CourseStudentEnrollment[]>([]);
  const [attendance, setAttendance] = useState<LessonAttendance[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lessons = useMemo(
    () => modules.flatMap((module) => module.lessons),
    [modules],
  );
  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId);
  const attendanceByStudent = useMemo(
    () =>
      new Map(
        attendance
          .filter((record) => record.lesson_id === selectedLessonId)
          .map((record) => [record.student_id, record]),
      ),
    [attendance, selectedLessonId],
  );

  useEffect(() => {
    const loadPage = async () => {
      setError(null);
      setIsLoading(true);

      try {
        const [nextCourse, nextModules, nextStudents, nextAttendance] =
          await Promise.all([
            getCourseWithEditions(courseId),
            listCourseContent(courseId),
            listApprovedCourseStudents(courseId),
            listLessonAttendance(courseId),
          ]);

        setCourse(nextCourse);
        setModules(nextModules);
        setStudents(nextStudents);
        setAttendance(nextAttendance);
        setSelectedLessonId((current) => current || nextModules[0]?.lessons[0]?.id || "");
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not load attendance.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadPage();
  }, [courseId]);

  const handleAttendanceChange = async (
    studentId: string,
    nextValues: { attended: boolean; stayedUntilEnd: boolean },
  ) => {
    if (!user || !selectedLessonId) {
      return;
    }

    const key = `${selectedLessonId}:${studentId}`;
    const now = new Date().toISOString();
    const previousAttendance = attendance;
    const existingRecord = attendanceByStudent.get(studentId);
    const optimisticRecord: LessonAttendance = {
      id: existingRecord?.id ?? key,
      lesson_id: selectedLessonId,
      student_id: studentId,
      attended: nextValues.attended,
      stayed_until_end: nextValues.attended && nextValues.stayedUntilEnd,
      confirmed_by: user.id,
      confirmed_at: now,
      created_at: existingRecord?.created_at ?? now,
      updated_at: now,
    };

    setAttendance((current) => {
      const withoutCurrent = current.filter(
        (record) =>
          !(
            record.lesson_id === selectedLessonId &&
            record.student_id === studentId
          ),
      );

      return [...withoutCurrent, optimisticRecord];
    });
    setSavingKey(key);
    setError(null);
    setMessage(null);

    try {
      const savedRecord = await saveLessonAttendance({
        lessonId: selectedLessonId,
        studentId,
        attended: nextValues.attended,
        stayedUntilEnd: nextValues.stayedUntilEnd,
        confirmedBy: user.id,
      });
      setAttendance((current) => {
        const withoutCurrent = current.filter(
          (record) =>
            !(
              record.lesson_id === selectedLessonId &&
              record.student_id === studentId
            ),
        );

        return [...withoutCurrent, savedRecord];
      });
      setMessage("Attendance updated.");
    } catch (caughtError) {
      setAttendance(previousAttendance);
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update attendance.",
      );
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Instructor</p>
          <h1>{course?.title ?? "Attendance"}</h1>
          <p>Confirm attendance and full-class participation by lesson.</p>
        </div>
        <a className="text-link" href="#/teaching">
          Back to teaching
        </a>
      </div>

      {error ? <p className="form-message error">{error}</p> : null}
      {message ? <p className="form-message success">{message}</p> : null}
      {isLoading ? <p>Loading attendance...</p> : null}

      {!isLoading ? (
        <section className="content-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Attendance</p>
              <h2>{selectedLesson?.title ?? "Select a lesson"}</h2>
            </div>
            <select
              className="compact-select"
              value={selectedLessonId}
              onChange={(event) => setSelectedLessonId(event.target.value)}
            >
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {getLessonLabel(lesson, modules)}
                </option>
              ))}
            </select>
          </div>

          {students.length === 0 ? (
            <div className="empty-builder">
              <strong>No approved students yet</strong>
              <span>Approved enrollments will appear here.</span>
            </div>
          ) : null}

          <div className="attendance-list">
            {students.map((student) => {
              const record = attendanceByStudent.get(student.student_id);
              const attended = record?.attended ?? false;
              const stayedUntilEnd = record?.stayed_until_end ?? false;
              const key = `${selectedLessonId}:${student.student_id}`;

              return (
                <article className="attendance-row" key={student.student_id}>
                  <div>
                    <strong>{getStudentName(student)}</strong>
                    <span>{student.profiles?.id}</span>
                  </div>
                  <label className="toggle-row compact-toggle">
                    <input
                      checked={attended}
                      disabled={savingKey === key}
                      type="checkbox"
                      onChange={(event) =>
                        void handleAttendanceChange(student.student_id, {
                          attended: event.target.checked,
                          stayedUntilEnd: event.target.checked
                            ? stayedUntilEnd
                            : false,
                        })
                      }
                    />
                    Attended
                  </label>
                  <label className="toggle-row compact-toggle">
                    <input
                      checked={stayedUntilEnd}
                      disabled={!attended || savingKey === key}
                      type="checkbox"
                      onChange={(event) =>
                        void handleAttendanceChange(student.student_id, {
                          attended,
                          stayedUntilEnd: event.target.checked,
                        })
                      }
                    />
                    Full class
                  </label>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </section>
  );
}
