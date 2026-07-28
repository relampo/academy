import { supabase } from "./supabase";
import type {
  Enums,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "../types/database.types";

export type Course = Tables<"courses">;
export type CourseEdition = Tables<"course_editions">;
export type Enrollment = Tables<"enrollments">;

export type CourseWithEditions = Course & {
  course_editions: CourseEdition[];
};

export type PublishedEditionWithCourseAndEnrollment = CourseEdition & {
  courses: Course | null;
  enrollments: Enrollment[];
};

export type EnrollmentReviewItem = Enrollment & {
  course_editions: (CourseEdition & { courses: Course | null }) | null;
  profiles: Pick<
    Tables<"profiles">,
    "id" | "display_name" | "first_name" | "last_name"
  > | null;
};

export type CreateCourseInput = Pick<
  TablesInsert<"courses">,
  "title" | "slug" | "short_description" | "description" | "status"
>;

export type CreateEditionInput = Pick<
  TablesInsert<"course_editions">,
  | "course_id"
  | "title"
  | "slug"
  | "status"
  | "start_date"
  | "end_date"
  | "capacity"
  | "enrollment_open"
  | "requires_approval"
>;

export type UpdateCourseInput = Pick<
  TablesUpdate<"courses">,
  "title" | "slug" | "short_description" | "description" | "status"
>;

export type UpdateEditionInput = Pick<
  TablesUpdate<"course_editions">,
  | "title"
  | "status"
  | "start_date"
  | "end_date"
  | "capacity"
  | "enrollment_open"
  | "requires_approval"
>;

export type EnrollmentStatus = Enums<"enrollment_status">;

export async function listCoursesWithEditions() {
  const { data, error } = await supabase
    .from("courses")
    .select("*, course_editions(*)")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data as CourseWithEditions[];
}

export async function getCourseWithEditions(courseId: string) {
  const { data, error } = await supabase
    .from("courses")
    .select("*, course_editions(*)")
    .eq("id", courseId)
    .single();

  if (error) {
    throw error;
  }

  return data as CourseWithEditions;
}

export async function listPublishedCourseEditions() {
  const { data, error } = await supabase
    .from("course_editions")
    .select("*, courses(*), enrollments(*)")
    .in("status", ["published", "enrollment_closed", "completed"])
    .order("start_date", { ascending: true, nullsFirst: false });

  if (error) {
    throw error;
  }

  return data as PublishedEditionWithCourseAndEnrollment[];
}

export async function createCourse(input: CreateCourseInput) {
  const { data, error } = await supabase
    .from("courses")
    .insert(input)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createCourseEdition(input: CreateEditionInput) {
  const { data, error } = await supabase
    .from("course_editions")
    .insert(input)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getUniqueEditionSlug(courseId: string, title: string) {
  const baseSlug = slugify(title) || "edition";
  const { data, error } = await supabase
    .from("course_editions")
    .select("slug")
    .eq("course_id", courseId)
    .like("slug", `${baseSlug}%`);

  if (error) {
    throw error;
  }

  const existingSlugs = new Set(data.map((edition) => edition.slug));

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = existingSlugs.size + 1;
  let nextSlug = `${baseSlug}-${suffix}`;

  while (existingSlugs.has(nextSlug)) {
    suffix += 1;
    nextSlug = `${baseSlug}-${suffix}`;
  }

  return nextSlug;
}

export async function updateCourse(courseId: string, input: UpdateCourseInput) {
  const { data, error } = await supabase
    .from("courses")
    .update(input)
    .eq("id", courseId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateCourseEdition(
  editionId: string,
  input: UpdateEditionInput,
) {
  const { data, error } = await supabase
    .from("course_editions")
    .update(input)
    .eq("id", editionId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function requestEnrollment(courseEditionId: string, studentId: string) {
  const { data, error } = await supabase
    .from("enrollments")
    .insert({
      course_edition_id: courseEditionId,
      student_id: studentId,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function listEnrollmentReviews() {
  const { data, error } = await supabase
    .from("enrollments")
    .select(
      "*, profiles!enrollments_student_id_fkey(id, display_name, first_name, last_name), course_editions(*, courses(*))",
    )
    .order("requested_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data as unknown as EnrollmentReviewItem[];
}

export async function updateEnrollmentStatus(
  enrollmentId: string,
  status: EnrollmentStatus,
  reviewerId: string,
) {
  const { data, error } = await supabase
    .from("enrollments")
    .update({
      status,
      approved_at: status === "approved" ? new Date().toISOString() : null,
      approved_by: status === "approved" ? reviewerId : null,
      rejection_reason: status === "rejected" ? "Rejected by reviewer" : null,
    })
    .eq("id", enrollmentId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
