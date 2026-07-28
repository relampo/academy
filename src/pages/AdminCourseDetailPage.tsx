import { useEffect, useState, type FormEvent } from "react";
import {
  ChartNoAxesColumn,
  Code2,
  File,
  FileText,
  Link,
  Package,
  Paperclip,
  Pencil,
  Presentation,
  Plus,
  Trash2,
  Video,
  type LucideIcon,
} from "lucide-react";
import {
  createLesson,
  createModule,
  createResource,
  deleteResource,
  getNextModulePosition,
  listLessonAssignments,
  listCourseContent,
  updateLesson,
  updateModule,
  upsertLessonAssignment,
  type LessonAssignment,
  type LessonWithResources,
  type ModuleWithLessons,
  type Resource,
} from "../services/content";
import {
  getCourseWithEditions,
  slugify,
  updateCourse,
  updateCourseOfferings,
  type CourseWithEditions,
} from "../services/courses";
import { useAuth } from "../hooks/useAuth";
import {
  assignCourseInstructor,
  listCourseInstructors,
  listInstructorProfiles,
  removeCourseInstructor,
  type CourseInstructorAssignment,
  type InstructorProfile,
} from "../services/instructors";
import type { Enums } from "../types/database.types";

type CourseStatus = Enums<"course_status">;

const resourceTypeLabels: Record<string, string> = {
  external_link: "External link",
  video: "Video",
  pdf: "PDF",
  slides: "Slides",
  zip: "ZIP",
  script: "Script",
  report: "Report",
};

const resourceTypeIcons: Record<string, LucideIcon> = {
  external_link: Link,
  video: Video,
  pdf: FileText,
  slides: Presentation,
  zip: Package,
  script: Code2,
  report: ChartNoAxesColumn,
};

function getResourceIcon(resourceType: string) {
  return resourceTypeIcons[resourceType] ?? File;
}

function renderResourceChip(
  resource: Resource,
  onRemove: (resourceId: string) => void,
  isDisabled: boolean,
) {
  const ResourceIcon = getResourceIcon(resource.resource_type);
  const resourceLabel = `${
    resourceTypeLabels[resource.resource_type] ?? resource.resource_type
  }: ${resource.title}`;
  const chipContent = (
    <>
      <ResourceIcon aria-hidden="true" size={16} strokeWidth={2.2} />
      {resource.external_url ? (
        <a
          aria-label={resourceLabel}
          className="resource-chip-link"
          href={resource.external_url}
          rel="noreferrer"
          target="_blank"
        >
          {resource.title}
        </a>
      ) : (
        <span>{resource.title}</span>
      )}
      <button
        aria-label={`Remove ${resource.title}`}
        disabled={isDisabled}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onRemove(resource.id);
        }}
        type="button"
      >
        ×
      </button>
    </>
  );

  return (
    <div aria-label={resourceLabel} className="resource-chip" key={resource.id}>
      {chipContent}
    </div>
  );
}

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

function getProfileName(profile: InstructorProfile | null) {
  if (!profile) {
    return "Unknown instructor";
  }

  return (
    profile.display_name ||
    `${profile.first_name} ${profile.last_name}`.trim() ||
    "Unnamed instructor"
  );
}

type AdminCourseDetailPageProps = {
  courseId: string;
};

type PendingDelete =
  | { type: "course"; title: string }
  | { type: "module"; module: ModuleWithLessons }
  | { type: "lesson"; lesson: LessonWithResources };

