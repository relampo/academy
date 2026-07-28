import { supabase } from "./supabase";
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "../types/database.types";

export type Module = Tables<"modules">;
export type Lesson = Tables<"lessons">;
export type Resource = Tables<"resources">;

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

  return data as ModuleWithLessons[];
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
