import type { CountryCount } from "../components/CommunityMap";
import { getCountryFlag, getCountryName, normalizeCountryCode } from "./countries";
import { listStudentCountryCounts } from "../services/users";

// One function behind both community maps — the landing and the dashboard — so
// they show the same countries and the same headcount by construction.
export async function listCommunityCountries(): Promise<CountryCount[]> {
  const records = await listStudentCountryCounts();
  const byCode = new Map<string, number>();

  for (const record of records) {
    const code = normalizeCountryCode(record.country);

    if (!code) {
      // Unrecognisable ("E", a stray keystroke): leave it off the map rather
      // than guessing a country for a student.
      continue;
    }

    // The database may still hold "Peru" and "Perú" as separate rows, so the
    // counts are merged here after resolving both to PE.
    byCode.set(code, (byCode.get(code) ?? 0) + record.student_count);
  }

  return [...byCode.entries()]
    .map(([code, count]) => ({
      code,
      name: getCountryName(code),
      flag: getCountryFlag(code),
      count,
    }))
    .sort((first, second) => second.count - first.count);
}