export function AdminCourseDetailPage({ courseId }: AdminCourseDetailPageProps) {
  const { user } = useAuth();
  const [course, setCourse] = useState<CourseWithEditions | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [instructors, setInstructors] = useState<InstructorProfile[]>([]);
  const [assignedInstructors, setAssignedInstructors] = useState<
    CourseInstructorAssignment[]
  >([]);
  const [lessonAssignments, setLessonAssignments] = useState<LessonAssignment[]>(
    [],
  );
  const [selectedInstructorId, setSelectedInstructorId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<CourseStatus>("draft");
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [editingEditionStartDate, setEditingEditionStartDate] = useState("");
  const [editingEditionEndDate, setEditingEditionEndDate] = useState("");
  const [editingEditionCapacity, setEditingEditionCapacity] = useState("");
  const [editingEditionEnrollmentOpen, setEditingEditionEnrollmentOpen] =
    useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");
  const [lessonModuleId, setLessonModuleId] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonDuration, setLessonDuration] = useState("");
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
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingLessonTitle, setEditingLessonTitle] = useState("");
  const [editingLessonDescription, setEditingLessonDescription] = useState("");
  const [editingLessonContent, setEditingLessonContent] = useState("");
  const [editingLessonVideoUrl, setEditingLessonVideoUrl] = useState("");
  const [editingLessonDuration, setEditingLessonDuration] = useState("");
  const [editingAssignmentLessonId, setEditingAssignmentLessonId] = useState<
    string | null
  >(null);
  const [editingAssignmentTitle, setEditingAssignmentTitle] = useState("");
  const [editingAssignmentDescription, setEditingAssignmentDescription] =
    useState("");
  const [editingAssignmentType, setEditingAssignmentType] = useState("report");
  const [editingAssignmentPoints, setEditingAssignmentPoints] = useState("10");
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

  const refreshCourseContent = async () => {
    const [nextModules, nextAssignments] = await Promise.all([
      listCourseContent(courseId),
      listLessonAssignments(courseId),
    ]);
    setModules(nextModules);
    setLessonAssignments(nextAssignments);
  };

  const loadCourse = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [
        nextCourse,
        nextModules,
        nextLessonAssignments,
        nextInstructors,
        nextAssignedInstructors,
      ] = await Promise.all([
        getCourseWithEditions(courseId),
        listCourseContent(courseId),
        listLessonAssignments(courseId),
        listInstructorProfiles(),
        listCourseInstructors(courseId),
      ]);
      setCourse(nextCourse);
      setModules(nextModules);
      setLessonAssignments(nextLessonAssignments);
      setInstructors(nextInstructors);
      setAssignedInstructors(nextAssignedInstructors);
      setSelectedInstructorId(
        nextInstructors.find(
          (instructor) =>
            !nextAssignedInstructors.some(
              (assignment) => assignment.instructor_id === instructor.id,
            ),
        )?.id ?? "",
      );
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

  const handleSaveCourseSetup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!validateEditionDates(editingEditionStartDate, editingEditionEndDate)) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateCourse(courseId, {
        title,
        slug: slugify(title),
        short_description: description || null,
        description: description || null,
        status,
      });

      await updateCourseOfferings(courseId, {
        title,
        status,
        start_date: editingEditionStartDate || null,
        end_date: editingEditionEndDate || null,
        capacity: editingEditionCapacity ? Number(editingEditionCapacity) : null,
        enrollment_open: editingEditionEnrollmentOpen,
        requires_approval: true,
      });

      if (
        selectedInstructorId &&
        user &&
        !assignedInstructors.some(
          (assignment) => assignment.instructor_id === selectedInstructorId,
        )
      ) {
        await assignCourseInstructor(courseId, selectedInstructorId, user.id);
      }

      setMessage("Course setup updated.");
      await loadCourse();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update course setup.",
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
    const primaryOffering = course.course_editions[0];
    setEditingEditionStartDate(primaryOffering?.start_date ?? "");
    setEditingEditionEndDate(primaryOffering?.end_date ?? "");
    setEditingEditionCapacity(
      primaryOffering?.capacity ? String(primaryOffering.capacity) : "",
    );
    setEditingEditionEnrollmentOpen(primaryOffering?.enrollment_open ?? false);
    setIsEditingCourse(false);
  };

  const validateEditionDates = (startDate: string, endDate: string) => {
    if (startDate && endDate && endDate < startDate) {
      setError("End date must be after the start date.");
      return false;
    }

    return true;
  };

  const handleAddInstructor = async () => {
    if (!selectedInstructorId || !user) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      await assignCourseInstructor(courseId, selectedInstructorId, user.id);
      const nextAssignedInstructors = await listCourseInstructors(courseId);
      setAssignedInstructors(nextAssignedInstructors);
      setSelectedInstructorId(
        instructors.find(
          (instructor) =>
            !nextAssignedInstructors.some(
              (assignment) => assignment.instructor_id === instructor.id,
            ),
        )?.id ?? "",
      );
      setMessage("Instructor added.");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Could not add instructor."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveInstructor = async (instructorId: string) => {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      await removeCourseInstructor(courseId, instructorId);
      const nextAssignedInstructors = await listCourseInstructors(courseId);
      setAssignedInstructors(nextAssignedInstructors);
      setSelectedInstructorId(
        instructors.find(
          (instructor) =>
            !nextAssignedInstructors.some(
              (assignment) => assignment.instructor_id === instructor.id,
            ),
        )?.id ?? "",
      );
      setMessage("Instructor removed.");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Could not remove instructor."));
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

      await updateCourseOfferings(courseId, {
        title,
        status: "archived",
        enrollment_open: false,
      });

      setMessage("Course deleted.");
      window.location.hash = "/admin/courses";
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
        status: "published",
      });

      setModuleTitle("");
      setModuleDescription("");
      setIsAddingModule(false);
      setMessage("Module created.");
      await refreshCourseContent();
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
      const lesson = await createLesson({
        course_id: courseId,
        module_id: lessonModuleId || null,
        title: lessonTitle,
        slug: slugify(lessonTitle),
        description: lessonDescription || null,
        content: lessonContent || null,
        video_url: lessonVideoUrl || null,
        duration_minutes: lessonDuration ? Number(lessonDuration) : null,
        position: nextPosition,
        status: "published",
      });
      await upsertLessonAssignment({
        lessonId: lesson.id,
        title: `Assignment - ${lesson.title}`,
        description: "Submit the required evidence for this class.",
        assignmentType: "report",
        points: 10,
      });

      setLessonTitle("");
      setLessonDescription("");
      setLessonContent("");
      setLessonVideoUrl("");
      setLessonDuration("");
      setActiveLessonModuleId(null);
      setMessage("Lesson created.");
      await refreshCourseContent();
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
      await refreshCourseContent();
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
      });

      setEditingModuleId(null);
      setMessage("Module updated.");
      await refreshCourseContent();
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

  const startEditLesson = (lesson: LessonWithResources) => {
    setEditingLessonId(lesson.id);
    setEditingLessonTitle(lesson.title);
    setEditingLessonDescription(lesson.description ?? "");
    setEditingLessonContent(lesson.content ?? "");
    setEditingLessonVideoUrl(lesson.video_url ?? "");
    setEditingLessonDuration(
      lesson.duration_minutes ? String(lesson.duration_minutes) : "",
    );
    setCollapsedLessonIds((current) => {
      const next = new Set(current);
      next.delete(lesson.id);
      return next;
    });
  };

  const startEditAssignment = (lesson: LessonWithResources) => {
    const assignment = lessonAssignments.find(
      (currentAssignment) => currentAssignment.lesson_id === lesson.id,
    );

    setEditingAssignmentLessonId(lesson.id);
    setEditingAssignmentTitle(assignment?.title ?? `Assignment - ${lesson.title}`);
    setEditingAssignmentDescription(
      assignment?.description ?? "Submit the required evidence for this class.",
    );
    setEditingAssignmentType(assignment?.assignment_type ?? "report");
    setEditingAssignmentPoints(String(assignment?.points ?? 10));
    setCollapsedLessonIds((current) => {
      const next = new Set(current);
      next.delete(lesson.id);
      return next;
    });
  };

  const handleUpdateAssignment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingAssignmentLessonId) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const assignment = await upsertLessonAssignment({
        lessonId: editingAssignmentLessonId,
        title: editingAssignmentTitle,
        description: editingAssignmentDescription || null,
        assignmentType: editingAssignmentType,
        points: editingAssignmentPoints ? Number(editingAssignmentPoints) : 10,
      });

      setLessonAssignments((current) => {
        const withoutCurrent = current.filter(
          (currentAssignment) =>
            currentAssignment.lesson_id !== editingAssignmentLessonId,
        );
        return [...withoutCurrent, assignment];
      });
      setEditingAssignmentLessonId(null);
      setMessage("Assignment updated.");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Could not update assignment."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateLesson = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingLessonId) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      await updateLesson(editingLessonId, {
        title: editingLessonTitle,
        slug: slugify(editingLessonTitle),
        description: editingLessonDescription || null,
        content: editingLessonContent || null,
        video_url: editingLessonVideoUrl || null,
        duration_minutes: editingLessonDuration
          ? Number(editingLessonDuration)
          : null,
      });

      setEditingLessonId(null);
      setMessage("Lesson updated.");
      await refreshCourseContent();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Could not update lesson."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteLesson = async (lesson: LessonWithResources) => {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      await updateLesson(lesson.id, {
        title: lesson.title,
        slug: lesson.slug,
        description: lesson.description,
        content: lesson.content,
        video_url: lesson.video_url,
        duration_minutes: lesson.duration_minutes,
        status: "archived",
      });

      setMessage("Lesson deleted.");
      await refreshCourseContent();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Could not delete lesson."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      await deleteResource(resourceId);
      setMessage("Resource removed.");
      await refreshCourseContent();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "Could not remove resource."));
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
      await refreshCourseContent();
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
    } else if (pendingDelete.type === "module") {
      await deleteModule(pendingDelete.module);
    } else {
      await deleteLesson(pendingDelete.lesson);
    }

    setPendingDelete(null);
  };

  const primaryOffering = course?.course_editions[0] ?? null;
  const assignmentByLesson = new Map(
    lessonAssignments.map((assignment) => [assignment.lesson_id, assignment]),
  );
  const availableInstructors = instructors.filter(
    (instructor) =>
      !assignedInstructors.some(
        (assignment) => assignment.instructor_id === instructor.id,
      ),
  );

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
        <section className="content-panel course-details-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Details</p>
              <h2>Course setup</h2>
            </div>
          </div>

          <form
            className="course-setup-form"
            id="course-setup-form"
            onSubmit={handleSaveCourseSetup}
          >
          <div className="course-overview-grid">
            <section className="details-block details-block-main">
              <div className="subsection-heading">
                <h3>Course details</h3>
              </div>
              <div
                className="stacked-form"
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
              </div>
            </section>

            <section className="details-block">
              <div className="subsection-heading">
                <h3>Enrollment</h3>
              </div>
            {primaryOffering ? (
              <div
                className="stacked-form"
              >
                <div className="form-grid">
                  <label>
                    Start date
                    <input
                      disabled={!isEditingCourse}
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
                      disabled={!isEditingCourse}
                      type="date"
                      value={editingEditionEndDate}
                      onChange={(event) =>
                        setEditingEditionEndDate(event.target.value)
                      }
                    />
                  </label>
                </div>
                <label>
                  Capacity
                  <input
                    disabled={!isEditingCourse}
                    min="1"
                    type="number"
                    value={editingEditionCapacity}
                    onChange={(event) =>
                      setEditingEditionCapacity(event.target.value)
                    }
                  />
                </label>
                <div className="toggle-row">
                  <label className="checkbox-row enrollment-open-row">
                    <input
                      checked={editingEditionEnrollmentOpen}
                      disabled={!isEditingCourse}
                      type="checkbox"
                      onChange={(event) =>
                        setEditingEditionEnrollmentOpen(event.target.checked)
                      }
                    />
                    Enrollment open
                  </label>
                </div>
              </div>
            ) : (
              <div className="empty-builder">
                <strong>No enrollment settings yet</strong>
                <span>This course needs enrollment settings before students can join.</span>
              </div>
            )}
            </section>

            <section className="details-block">
              <div className="subsection-heading">
                <h3>Instructors</h3>
              </div>
            <div className="stacked-form">
              <label>
                Assign instructor
                <div className="inline-picker">
                  <select
                    disabled={availableInstructors.length === 0 || isSubmitting}
                    value={selectedInstructorId}
                    onChange={(event) => setSelectedInstructorId(event.target.value)}
                  >
                    {availableInstructors.length === 0 ? (
                      <option value="">
                        {instructors.length === 0
                          ? "No active instructors"
                          : "All instructors assigned"}
                      </option>
                    ) : null}
                    {availableInstructors.map((instructor) => (
                      <option key={instructor.id} value={instructor.id}>
                        {getProfileName(instructor)}
                      </option>
                    ))}
                  </select>
                  <button
                    className="secondary-action"
                    disabled={
                      !selectedInstructorId ||
                      availableInstructors.length === 0 ||
                      isSubmitting
                    }
                    type="button"
                    onClick={() => void handleAddInstructor()}
                  >
                    Add
                  </button>
                </div>
              </label>
            </div>
            <div className="mini-list instructor-list">
              {assignedInstructors.length === 0 ? (
                <span>No instructors assigned</span>
              ) : null}
              {assignedInstructors.map((assignment) => (
                <span className="removable-chip" key={assignment.instructor_id}>
                  {getProfileName(assignment.profiles)}
                  {isEditingCourse ? (
                    <button
                      aria-label={`Remove ${getProfileName(assignment.profiles)}`}
                      disabled={isSubmitting}
                      type="button"
                      onClick={() =>
                        void handleRemoveInstructor(assignment.instructor_id)
                      }
                    >
                      x
                    </button>
                  ) : null}
                </span>
              ))}
            </div>
            </section>
          </div>
          <div className="course-setup-actions">
            {!isEditingCourse ? (
              <button
                className="primary-action"
                type="button"
                onClick={() => setIsEditingCourse(true)}
              >
                Edit
              </button>
            ) : (
              <>
                <button type="button" onClick={handleCancelEditCourse}>
                  Cancel
                </button>
                <button
                  className="primary-action"
                  type="submit"
                  disabled={isSubmitting}
                >
                  Save
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
          </form>
        </section>
      ) : null}

      {!isLoading && course ? (
        <section className="content-panel curriculum-panel">
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
              <label>
                Module title
                <input
                  required
                  value={moduleTitle}
                  onChange={(event) => setModuleTitle(event.target.value)}
                />
              </label>
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
                      <span className="module-kicker">Module {moduleIndex + 1}</span>
                      <h2>{module.title}</h2>
                      <p>{module.description || "No description yet."}</p>
                    </div>
                  </button>
                  <div className="row-actions curriculum-actions">
                    <button
                      aria-label="Edit module"
                      title="Edit module"
                      type="button"
                      onClick={() => startEditModule(module)}
                    >
                      <Pencil aria-hidden="true" size={17} strokeWidth={2.2} />
                    </button>
                    <button
                      aria-label="Add lesson"
                      title="Add lesson"
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
                      <Plus aria-hidden="true" size={18} strokeWidth={2.2} />
                    </button>
                    <button
                      className="danger-action"
                      aria-label="Delete module"
                      title="Delete module"
                      type="button"
                      disabled={isSubmitting || module.status === "archived"}
                      onClick={() =>
                        setPendingDelete({
                          type: "module",
                          module,
                        })
                      }
                    >
                      <Trash2 aria-hidden="true" size={17} strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
                {editingModuleId === module.id ? (
                  <form
                    className="inline-builder-form module-edit-form"
                    onSubmit={handleUpdateModule}
                  >
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
                        <div
                          className={`lesson-row${
                            editingLessonId === lesson.id ? " is-editing" : ""
                          }`}
                          key={lesson.id}
                        >
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
                              <div className="lesson-title-stack">
                                <span className="lesson-kicker">
                                  Lesson {lessonIndex + 1}
                                </span>
                                <strong>{lesson.title}</strong>
                              </div>
                            </button>
                            <div className="lesson-actions">
                              <button
                                aria-label="Edit lesson"
                                title="Edit lesson"
                                type="button"
                                onClick={() => startEditLesson(lesson)}
                              >
                                <Pencil
                                  aria-hidden="true"
                                  size={17}
                                  strokeWidth={2.2}
                                />
                              </button>
                              <button
                                aria-label="Edit assignment"
                                title="Edit assignment"
                                type="button"
                                onClick={() => startEditAssignment(lesson)}
                              >
                                <FileText
                                  aria-hidden="true"
                                  size={17}
                                  strokeWidth={2.2}
                                />
                              </button>
                              <button
                                className="subtle-action"
                                aria-label="Add resource"
                                title="Add resource"
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
                                <Paperclip
                                  aria-hidden="true"
                                  size={17}
                                  strokeWidth={2.2}
                                />
                              </button>
                              <button
                                className="danger-action"
                                aria-label="Delete lesson"
                                title="Delete lesson"
                                type="button"
                                disabled={
                                  isSubmitting || lesson.status === "archived"
                                }
                                onClick={() =>
                                  setPendingDelete({
                                    type: "lesson",
                                    lesson,
                                  })
                                }
                              >
                                <Trash2
                                  aria-hidden="true"
                                  size={17}
                                  strokeWidth={2.2}
                                />
                              </button>
                            </div>
                          </div>
                          {!collapsedLessonIds.has(lesson.id) &&
                          editingLessonId === lesson.id ? (
                            <form
                              className="inline-builder-form lesson-edit-form"
                              onSubmit={handleUpdateLesson}
                            >
                              <label>
                                Lesson title
                                <input
                                  required
                                  value={editingLessonTitle}
                                  onChange={(event) =>
                                    setEditingLessonTitle(event.target.value)
                                  }
                                />
                              </label>
                              <label>
                                Description
                                <textarea
                                  value={editingLessonDescription}
                                  onChange={(event) =>
                                    setEditingLessonDescription(
                                      event.target.value,
                                    )
                                  }
                                />
                              </label>
                              <label>
                                Content
                                <textarea
                                  value={editingLessonContent}
                                  onChange={(event) =>
                                    setEditingLessonContent(event.target.value)
                                  }
                                />
                              </label>
                              <div className="form-grid">
                                <label>
                                  Video URL
                                  <input
                                    type="url"
                                    value={editingLessonVideoUrl}
                                    onChange={(event) =>
                                      setEditingLessonVideoUrl(
                                        event.target.value,
                                      )
                                    }
                                  />
                                </label>
                                <label>
                                  Minutes
                                  <input
                                    min="1"
                                    type="number"
                                    value={editingLessonDuration}
                                    onChange={(event) =>
                                      setEditingLessonDuration(
                                        event.target.value,
                                      )
                                    }
                                  />
                                </label>
                              </div>
                              <div className="inline-actions">
                                <button type="submit" disabled={isSubmitting}>
                                  Save lesson
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingLessonId(null)}
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          ) : null}
                          {!collapsedLessonIds.has(lesson.id) &&
                          editingLessonId !== lesson.id ? (
                            <div className="lesson-details">
                              <span>
                                {lesson.description || "No description yet."}
                              </span>
                              <div className="assignment-summary">
                                {(() => {
                                  const assignment = assignmentByLesson.get(
                                    lesson.id,
                                  );

                                  return (
                                    <>
                                      <FileText
                                        aria-hidden="true"
                                        size={17}
                                        strokeWidth={2.2}
                                      />
                                      <div>
                                        <small>Required assignment</small>
                                        <strong>
                                          {assignment?.title ??
                                            `Assignment - ${lesson.title}`}
                                        </strong>
                                      </div>
                                      <span>
                                        {assignment?.assignment_type ?? "report"}
                                      </span>
                                      <span>{assignment?.points ?? 10} pts</span>
                                    </>
                                  );
                                })()}
                              </div>
                              <div className="lesson-support-row">
                                <div className="mini-list">
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
                                {lesson.resources.length > 0 ? (
                                  <div className="resource-list">
                                    {lesson.resources.map((resource) =>
                                      renderResourceChip(
                                        resource,
                                        handleDeleteResource,
                                        isSubmitting,
                                      ),
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ) : null}
                          {!collapsedLessonIds.has(lesson.id) &&
                          editingAssignmentLessonId === lesson.id ? (
                            <form
                              className="inline-builder-form assignment-form"
                              onSubmit={handleUpdateAssignment}
                            >
                              <label>
                                Assignment title
                                <input
                                  required
                                  value={editingAssignmentTitle}
                                  onChange={(event) =>
                                    setEditingAssignmentTitle(event.target.value)
                                  }
                                />
                              </label>
                              <label>
                                Instructions
                                <textarea
                                  value={editingAssignmentDescription}
                                  onChange={(event) =>
                                    setEditingAssignmentDescription(
                                      event.target.value,
                                    )
                                  }
                                />
                              </label>
                              <div className="form-grid">
                                <label>
                                  Type
                                  <select
                                    value={editingAssignmentType}
                                    onChange={(event) =>
                                      setEditingAssignmentType(
                                        event.target.value,
                                      )
                                    }
                                  >
                                    <option value="report">Report/link</option>
                                    <option value="script">
                                      Script validation
                                    </option>
                                    <option value="document">Document</option>
                                    <option value="drive_link">
                                      Google Drive link
                                    </option>
                                  </select>
                                </label>
                                <label>
                                  Points
                                  <input
                                    min="0"
                                    type="number"
                                    value={editingAssignmentPoints}
                                    onChange={(event) =>
                                      setEditingAssignmentPoints(
                                        event.target.value,
                                      )
                                    }
                                  />
                                </label>
                              </div>
                              <div className="inline-actions">
                                <button type="submit" disabled={isSubmitting}>
                                  Save assignment
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingAssignmentLessonId(null)
                                  }
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
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
                                    <option value="video">Video</option>
                                    <option value="pdf">PDF</option>
                                    <option value="slides">Slides</option>
                                    <option value="zip">ZIP</option>
                                    <option value="script">Script</option>
                                    <option value="report">Report</option>
                                  </select>
                                </label>
                              </div>
                              <label>
                                External URL optional
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
                  : pendingDelete.type === "module"
                    ? pendingDelete.module.title
                    : pendingDelete.lesson.title}
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
