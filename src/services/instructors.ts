import { supabase } from "./supabase";
import type { Tables } from "../types/database.types";

export type InstructorProfile = Pick<
  Tables<"profiles">,
  "id" | "display_name" | "first_name" | "last_name"
>;

export type CourseInstructorAssignment = Tables<"course_instructors"> & {
  profiles: InstructorProfile | null;
};

export async function listInstructorProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, first_name, last_name")
    .eq("role", "instructor")
    .eq("status", "active")
    .order("display_name", { ascending: true, nullsFirst: false });

  if (error) {
    throw error;
  }

  return data as InstructorProfile[];
}

export async function listCourseInstructors(courseId: string) {
  const { data, error } = await supabase
    .from("course_instructors")
    .select(
      "*, profiles!course_instructors_instructor_id_fkey(id, display_name, first_name, last_name)",
    )
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data as unknown as CourseInstructorAssignment[];
}

export async function assignCourseInstructor(
  courseId: string,
  instructorId: string,
  assignedBy: string,
) {
  const { data, error } = await supabase
    .from("course_instructors")
    .upsert(
      {
        course_id: courseId,
        instructor_id: instructorId,
        assigned_by: assignedBy,
      },
      { onConflict: "course_id,instructor_id" },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
