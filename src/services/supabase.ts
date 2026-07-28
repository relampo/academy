import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey = import.meta.env
  .VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Missing Supabase environment variables.");
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabasePublishableKey,
);
