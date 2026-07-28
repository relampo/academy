import { useEffect, useState, type FormEvent } from "react";
import {
  createLesson,
  createModule,
  createResource,
  getNextModulePosition,
  listCourseContent,
  updateModule,
  type ModuleWithLessons,
} from "../services/content";
import {
  getCourseWithEditions,
  slugify,
  updateCourse,
  updateCourseEdition,
  type CourseWithEditions,
} from "../services/courses";
import type { Enums } from "../types/database.types";

type CourseStatus = Enums<"course_status">;
type LessonStatus = Enums<"lesson_status">;

const resourceTypeLabels: Record<string, string> = {
  external_link: "External link",
  pdf: "PDF",
  slides: "Slides",
  zip: "ZIP",
  script: "Script",
  report: "Report",
};

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

type AdminCourseDetailPageProps = {
  courseId: string;
};

type PendingDelete =
  | { type: "course"; title: string }
  | { type: "module"; module: ModuleWithLessons };

export function AdminCourseDetailPage({ courseId }: AdminCourseDetailPageProps) {
  const [course, setCourse] = useState<CourseWithEditions | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<CourseStatus>("draft");
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [editingEditionStartDate, setEditingEditionStartDate] = useState("");
  const [editingEditionEndDate, setEditingEditionEndDate] = useState("");
  const [editingEditionCapacity, setEditingEditionCapacity] = useState("");
  const [editingEditionStatus, setEditingEditionStatus] =
    useState<CourseStatus>("draft");
  const [editingEditionEnrollmentOpen, setEditingEditionEnrollmentOpen] =
    useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [moduleStatus, setModuleStatus] = useState<LessonStatus>("draft");
  const [lessonModuleId, setLessonModuleId] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonDuration, setLessonDuration] = useState("");
  const [lessonStatus, setLessonStatus] = useState<LessonStatus>("draft");
  const [resourceLessonId, setResourceLessonId] = useState("");
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceType, setResourceType] = useState("external_link");
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [activeLessonModuleId, setActiveLessonModuleId] = useState<string | null>(
    null,
  );
  const [activeResourceLessonId, setActiveResourceLessonId] = useState<
    string | null
  >(null);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState("");
  const [editingModuleDescription, setEditingModuleDescription] = useState("");
  const [editingModuleStatus, setEditingModuleStatus] =
    useState<LessonStatus>("draft");
  const [collapsedModuleIds, setCollapsedModuleIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [collapsedLessonIds, setCollapsedLessonIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCourse = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextCourse = await getCourseWithEditions(courseId);
      const nextModules = await listCourseContent(courseId);
      setCourse(nextCourse);
      setModules(nextModules);
      setCollapsedModuleIds(new Set(nextModules.map((module) => module.id)));
      setCollapsedLessonIds(
        new Set(
          nextModules.flatMap((module) =>
            module.lessons.map((lesson) => lesson.id),
          ),
        ),
      );
      setTitle(nextCourse.title);
      setDescription(nextCourse.description ?? nextCourse.short_description ?? "");
      setStatus(nextCourse.status);
      setIsEditingCourse(false);
      const primaryOffering = nextCourse.course_editions[0];
      setEditingEditionStartDate(primaryOffering?.start_date ?? "");
      setEditingEditionEndDate(primaryOffering?.end_date ?? "");
      setEditingEditionCapacity(
        primaryOffering?.capacity ? String(primaryOffering.capacity) : "",
      );
      setEditingEditionStatus(primaryOffering?.status ?? "draft");
      setEditingEditionEnrollmentOpen(primaryOffering?.enrollment_open ?? false);
      setLessonModuleId((current) => current || nextModules[0]?.id || "");
      setResourceLessonId(
        (current) => current || nextModules[0]?.lessons[0]?.id || "",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Could not load course.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadCourse();
  }, [courseId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      await updateCourse(courseId, {
        title,
        slug: slugify(title),
        short_description: description || null,
        description: description || null,
        status,
      });

      setMessage("Course updated.");
      await loadCourse();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update course.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEditCourse = () => {
    if (!course) {
      return;
    }

    setTitle(course.title);
    setDescription(course.description ?? course.short_description ?? "");
    setStatus(course.status);
    setIsEditingCourse(false);
  };

  const validateEditionDates = (startDate: string, endDate: string) => {
    if (startDate && endDate && endDate < startDate) {
      setError("End date must be after the start date.");
      return false;
    }

    return true;
  };

  const handleUpdatePrimaryOffering = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!primaryOffering || !course) {
      return;
    }

    setError(null);
    setMessage(null);

    if (!validateEditionDates(editingEditionStartDate, editingEditionEndDate)) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateCourseEdition(primaryOffering.id, {
        title: course.title,
        status: editingEditionStatus,
        start_date: editingEditionStartDate || null,
        end_date: editingEditionEndDate || null,
        capacity: editingEditionCapacity ? Number(editingEditionCapacity) : null,
        enrollment_open: editingEditionEnrollmentOpen,
        requires_approval: true,
      });

      setMessage("Enrollment settings updated.");
      await loadCourse();
    } catch (caughtError) {
      setError(
        getErrorMessage(caughtError, "Could not update enrollment settings."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteCourse = async () => {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      await updateCourse(courseId, {
        title,
        slug: slugify(title),
        short_description: description || null,
        description: description || null,
        status: "archived",
      });

      setMessage("Course deleted.");
      await loadCourse();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not delete course.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateModule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const nextPosition = await getNextModulePosition(courseId);

      await createModule({
        course_id: courseId,
        title: moduleTitle,
        description: moduleDescription || null,
        position: nextPosition,
        status: moduleStatus,
      });

      setModuleTitle("");
      setModuleDescription("");
      setModuleStatus("draft");
      setIsAddingModule(false);
      setMessage("Module created.");
      await loadCourse();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Could not create module."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateLesson = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const nextPosition =
      Math.max(
        0,
        ...modules.flatMap((module) =>
          module.lessons.map((lesson) => lesson.position),
        ),
      ) + 1;

    try {
      await createLesson({
        course_id: courseId,
        module_id: lessonModuleId || null,
        title: lessonTitle,
        slug: slugify(lessonTitle),
        description: lessonDescription || null,
        content: lessonContent || null,
        video_url: lessonVideoUrl || null,
        duration_minutes: lessonDuration ? Number(lessonDuration) : null,
        position: nextPosition,
        status: lessonStatus,
      });

      setLessonTitle("");
      setLessonDescription("");
      setLessonContent("");
      setLessonVideoUrl("");
      setLessonDuration("");
      setLessonStatus("draft");
      setActiveLessonModuleId(null);
      setMessage("Lesson created.");
      await loadCourse();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not create lesson.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateResource = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const selectedLesson = modules
      .flatMap((module) => module.lessons)
      .find((lesson) => lesson.id === resourceLessonId);

    try {
      await createResource({
        lesson_id: resourceLessonId,
        title: resourceTitle,
        description: null,
        resource_type: resourceType,
        external_url: resourceUrl || null,
        is_downloadable: true,
        position: (selectedLesson?.resources.length ?? 0) + 1,
      });

      setResourceTitle("");
      setResourceUrl("");
      setResourceType("external_link");
      setActiveResourceLessonId(null);
      setMessage("Resource added.");
      await loadCourse();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not add resource.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setCollapsedModuleIds((current) => {
      const next = new Set(current);

      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }

      return next;
    });
  };

  const toggleLesson = (lessonId: string) => {
    setCollapsedLessonIds((current) => {
      const next = new Set(current);

      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }

      return next;
    });
  };

  const startEditModule = (module: ModuleWithLessons) => {
    setEditingModuleId(module.id);
    setEditingModuleTitle(module.title);
    setEditingModuleDescription(module.description ?? "");
    setEditingModuleStatus(module.status);
    setCollapsedModuleIds((current) => {
      const next = new Set(current);
      next.delete(module.id);
      return next;
    });
  };

  const handleUpdateModule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingModuleId) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      await updateModule(editingModuleId, {
        title: editingModuleTitle,
        description: editingModuleDescription || null,
        status: editingModuleStatus,
      });

      setEditingModuleId(null);
      setMessage("Module updated.");
      await loadCourse();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update module.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteModule = async (module: ModuleWithLessons) => {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      await updateModule(module.id, {
        title: module.title,
        description: module.description,
        status: "archived",
      });

      setMessage("Module deleted.");
      await loadCourse();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not delete module.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) {
      return;
    }

    if (pendingDelete.type === "course") {
      await deleteCourse();
    } else {
      await deleteModule(pendingDelete.module);
    }

    setPendingDelete(null);
  };

  const primaryOffering = course?.course_editions[0] ?? null;

  return (
    <section className="page">
      <div className="page-header course-detail-header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>{course?.title ?? "Course"}</h1>
          {course ? (
            <div className="mini-list">
              <span>{course.status}</span>
              <span>
                {primaryOffering?.enrollment_open
                  ? "Enrollment open"
                  : "Enrollment closed"}
              </span>
              <span>{modules.length} modules</span>
            </div>
          ) : null}
        </div>
        <a className="text-link" href="#/admin/courses">
          Back to courses
        </a>
      </div>

      {error ? <p className="form-message error">{error}</p> : null}
      {message ? <p className="form-message success">{message}</p> : null}
      {isLoading ? <p>Loading course...</p> : null}

      {!isLoading && course ? (
        <div className="course-overview-grid">
          <section className="content-panel compact-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Details</p>
                <h2>Course details</h2>
              </div>
              <div className="panel-actions">
                {!isEditingCourse ? (
                  <button type="button" onClick={() => setIsEditingCourse(true)}>
                    Edit
                  </button>
                ) : (
                  <>
                    <button type="submit" form="course-details-form" disabled={isSubmitting}>
                      Save
                    </button>
                    <button type="button" onClick={handleCancelEditCourse}>
                      Cancel
                    </button>
                  </>
                )}
                <button
                  className="danger-action"
                  type="button"
                  disabled={isSubmitting}
                  onClick={() =>
                    setPendingDelete({
                      type: "course",
                      title: course.title,
                    })
                  }
                >
                  Delete
                </button>
              </div>
            </div>
            <form
              className="stacked-form"
              id="course-details-form"
              onSubmit={handleSubmit}
            >
              <div className="form-grid">
                <label>
                  Title
                  <input
                    disabled={!isEditingCourse}
                    required
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </label>
                <label>
                  Status
                  <select
                    disabled={!isEditingCourse}
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as CourseStatus)
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="enrollment_closed">Enrollment closed</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
              </div>
              <label>
                Description
                <textarea
                  className="compact-textarea"
                  disabled={!isEditingCourse}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>
            </form>
          </section>

          <section className="content-panel compact-panel">
            <div className="panel-heading">
              <div>
                <h2>Enrollment</h2>
              </div>
            </div>
            {primaryOffering ? (
              <form
                className="stacked-form"
                onSubmit={handleUpdatePrimaryOffering}
              >
                <div className="form-grid">
                  <label>
                    Start date
                    <input
                      type="date"
                      value={editingEditionStartDate}
                      onChange={(event) =>
                        setEditingEditionStartDate(event.target.value)
                      }
                    />
                  </label>
                  <label>
                    End date
                    <input
                      type="date"
                      value={editingEditionEndDate}
                      onChange={(event) =>
                        setEditingEditionEndDate(event.target.value)
                      }
                    />
                  </label>
                </div>
                <div className="form-grid">
                  <label>
                    Capacity
                    <input
                      min="1"
                      type="number"
                      value={editingEditionCapacity}
                      onChange={(event) =>
                        setEditingEditionCapacity(event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Status
                    <select
                      value={editingEditionStatus}
                      onChange={(event) =>
                        setEditingEditionStatus(event.target.value as CourseStatus)
                      }
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="enrollment_closed">
                        Enrollment closed
                      </option>
                      <option value="completed">Completed</option>
                    </select>
                  </label>
                </div>
                <div className="toggle-row">
                  <label className="checkbox-row enrollment-open-row">
                    <input
                      checked={editingEditionEnrollmentOpen}
                      type="checkbox"
                      onChange={(event) =>
                        setEditingEditionEnrollmentOpen(event.target.checked)
                      }
                    />
                    Enrollment open
                  </label>
                </div>
                <div className="inline-actions">
                  <button type="submit" disabled={isSubmitting}>
                    Save enrollment settings
                  </button>
                </div>
              </form>
            ) : (
              <div className="empty-builder">
                <strong>No enrollment settings yet</strong>
                <span>This course needs enrollment settings before students can join.</span>
              </div>
            )}
          </section>
        </div>
      ) : null}

      {!isLoading && course ? (
        <section className="content-panel">
          <div className="page-header compact-header">
            <div>
              <p className="eyebrow">Curriculum</p>
              <h2>Course content</h2>
              <p>Create modules, add lessons, then attach resources to each lesson.</p>
            </div>
            <button
              className="secondary-action"
              type="button"
              onClick={() => setIsAddingModule((current) => !current)}
            >
              Add module
            </button>
          </div>

          {isAddingModule ? (
            <form
              className="inline-builder-form module-form"
              onSubmit={handleCreateModule}
            >
              <div className="form-grid">
                <label>
                  Module title
                  <input
                    required
                    value={moduleTitle}
                    onChange={(event) => setModuleTitle(event.target.value)}
                  />
                </label>
                <label>
                  Status
                  <select
                    value={moduleStatus}
                    onChange={(event) =>
                      setModuleStatus(event.target.value as LessonStatus)
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </label>
              </div>
              <label>
                Description
                <textarea
                  value={moduleDescription}
                  onChange={(event) => setModuleDescription(event.target.value)}
                />
              </label>
              <div className="inline-actions">
                <button type="submit" disabled={isSubmitting}>
                  Save module
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingModule(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          <div className="content-tree">
            {modules.length === 0 ? (
              <div className="empty-builder">
                <strong>No modules yet</strong>
                <span>Add your first module to start building the course.</span>
              </div>
            ) : null}
            {modules.map((module, moduleIndex) => (
              <article className="module-block" key={module.id}>
                <div className="module-heading">
                  <button
                    className="module-toggle"
                    type="button"
                    aria-expanded={!collapsedModuleIds.has(module.id)}
                    onClick={() => toggleModule(module.id)}
                  >
                    <span aria-hidden="true">
                      {collapsedModuleIds.has(module.id) ? "+" : "-"}
                    </span>
                    <div>
                      <h2>
                        Module {moduleIndex + 1}: <span>{module.title}</span>
                      </h2>
                      <p>{module.description || "No description yet."}</p>
                    </div>
                  </button>
                  <div className="row-actions">
                    <span className="status-chip">{module.status}</span>
                    <button type="button" onClick={() => startEditModule(module)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLessonModuleId(module.id);
                        setCollapsedModuleIds((current) => {
                          const next = new Set(current);
                          next.delete(module.id);
                          return next;
                        });
                        setActiveLessonModuleId(
                          activeLessonModuleId === module.id ? null : module.id,
                        );
                      }}
                    >
                      Add lesson
                    </button>
                    <button
                      className="danger-action"
                      type="button"
                      disabled={isSubmitting || module.status === "archived"}
                      onClick={() =>
                        setPendingDelete({
                          type: "module",
                          module,
                        })
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {editingModuleId === module.id ? (
                  <form
                    className="inline-builder-form module-edit-form"
                    onSubmit={handleUpdateModule}
                  >
                    <div className="form-grid">
                      <label>
                        Module title
                        <input
                          required
                          value={editingModuleTitle}
                          onChange={(event) =>
                            setEditingModuleTitle(event.target.value)
                          }
                        />
                      </label>
                      <label>
                        Status
                        <select
                          value={editingModuleStatus}
                          onChange={(event) =>
                            setEditingModuleStatus(
                              event.target.value as LessonStatus,
                            )
                          }
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="hidden">Hidden</option>
                        </select>
                      </label>
                    </div>
                    <label>
                      Description
                      <textarea
                        value={editingModuleDescription}
                        onChange={(event) =>
                          setEditingModuleDescription(event.target.value)
                        }
                      />
                    </label>
                    <div className="inline-actions">
                      <button type="submit" disabled={isSubmitting}>
                        Save module
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingModuleId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : null}
                {!collapsedModuleIds.has(module.id) &&
                activeLessonModuleId === module.id ? (
                  <form
                    className="inline-builder-form lesson-form"
                    onSubmit={handleCreateLesson}
                  >
                    <label>
                      Lesson title
                      <input
                        required
                        value={lessonTitle}
                        onChange={(event) => setLessonTitle(event.target.value)}
                      />
                    </label>
                    <label>
                      Description
                      <textarea
                        value={lessonDescription}
                        onChange={(event) =>
                          setLessonDescription(event.target.value)
                        }
                      />
                    </label>
                    <label>
                      Content
                      <textarea
                        value={lessonContent}
                        onChange={(event) => setLessonContent(event.target.value)}
                      />
                    </label>
                    <div className="form-grid">
                      <label>
                        Video URL
                        <input
                          type="url"
                          value={lessonVideoUrl}
                          onChange={(event) =>
                            setLessonVideoUrl(event.target.value)
                          }
                        />
                      </label>
                      <label>
                        Minutes
                        <input
                          min="1"
                          type="number"
                          value={lessonDuration}
                          onChange={(event) =>
                            setLessonDuration(event.target.value)
                          }
                        />
                      </label>
                    </div>
                    <label>
                      Status
                      <select
                        value={lessonStatus}
                        onChange={(event) =>
                          setLessonStatus(event.target.value as LessonStatus)
                        }
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </label>
                    <div className="inline-actions">
                      <button type="submit" disabled={isSubmitting}>
                        Save lesson
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveLessonModuleId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : null}
                {!collapsedModuleIds.has(module.id) ? (
                  <div className="lesson-list">
                    {module.lessons.length === 0 ? (
                      <p className="tree-empty">No lessons in this module.</p>
                    ) : (
                      module.lessons.map((lesson, lessonIndex) => (
                        <div className="lesson-row" key={lesson.id}>
                          <div className="lesson-heading">
                            <button
                              className="lesson-toggle"
                              type="button"
                              aria-expanded={!collapsedLessonIds.has(lesson.id)}
                              onClick={() => toggleLesson(lesson.id)}
                            >
                              <span aria-hidden="true">
                                {collapsedLessonIds.has(lesson.id) ? "+" : "-"}
                              </span>
                              <div>
                                <strong>
                                  Lecture {lessonIndex + 1}:{" "}
                                  <span>{lesson.title}</span>
                                </strong>
                              </div>
                            </button>
                            <button
                              className="subtle-action"
                              type="button"
                              onClick={() => {
                                setResourceLessonId(lesson.id);
                                setCollapsedLessonIds((current) => {
                                  const next = new Set(current);
                                  next.delete(lesson.id);
                                  return next;
                                });
                                setActiveResourceLessonId(
                                  activeResourceLessonId === lesson.id
                                    ? null
                                    : lesson.id,
                                );
                              }}
                            >
                              Add resource
                            </button>
                          </div>
                          {!collapsedLessonIds.has(lesson.id) ? (
                            <div className="lesson-details">
                              <span>
                                {lesson.description || "No description yet."}
                              </span>
                              <div className="mini-list">
                                <span>{lesson.status}</span>
                                {lesson.duration_minutes ? (
                                  <span>{lesson.duration_minutes} min</span>
                                ) : null}
                                {lesson.resources.length > 0 ? (
                                  <span>
                                    {lesson.resources.length}{" "}
                                    {lesson.resources.length === 1
                                      ? "resource"
                                      : "resources"}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          ) : null}
                          {!collapsedLessonIds.has(lesson.id) &&
                          activeResourceLessonId === lesson.id ? (
                            <form
                              className="inline-builder-form resource-form"
                              onSubmit={handleCreateResource}
                            >
                              <div className="form-grid">
                                <label>
                                  Resource title
                                  <input
                                    required
                                    value={resourceTitle}
                                    onChange={(event) =>
                                      setResourceTitle(event.target.value)
                                    }
                                  />
                                </label>
                                <label>
                                  Type
                                  <select
                                    value={resourceType}
                                    onChange={(event) =>
                                      setResourceType(event.target.value)
                                    }
                                  >
                                    <option value="external_link">
                                      External link
                                    </option>
                                    <option value="pdf">PDF</option>
                                    <option value="slides">Slides</option>
                                    <option value="zip">ZIP</option>
                                    <option value="script">Script</option>
                                    <option value="report">Report</option>
                                  </select>
                                </label>
                              </div>
                              <label>
                                External URL
                                <input
                                  type="url"
                                  value={resourceUrl}
                                  onChange={(event) =>
                                    setResourceUrl(event.target.value)
                                  }
                                />
                              </label>
                              <div className="inline-actions">
                                <button type="submit" disabled={isSubmitting}>
                                  Save resource
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveResourceLessonId(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : null}
                          {!collapsedLessonIds.has(lesson.id) &&
                          lesson.resources.length > 0 ? (
                            <div className="resource-list">
                              {lesson.resources.map((resource) => (
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
                                )
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))
                    )}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {pendingDelete ? (
        <div
          aria-labelledby="delete-dialog-title"
          aria-modal="true"
          className="modal-backdrop"
          role="dialog"
        >
          <section className="confirm-dialog">
            <div>
              <p className="eyebrow">Confirm delete</p>
              <h2 id="delete-dialog-title">
                Delete{" "}
                {pendingDelete.type === "course"
                  ? pendingDelete.title
                  : pendingDelete.module.title}
                ?
              </h2>
              <p>
                This will remove it from active course management. Existing
                records are kept safely for history.
              </p>
            </div>
            <div className="confirm-actions">
              <button type="button" onClick={() => setPendingDelete(null)}>
                Cancel
              </button>
              <button
                className="danger-action"
                type="button"
                disabled={isSubmitting}
                onClick={() => void confirmDelete()}
              >
                Delete
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
