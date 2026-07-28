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

export async function getUniqueCourseSlug(title: string) {
  const baseSlug = slugify(title) || "course";
  const { data, error } = await supabase
    .from("courses")
    .select("slug")
    .like("slug", `${baseSlug}%`);

  if (error) {
    throw error;
  }

  const existingSlugs = new Set(data.map((course) => course.slug));

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

export async function createCourseWithDefaultOffering(
  input: CreateCourseInput,
  enrollmentOpen: boolean,
) {
  const course = await createCourse(input);

  await createCourseEdition({
    course_id: course.id,
    title: course.title,
    slug: "default",
    status: input.status ?? "draft",
    start_date: null,
    end_date: null,
    capacity: null,
    enrollment_open: enrollmentOpen,
    requires_approval: true,
  });

  return course;
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

export async function duplicateCourse(courseId: string) {
  const source = await getCourseWithEditions(courseId);
  const copyTitle = `${source.title} Copy`;
  const copySlug = await getUniqueCourseSlug(copyTitle);

  const { data: copiedCourse, error: courseError } = await supabase
    .from("courses")
    .insert({
      title: copyTitle,
      slug: copySlug,
      short_description: source.short_description,
      description: source.description,
      cover_url: source.cover_url,
      status: "draft",
      source_course_id: source.id,
    })
    .select()
    .single();

  if (courseError) {
    throw courseError;
  }

  const primaryOffering = source.course_editions[0];

  await createCourseEdition({
    course_id: copiedCourse.id,
    title: copiedCourse.title,
    slug: "default",
    status: "draft",
    start_date: primaryOffering?.start_date ?? null,
    end_date: primaryOffering?.end_date ?? null,
    capacity: primaryOffering?.capacity ?? null,
    enrollment_open: false,
    requires_approval: primaryOffering?.requires_approval ?? true,
  });

  const { data: modules, error: modulesError } = await supabase
    .from("modules")
    .select("*, lessons(*, resources(*))")
    .eq("course_id", source.id)
    .neq("status", "archived")
    .order("position", { ascending: true })
    .order("position", { referencedTable: "lessons", ascending: true })
    .order("position", { referencedTable: "lessons.resources", ascending: true });

  if (modulesError) {
    throw modulesError;
  }

  for (const module of modules ?? []) {
    const { data: copiedModule, error: moduleError } = await supabase
      .from("modules")
      .insert({
        course_id: copiedCourse.id,
        title: module.title,
        description: module.description,
        position: module.position,
        status: module.status,
      })
      .select()
      .single();

    if (moduleError) {
      throw moduleError;
    }

    for (const lesson of module.lessons ?? []) {
      const { data: copiedLesson, error: lessonError } = await supabase
        .from("lessons")
        .insert({
          course_id: copiedCourse.id,
          module_id: copiedModule.id,
          title: lesson.title,
          slug: lesson.slug,
          description: lesson.description,
          objectives: lesson.objectives,
          content: lesson.content,
          video_url: lesson.video_url,
          scheduled_at: lesson.scheduled_at,
          duration_minutes: lesson.duration_minutes,
          position: lesson.position,
          status: lesson.status,
          attendance_enabled: lesson.attendance_enabled,
        })
        .select()
        .single();

      if (lessonError) {
        throw lessonError;
      }

      for (const resource of lesson.resources ?? []) {
        const { error: resourceError } = await supabase.from("resources").insert({
          lesson_id: copiedLesson.id,
          title: resource.title,
          description: resource.description,
          resource_type: resource.resource_type,
          external_url: resource.external_url,
          is_downloadable: resource.is_downloadable,
          unlock_at: resource.unlock_at,
          requires_enrollment: resource.requires_enrollment,
          position: resource.position,
        });

        if (resourceError) {
          throw resourceError;
        }
      }
    }
  }

  return copiedCourse;
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
