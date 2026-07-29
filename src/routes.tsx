import type { ComponentType } from "react";
import { AdminCoursesPage } from "./pages/AdminCoursesPage";
import { AdminSettingsPage } from "./pages/AdminSettingsPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AssignmentReviewPage } from "./pages/AssignmentReviewPage";
import { CoursesPage } from "./pages/CoursesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EnrollmentReviewPage } from "./pages/EnrollmentReviewPage";
import { ProfilePage } from "./pages/ProfilePage";
import { TeachingCoursesPage } from "./pages/TeachingCoursesPage";
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
    label: "Inicio",
    Component: DashboardPage,
    allowedRoles: ["admin", "instructor", "student"],
    navGroup: "student",
  },
  {
    path: "/courses",
    label: "Mis cursos",
    Component: CoursesPage,
    allowedRoles: ["admin", "instructor", "student"],
    navGroup: "student",
  },
  {
    path: "/profile",
    label: "Perfil",
    Component: ProfilePage,
    allowedRoles: ["admin", "instructor", "student"],
    navGroup: "student",
  },
  {
    path: "/enrollments",
    label: "Inscripciones",
    Component: EnrollmentReviewPage,
    allowedRoles: ["admin", "instructor"],
    navGroup: "instructor",
  },
  {
    path: "/teaching",
    label: "Cursos que imparto",
    Component: TeachingCoursesPage,
    allowedRoles: ["admin", "instructor"],
    navGroup: "instructor",
  },
  {
    path: "/assignments",
    label: "Tareas",
    Component: AssignmentReviewPage,
    allowedRoles: ["admin", "instructor"],
    navGroup: "instructor",
  },
  {
    path: "/admin/courses",
    label: "Cursos",
    Component: AdminCoursesPage,
    allowedRoles: ["admin"],
    navGroup: "admin",
  },
  {
    path: "/admin/users",
    label: "Usuarios",
    Component: AdminUsersPage,
    allowedRoles: ["admin"],
    navGroup: "admin",
  },
  {
    path: "/admin/settings",
    label: "Configuracion",
    Component: AdminSettingsPage,
    allowedRoles: ["admin"],
    navGroup: "admin",
  },
];

export function getRoute(path: string) {
  return appRoutes.find((route) => route.path === path);
}
