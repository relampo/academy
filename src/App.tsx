import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BrandMark } from "./components/BrandMark";
import { AppLayout } from "./layouts/AppLayout";
import { useAuth } from "./hooks/useAuth";
import { AdminCourseDetailPage } from "./pages/AdminCourseDetailPage";
import { AssignmentReviewPage } from "./pages/AssignmentReviewPage";
import { AttendancePage } from "./pages/AttendancePage";
import { CoursePlayerPage } from "./pages/CoursePlayerPage";
import { LoginPage } from "./pages/LoginPage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";
import { getRoute, type AppRoute, type UserRole } from "./routes";

function getHashPath() {
  const hashPath = window.location.hash.replace(/^#/, "");
  return hashPath.startsWith("/") ? hashPath : "/";
}

type DynamicRoute = {
  allowedRoles: UserRole[];
  element: ReactNode;
  navPath: string;
};

function renderDynamicRoute(path: string): DynamicRoute | null {
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
  const { isLoading, profile, session } = useAuth();

  useEffect(() => {
    const handleHashChange = () => setPath(getHashPath());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (!isLoading && !session && path !== "/login") {
      window.location.hash = "/login";
    }

    if (!isLoading && session && path === "/login") {
      window.location.hash = "/";
    }
  }, [isLoading, path, session]);

  const page = useMemo(() => {
    if (isLoading) {
      return (
        <main className="loading-screen">
          <BrandMark size="large" />
          <strong>Loading Relampo Academy</strong>
        </main>
      );
    }

    if (!session && path !== "/login") {
      return null;
    }

    if (path === "/login") {
      return <LoginPage />;
    }

    const dynamicRoute = renderDynamicRoute(path);
    const staticRoute = getRoute(path);
    const route: DynamicRoute | AppRoute | undefined =
      dynamicRoute ?? staticRoute;

    if (!route) {
      window.location.hash = "/";
      return null;
    }

    const role = profile?.role ?? "student";
    const isAllowed = route.allowedRoles.includes(role);

    if (!isAllowed) {
      return (
        <AppLayout currentPath={path}>
          <UnauthorizedPage />
        </AppLayout>
      );
    }

    if ("element" in route) {
      return <AppLayout currentPath={route.navPath}>{route.element}</AppLayout>;
    }

    const Page = route.Component;

    return (
      <AppLayout currentPath={path}>
        <Page />
      </AppLayout>
    );
  }, [isLoading, path, profile?.role, session]);

  return page;
}
