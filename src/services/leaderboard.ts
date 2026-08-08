import { supabase } from "./supabase";
import type { Enums, TablesUpdate } from "../types/database.types";

export type LeaderboardEntry = {
  student_id: string;
  display_name: string;
  avatar_url: string | null;
  total_score: number;
  max_score: number;
  score_ratio: number;
  level: string;
};

export type LeaderboardVisibility = Enums<"leaderboard_visibility">;

export async function getCourseLeaderboard(courseId: string) {
  const { data, error } = await supabase.rpc("get_course_leaderboard", {
    target_course_id: courseId,
  });

  if (error) {
    throw error;
  }

  return data as LeaderboardEntry[];
}

export async function getLeaderboardAliasPool() {
  const { data, error } = await supabase.rpc("get_leaderboard_alias_pool");

  if (error) {
    throw error;
  }

  return (data ?? []) as string[];
}

export async function updateLeaderboardProfile(
  userId: string,
  input: Pick<
    TablesUpdate<"profiles">,
    "leaderboard_name" | "leaderboard_visibility" | "avatar_url"
  >,
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
