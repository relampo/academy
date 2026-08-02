import { useEffect, useMemo, useState } from "react";
import { listCoursesWithEditions, type CourseWithEditions } from "../services/courses";
import { getCourseLeaderboard, type LeaderboardEntry } from "../services/leaderboard";
import {
  assignUserToCourseEdition,
  deleteStudentProfile,
  listAcademyUsers,
  listUserEnrollmentSummaries,
  updateUserProfile,
  type AcademyUser,
  type AcademyUserRole,
  type AcademyUserStatus,
  type UserEnrollmentSummary,
} from "../services/users";
import { useAuth } from "../hooks/useAuth";

const ROLE_LABELS: Record<AcademyUserRole, string> = {
  admin: "Administrador",
  instructor: "Instructor",
  student: "Estudiante",
};

const STATUS_LABELS: Record<AcademyUserStatus, string> = {
  active: "Activo",
  pending: "Pendiente",
  suspended: "Desactivado",
};

function getUserName(user: AcademyUser) {
  return (
    user.display_name ||
    `${user.first_name} ${user.last_name}`.trim() ||
    "Usuario sin nombre"
  );
}

function getUserInitials(user: AcademyUser) {
  const name = getUserName(user);
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AcademyUser[]>([]);
  const [enrollments, setEnrollments] = useState<UserEnrollmentSummary[]>([]);
  const [courses, setCourses] = useState<CourseWithEditions[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("all");
  const [courseEditionToAssign, setCourseEditionToAssign] = useState("");
  const [roleFilter, setRoleFilter] = useState<AcademyUserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AcademyUserStatus | "all">(
    "all",
  );
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [nextUsers, nextEnrollments, nextCourses] = await Promise.all([
        listAcademyUsers(),
        listUserEnrollmentSummaries(),
        listCoursesWithEditions(),
      ]);

      setUsers(nextUsers);
      setEnrollments(nextEnrollments);
      setCourses(nextCourses);

      if (selectedCourseId === "all" && nextCourses[0]) {
        setSelectedCourseId(nextCourses[0].id);
      }

      const firstEdition = nextCourses[0]?.course_editions[0];
      if (!courseEditionToAssign && firstEdition) {
        setCourseEditionToAssign(firstEdition.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (selectedCourseId === "all") {
      setLeaderboard([]);
      return;
    }

    void getCourseLeaderboard(selectedCourseId).then(setLeaderboard);
  }, [selectedCourseId]);

  const enrollmentByUser = useMemo(() => {
    return enrollments.reduce<Record<string, UserEnrollmentSummary[]>>(
      (accumulator, enrollment) => {
        accumulator[enrollment.student_id] = [
          ...(accumulator[enrollment.student_id] ?? []),
          enrollment,
        ];
        return accumulator;
      },
      {},
    );
  }, [enrollments]);

  const leaderboardByUser = useMemo(() => {
    return leaderboard.reduce<Record<string, LeaderboardEntry & { rank: number }>>(
      (accumulator, entry, index) => {
        accumulator[entry.student_id] = { ...entry, rank: index + 1 };
        return accumulator;
      },
      {},
    );
  }, [leaderboard]);

  const assignableEditions = useMemo(
    () =>
      courses.flatMap((course) =>
        course.course_editions.map((edition) => ({
          ...edition,
          courseTitle: course.title,
        })),
      ),
    [courses],
  );

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((academyUser) => {
      const userEnrollments = enrollmentByUser[academyUser.id] ?? [];
      const matchesSearch =
        !normalizedSearch ||
        getUserName(academyUser).toLowerCase().includes(normalizedSearch) ||
        (academyUser.leaderboard_name ?? "")
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesRole = roleFilter === "all" || academyUser.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" || academyUser.status === statusFilter;
      const matchesCourse =
        selectedCourseId === "all" ||
        userEnrollments.some(
          (enrollment) =>
            enrollment.course_editions?.course_id === selectedCourseId,
        );

      return matchesSearch && matchesRole && matchesStatus && matchesCourse;
    });
  }, [
    enrollmentByUser,
    roleFilter,
    search,
    selectedCourseId,
    statusFilter,
    users,
  ]);

  const handleRoleChange = async (
    targetUser: AcademyUser,
    nextRole: AcademyUserRole,
  ) => {
    if (targetUser.id === currentUser?.id) {
      setActionMessage("No puedes cambiar tu propio rol desde esta tabla.");
      return;
    }

    const confirmed = window.confirm(
      `¿Cambiar el rol de ${getUserName(targetUser)} a ${ROLE_LABELS[nextRole]}?`,
    );

    if (!confirmed) {
      return;
    }

    await updateUserProfile(targetUser.id, { role: nextRole });
    setActionMessage("Rol actualizado.");
    await loadData();
  };

  const handleStatusChange = async (
    targetUser: AcademyUser,
    nextStatus: AcademyUserStatus,
  ) => {
    if (targetUser.id === currentUser?.id) {
      setActionMessage("No puedes desactivar tu propia cuenta.");
      return;
    }

    await updateUserProfile(targetUser.id, { status: nextStatus });
    setActionMessage(
      nextStatus === "suspended" ? "Usuario desactivado." : "Usuario activado.",
    );
    await loadData();
  };

  const handleAssignCourse = async (targetUser: AcademyUser) => {
    if (!currentUser || !courseEditionToAssign) {
      return;
    }

    await assignUserToCourseEdition(
      targetUser.id,
      courseEditionToAssign,
      currentUser.id,
    );
    setActionMessage("Curso asignado y aprobado.");
    await loadData();
  };

  const handleDeleteStudent = async (targetUser: AcademyUser) => {
    if (targetUser.id === currentUser?.id) {
      setActionMessage("No puedes eliminar tu propia cuenta desde esta tabla.");
      return;
    }

    if (targetUser.role !== "student") {
      setActionMessage("Solo puedes eliminar usuarios con rol estudiante.");
      return;
    }

    const confirmed = window.confirm(
      `¿Eliminar al estudiante ${getUserName(targetUser)}? Esta acción quitará su perfil y sus registros de estudiante.`,
    );

    if (!confirmed) {
      return;
    }

    await deleteStudentProfile(targetUser.id);
    setActionMessage("Estudiante eliminado.");
    await loadData();
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Usuarios</h1>
        </div>
      </div>

      <section className="content-panel admin-users-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Gestión de usuarios</p>
            <h2>Usuarios de la academia</h2>
          </div>
          <span className="muted-text">
            {filteredUsers.length} de {users.length} usuarios
          </span>
        </div>

        <div className="admin-users-filters">
          <label>
            <span>Buscar</span>
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nombre o alias"
              value={search}
            />
          </label>
          <label>
            <span>Curso</span>
            <select
              onChange={(event) => setSelectedCourseId(event.target.value)}
              value={selectedCourseId}
            >
              <option value="all">Todos los cursos</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Rol</span>
            <select
              onChange={(event) =>
                setRoleFilter(event.target.value as AcademyUserRole | "all")
              }
              value={roleFilter}
            >
              <option value="all">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="instructor">Instructor</option>
              <option value="student">Estudiante</option>
            </select>
          </label>
          <label>
            <span>Estado</span>
            <select
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as AcademyUserStatus | "all",
                )
              }
              value={statusFilter}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="pending">Pendiente</option>
              <option value="suspended">Desactivado</option>
            </select>
          </label>
        </div>

        <div className="admin-course-assignment-bar">
          <label>
            <span>Asignar curso</span>
            <select
              onChange={(event) => setCourseEditionToAssign(event.target.value)}
              value={courseEditionToAssign}
            >
              {assignableEditions.map((edition) => (
                <option key={edition.id} value={edition.id}>
                  {edition.courseTitle}
                </option>
              ))}
            </select>
          </label>
          <span>
            La asignación desde aquí queda aprobada automáticamente para el
            estudiante.
          </span>
        </div>

        {actionMessage ? (
          <p className="admin-users-message">{actionMessage}</p>
        ) : null}

        <div className="admin-users-table-scroll">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Alias público</th>
                <th>Puntos</th>
                <th>Posición</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8}>Cargando usuarios...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8}>No hay usuarios para estos filtros.</td>
                </tr>
              ) : (
                filteredUsers.map((academyUser) => {
                  const leaderboardEntry = leaderboardByUser[academyUser.id];
                  const isCurrentUser = academyUser.id === currentUser?.id;

                  return (
                    <tr key={academyUser.id}>
                      <td>
                        <div className="admin-user-cell">
                          <span>{getUserInitials(academyUser) || "U"}</span>
                          <div>
                            <strong>{getUserName(academyUser)}</strong>
                            <small>{academyUser.id.slice(0, 8)}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        {academyUser.email ? (
                          academyUser.email
                        ) : (
                          <span className="muted-text">Sin email</span>
                        )}
                      </td>
                      <td>
                        <select
                          disabled={isCurrentUser}
                          onChange={(event) =>
                            void handleRoleChange(
                              academyUser,
                              event.target.value as AcademyUserRole,
                            )
                          }
                          value={academyUser.role}
                        >
                          <option value="admin">Administrador</option>
                          <option value="instructor">Instructor</option>
                          <option value="student">Estudiante</option>
                        </select>
                      </td>
                      <td>
                        <span
                          className={`status-pill status-pill-${academyUser.status}`}
                        >
                          {STATUS_LABELS[academyUser.status]}
                        </span>
                      </td>
                      <td>
                        {leaderboardEntry?.display_name ||
                          academyUser.leaderboard_name ||
                          "Sin alias"}
                      </td>
                      <td>
                        {leaderboardEntry ? (
                          <strong>
                            {leaderboardEntry.total_score}/
                            {leaderboardEntry.max_score} pts
                          </strong>
                        ) : (
                          <span className="muted-text">Elige un curso</span>
                        )}
                      </td>
                      <td>
                        {leaderboardEntry ? (
                          <strong>#{leaderboardEntry.rank}</strong>
                        ) : (
                          <span className="muted-text">-</span>
                        )}
                      </td>
                      <td>
                        <div className="admin-user-actions">
                          <button
                            className="secondary-button"
                            disabled={!courseEditionToAssign}
                            onClick={() => void handleAssignCourse(academyUser)}
                            type="button"
                          >
                            Asignar
                          </button>
                          {academyUser.status === "suspended" ? (
                            <button
                              className="secondary-button"
                              disabled={isCurrentUser}
                              onClick={() =>
                                void handleStatusChange(academyUser, "active")
                              }
                              type="button"
                            >
                              Activar
                            </button>
                          ) : (
                            <button
                              className="danger-button"
                              disabled={isCurrentUser}
                              onClick={() =>
                                void handleStatusChange(
                                  academyUser,
                                  "suspended",
                                )
                              }
                              type="button"
                            >
                              Desactivar
                            </button>
                          )}
                          <button
                            className="danger-button"
                            disabled={isCurrentUser || academyUser.role !== "student"}
                            onClick={() => void handleDeleteStudent(academyUser)}
                            type="button"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
