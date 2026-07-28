import type { ComponentType } from "react";
import { AdminCoursesPage } from "./pages/AdminCoursesPage";
import { AdminSettingsPage } from "./pages/AdminSettingsPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AssignmentsPage } from "./pages/AssignmentsPage";
import { CoursesPage } from "./pages/CoursesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EnrollmentReviewPage } from "./pages/EnrollmentReviewPage";
import { ProfilePage } from "./pages/ProfilePage";
import type { Enums } from "./types/database.types";

export type UserRole = Enums<"user_role">;

export type AppRoute = {
  path: string;
  label: string;
  Component: ComponentType;
  allowedRoles: UserRole[];
  navGroup: "student" | "instructor" | "admin";
};

export const appRoutes: AppRoute[] = [
  {
    path: "/",
    label: "Dashboard",
    Component: DashboardPage,
    allowedRoles: ["admin", "instructor", "student"],
    navGroup: "student",
  },
  {
    path: "/courses",
    label: "My Courses",
    Component: CoursesPage,
    allowedRoles: ["admin", "instructor", "student"],
    navGroup: "student",
  },
  {
    path: "/profile",
    label: "Profile",
    Component: ProfilePage,
    allowedRoles: ["admin", "instructor", "student"],
    navGroup: "student",
  },
  {
    path: "/enrollments",
    label: "Enrollment Review",
    Component: EnrollmentReviewPage,
    allowedRoles: ["admin", "instructor"],
    navGroup: "instructor",
  },
  {
    path: "/assignments",
    label: "Assignments",
    Component: AssignmentsPage,
    allowedRoles: ["admin", "instructor"],
    navGroup: "instructor",
  },
  {
    path: "/admin/courses",
    label: "Courses",
    Component: AdminCoursesPage,
    allowedRoles: ["admin"],
    navGroup: "admin",
  },
  {
    path: "/admin/users",
    label: "Users",
    Component: AdminUsersPage,
    allowedRoles: ["admin"],
    navGroup: "admin",
  },
  {
    path: "/admin/settings",
    label: "Settings",
    Component: AdminSettingsPage,
    allowedRoles: ["admin"],
    navGroup: "admin",
  },
];

export function getRoute(path: string) {
  return appRoutes.find((route) => route.path === path);
}
