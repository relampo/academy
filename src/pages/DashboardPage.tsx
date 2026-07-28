import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { RefreshCw, Trophy, UserRound } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { listPublishedCourseEditions } from "../services/courses";
import {
  getCourseLeaderboard,
  updateLeaderboardProfile,
  type LeaderboardEntry,
  type LeaderboardVisibility,
} from "../services/leaderboard";

const stormAliases = [
  "Rayo Norte",
  "Centella Alta",
  "Trueno Claro",
  "Nube Ionica",
  "Chispa Azul",
  "Vortice Solar",
  "Pulso Electrico",
  "Relampago Delta",
  "Frente de Tormenta",
  "Arco Plasma",
];

const avatarSwatches = [
  "#ffc712",
  "#36a3ff",
  "#37a267",
  "#d46b53",
  "#7c5cff",
  "#1d9a8a",
];

function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function getGeneratedAlias(seed: string) {
  const total = seed
    .split("")
    .reduce((sum, character) => sum + character.charCodeAt(0), 0);

  return stormAliases[total % stormAliases.length];
}

function getGeneratedAvatar(seed: string) {
  const total = seed
    .split("")
    .reduce((sum, character) => sum + character.charCodeAt(0), 0);

  return avatarSwatches[total % avatarSwatches.length];
}

function getLevelClass(level: string) {
  return `is-${level.toLowerCase()}`;
}

