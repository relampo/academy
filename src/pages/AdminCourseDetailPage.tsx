import { useEffect, useState, type FormEvent } from "react";
import {
  ChartNoAxesColumn,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Code2,
  File,
  FileText,
  Link,
  Package,
  Paperclip,
  Pencil,
  Presentation,
  Plus,
  CircleHelp,
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
  listLessonQuizzes,
  listCourseContent,
  updateLesson,
  updateModule,
  upsertLessonAssignment,
  upsertLessonQuizQuestions,
  type LessonAssignment,
  type LessonQuizWithQuestions,
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
import { getHashUrl } from "../lib/appUrl";
import type { Enums } from "../types/database.types";

type CourseStatus = Enums<"course_status">;

const resourceTypeLabels: Record<string, string> = {
  external_link: "Enlace externo",
  video: "Video",
  pdf: "PDF",
  slides: "Presentación",
  zip: "ZIP",
  script: "Script",
  report: "Reporte",
};

function formatStatus(value: string) {
  const labels: Record<string, string> = {
    draft: "borrador",
    published: "publicado",
    enrollment_closed: "inscripción cerrada",
    completed: "completado",
    archived: "archivado",
  };

  return labels[value] ?? value.replace(/_/g, " ");
}

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
        aria-label={`Quitar ${resource.title}`}
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
    return "Instructor desconocido";
  }

  return (
    profile.display_name ||
    `${profile.first_name} ${profile.last_name}`.trim() ||
    "Instructor sin nombre"
  );
}

type AdminCourseDetailPageProps = {
  courseId: string;
};

type PendingDelete =
  | { type: "course"; title: string }
  | { type: "module"; module: ModuleWithLessons }
  | { type: "lesson"; lesson: LessonWithResources };

type QuizQuestionDraft = {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  position: number;
};

