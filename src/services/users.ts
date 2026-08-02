import { supabase } from "./supabase";
import type { Enums, Tables, TablesUpdate } from "../types/database.types";
import { getAppBaseUrl } from "../lib/appUrl";

const productionAppUrl = "https://performancelatam.com";

export type AcademyUser = Tables<"profiles">;
export type AcademyUserRole = Enums<"user_role">;
export type AcademyUserStatus = Enums<"user_status">;

export type UserEnrollmentSummary = Pick<
  Tables<"enrollments">,
  "id" | "course_edition_id" | "student_id" | "status" | "requested_at"
> & {
  course_editions:
    | (Pick<Tables<"course_editions">, "id" | "course_id" | "title"> & {
        courses: Pick<Tables<"courses">, "id" | "title"> | null;
      })
    | null;
};

export async function listAcademyUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data as AcademyUser[];
}

export async function listUserEnrollmentSummaries() {
  const { data, error } = await supabase
    .from("enrollments")
    .select("id, course_edition_id, student_id, status, requested_at, course_editions(id, course_id, title, courses(id, title))")
    .order("requested_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data as unknown as UserEnrollmentSummary[];
}

export async function updateUserProfile(
  userId: string,
  input: Pick<TablesUpdate<"profiles">, "role" | "status">,
) {
  const { data, error } = await supabase
    .from("profiles")
    .update(input)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteStudentProfile(userId: string) {
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId)
    .eq("role", "student");

  if (error) {
    throw error;
  }
}

export async function sendPasswordReset(email: string) {
  const appBaseUrl = getAppBaseUrl();
  const redirectBaseUrl = appBaseUrl.includes("localhost")
    ? productionAppUrl
    : appBaseUrl;
  const redirectTo = `${redirectBaseUrl}?reset-password=1`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    throw error;
  }
}

export async function assignUserToCourseEdition(
  studentId: string,
  courseEditionId: string,
  approvedBy: string,
) {
  const { data: existingEnrollment, error: existingError } = await supabase
    .from("enrollments")
    .select("id")
    .eq("student_id", studentId)
    .eq("course_edition_id", courseEditionId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  const approval = {
    status: "approved" as const,
    approved_at: new Date().toISOString(),
    approved_by: approvedBy,
    rejection_reason: null,
  };

  if (existingEnrollment) {
    const { data, error } = await supabase
      .from("enrollments")
      .update(approval)
      .eq("id", existingEnrollment.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  const { data, error } = await supabase
    .from("enrollments")
    .insert({
      course_edition_id: courseEditionId,
      student_id: studentId,
      ...approval,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function unassignUserFromCourseEdition(enrollmentId: string) {
  const { data, error } = await supabase
    .from("enrollments")
    .update({
      status: "withdrawn",
      approved_at: null,
      approved_by: null,
      rejection_reason: null,
    })
    .eq("id", enrollmentId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
