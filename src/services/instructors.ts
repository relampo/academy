import { supabase } from "./supabase";
import type { Tables } from "../types/database.types";

export type InstructorProfile = Pick<
  Tables<"profiles">,
  "id" | "display_name" | "first_name" | "last_name"
>;

export type CourseInstructorAssignment = Tables<"course_instructors"> & {
  profiles: InstructorProfile | null;
};

export type TeachingCourseAssignment = Tables<"course_instructors"> & {
  courses: Tables<"courses"> | null;
};

export async function listInstructorProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, first_name, last_name")
    .in("role", ["admin", "instructor"])
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

export async function removeCourseInstructor(
  courseId: string,
  instructorId: string,
) {
  const { error } = await supabase
    .from("course_instructors")
    .delete()
    .eq("course_id", courseId)
    .eq("instructor_id", instructorId);

  if (error) {
    throw error;
  }
}

export async function listTeachingCourses(instructorId: string) {
  const { data, error } = await supabase
    .from("course_instructors")
    .select("*, courses(*)")
    .eq("instructor_id", instructorId)
    .neq("courses.status", "archived")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data as unknown as TeachingCourseAssignment[];
}