export function DashboardPage() {
  const { profile, user, refreshProfile } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [courses, setCourses] = useState<
    Awaited<ReturnType<typeof listPublishedCourseEditions>>
  >([]);
  const [leaderboardName, setLeaderboardName] = useState("");
  const [leaderboardVisibility, setLeaderboardVisibility] =
    useState<LeaderboardVisibility>("alias");
  const [avatarColor, setAvatarColor] = useState("#ffc712");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const name = profile?.first_name || profile?.display_name || "there";

  useEffect(() => {
    const loadCourses = async () => {
      if (!user) {
        return;
      }

      setError(null);
      setIsLoading(true);

      try {
        const nextCourses = (await listPublishedCourseEditions(user.id)).filter(
          (edition) =>
            edition.enrollments.some(
              (enrollment) => enrollment.status === "approved",
            ),
        );
        setCourses(nextCourses);
        setSelectedCourseId((current) => current || nextCourses[0]?.course_id || "");
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Could not load dashboard.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadCourses();
  }, [user]);

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
            : "Could not load leaderboard.",
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
    setLeaderboardVisibility(profile.leaderboard_visibility);
    setAvatarColor(profile.avatar_url || getGeneratedAvatar(profile.id));
  }, [profile]);

  const currentEntry = useMemo(
    () => leaderboard.find((entry) => entry.student_id === user?.id),
    [leaderboard, user?.id],
  );
  const topLeaderboard = leaderboard.slice(0, 10);

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
      await updateLeaderboardProfile(user.id, {
        leaderboard_name: leaderboardName || getGeneratedAlias(user.id),
        leaderboard_visibility: leaderboardVisibility,
        avatar_url: avatarColor,
      });
      await refreshProfile();
      if (selectedCourseId) {
        setLeaderboard(await getCourseLeaderboard(selectedCourseId));
      }
      setMessage("Leaderboard profile updated.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not update leaderboard profile.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="eyebrow">Academy</p>
          <h1>Welcome, {name}</h1>
        </div>
        <span className="status-pill">{profile?.role ?? "student"}</span>
      </div>

      {error ? <p className="form-message error">{error}</p> : null}
      {message ? <p className="form-message success">{message}</p> : null}
      {isLoading ? <p>Loading dashboard...</p> : null}

      <div className="stats-grid">
        <article className="stat-card">
          <span>Active courses</span>
          <strong>{courses.length}</strong>
        </article>
        <article className="stat-card">
          <span>Current level</span>
          <strong>{currentEntry?.level ?? "Chispa"}</strong>
        </article>
        <article className="stat-card">
          <span>Accumulated</span>
          <strong>
            {formatPoints(currentEntry?.total_score ?? 0)}
            <small> pts</small>
          </strong>
        </article>
      </div>

      <section className="leaderboard-shell">
        <div className="content-panel leaderboard-panel">
          <div className="page-header compact-header">
            <div>
              <p className="eyebrow">Leaderboard</p>
              <h2>Course ranking</h2>
            </div>
            <label className="assignment-search">
              <span>Course</span>
              <select
                value={selectedCourseId}
                onChange={(event) => setSelectedCourseId(event.target.value)}
              >
                {courses.length === 0 ? (
                  <option value="">No approved courses</option>
                ) : null}
                {courses.map((edition) => (
                  <option key={edition.course_id} value={edition.course_id}>
                    {edition.courses?.title ?? edition.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {topLeaderboard.length === 0 ? (
            <p>No ranking data yet.</p>
          ) : (
            <div className="leaderboard-list">
              {topLeaderboard.map((entry, index) => (
                <article
                  className={`leaderboard-row ${getLevelClass(entry.level)}${
                    entry.student_id === user?.id ? " is-current" : ""
                  }`}
                  key={entry.student_id}
                >
                  <span className="leaderboard-rank">{index + 1}</span>
                  <span
                    className="leaderboard-avatar"
                    style={{
                      background: entry.avatar_url || getGeneratedAvatar(entry.student_id),
                    }}
                  >
                    <Trophy aria-hidden="true" size={16} strokeWidth={2.4} />
                  </span>
                  <div>
                    <strong>{entry.display_name}</strong>
                    <span>{entry.level}</span>
                  </div>
                  <div className="leaderboard-score">
                    <strong>{formatPoints(entry.total_score)}</strong>
                    <span>
                      /{formatPoints(entry.max_score)} pts
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <form
          className="content-panel leaderboard-profile-card"
          onSubmit={handleSaveLeaderboardProfile}
        >
          <div>
            <p className="eyebrow">Public profile</p>
            <h2>Leaderboard identity</h2>
          </div>
          <div
            className="leaderboard-profile-preview"
            style={{ "--avatar-color": avatarColor } as CSSProperties}
          >
            <span>
              <UserRound aria-hidden="true" size={24} strokeWidth={2.2} />
            </span>
            <strong>
              {leaderboardVisibility === "alias"
                ? leaderboardName
                : profile?.display_name || name}
            </strong>
          </div>
          <label>
            Display
            <select
              value={leaderboardVisibility}
              onChange={(event) =>
                setLeaderboardVisibility(
                  event.target.value as LeaderboardVisibility,
                )
              }
            >
              <option value="alias">Alias</option>
              <option value="first_name">First name</option>
              <option value="full_name">Full name</option>
              <option value="hidden">Hidden</option>
            </select>
          </label>
          <label>
            Alias
            <div className="inline-picker">
              <input
                value={leaderboardName}
                onChange={(event) => setLeaderboardName(event.target.value)}
              />
              <button
                className="secondary-action"
                type="button"
                onClick={() =>
                  setLeaderboardName(
                    stormAliases[
                      Math.floor(Math.random() * stormAliases.length)
                    ],
                  )
                }
              >
                <RefreshCw aria-hidden="true" size={16} strokeWidth={2.4} />
              </button>
            </div>
          </label>
          <div className="avatar-picker">
            <span>Avatar</span>
            <div>
              {avatarSwatches.map((color) => (
                <button
                  aria-label={`Use avatar color ${color}`}
                  className={avatarColor === color ? "selected" : ""}
                  key={color}
                  style={{ background: color }}
                  type="button"
                  onClick={() => setAvatarColor(color)}
                />
              ))}
            </div>
          </div>
          <button className="primary-action" disabled={isSaving} type="submit">
            Save identity
          </button>
        </form>
      </section>
    </section>
  );
}
