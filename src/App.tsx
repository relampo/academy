import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BrandMark } from "./components/BrandMark";
import { AppLayout } from "./layouts/AppLayout";
import { useAuth } from "./hooks/useAuth";
import { AdminCourseDetailPage } from "./pages/AdminCourseDetailPage";
import { AssignmentReviewPage } from "./pages/AssignmentReviewPage";
import { AttendancePage } from "./pages/AttendancePage";
import { CoursePlayerPage } from "./pages/CoursePlayerPage";
import { EnrollPage } from "./pages/EnrollPage";
import { LoginPage } from "./pages/LoginPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { supabase } from "./services/supabase";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";
import { getRoute, type AppRoute, type UserRole } from "./routes";

function getHashPath() {
  const hashPath = window.location.hash.replace(/^#/, "");
  const isPasswordRecovery =
    window.sessionStorage.getItem("relampo:passwordRecovery") === "true" ||
    window.location.search.includes("reset-password=1") ||
    hashPath.includes("type=recovery") ||
    window.location.href.includes("type=recovery");

  if (isPasswordRecovery) {
    window.sessionStorage.setItem("relampo:passwordRecovery", "true");
    return "/reset-password";
  }

  return hashPath.startsWith("/") ? hashPath : "/";
}

type DynamicRoute = {
  allowedRoles: UserRole[];
  element: ReactNode;
  navPath: string;
  isPublic?: boolean;
};

function renderDynamicRoute(path: string): DynamicRoute | null {
  const enrollmentMatch = path.match(/^\/enroll\/([^/]+)$/);

  if (enrollmentMatch?.[1]) {
    return {
      allowedRoles: ["admin", "instructor", "student"],
      element: <EnrollPage courseRef={decodeURIComponent(enrollmentMatch[1])} />,
      navPath: "/courses",
      isPublic: true,
    };
  }

  if (path === "/reset-password") {
    return {
      allowedRoles: ["admin", "instructor", "student"],
      element: <ResetPasswordPage />,
      navPath: "/profile",
      isPublic: true,
    };
  }

  const adminCourseMatch = path.match(/^\/admin\/courses\/([^/]+)$/);

  if (adminCourseMatch?.[1]) {
    return {
      allowedRoles: ["admin"],
      element: <AdminCourseDetailPage courseId={adminCourseMatch[1]} />,
      navPath: "/admin/courses",
    };
  }

  const attendanceMatch = path.match(/^\/attendance\/([^/]+)$/);

  if (attendanceMatch?.[1]) {
    return {
      allowedRoles: ["admin", "instructor"],
      element: <AttendancePage courseId={attendanceMatch[1]} />,
      navPath: "/teaching",
    };
  }

  const assignmentMatch = path.match(/^\/assignments\/([^/]+)$/);

  if (assignmentMatch?.[1]) {
    return {
      allowedRoles: ["admin", "instructor"],
      element: <AssignmentReviewPage courseId={assignmentMatch[1]} />,
      navPath: "/assignments",
    };
  }

  const courseMatch = path.match(/^\/courses\/([^/]+)$/);

  if (courseMatch?.[1]) {
    return {
      allowedRoles: ["admin", "instructor", "student"],
      element: <CoursePlayerPage courseId={courseMatch[1]} />,
      navPath: "/courses",
    };
  }

  return null;
}

export function App() {
  const [path, setPath] = useState(getHashPath);
  const [refreshKey, setRefreshKey] = useState(0);
  const { isLoading, profile, session } = useAuth();

  useEffect(() => {
    const handleHashChange = () => setPath(getHashPath());
    const handlePasswordRecovery = () => setPath("/reset-password");
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("relampo:password-recovery", handlePasswordRecovery);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener(
        "relampo:password-recovery",
        handlePasswordRecovery,
      );
    };
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        window.sessionStorage.setItem("relampo:passwordRecovery", "true");
        setPath("/reset-password");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const dynamicRoute = renderDynamicRoute(path);
    const isPublicRoute = dynamicRoute?.isPublic;

    if (!isLoading && !session && path !== "/login" && !isPublicRoute) {
      window.location.hash = "/login";
    }

    if (
      !isLoading &&
      session &&
      path === "/login" &&
      window.sessionStorage.getItem("relampo:passwordRecovery") === "true"
    ) {
      setPath("/reset-password");
      return;
    }

    if (!isLoading && session && path === "/login") {
      const returnTo = window.sessionStorage.getItem("relampo:returnTo");
      window.location.hash = returnTo || "/";
    }
  }, [isLoading, path, session]);

  useEffect(() => {
    if (!session) {
      return;
    }

    let refreshTimer: number | undefined;
    const tables = [
      "courses",
      "course_editions",
      "course_instructors",
      "enrollments",
      "modules",
      "lessons",
      "resources",
      "lesson_attendance",
      "lesson_progress",
      "lesson_assignments",
      "assignment_submissions",
      "lesson_quizzes",
      "quiz_questions",
      "quiz_attempts",
      "quiz_answers",
      "leaderboard_profiles",
    ];
    const channel = supabase.channel("relampo-app-refresh");

    tables.forEach((table) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          window.clearTimeout(refreshTimer);
          refreshTimer = window.setTimeout(() => {
            window.dispatchEvent(new CustomEvent("relampo:data-changed"));

            if (!path.match(/^\/courses\/[^/]+$/)) {
              setRefreshKey((current) => current + 1);
            }
          }, 450);
        },
      );
    });

    void channel.subscribe();

    return () => {
      window.clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [path, session]);

  const page = useMemo(() => {
    if (isLoading) {
      return (
        <main className="loading-screen">
          <BrandMark size="large" />
          <strong>Cargando Relampo Academy</strong>
        </main>
      );
    }

    const dynamicRoute = renderDynamicRoute(path);

    if (!session && path !== "/login" && !dynamicRoute?.isPublic) {
      return null;
    }

    if (path === "/login") {
      return <LoginPage />;
    }

    if (path === "/reset-password") {
      return <ResetPasswordPage />;
    }

    const staticRoute = getRoute(path);
    const route: DynamicRoute | AppRoute | undefined =
      dynamicRoute ?? staticRoute;

    if (!route) {
      window.location.hash = "/";
      return null;
    }

    if (dynamicRoute?.isPublic && !session) {
      return dynamicRoute.element;
    }

    const role = profile?.role ?? "student";
    const isAllowed = route.allowedRoles.includes(role);

    if (!isAllowed) {
      return (
        <AppLayout currentPath={path} key={`unauthorized-${refreshKey}`}>
          <UnauthorizedPage />
        </AppLayout>
      );
    }

    if ("element" in route) {
      return (
        <AppLayout currentPath={route.navPath} key={`${path}-${refreshKey}`}>
          {route.element}
        </AppLayout>
      );
    }

    const Page = route.Component;

    return (
      <AppLayout currentPath={path} key={`${path}-${refreshKey}`}>
        <Page />
      </AppLayout>
    );
  }, [isLoading, path, profile?.role, refreshKey, session]);

  return page;
}
