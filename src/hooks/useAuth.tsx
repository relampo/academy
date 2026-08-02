import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../services/supabase";
import { getAppBaseUrl } from "../lib/appUrl";
import type { Tables } from "../types/database.types";

type Profile = Tables<"profiles">;

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

type SignUpInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string, email?: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      throw error;
    }

    if (email && "email" in data && data.email !== email) {
      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({ email })
        .eq("id", userId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setProfile(updatedProfile);
      return;
    }

    setProfile(data);
  }, []);

  const refreshProfile = useCallback(async () => {
    const {
      data: { session: activeSession },
    } = await supabase.auth.getSession();

    if (!activeSession?.user) {
      setProfile(null);
      return;
    }

    await loadProfile(activeSession.user.id, activeSession.user.email);
  }, [loadProfile]);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const {
        data: { session: activeSession },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      setSession(activeSession);

      if (activeSession?.user) {
        await loadProfile(activeSession.user.id, activeSession.user.email);
      } else {
        setProfile(null);
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "PASSWORD_RECOVERY") {
        window.sessionStorage.setItem("relampo:passwordRecovery", "true");
        window.dispatchEvent(new CustomEvent("relampo:password-recovery"));
      }

      setSession(nextSession);

      if (!nextSession?.user) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      void loadProfile(nextSession.user.id, nextSession.user.email).finally(() =>
        setIsLoading(false),
      );
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: getAppBaseUrl(),
        data: {
          first_name: input.firstName,
          last_name: input.lastName,
          display_name: `${input.firstName} ${input.lastName}`.trim(),
          email: input.email,
        },
      },
    });

    if (error) {
      throw error;
    }

    if (data.user && data.user.identities?.length === 0) {
      throw new Error(
        "Este email ya tiene una cuenta. Inicia sesión para inscribirte.",
      );
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isLoading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [isLoading, profile, refreshProfile, session, signIn, signOut, signUp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