function createBlankQuizQuestions(): QuizQuestionDraft[] {
  return Array.from({ length: 10 }, (_, index) => ({
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctOption: "a",
    position: index + 1,
  }));
}

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
  const [lessonQuizzes, setLessonQuizzes] = useState<LessonQuizWithQuestions[]>(
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
  const [editingQuizLessonId, setEditingQuizLessonId] = useState<string | null>(
    null,
  );
  const [editingQuizTitle, setEditingQuizTitle] = useState("");
  const [editingQuizQuestions, setEditingQuizQuestions] = useState<
    QuizQuestionDraft[]
  >(() => createBlankQuizQuestions());
  const [editingQuizQuestionIndex, setEditingQuizQuestionIndex] = useState(0);
  const [editingQuizError, setEditingQuizError] = useState<string | null>(null);
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
    const [nextModules, nextAssignments, nextQuizzes] = await Promise.all([
      listCourseContent(courseId),
      listLessonAssignments(courseId),
      listLessonQuizzes(courseId),
    ]);
    setModules(nextModules);
    setLessonAssignments(nextAssignments);
    setLessonQuizzes(nextQuizzes);
  };

  const loadCourse = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [
        nextCourse,
        nextModules,
        nextLessonAssignments,
        nextLessonQuizzes,
        nextInstructors,
        nextAssignedInstructors,
      ] = await Promise.all([
        getCourseWithEditions(courseId),
        listCourseContent(courseId),
        listLessonAssignments(courseId),
        listLessonQuizzes(courseId),
        listInstructorProfiles(),
        listCourseInstructors(courseId),
      ]);
      setCourse(nextCourse);
      setModules(nextModules);
      setLessonAssignments(nextLessonAssignments);
      setLessonQuizzes(nextLessonQuizzes);
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
        caughtError instanceof Error ? caughtError.message : "No se pudo cargar el curso.",
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

      setMessage("Configuración del curso actualizada.");
      await loadCourse();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo actualizar la configuración del curso.",
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
      setError("La fecha final debe ser posterior a la fecha de inicio.");
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
      setMessage("Instructor agregado.");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "No se pudo agregar el instructor."));
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
      setMessage("Instructor removido.");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "No se pudo remover el instructor."));
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

      setMessage("Curso eliminado.");
      window.location.hash = "/admin/courses";
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo eliminar el curso.",
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
        status: "draft",
      });

      setModuleTitle("");
      setModuleDescription("");
      setIsAddingModule(false);
      setMessage("Módulo creado.");
      await refreshCourseContent();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "No se pudo crear el módulo."));
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
        status: "draft",
      });
      await upsertLessonAssignment({
        lessonId: lesson.id,
        title: `Tarea - ${lesson.title}`,
        description: "Envía la evidencia requerida para esta clase.",
        assignmentType: "report",
        points: 10,
      });

      setLessonTitle("");
      setLessonDescription("");
      setLessonContent("");
      setLessonVideoUrl("");
      setLessonDuration("");
      setActiveLessonModuleId(null);
      setMessage("Clase creada.");
      await refreshCourseContent();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo crear la clase.",
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
      setMessage("Recurso agregado.");
      await refreshCourseContent();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo agregar el recurso.",
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
      setMessage("Módulo actualizado.");
      await refreshCourseContent();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo actualizar el módulo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateModuleStatus = async (
    module: ModuleWithLessons,
    nextStatus: "draft" | "published" | "hidden",
  ) => {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      await updateModule(module.id, {
        title: module.title,
        description: module.description,
        status: nextStatus,
      });
      setMessage(
        nextStatus === "published"
          ? "Módulo publicado."
          : "Módulo ocultado.",
      );
      await refreshCourseContent();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo actualizar el estado del módulo.",
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

  const handleUpdateLessonStatus = async (
    lesson: LessonWithResources,
    nextStatus: "draft" | "published" | "hidden",
  ) => {
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
        status: nextStatus,
      });
      setMessage(
        nextStatus === "published" ? "Clase publicada." : "Clase ocultada.",
      );
      await refreshCourseContent();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo actualizar el estado de la clase.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditAssignment = (lesson: LessonWithResources) => {
    const assignment = lessonAssignments.find(
      (currentAssignment) => currentAssignment.lesson_id === lesson.id,
    );

    setEditingAssignmentLessonId(lesson.id);
    setEditingAssignmentTitle(assignment?.title ?? `Tarea - ${lesson.title}`);
    setEditingAssignmentDescription(
      assignment?.description ?? "Envía la evidencia requerida para esta clase.",
    );
    setEditingAssignmentType(assignment?.assignment_type ?? "report");
    setCollapsedLessonIds((current) => {
      const next = new Set(current);
      next.delete(lesson.id);
      return next;
    });
  };

  const startEditQuiz = (lesson: LessonWithResources) => {
    const quiz = lessonQuizzes.find((currentQuiz) => currentQuiz.lesson_id === lesson.id);
    const existingQuestions = quiz?.quiz_questions ?? [];
    const questionDrafts = createBlankQuizQuestions().map((blankQuestion) => {
      const existingQuestion = existingQuestions.find(
        (question) => question.position === blankQuestion.position,
      );

      return existingQuestion
        ? {
            questionText: existingQuestion.question_text,
            optionA: existingQuestion.option_a,
            optionB: existingQuestion.option_b,
            optionC: existingQuestion.option_c,
            optionD: existingQuestion.option_d,
            correctOption: existingQuestion.correct_option,
            position: existingQuestion.position,
          }
        : blankQuestion;
    });

    setEditingQuizLessonId(lesson.id);
    setEditingQuizTitle(quiz?.title ?? `Quiz - ${lesson.title}`);
    setEditingQuizQuestions(questionDrafts);
    setEditingQuizQuestionIndex(0);
    setEditingQuizError(null);
    setCollapsedLessonIds((current) => {
      const next = new Set(current);
      next.delete(lesson.id);
      return next;
    });
  };

  const updateQuizQuestionDraft = (
    position: number,
    field: keyof QuizQuestionDraft,
    value: string,
  ) => {
    setEditingQuizError(null);
    setEditingQuizQuestions((current) =>
      current.map((question) =>
        question.position === position ? { ...question, [field]: value } : question,
      ),
    );
  };

  const handleUpdateQuiz = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingQuizLessonId) {
      return;
    }

    const firstEmptyQuestionIndex = editingQuizQuestions.findIndex(
      (question) =>
        !question.questionText.trim() ||
        !question.optionA.trim() ||
        !question.optionB.trim() ||
        !question.optionC.trim() ||
        !question.optionD.trim(),
    );

    if (editingQuizQuestions.length !== 10 || firstEmptyQuestionIndex >= 0) {
      const nextError =
        firstEmptyQuestionIndex >= 0
          ? `Completa la pregunta ${firstEmptyQuestionIndex + 1} antes de guardar.`
          : "El quiz requiere exactamente 10 preguntas completas.";

      if (firstEmptyQuestionIndex >= 0) {
        setEditingQuizQuestionIndex(firstEmptyQuestionIndex);
      }

      setEditingQuizError(nextError);
      setError(null);
      return;
    }

    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const quiz = await upsertLessonQuizQuestions({
        lessonId: editingQuizLessonId,
        title: editingQuizTitle,
        questions: editingQuizQuestions,
      });

      setLessonQuizzes((current) => {
        const withoutCurrent = current.filter(
          (currentQuiz) => currentQuiz.lesson_id !== editingQuizLessonId,
        );
        return [...withoutCurrent, quiz];
      });
      setEditingQuizLessonId(null);
      setEditingQuizError(null);
      setMessage("Quiz actualizado.");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "No se pudo actualizar el quiz."));
    } finally {
      setIsSubmitting(false);
    }
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
      const existingAssignment = lessonAssignments.find(
        (assignment) => assignment.lesson_id === editingAssignmentLessonId,
      );
      const assignment = await upsertLessonAssignment({
        lessonId: editingAssignmentLessonId,
        title: editingAssignmentTitle,
        description: editingAssignmentDescription || null,
        assignmentType: editingAssignmentType,
        points: existingAssignment?.points ?? 10,
      });

      setLessonAssignments((current) => {
        const withoutCurrent = current.filter(
          (currentAssignment) =>
            currentAssignment.lesson_id !== editingAssignmentLessonId,
        );
        return [...withoutCurrent, assignment];
      });
      setEditingAssignmentLessonId(null);
      setMessage("Tarea actualizada.");
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "No se pudo actualizar la tarea."));
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
      setMessage("Clase actualizada.");
      await refreshCourseContent();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "No se pudo actualizar la clase."));
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

      setMessage("Clase eliminada.");
      await refreshCourseContent();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "No se pudo eliminar la clase."));
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
      setMessage("Recurso removido.");
      await refreshCourseContent();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, "No se pudo remover el recurso."));
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

      setMessage("Módulo eliminado.");
      await refreshCourseContent();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo eliminar el módulo.",
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
  const enrollmentLink = course
    ? getHashUrl(`/enroll/${encodeURIComponent(course.slug || course.id)}`)
    : "";
  const assignmentByLesson = new Map(
    lessonAssignments.map((assignment) => [assignment.lesson_id, assignment]),
  );
  const quizByLesson = new Map(
    lessonQuizzes.map((quiz) => [quiz.lesson_id, quiz]),
  );
  const availableInstructors = instructors.filter(
    (instructor) =>
      !assignedInstructors.some(
        (assignment) => assignment.instructor_id === instructor.id,
      ),
  );

  const handleCopyEnrollmentLink = async () => {
    if (!enrollmentLink) {
      return;
    }

    try {
      await window.navigator.clipboard.writeText(enrollmentLink);
      setMessage("Link de inscripción copiado.");
    } catch {
      setMessage(enrollmentLink);
    }
  };

  return (
    <section className="page">
      <div className="page-header course-detail-header">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>{course?.title ?? "Curso"}</h1>
          {course ? (
            <div className="mini-list">
              <span>{formatStatus(course.status)}</span>
              <span>
                {primaryOffering?.enrollment_open
                  ? "Inscripción abierta"
                  : "Inscripción cerrada"}
              </span>
              <span>{modules.length} módulos</span>
            </div>
          ) : null}
        </div>
        <a className="text-link" href="#/admin/courses">
          Volver a cursos
        </a>
      </div>

      {error ? <p className="form-message error">{error}</p> : null}
      {message ? <p className="form-message success">{message}</p> : null}
      {isLoading ? <p>Cargando curso...</p> : null}

      {!isLoading && course ? (
        <section className="content-panel course-details-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Detalles</p>
              <h2>Configuración del curso</h2>
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
                <h3>Detalles del curso</h3>
              </div>
              <div
                className="stacked-form"
              >
                <div className="form-grid">
                  <label>
                    Título
                    <input
                      disabled={!isEditingCourse}
                      required
                      type="text"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                    />
                  </label>
                  <label>
                    Estado
                    <select
                      disabled={!isEditingCourse}
                      value={status}
                      onChange={(event) =>
                        setStatus(event.target.value as CourseStatus)
                      }
                    >
                      <option value="draft">Borrador</option>
                      <option value="published">Publicado</option>
                      <option value="enrollment_closed">Inscripción cerrada</option>
                      <option value="completed">Completado</option>
                    </select>
                  </label>
                </div>
                <label>
                  Descripción
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
                <h3>Inscripción</h3>
              </div>
            {primaryOffering ? (
              <div
                className="stacked-form"
              >
                <div className="form-grid">
                  <label>
                    Fecha de inicio
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
                    Fecha final
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
                  Capacidad
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
                    Inscripción abierta
                  </label>
                </div>
                <div className="enrollment-link-box">
                  <span>Link de inscripción</span>
                  <div>
                    <input readOnly value={enrollmentLink} />
                    <button
                      className="secondary-action"
                      type="button"
                      onClick={() => void handleCopyEnrollmentLink()}
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-builder">
                <strong>Todavía no hay configuración de inscripción</strong>
                <span>Este curso necesita configuración antes de aceptar estudiantes.</span>
              </div>
            )}
            </section>

            <section className="details-block">
              <div className="subsection-heading">
                <h3>Instructores</h3>
              </div>
            <div className="stacked-form">
              <label>
                Asignar instructor
                <div className="inline-picker">
                  <select
                    disabled={availableInstructors.length === 0 || isSubmitting}
                    value={selectedInstructorId}
                    onChange={(event) => setSelectedInstructorId(event.target.value)}
                  >
                    {availableInstructors.length === 0 ? (
                      <option value="">
                        {instructors.length === 0
                          ? "No hay instructores activos"
                          : "Todos los instructores están asignados"}
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
                    Agregar
                  </button>
                </div>
              </label>
            </div>
            <div className="mini-list instructor-list">
              {assignedInstructors.length === 0 ? (
                <span>No hay instructores asignados</span>
              ) : null}
              {assignedInstructors.map((assignment) => (
                <span className="removable-chip" key={assignment.instructor_id}>
                  {getProfileName(assignment.profiles)}
                  {isEditingCourse ? (
                    <button
                      aria-label={`Quitar ${getProfileName(assignment.profiles)}`}
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
                Editar
              </button>
            ) : (
              <>
                <button type="button" onClick={handleCancelEditCourse}>
                  Cancelar
                </button>
                <button
                  className="primary-action"
                  type="submit"
                  disabled={isSubmitting}
                >
                  Guardar
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
              Eliminar
            </button>
          </div>
          </form>
        </section>
      ) : null}

      {!isLoading && course ? (
        <section className="content-panel curriculum-panel">
          <div className="page-header compact-header">
            <div>
              <p className="eyebrow">Contenido</p>
              <h2>Contenido del curso</h2>
              <p>Crea módulos, agrega clases y adjunta recursos a cada clase.</p>
            </div>
            <button
              className="secondary-action"
              type="button"
              onClick={() => setIsAddingModule((current) => !current)}
            >
              Agregar módulo
            </button>
          </div>

          {isAddingModule ? (
            <form
              className="inline-builder-form module-form"
              onSubmit={handleCreateModule}
            >
              <label>
                Título del módulo
                <input
                  required
                  value={moduleTitle}
                  onChange={(event) => setModuleTitle(event.target.value)}
                />
              </label>
              <label>
                Descripción
                <textarea
                  value={moduleDescription}
                  onChange={(event) => setModuleDescription(event.target.value)}
                />
              </label>
              <div className="inline-actions">
                <button type="submit" disabled={isSubmitting}>
                  Guardar módulo
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingModule(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : null}

          <div className="content-tree">
            {modules.length === 0 ? (
              <div className="empty-builder">
                <strong>Todavía no hay módulos</strong>
                <span>Agrega el primer módulo para empezar a construir el curso.</span>
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
                    <div>
                      <span className="module-kicker">Módulo {moduleIndex + 1}</span>
                      <h2>{module.title}</h2>
                      <p>{module.description || "Sin descripción todavía."}</p>
                      <span className="publication-chip">
                        {module.status === "published"
                          ? "Publicado"
                          : "No publicado"}
                      </span>
                    </div>
                  </button>
                  <div className="row-actions curriculum-actions">
                    <button
                      className={
                        module.status === "published"
                          ? "visibility-action is-visible"
                          : "visibility-action is-hidden"
                      }
                      aria-label={
                        module.status === "published"
                          ? "Módulo publicado"
                          : "Módulo no publicado"
                      }
                      title={
                        module.status === "published"
                          ? "Publicado - clic para ocultar"
                          : "No publicado - clic para publicar"
                      }
                      type="button"
                      disabled={isSubmitting || module.status === "archived"}
                      onClick={() =>
                        void handleUpdateModuleStatus(
                          module,
                          module.status === "published" ? "hidden" : "published",
                        )
                      }
                    >
                      {module.status === "published" ? (
                        <Eye aria-hidden="true" size={17} strokeWidth={2.2} />
                      ) : (
                        <EyeOff aria-hidden="true" size={17} strokeWidth={2.2} />
                      )}
                    </button>
                    <button
                      aria-label="Editar módulo"
                      title="Editar módulo"
                      type="button"
                      onClick={() => startEditModule(module)}
                    >
                      <Pencil aria-hidden="true" size={17} strokeWidth={2.2} />
                    </button>
                    <button
                      aria-label="Agregar clase"
                      title="Agregar clase"
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
                      aria-label="Eliminar módulo"
                      title="Eliminar módulo"
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
                    <button
                      className="collapse-action"
                      aria-label={
                        collapsedModuleIds.has(module.id)
                          ? "Expandir módulo"
                          : "Colapsar módulo"
                      }
                      title={
                        collapsedModuleIds.has(module.id)
                          ? "Expandir módulo"
                          : "Colapsar módulo"
                      }
                      type="button"
                      aria-expanded={!collapsedModuleIds.has(module.id)}
                      onClick={() => toggleModule(module.id)}
                    >
                      {collapsedModuleIds.has(module.id) ? (
                        <ChevronRight size={17} strokeWidth={2.2} />
                      ) : (
                        <ChevronDown size={17} strokeWidth={2.2} />
                      )}
                    </button>
                  </div>
                </div>
                {editingModuleId === module.id ? (
                  <form
                    className="inline-builder-form module-edit-form"
                    onSubmit={handleUpdateModule}
                  >
                    <label>
                      Título del módulo
                      <input
                        required
                        value={editingModuleTitle}
                        onChange={(event) =>
                          setEditingModuleTitle(event.target.value)
                        }
                      />
                    </label>
                    <label>
                      Descripción
                      <textarea
                        value={editingModuleDescription}
                        onChange={(event) =>
                          setEditingModuleDescription(event.target.value)
                        }
                      />
                    </label>
                    <div className="inline-actions">
                      <button type="submit" disabled={isSubmitting}>
                        Guardar módulo
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingModuleId(null)}
                      >
                        Cancelar
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
                      Título de la clase
                      <input
                        required
                        value={lessonTitle}
                        onChange={(event) => setLessonTitle(event.target.value)}
                      />
                    </label>
                    <label>
                      Descripción
                      <textarea
                        value={lessonDescription}
                        onChange={(event) =>
                          setLessonDescription(event.target.value)
                        }
                      />
                    </label>
                    <label>
                      Contenido
                      <textarea
                        value={lessonContent}
                        onChange={(event) => setLessonContent(event.target.value)}
                      />
                    </label>
                    <div className="form-grid">
                      <label>
                        URL del video
                        <input
                          type="url"
                          value={lessonVideoUrl}
                          onChange={(event) =>
                            setLessonVideoUrl(event.target.value)
                          }
                        />
                      </label>
                      <label>
                        Minutos
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
                        Guardar clase
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveLessonModuleId(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : null}
                {!collapsedModuleIds.has(module.id) ? (
                  <div className="lesson-list">
                    {module.lessons.length === 0 ? (
                      <p className="tree-empty">No hay clases en este módulo.</p>
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
                              <div className="lesson-title-stack">
                                <span className="lesson-kicker">
                                  Clase {lessonIndex + 1}
                                </span>
                                <strong>{lesson.title}</strong>
                                <span className="publication-chip">
                                  {lesson.status === "published"
                                    ? "Publicado"
                                    : "No publicado"}
                                </span>
                              </div>
                            </button>
                            <div className="lesson-actions">
                              <button
                                className={
                                  lesson.status === "published"
                                    ? "visibility-action is-visible"
                                    : "visibility-action is-hidden"
                                }
                                aria-label={
                                  lesson.status === "published"
                                    ? "Clase publicada"
                                    : "Clase no publicada"
                                }
                                title={
                                  lesson.status === "published"
                                    ? "Publicada - clic para ocultar"
                                    : "No publicada - clic para publicar"
                                }
                                type="button"
                                disabled={
                                  isSubmitting || lesson.status === "archived"
                                }
                                onClick={() =>
                                  void handleUpdateLessonStatus(
                                    lesson,
                                    lesson.status === "published"
                                      ? "hidden"
                                      : "published",
                                  )
                                }
                              >
                                {lesson.status === "published" ? (
                                  <Eye
                                    aria-hidden="true"
                                    size={17}
                                    strokeWidth={2.2}
                                  />
                                ) : (
                                  <EyeOff
                                    aria-hidden="true"
                                    size={17}
                                    strokeWidth={2.2}
                                  />
                                )}
                              </button>
                              <button
                                aria-label="Editar clase"
                                title="Editar clase"
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
                                aria-label="Editar tarea"
                                title="Editar tarea"
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
                                aria-label="Agregar recurso"
                                title="Agregar recurso"
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
                                aria-label="Eliminar clase"
                                title="Eliminar clase"
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
                              <button
                                className="collapse-action"
                                aria-label={
                                  collapsedLessonIds.has(lesson.id)
                                    ? "Expandir clase"
                                    : "Colapsar clase"
                                }
                                title={
                                  collapsedLessonIds.has(lesson.id)
                                    ? "Expandir clase"
                                    : "Colapsar clase"
                                }
                                type="button"
                                aria-expanded={!collapsedLessonIds.has(lesson.id)}
                                onClick={() => toggleLesson(lesson.id)}
                              >
                                {collapsedLessonIds.has(lesson.id) ? (
                                  <ChevronRight size={17} strokeWidth={2.2} />
                                ) : (
                                  <ChevronDown size={17} strokeWidth={2.2} />
                                )}
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
                                Título de la clase
                                <input
                                  required
                                  value={editingLessonTitle}
                                  onChange={(event) =>
                                    setEditingLessonTitle(event.target.value)
                                  }
                                />
                              </label>
                              <label>
                                Descripción
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
                                Contenido
                                <textarea
                                  value={editingLessonContent}
                                  onChange={(event) =>
                                    setEditingLessonContent(event.target.value)
                                  }
                                />
                              </label>
                              <div className="form-grid">
                                <label>
                                  URL del video
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
                                  Minutos
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
                                  Guardar clase
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingLessonId(null)}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </form>
                          ) : null}
                          {!collapsedLessonIds.has(lesson.id) &&
                          editingLessonId !== lesson.id ? (
                            <div className="lesson-details">
                              <span>
                                {lesson.description || "Sin descripción todavía."}
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
                                        <small>Tarea obligatoria</small>
                                        <strong>
                                          {assignment?.title ??
                                            `Tarea - ${lesson.title}`}
                                        </strong>
                                      </div>
                                      <span>
                                        {assignment?.assignment_type ?? "report"}
                                      </span>
                                    </>
                                  );
                                })()}
                              </div>
                              <div className="assignment-summary quiz-summary">
                                {(() => {
                                  const quiz = quizByLesson.get(lesson.id);
                                  const questionCount =
                                    quiz?.quiz_questions.length ?? 0;

                                  return (
                                    <>
                                      <CircleHelp
                                        aria-hidden="true"
                                        size={17}
                                        strokeWidth={2.2}
                                      />
                                      <div>
                                        <small>Quiz obligatorio</small>
                                        <strong>
                                          {quiz?.title ?? `Quiz - ${lesson.title}`}
                                        </strong>
                                      </div>
                                      <span>{questionCount}/10 preguntas</span>
                                      <button
                                        className="secondary-action quiz-config-action"
                                        type="button"
                                        onClick={() => startEditQuiz(lesson)}
                                      >
                                        {questionCount === 10
                                          ? "Editar quiz"
                                          : "Configurar quiz"}
                                      </button>
                                    </>
                                  );
                                })()}
                              </div>
                              <div className="lesson-support-row">
                                <div className="mini-list">
                                  {lesson.resources.length > 0 ? (
                                    <span>
                                      {lesson.resources.length}{" "}
                                      {lesson.resources.length === 1
                                        ? "recurso"
                                        : "recursos"}
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
                          editingQuizLessonId === lesson.id ? (
                            <form
                              className="inline-builder-form quiz-form"
                              onSubmit={handleUpdateQuiz}
                            >
                              <label>
                                Título del quiz
                                <input
                                  required
                                  value={editingQuizTitle}
                                  onChange={(event) =>
                                    setEditingQuizTitle(event.target.value)
                                  }
                                />
                              </label>
                              {editingQuizError ? (
                                <p className="form-message error quiz-form-message">
                                  {editingQuizError}
                                </p>
                              ) : null}
                              {(() => {
                                const question =
                                  editingQuizQuestions[editingQuizQuestionIndex];

                                return (
                                  <div className="quiz-question-stepper">
                                    <div className="quiz-stepper-header">
                                      <strong>
                                        {editingQuizQuestionIndex + 1}/
                                        {editingQuizQuestions.length}
                                      </strong>
                                      <span>
                                        Pregunta {question.position}
                                      </span>
                                    </div>
                                    <fieldset
                                      className="quiz-question-editor"
                                      key={question.position}
                                    >
                                      <legend>Pregunta {question.position}</legend>
                                      <label>
                                        Pregunta
                                        <input
                                          required
                                          value={question.questionText}
                                          onChange={(event) =>
                                            updateQuizQuestionDraft(
                                              question.position,
                                              "questionText",
                                              event.target.value,
                                            )
                                          }
                                        />
                                      </label>
                                      <div className="form-grid">
                                        <label>
                                          Opción A
                                          <input
                                            required
                                            value={question.optionA}
                                            onChange={(event) =>
                                              updateQuizQuestionDraft(
                                                question.position,
                                                "optionA",
                                                event.target.value,
                                              )
                                            }
                                          />
                                        </label>
                                        <label>
                                          Opción B
                                          <input
                                            required
                                            value={question.optionB}
                                            onChange={(event) =>
                                              updateQuizQuestionDraft(
                                                question.position,
                                                "optionB",
                                                event.target.value,
                                              )
                                            }
                                          />
                                        </label>
                                        <label>
                                          Opción C
                                          <input
                                            required
                                            value={question.optionC}
                                            onChange={(event) =>
                                              updateQuizQuestionDraft(
                                                question.position,
                                                "optionC",
                                                event.target.value,
                                              )
                                            }
                                          />
                                        </label>
                                        <label>
                                          Opción D
                                          <input
                                            required
                                            value={question.optionD}
                                            onChange={(event) =>
                                              updateQuizQuestionDraft(
                                                question.position,
                                                "optionD",
                                                event.target.value,
                                              )
                                            }
                                          />
                                        </label>
                                      </div>
                                      <label>
                                        Respuesta correcta
                                        <select
                                          value={question.correctOption}
                                          onChange={(event) =>
                                            updateQuizQuestionDraft(
                                              question.position,
                                              "correctOption",
                                              event.target.value,
                                            )
                                          }
                                        >
                                          <option value="a">A</option>
                                          <option value="b">B</option>
                                          <option value="c">C</option>
                                          <option value="d">D</option>
                                        </select>
                                      </label>
                                    </fieldset>
                                    <div className="quiz-stepper-actions">
                                      <button
                                        type="button"
                                        disabled={editingQuizQuestionIndex === 0}
                                        onClick={() =>
                                          setEditingQuizQuestionIndex((current) =>
                                            Math.max(0, current - 1),
                                          )
                                        }
                                      >
                                        Anterior
                                      </button>
                                      <button
                                        type="button"
                                        disabled={
                                          editingQuizQuestionIndex ===
                                          editingQuizQuestions.length - 1
                                        }
                                        onClick={() =>
                                          setEditingQuizQuestionIndex((current) =>
                                            Math.min(
                                              editingQuizQuestions.length - 1,
                                              current + 1,
                                            ),
                                          )
                                        }
                                      >
                                        Siguiente
                                      </button>
                                    </div>
                                  </div>
                                );
                              })()}
                              <div className="inline-actions">
                                <button type="submit" disabled={isSubmitting}>
                                  Guardar quiz
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingQuizLessonId(null);
                                    setEditingQuizError(null);
                                  }}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </form>
                          ) : null}
                          {!collapsedLessonIds.has(lesson.id) &&
                          editingAssignmentLessonId === lesson.id ? (
                            <form
                              className="inline-builder-form assignment-form"
                              onSubmit={handleUpdateAssignment}
                            >
                              <label>
                                Título de la tarea
                                <input
                                  required
                                  value={editingAssignmentTitle}
                                  onChange={(event) =>
                                    setEditingAssignmentTitle(event.target.value)
                                  }
                                />
                              </label>
                              <label>
                                Instrucciones
                                <textarea
                                  value={editingAssignmentDescription}
                                  onChange={(event) =>
                                    setEditingAssignmentDescription(
                                      event.target.value,
                                    )
                                  }
                                />
                              </label>
                              <label>
                                Tipo
                                <select
                                  value={editingAssignmentType}
                                  onChange={(event) =>
                                    setEditingAssignmentType(event.target.value)
                                  }
                                >
                                  <option value="report">Reporte/enlace</option>
                                  <option value="script">
                                    Validación de script
                                  </option>
                                  <option value="document">Documento</option>
                                  <option value="drive_link">
                                    Enlace de Google Drive
                                  </option>
                                </select>
                              </label>
                              <div className="inline-actions">
                                <button type="submit" disabled={isSubmitting}>
                                  Guardar tarea
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingAssignmentLessonId(null)
                                  }
                                >
                                  Cancelar
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
                                  Título del recurso
                                  <input
                                    required
                                    value={resourceTitle}
                                    onChange={(event) =>
                                      setResourceTitle(event.target.value)
                                    }
                                  />
                                </label>
                                <label>
                                  Tipo
                                  <select
                                    value={resourceType}
                                    onChange={(event) =>
                                      setResourceType(event.target.value)
                                    }
                                  >
                                    <option value="external_link">
                                      Enlace externo
                                    </option>
                                    <option value="video">Video</option>
                                    <option value="pdf">PDF</option>
                                    <option value="slides">Presentación</option>
                                    <option value="zip">ZIP</option>
                                    <option value="script">Script</option>
                                    <option value="report">Reporte</option>
                                  </select>
                                </label>
                              </div>
                              <label>
                                URL externa opcional
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
                                  Guardar recurso
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveResourceLessonId(null)}
                                >
                                  Cancelar
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
              <p className="eyebrow">Confirmar eliminación</p>
              <h2 id="delete-dialog-title">
                Eliminar{" "}
                {pendingDelete.type === "course"
                  ? pendingDelete.title
                  : pendingDelete.type === "module"
                    ? pendingDelete.module.title
                    : pendingDelete.lesson.title}
                ?
              </h2>
              <p>
                Esto lo quitará de la gestión activa del curso. Los registros
                existentes se mantienen para historial.
              </p>
            </div>
            <div className="confirm-actions">
              <button type="button" onClick={() => setPendingDelete(null)}>
                Cancelar
              </button>
              <button
                className="danger-action"
                type="button"
                disabled={isSubmitting}
                onClick={() => void confirmDelete()}
              >
                Eliminar
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
