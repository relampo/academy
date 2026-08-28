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
export type LessonQuiz = Tables<"lesson_quizzes">;
export type QuizQuestion = Tables<"quiz_questions">;
export type QuizAttempt = Tables<"quiz_attempts">;
export type QuizAnswer = Tables<"quiz_answers">;
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

export type LessonQuizWithQuestions = LessonQuiz & {
  quiz_questions: QuizQuestion[];
};

type QuizAttemptWithAnswers = QuizAttempt & {
  quiz_answers?: Pick<QuizAnswer, "id">[];
};

export type QuizAnswerInput = {
  questionId: string;
  selectedOption: string;
  secondsSpent: number;
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

export async function listLessonQuizzes(courseId: string) {
  const { data, error } = await supabase
    .from("lesson_quizzes")
    .select("*, quiz_questions(*), lessons!inner(course_id)")
    .eq("lessons.course_id", courseId)
    .order("created_at", { ascending: true })
    .order("position", {
      referencedTable: "quiz_questions",
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data as LessonQuizWithQuestions[];
}

export async function upsertLessonQuizQuestions(input: {
  lessonId: string;
  title: string;
  questions: Array<{
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: string;
    position: number;
  }>;
}) {
  const { data: quiz, error: quizError } = await supabase
    .from("lesson_quizzes")
    .upsert(
      {
        lesson_id: input.lessonId,
        title: input.title,
        required: true,
      },
      { onConflict: "lesson_id" },
    )
    .select()
    .single();

  if (quizError) {
    throw quizError;
  }

  const { data, error } = await supabase
    .from("quiz_questions")
    .upsert(
      input.questions.map((question) => ({
        quiz_id: quiz.id,
        question_text: question.questionText,
        option_a: question.optionA,
        option_b: question.optionB,
        option_c: question.optionC,
        option_d: question.optionD,
        correct_option: question.correctOption,
        position: question.position,
      })),
      { onConflict: "quiz_id,position" },
    )
    .select()
    .order("position", { ascending: true });

  if (error) {
    throw error;
  }

  return { ...quiz, quiz_questions: data } as LessonQuizWithQuestions;
}

export async function listQuizAttemptsByQuizIds(
  quizIds: string[],
  studentId?: string,
) {
  if (quizIds.length === 0) {
    return [];
  }

  let query = supabase
    .from("quiz_attempts")
    .select("*, quiz_answers(id)")
    .in("quiz_id", quizIds);

  if (studentId) {
    query = query.eq("student_id", studentId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data as QuizAttemptWithAnswers[])
    .filter((attempt) => (attempt.quiz_answers?.length ?? 0) === 10)
    .map(({ quiz_answers: _quizAnswers, ...attempt }) => attempt);
}

// Per-question detail of a finished attempt, for the review a student sees
// afterwards. Deliberately does not read quiz_questions.correct_option: the
// quiz allows a single attempt, so revealing the right answer to whoever
// finished first hands them the solved paper to pass around.
export async function listQuizAnswersByAttemptIds(attemptIds: string[]) {
  if (attemptIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("quiz_answers")
    .select("*")
    .in("attempt_id", attemptIds);

  if (error) {
    throw error;
  }

  return (data ?? []) as QuizAnswer[];
}

// Escala por pregunta. Premia a quien ya domina el tema y responde de
// inmediato, sin dejar sin puntos a quien se toma su tiempo. El tramo máximo
// llega hasta los 10 segundos porque varias preguntas plantean un escenario:
// leerlo con calma no debería costar puntos. Una respuesta incorrecta no suma,
// rápida o lenta.
function getQuizPoints(isCorrect: boolean, secondsSpent: number) {
  if (!isCorrect) {
    return 0;
  }

  if (secondsSpent <= 10) {
    return 2;
  }

  if (secondsSpent <= 20) {
    return 1.8;
  }

  if (secondsSpent <= 30) {
    return 1.6;
  }

  if (secondsSpent <= 45) {
    return 1.4;
  }

  return 1.2;
}

export async function submitQuizAttempt(input: {
  quiz: LessonQuizWithQuestions;
  studentId: string;
  answers: QuizAnswerInput[];
}) {
  const questionById = new Map(
    input.quiz.quiz_questions.map((question) => [question.id, question]),
  );
  const answers = input.answers.map((answer) => {
    const question = questionById.get(answer.questionId);
    const isCorrect = question?.correct_option === answer.selectedOption;
    const secondsSpent = Math.max(0, Math.round(answer.secondsSpent));

    return {
      question_id: answer.questionId,
      selected_option: answer.selectedOption,
      is_correct: isCorrect,
      seconds_spent: secondsSpent,
      points_awarded: getQuizPoints(isCorrect, secondsSpent),
    };
  });
  const totalScore = answers.reduce(
    (sum, answer) => sum + answer.points_awarded,
    0,
  );
  const totalSeconds = answers.reduce(
    (sum, answer) => sum + answer.seconds_spent,
    0,
  );

  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .upsert(
      {
        quiz_id: input.quiz.id,
        student_id: input.studentId,
        total_score: totalScore,
        total_seconds: totalSeconds,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "quiz_id,student_id" },
    )
    .select()
    .single();

  if (attemptError) {
    throw attemptError;
  }

  const { error: answersError } = await supabase.from("quiz_answers").upsert(
    answers.map((answer) => ({
      attempt_id: attempt.id,
      ...answer,
    })),
    { onConflict: "attempt_id,question_id" },
  );

  if (answersError) {
    throw answersError;
  }

  return attempt as QuizAttempt;
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
