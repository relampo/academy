import { useEffect, useMemo, useState } from "react";
import { listCoursesWithEditions, type CourseWithEditions } from "../services/courses";
import { getCourseLeaderboard, type LeaderboardEntry } from "../services/leaderboard";
import {
  assignUserToCourseEdition,
  deleteStudentProfile,
  listAcademyUsers,
  listUserEnrollmentSummaries,
  unassignUserFromCourseEdition,
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
  const { profile, user: currentUser } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [users, setUsers] = useState<AcademyUser[]>([]);
  const [enrollments, setEnrollments] = useState<UserEnrollmentSummary[]>([]);
  const [courses, setCourses] = useState<CourseWithEditions[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("all");
  const [selectedEditionByUserId, setSelectedEditionByUserId] = useState<
    Record<string, string>
  >({});
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

      setSelectedEditionByUserId((currentSelections) => {
        const activeEditionIds = new Set(
          nextCourses.flatMap((course) =>
            course.course_editions
              .filter((edition) => !edition.archived_at)
              .map((edition) => edition.id),
          ),
        );

        return Object.fromEntries(
          nextUsers.map((academyUser) => [
            academyUser.id,
            activeEditionIds.has(currentSelections[academyUser.id] ?? "")
              ? currentSelections[academyUser.id]
              : "",
          ]),
        );
      });
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
        course.course_editions
          .filter((edition) => !edition.archived_at)
          .map((edition) => ({
            ...edition,
            courseTitle:
              edition.slug === "default"
                ? course.title
                : `${course.title} - ${edition.title}`,
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
      const matchesRole =
        isAdmin
          ? roleFilter === "all" || academyUser.role === roleFilter
          : academyUser.role === "student";
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
    isAdmin,
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
    const selectedEditionId = selectedEditionByUserId[targetUser.id];

    if (!currentUser || !selectedEditionId) {
      return;
    }

    if (targetUser.role !== "student") {
      setActionMessage("Solo puedes asignar cursos a estudiantes.");
      return;
    }

    await assignUserToCourseEdition(
      targetUser.id,
      selectedEditionId,
      currentUser.id,
    );
    setActionMessage("Curso asignado y aprobado.");
    await loadData();
  };

  const handleUnassignCourse = async (
    targetUser: AcademyUser,
    enrollmentId: string,
  ) => {
    const confirmed = window.confirm(
      `¿Quitar a ${getUserName(targetUser)} de este curso?`,
    );

    if (!confirmed) {
      return;
    }

    await unassignUserFromCourseEdition(enrollmentId);
    setActionMessage("Estudiante quitado del curso.");
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
          {isAdmin ? (
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
          ) : null}
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
                <th>Curso</th>
                <th>Alias público</th>
                <th>Puntos</th>
                <th>Posición</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9}>Cargando usuarios...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9}>No hay usuarios para estos filtros.</td>
                </tr>
              ) : (
                filteredUsers.map((academyUser) => {
                  const leaderboardEntry = leaderboardByUser[academyUser.id];
                  const isCurrentUser = academyUser.id === currentUser?.id;
                  const selectedEditionId =
                    selectedEditionByUserId[academyUser.id] ?? "";
                  const isSelectedEditionAssigned = (
                    enrollmentByUser[academyUser.id] ?? []
                  ).some(
                    (enrollment) =>
                      enrollment.course_edition_id === selectedEditionId &&
                      enrollment.status === "approved",
                  );
                  const selectedEnrollment = (
                    enrollmentByUser[academyUser.id] ?? []
                  ).find(
                    (enrollment) =>
                      enrollment.course_edition_id === selectedEditionId &&
                      enrollment.status === "approved",
                  );

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
                          disabled={!isAdmin || isCurrentUser}
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
                        {academyUser.role === "student" ? (
                          <div className="admin-user-course-picker">
                            <select
                              disabled={assignableEditions.length === 0}
                              onChange={(event) =>
                                setSelectedEditionByUserId((current) => ({
                                  ...current,
                                  [academyUser.id]: event.target.value,
                                }))
                              }
                              value={selectedEditionId}
                            >
                              <option value="">
                                {assignableEditions.length === 0
                                  ? "Sin cursos disponibles"
                                  : "Seleccionar curso"}
                              </option>
                              {assignableEditions.map((edition) => (
                                <option key={edition.id} value={edition.id}>
                                  {edition.courseTitle}
                                </option>
                              ))}
                            </select>
                            <button
                              className="secondary-button"
                              disabled={
                                !selectedEditionId ||
                                assignableEditions.length === 0
                              }
                              onClick={() =>
                                selectedEnrollment
                                  ? void handleUnassignCourse(
                                      academyUser,
                                      selectedEnrollment.id,
                                    )
                                  : void handleAssignCourse(academyUser)
                              }
                              type="button"
                            >
                              {isSelectedEditionAssigned ? "Quitar" : "Asignar"}
                            </button>
                          </div>
                        ) : (
                          <span className="muted-text">No aplica</span>
                        )}
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
                          {isAdmin ? (
                            <>
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
                            </>
                          ) : null}
                          {academyUser.role === "student" ? (
                            <button
                              className="danger-button"
                              disabled={isCurrentUser}
                              onClick={() => void handleDeleteStudent(academyUser)}
                              type="button"
                            >
                              Eliminar
                            </button>
                          ) : null}
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
