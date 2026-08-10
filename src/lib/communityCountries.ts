import type { CountryCount } from "../components/CommunityMap";
import { getCountryFlag, getCountryName } from "./countries";

// The community is larger than the app's user table: people join through the
// group before they ever create an account, so profiles only holds a fraction
// of them. These counts come from the community roster, which is why they are
// a fixed list rather than a query.
//
// To update: replace the numbers below. Both maps read this, so they cannot
// disagree.
const communityHeadcount: Record<string, number> = {
  PE: 43,
  AR: 28,
  CO: 28,
  MX: 19,
  BO: 14,
  PA: 11,
  UY: 11,
  CL: 10,
  CR: 4,
  // Includes the roster entry recorded only as "E", read as España: it is the
  // traditional Spanish abbreviation for the country, and every other value in
  // the roster is a country name.
  ES: 4,
  BR: 2,
  CU: 2,
  EC: 2,
  PY: 2,
  VE: 2,
  CA: 1,
  NI: 1,
  US: 1,
};

// One list behind both community maps — the landing and the dashboard — so they
// show the same countries and the same headcount by construction.
export const communityCountries: CountryCount[] = Object.entries(
  communityHeadcount,
)
  .map(([code, count]) => ({
    code,
    name: getCountryName(code),
    flag: getCountryFlag(code),
    count,
  }))
  .sort((first, second) => second.count - first.count);
