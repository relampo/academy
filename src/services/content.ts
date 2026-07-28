import { supabase } from "./supabase";
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "../types/database.types";

export type Module = Tables<"modules">;
export type Lesson = Tables<"lessons">;
export type LessonAttendance = Tables<"lesson_attendance">;
export type LessonAssignment = Tables<"lesson_assignments">;
export type LessonProgress = Tables<"lesson_progress">;
export type AssignmentSubmission = Tables<"assignment_submissions">;
export type Resource = Tables<"resources">;

export type AssignmentReviewItem = AssignmentSubmission & {
  profiles: Pick<
    Tables<"profiles">,
    "id" | "display_name" | "first_name" | "last_name"
  > | null;
  lesson_assignments:
    | (LessonAssignment & {
        lessons:
          | (Pick<Tables<"lessons">, "id" | "title" | "course_id"> & {
              modules: Pick<Tables<"modules">, "title"> | null;
            })
          | null;
      })
    | null;
};

export type LessonWithResources = Lesson & {
  resources: Resource[];
};

export type ModuleWithLessons = Module & {
  lessons: LessonWithResources[];
};

export type CreateModuleInput = Pick<
  TablesInsert<"modules">,
  "course_id" | "title" | "description" | "position" | "status"
>;

export type CreateLessonInput = Pick<
  TablesInsert<"lessons">,
  | "course_id"
  | "module_id"
  | "title"
  | "slug"
  | "description"
  | "content"
  | "video_url"
  | "duration_minutes"
  | "position"
  | "status"
>;

export type CreateResourceInput = Pick<
  TablesInsert<"resources">,
  | "lesson_id"
  | "title"
  | "description"
  | "resource_type"
  | "external_url"
  | "is_downloadable"
  | "position"
>;

export type UpdateModuleInput = Pick<
  TablesUpdate<"modules">,
  "title" | "description" | "status"
>;

export type UpdateLessonInput = Pick<
  TablesUpdate<"lessons">,
  | "title"
  | "slug"
  | "description"
  | "content"
  | "video_url"
  | "duration_minutes"
  | "status"
>;

export type UpdateResourceInput = Pick<
  TablesUpdate<"resources">,
  "title" | "resource_type" | "external_url" | "is_downloadable"
>;

export async function listCourseContent(courseId: string) {
  const { data, error } = await supabase
    .from("modules")
    .select("*, lessons(*, resources(*))")
    .eq("course_id", courseId)
    .neq("status", "archived")
    .order("position", { ascending: true })
    .order("position", { referencedTable: "lessons", ascending: true })
    .order("position", { referencedTable: "lessons.resources", ascending: true });

  if (error) {
    throw error;
  }

  return (data as ModuleWithLessons[]).map((module) => ({
    ...module,
    lessons: module.lessons.filter((lesson) => lesson.status !== "archived"),
  }));
}

