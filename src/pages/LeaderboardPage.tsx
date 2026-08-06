import {
  Activity,
  Asterisk,
  Atom,
  AudioWaveform,
  Bolt,
  CircleDot,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudRain,
  CloudRainWind,
  CloudSun,
  CloudSunRain,
  Droplets,
  Flame,
  Leaf,
  Magnet,
  Moon,
  Mountain,
  MountainSnow,
  Orbit,
  Radar,
  Satellite,
  RefreshCw,
  Snowflake,
  Sparkles,
  Star,
  Sun,
  Tornado,
  Trophy,
  Waves,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { useAuth } from "../hooks/useAuth";
import {
  avatarPresets,
  type AvatarPreset,
  formatPoints,
  getAvatarPreset,
  getGeneratedAlias,
  getLevelClass,
  leaderboardLevels,
} from "../lib/leaderboardIdentity";
import {
  listCoursesWithEditions,
  listPublishedCourseEditions,
} from "../services/courses";
import {
  getCourseLeaderboard,
  updateLeaderboardProfile,
  type LeaderboardEntry,
  type LeaderboardVisibility,
} from "../services/leaderboard";

const levelIcons: Record<string, LucideIcon> = {
  Chispa: Sparkles,
  Centella: Zap,
  Rayo: Bolt,
  Relámpago: Trophy,
  Relampago: Trophy,
};

type LeaderboardCourseOption = {
  course_id: string;
  title: string;
};

const defaultLeaderboardCourse: LeaderboardCourseOption = {
  course_id: "0ac11057-0025-485d-abef-265af3c21a62",
  title: "Grupo de Estudio: Performance Testing LATAM",
};

const avatarIcons: Record<string, LucideIcon> = {
  activity: Activity,
  asterisk: Asterisk,
  atom: Atom,
  audioWaveform: AudioWaveform,
  bolt: Bolt,
  circleDot: CircleDot,
  cloudFog: CloudFog,
  cloudHail: CloudHail,
  cloudLightning: CloudLightning,
  cloudRain: CloudRain,
  cloudRainWind: CloudRainWind,
  cloudSun: CloudSun,
  cloudSunRain: CloudSunRain,
  droplets: Droplets,
  flame: Flame,
  leaf: Leaf,
  magnet: Magnet,
  moon: Moon,
  mountain: Mountain,
  mountainSnow: MountainSnow,
  orbit: Orbit,
  radar: Radar,
  satellite: Satellite,
  snowflake: Snowflake,
  sparkles: Sparkles,
  star: Star,
  sun: Sun,
  tornado: Tornado,
  waves: Waves,
  wind: Wind,
  zap: Zap,
};

function getAvatarIcon(preset: AvatarPreset) {
  return avatarIcons[preset.iconKey] ?? Sparkles;
}

function AvatarEmblem({
  className = "",
  preset,
  size = 18,
}: {
  className?: string;
  preset: AvatarPreset;
  size?: number;
}) {
  const Icon = getAvatarIcon(preset);

  return (
    <span
      className={`avatar-emblem ${className}`}
      style={
        {
          "--avatar-color": preset.background,
          "--avatar-radius": preset.radius,
          "--avatar-clip": preset.clipPath,
        } as CSSProperties
      }
      title={preset.label}
    >
      <Icon aria-hidden="true" size={size} strokeWidth={2.35} />
    </span>
  );
}

const avatarShapeOptions = [
  { key: "orb", label: "Órbita", radius: "999px", clipPath: "none" },
  {
    key: "plate",
    label: "Placa",
    radius: "14px 6px 14px 6px",
    clipPath: "none",
  },
  {
    key: "shield",
    label: "Escudo",
    radius: "10px",
    clipPath: "polygon(50% 0%, 100% 35%, 82% 100%, 18% 100%, 0% 35%)",
  },
  {
    key: "crystal",
    label: "Cristal",
    radius: "10px",
    clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
  },
  {
    key: "hex",
    label: "Hexa",
    radius: "12px",
    clipPath: "polygon(25% 4%, 75% 4%, 100% 50%, 75% 96%, 25% 96%, 0% 50%)",
  },
  {
    key: "comet",
    label: "Cometa",
    radius: "999px 8px 999px 8px",
    clipPath: "none",
  },
  {
    key: "wave",
    label: "Onda",
    radius: "20px 999px 20px 999px",
    clipPath: "none",
  },
  {
    key: "peak",
    label: "Cumbre",
    radius: "8px",
    clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
  },
  {
    key: "spark",
    label: "Chispa",
    radius: "9px",
    clipPath: "polygon(50% 0%, 62% 33%, 100% 40%, 68% 60%, 78% 100%, 50% 74%, 22% 100%, 32% 60%, 0% 40%, 38% 33%)",
  },
  {
    key: "drop",
    label: "Gota",
    radius: "999px 999px 999px 10px",
    clipPath: "none",
  },
  {
    key: "flare",
    label: "Fulgor",
    radius: "8px",
    clipPath: "polygon(50% 0%, 86% 14%, 100% 50%, 86% 86%, 50% 100%, 14% 86%, 0% 50%, 14% 14%)",
  },
  {
    key: "leaf",
    label: "Hoja",
    radius: "999px 8px 999px 8px",
    clipPath: "none",
  },
  {
    key: "moon",
    label: "Media luna",
    radius: "999px 999px 999px 8px",
    clipPath: "polygon(0% 0%, 100% 0%, 78% 50%, 100% 100%, 0% 100%)",
  },
  {
    key: "prism",
    label: "Prisma",
    radius: "10px",
    clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
  },
  {
    key: "bolt",
    label: "Rayo",
    radius: "8px",
    clipPath: "polygon(42% 0%, 82% 0%, 58% 38%, 100% 38%, 34% 100%, 47% 56%, 12% 56%)",
  },
  {
    key: "horizon",
    label: "Horizonte",
    radius: "18px 18px 4px 4px",
    clipPath: "none",
  },
  {
    key: "capsule",
    label: "Cápsula",
    radius: "999px",
    clipPath: "polygon(18% 0%, 82% 0%, 100% 50%, 82% 100%, 18% 100%, 0% 50%)",
  },
  {
    key: "signal",
    label: "Señal",
    radius: "999px 999px 12px 12px",
    clipPath: "polygon(0% 18%, 100% 0%, 86% 100%, 14% 100%)",
  },
];

const avatarColorOptions = [
  {
    label: "Relámpago",
    background: "linear-gradient(135deg, #ffc712 0%, #fff3a3 100%)",
  },
  {
    label: "Océano",
    background: "linear-gradient(135deg, #0ea5e9 0%, #bae6fd 100%)",
  },
  {
    label: "Aurora",
    background: "linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)",
  },
  {
    label: "Solar",
    background: "linear-gradient(135deg, #f97316 0%, #fef08a 100%)",
  },
  {
    label: "Plasma",
    background: "linear-gradient(135deg, #7c3aed 0%, #22d3ee 100%)",
  },
  {
    label: "Tormenta",
    background: "linear-gradient(135deg, #0f172a 0%, #64748b 100%)",
  },
  {
    label: "Magma",
    background: "linear-gradient(135deg, #b91c1c 0%, #facc15 100%)",
  },
  {
    label: "Bosque",
    background: "linear-gradient(135deg, #166534 0%, #bbf7d0 100%)",
  },
  {
    label: "Polar",
    background: "linear-gradient(135deg, #475569 0%, #f8fafc 100%)",
  },
  {
    label: "Nebulosa",
    background: "linear-gradient(135deg, #d97706 0%, #f0abfc 100%)",
  },
  {
    label: "Cobalto",
    background: "linear-gradient(135deg, #1d4ed8 0%, #60a5fa 100%)",
  },
  {
    label: "Rocío",
    background: "linear-gradient(135deg, #22d3ee 0%, #c084fc 100%)",
  },
  {
    label: "Granizo",
    background: "linear-gradient(135deg, #94a3b8 0%, #e0f2fe 100%)",
  },
  {
    label: "Centella",
    background: "linear-gradient(135deg, #fde047 0%, #22c55e 100%)",
  },
  {
    label: "Eclipse",
    background: "linear-gradient(135deg, #020617 0%, #f59e0b 100%)",
  },
  {
    label: "Laguna",
    background: "linear-gradient(135deg, #0891b2 0%, #34d399 100%)",
  },
  {
    label: "Carmesí",
    background: "linear-gradient(135deg, #e11d48 0%, #fb7185 100%)",
  },
  {
    label: "Violeta",
    background: "linear-gradient(135deg, #6d28d9 0%, #f0abfc 100%)",
  },
];

function getShapeKey(radius: string, clipPath: string) {
  return (
    avatarShapeOptions.find(
      (shape) => shape.radius === radius && shape.clipPath === clipPath,
    )?.key || avatarShapeOptions[0].key
  );
}

function getSavedNameChangeCount(savedValue: string | null | undefined) {
  if (!savedValue?.startsWith("{")) {
    return 0;
  }

  try {
    const customValue = JSON.parse(savedValue) as { nameChangeCount?: number };
    return Math.max(0, Math.min(2, customValue.nameChangeCount || 0));
  } catch {
    return 0;
  }
}

function normalizeGeneratedName(value: string) {
  return value.split("·")[0]?.trim().toLowerCase() || "";
}

export function LeaderboardPage() {
  const { profile, refreshProfile, user } = useAuth();
  const [courses, setCourses] = useState<LeaderboardCourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardName, setLeaderboardName] = useState("");
  const [leaderboardVisibility, setLeaderboardVisibility] =
    useState<LeaderboardVisibility>("alias");
  const [avatarPresetLabel, setAvatarPresetLabel] = useState(
    avatarPresets[0].label,
  );
  const [avatarColor, setAvatarColor] = useState(avatarPresets[0].background);
  const [avatarShapeKey, setAvatarShapeKey] = useState(
    getShapeKey(avatarPresets[0].radius, avatarPresets[0].clipPath),
  );
  const [nameChangeCount, setNameChangeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadCourses = async () => {
      if (!user || !profile) {
        setIsLoading(false);
        return;
      }

      setError(null);
      setIsLoading(true);

      try {
        const loadedCourses: LeaderboardCourseOption[] =
          profile.role === "student"
            ? (await listPublishedCourseEditions(user.id))
                .filter((edition) =>
                  edition.enrollments.some(
                    (enrollment) => enrollment.status === "approved",
                  ),
                )
                .map((edition) => ({
                  course_id: edition.course_id,
                  title: edition.courses?.title ?? edition.title,
                }))
            : (await listCoursesWithEditions())
                .filter((course) =>
                  course.course_editions.some(
                    (edition) =>
                      ["published", "enrollment_closed", "completed"].includes(
                        edition.status,
                      ) && !edition.archived_at,
                  ),
                )
                .map((course) => ({
                  course_id: course.id,
                  title: course.title,
                }));
        const nextCourses = loadedCourses.some(
          (course) => course.course_id === defaultLeaderboardCourse.course_id,
        )
          ? loadedCourses
          : [defaultLeaderboardCourse, ...loadedCourses];

        setCourses(nextCourses);
        setSelectedCourseId((current) =>
          current && nextCourses.some((course) => course.course_id === current)
            ? current
            : nextCourses[0]?.course_id || "",
        );
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudieron cargar los cursos del leaderboard.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadCourses();
  }, [profile, user]);

  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!selectedCourseId) {
        setLeaderboard([]);
        return;
      }

      setError(null);

      try {
        setLeaderboard(await getCourseLeaderboard(selectedCourseId));
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudo cargar la tabla de posiciones.",
        );
      }
    };

    void loadLeaderboard();
  }, [selectedCourseId]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setLeaderboardName(
      profile.leaderboard_name || getGeneratedAlias(profile.id),
    );
    setLeaderboardVisibility(
      profile.leaderboard_visibility === "full_name" ? "full_name" : "alias",
    );
    const savedAvatarPreset = getAvatarPreset(profile.avatar_url, profile.id);
    setAvatarPresetLabel(savedAvatarPreset.label);
    setAvatarColor(savedAvatarPreset.background);
    setAvatarShapeKey(
      getShapeKey(savedAvatarPreset.radius, savedAvatarPreset.clipPath),
    );
    setNameChangeCount(getSavedNameChangeCount(profile.avatar_url));
  }, [profile]);

  const currentEntry = useMemo(
    () => leaderboard.find((entry) => entry.student_id === user?.id),
    [leaderboard, user?.id],
  );
  const currentRank =
    leaderboard.findIndex((entry) => entry.student_id === user?.id) + 1;
  const baseAvatarPreset =
    avatarPresets.find((preset) => preset.label === avatarPresetLabel) ||
    avatarPresets[0];
  const selectedAvatarShape =
    avatarShapeOptions.find((shape) => shape.key === avatarShapeKey) ||
    avatarShapeOptions[0];
  const selectedAvatarPreset: AvatarPreset = {
    ...baseAvatarPreset,
    background: avatarColor,
    radius: selectedAvatarShape.radius,
    clipPath: selectedAvatarShape.clipPath,
  };
  const fullProfileName =
    profile?.display_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    profile?.first_name ||
    "";
  const previewAlias = leaderboardName || getGeneratedAlias(user?.id || "relampo");
  const previewDisplayName =
    leaderboardVisibility === "full_name" && fullProfileName
      ? `${previewAlias} · ${fullProfileName}`
      : previewAlias;
  const scorePercent =
    currentEntry && currentEntry.max_score > 0
      ? Math.min(
          100,
          Math.round((currentEntry.total_score / currentEntry.max_score) * 100),
        )
      : 0;
  const usedNames = useMemo(
    () =>
      new Set(
        leaderboard
          .filter((entry) => entry.student_id !== user?.id)
          .map((entry) => normalizeGeneratedName(entry.display_name))
          .filter(Boolean),
      ),
    [leaderboard, user?.id],
  );
  const remainingNameChanges = Math.max(0, 2 - nameChangeCount);

  const handleGenerateIdentity = () => {
    if (remainingNameChanges <= 0) {
      setMessage(null);
      setError("Ya usaste los 2 cambios permitidos para el nombre generado.");
      return;
    }

    const availablePresets = avatarPresets.filter(
      (preset) => !usedNames.has(preset.label.toLowerCase()),
    );

    if (availablePresets.length === 0) {
      setMessage(null);
      setError("No hay nombres generados disponibles para este curso.");
      return;
    }

    const preset =
      availablePresets[Math.floor(Math.random() * availablePresets.length)];

    setAvatarPresetLabel(preset.label);
    setAvatarColor(preset.background);
    setAvatarShapeKey(getShapeKey(preset.radius, preset.clipPath));
    setLeaderboardName(preset.label);
    setNameChangeCount((current) => Math.min(2, current + 1));
    setError(null);
    setMessage(
      `Nombre generado actualizado. Te queda${
        remainingNameChanges - 1 === 1 ? "" : "n"
      } ${remainingNameChanges - 1} cambio${
        remainingNameChanges - 1 === 1 ? "" : "s"
      }.`,
    );
  };

  const handleSaveLeaderboardProfile = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!user) {
      return;
    }

    setError(null);
    setMessage(null);
    setIsSaving(true);

    try {
      if (usedNames.has(normalizeGeneratedName(leaderboardName || ""))) {
        throw new Error("Ese nombre generado ya está en uso en este curso.");
      }

      await updateLeaderboardProfile(user.id, {
        leaderboard_name: leaderboardName || getGeneratedAlias(user.id),
        leaderboard_visibility: leaderboardVisibility,
        avatar_url: JSON.stringify({
          background: selectedAvatarPreset.background,
          clipPath: selectedAvatarPreset.clipPath,
          label: avatarPresetLabel,
          nameChangeCount,
          radius: selectedAvatarPreset.radius,
        }),
      });
      await refreshProfile();
      if (selectedCourseId) {
        setLeaderboard(await getCourseLeaderboard(selectedCourseId));
      }
      setMessage("Identidad pública actualizada.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo actualizar tu identidad pública.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="page leaderboard-page">
      <div className="page-header leaderboard-hero">
        <div>
          <h1>Leaderboard</h1>
          <div className="leaderboard-prize-callout">
            <strong>Premio para los 3 primeros lugares</strong>
            <span>Licencia Relampo</span>
            <span>1000+ usuarios</span>
            <span>2 meses gratis</span>
          </div>
        </div>
        <span className="status-pill">
          {currentEntry ? currentEntry.level : "Chispa"}
        </span>
      </div>

      {error ? <p className="form-message error">{error}</p> : null}
      {message ? <p className="form-message success">{message}</p> : null}
      {isLoading ? <p>Cargando leaderboard...</p> : null}

      <div className="leaderboard-stats-strip">
        <article>
          <span>Tu posición</span>
          <strong>{currentRank > 0 ? `#${currentRank}` : "-"}</strong>
        </article>
        <article>
          <span>Nivel actual</span>
          <strong>{currentEntry?.level ?? "Chispa"}</strong>
        </article>
        <article>
          <span>Progreso de puntos</span>
          <strong>{scorePercent}%</strong>
        </article>
      </div>

      <section className="leaderboard-shell leaderboard-page-grid">
        <div className="content-panel leaderboard-panel leaderboard-arena">
          <div className="page-header compact-header">
            <div>
              <h2>Leaderboard del curso</h2>
              <span className="leaderboard-count">
                {leaderboard.length} estudiante{leaderboard.length === 1 ? "" : "s"}
              </span>
            </div>
            <label className="assignment-search">
              <span>Curso</span>
              <select
                value={selectedCourseId}
                onChange={(event) => setSelectedCourseId(event.target.value)}
              >
                {courses.length === 0 ? (
                  <option value="">
                    {profile?.role === "student"
                      ? "No hay cursos aprobados"
                      : "No hay cursos disponibles"}
                  </option>
                ) : null}
                {courses.map((edition) => (
                  <option key={edition.course_id} value={edition.course_id}>
                    {edition.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="league-tier-strip" aria-label="Niveles del leaderboard">
            {leaderboardLevels.map((level) => {
              const Icon = levelIcons[level.name] ?? Sparkles;

              return (
                <article
                  className={`league-tier-card ${getLevelClass(level.name)}${
                    currentEntry &&
                    getLevelClass(currentEntry.level) === getLevelClass(level.name)
                      ? " is-active"
                      : ""
                  }`}
                  key={level.name}
                  title={level.description}
                >
                  <span>
                    <Icon aria-hidden="true" size={15} strokeWidth={2.3} />
                  </span>
                  <div>
                    <strong>{level.name}</strong>
                    <small>{level.threshold}</small>
                  </div>
                </article>
              );
            })}
          </div>

          {leaderboard.length === 0 ? (
            <div className="empty-builder">
              <strong>Todavía no hay ranking</strong>
              <span>
                La tabla aparecerá cuando haya puntos registrados en este curso.
              </span>
            </div>
          ) : (
            <>
              {currentEntry ? (
                <div className="leaderboard-summary-card leaderboard-my-position">
                  <div>
                    <span>Tu posición</span>
                    <strong>
                      {currentRank > 0 ? `#${currentRank}` : "-"} ·{" "}
                      {currentEntry.level}
                    </strong>
                  </div>
                  <div className="leaderboard-progress">
                    <span>
                      {formatPoints(currentEntry.total_score)}/
                      {formatPoints(currentEntry.max_score)} pts
                    </span>
                    <div>
                      <i style={{ width: `${scorePercent}%` }} />
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="leaderboard-list leaderboard-rank-board">
                {leaderboard.map((entry, index) => {
                  const avatarPreset = getAvatarPreset(
                    entry.avatar_url,
                    entry.student_id,
                  );
                  const displayName =
                    entry.student_id === user?.id
                      ? previewDisplayName
                      : entry.display_name;

                  return (
                    <article
                      className={`leaderboard-row ${getLevelClass(entry.level)}${
                        entry.student_id === user?.id ? " is-current" : ""
                      }`}
                      key={entry.student_id}
                    >
                      <span className="leaderboard-rank">{index + 1}</span>
                      <AvatarEmblem
                        className="leaderboard-avatar"
                        preset={avatarPreset}
                        size={17}
                      />
                      <div>
                        <strong>{displayName}</strong>
                        <span className={`league-level-badge ${getLevelClass(entry.level)}`}>
                          {entry.level}
                        </span>
                      </div>
                      <div className="leaderboard-score">
                        <strong>{formatPoints(entry.total_score)}</strong>
                        <span>
                          /{formatPoints(entry.max_score)} pts
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="league-reward-banner">
                <div>
                  <Zap aria-hidden="true" size={18} strokeWidth={2.3} />
                  <div>
                    <strong>Premio del curso</strong>
                    <span>
                      Top 3: licencia Relampo con 1000+ usuarios gratis durante
                      2 meses.
                    </span>
                  </div>
                </div>
                <div>
                  <span>Nivel actual</span>
                  <strong>{currentEntry?.level ?? "Chispa"}</strong>
                </div>
              </div>
            </>
          )}
        </div>

        <aside className="leaderboard-side-stack">
          <form
            className="content-panel leaderboard-profile-card"
            onSubmit={handleSaveLeaderboardProfile}
          >
            <div className="leaderboard-profile-header">
              <p className="eyebrow">Perfil público</p>
              <h2>Identidad en la tabla</h2>
            </div>
            <div
              className="leaderboard-profile-preview"
            >
              <AvatarEmblem
                className="leaderboard-profile-emblem"
                preset={selectedAvatarPreset}
                size={24}
              />
              <div>
                <strong>{previewDisplayName}</strong>
                <span>{selectedAvatarPreset.description}</span>
              </div>
            </div>
            <label>
              Nombre generado
              <div className="inline-picker">
                <input
                  readOnly
                  value={leaderboardName}
                />
                <button
                  className="secondary-action"
                  disabled={remainingNameChanges === 0}
                  type="button"
                  onClick={handleGenerateIdentity}
                  title={
                    remainingNameChanges === 0
                      ? "Ya usaste los 2 cambios permitidos"
                      : "Generar otro nombre"
                  }
                >
                  <RefreshCw aria-hidden="true" size={16} strokeWidth={2.4} />
                </button>
              </div>
              <span className="identity-helper">
                {remainingNameChanges === 0
                  ? "Nombre fijado. Aún puedes cambiar color y forma."
                  : `${remainingNameChanges} cambio${
                      remainingNameChanges === 1 ? "" : "s"
                    } de nombre disponible${
                      remainingNameChanges === 1 ? "" : "s"
                    }.`}
              </span>
            </label>
            <label className="identity-checkbox">
              <input
                checked={leaderboardVisibility === "full_name"}
                type="checkbox"
                onChange={(event) =>
                  setLeaderboardVisibility(
                    event.target.checked ? "full_name" : "alias",
                  )
                }
              />
              <span>
                <strong>Mostrar mi nombre real</strong>
                <small>Se mostrará junto al nombre generado.</small>
              </span>
            </label>
            <div className="identity-customizer">
              <div className="identity-option-group">
                <span>Color</span>
                <div className="identity-color-grid">
                  {avatarColorOptions.map((color) => (
                    <button
                      aria-label={`Usar color ${color.label}`}
                      className={
                        avatarColor === color.background ? "selected" : ""
                      }
                      key={color.label}
                      title={color.label}
                      type="button"
                      onClick={() => setAvatarColor(color.background)}
                    >
                      <span
                        style={
                          {
                            "--avatar-color": color.background,
                          } as CSSProperties
                        }
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="identity-option-group">
                <span>Forma</span>
                <div className="identity-shape-grid">
                  {avatarShapeOptions.map((shape) => (
                  <button
                    aria-label={`Usar forma ${shape.label}`}
                    className={
                      avatarShapeKey === shape.key ? "selected" : ""
                    }
                    key={shape.key}
                    title={shape.label}
                    type="button"
                    onClick={() => setAvatarShapeKey(shape.key)}
                  >
                    <AvatarEmblem
                      preset={{
                        ...baseAvatarPreset,
                        background: avatarColor,
                        clipPath: shape.clipPath,
                        radius: shape.radius,
                      }}
                      size={16}
                    />
                  </button>
                ))}
                </div>
              </div>
            </div>
            <div className="leaderboard-profile-actions">
              <button
                className="primary-action"
                disabled={isSaving}
                type="submit"
              >
                Guardar identidad
              </button>
            </div>
          </form>

        </aside>
      </section>
    </section>
  );
}