export async function createModule(input: CreateModuleInput) {
  const { data, error } = await supabase
    .from("modules")
    .insert(input)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getNextModulePosition(courseId: string) {
  const { data, error } = await supabase
    .from("modules")
    .select("position")
    .eq("course_id", courseId)
    .order("position", { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  return (data[0]?.position ?? 0) + 1;
}

export async function createLesson(input: CreateLessonInput) {
  const { data, error } = await supabase
    .from("lessons")
    .insert(input)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertLessonAssignment(input: {
  lessonId: string;
  title: string;
  description?: string | null;
  assignmentType?: string;
  points?: number;
}) {
  const { data, error } = await supabase
    .from("lesson_assignments")
    .upsert(
      {
        lesson_id: input.lessonId,
        title: input.title,
        description: input.description ?? null,
        assignment_type: input.assignmentType ?? "report",
        points: input.points ?? 10,
        required: true,
      },
      { onConflict: "lesson_id" },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createResource(input: CreateResourceInput) {
  const { data, error } = await supabase
    .from("resources")
    .insert(input)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateModule(moduleId: string, input: UpdateModuleInput) {
  const { data, error } = await supabase
    .from("modules")
    .update(input)
    .eq("id", moduleId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateLesson(lessonId: string, input: UpdateLessonInput) {
  const { data, error } = await supabase
    .from("lessons")
    .update(input)
    .eq("id", lessonId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateResource(
  resourceId: string,
  input: UpdateResourceInput,
) {
  const { data, error } = await supabase
    .from("resources")
    .update(input)
    .eq("id", resourceId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteResource(resourceId: string) {
  const { error } = await supabase
    .from("resources")
    .delete()
    .eq("id", resourceId);

  if (error) {
    throw error;
  }
}

export async function listLessonProgress(courseId: string, studentId: string) {
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("*, lessons!inner(course_id)")
    .eq("student_id", studentId)
    .eq("lessons.course_id", courseId);

  if (error) {
    throw error;
  }

  return data as LessonProgress[];
}

export async function markLessonViewed(lessonId: string, studentId: string) {
  const { data, error } = await supabase
    .from("lesson_progress")
    .upsert(
      {
        lesson_id: lessonId,
        student_id: studentId,
        viewed_at: new Date().toISOString(),
      },
      { onConflict: "lesson_id,student_id" },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function unmarkLessonViewed(lessonId: string, studentId: string) {
  const { error } = await supabase
    .from("lesson_progress")
    .delete()
    .eq("lesson_id", lessonId)
    .eq("student_id", studentId);

  if (error) {
    throw error;
  }
}

export async function listLessonAttendance(courseId: string, studentId?: string) {
  let query = supabase
    .from("lesson_attendance")
    .select("*, lessons!inner(course_id)")
    .eq("lessons.course_id", courseId);

  if (studentId) {
    query = query.eq("student_id", studentId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data as LessonAttendance[];
}

export async function saveLessonAttendance(input: {
  lessonId: string;
  studentId: string;
  attended: boolean;
  stayedUntilEnd: boolean;
  confirmedBy: string;
}) {
  const { data, error } = await supabase
    .from("lesson_attendance")
    .upsert(
      {
        lesson_id: input.lessonId,
        student_id: input.studentId,
        attended: input.attended,
        stayed_until_end: input.attended && input.stayedUntilEnd,
        confirmed_by: input.confirmedBy,
        confirmed_at: new Date().toISOString(),
      },
      { onConflict: "lesson_id,student_id" },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function listLessonAssignments(courseId: string) {
  const { data, error } = await supabase
    .from("lesson_assignments")
    .select("*, lessons!inner(course_id)")
    .eq("lessons.course_id", courseId);

  if (error) {
    throw error;
  }

  return data as LessonAssignment[];
}

export async function listAssignmentSubmissionsByAssignmentIds(
  assignmentIds: string[],
  studentId?: string,
) {
  if (assignmentIds.length === 0) {
    return [];
  }

  let query = supabase
    .from("assignment_submissions")
    .select("*")
    .in("assignment_id", assignmentIds);

  if (studentId) {
    query = query.eq("student_id", studentId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data as AssignmentSubmission[];
}

export async function submitAssignment(input: {
  assignmentId: string;
  studentId: string;
  submissionUrl?: string | null;
  notes?: string | null;
}) {
  const { data, error } = await supabase
    .from("assignment_submissions")
    .upsert(
      {
        assignment_id: input.assignmentId,
        student_id: input.studentId,
        submission_url: input.submissionUrl ?? null,
        notes: input.notes ?? null,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "assignment_id,student_id" },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function listAssignmentReviewItems() {
  const { data, error } = await supabase
    .from("assignment_submissions")
    .select(
      "*, profiles!assignment_submissions_student_id_fkey(id, display_name, first_name, last_name), lesson_assignments!inner(*, lessons!inner(id, title, course_id, modules(title)))",
    )
    .order("submitted_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data as unknown as AssignmentReviewItem[];
}

export async function reviewAssignmentSubmission(input: {
  submissionId: string;
  status: "reviewed" | "needs_revision";
  pointsAwarded?: number | null;
  reviewedBy: string;
}) {
  const { data, error } = await supabase
    .from("assignment_submissions")
    .update({
      status: input.status,
      points_awarded: input.pointsAwarded ?? null,
      reviewed_by: input.reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.submissionId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
