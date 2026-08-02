export type CountryOption = {
  code: string;
  name: string;
  x: number;
  y: number;
};

export const countryOptions: CountryOption[] = [
  { code: "AR", name: "Argentina", x: 55, y: 78 },
  { code: "BO", name: "Bolivia", x: 51, y: 65 },
  { code: "BR", name: "Brazil", x: 59, y: 61 },
  { code: "CL", name: "Chile", x: 49, y: 78 },
  { code: "CO", name: "Colombia", x: 47, y: 50 },
  { code: "CR", name: "Costa Rica", x: 40, y: 44 },
  { code: "CU", name: "Cuba", x: 43, y: 35 },
  { code: "DO", name: "Dominican Republic", x: 48, y: 37 },
  { code: "EC", name: "Ecuador", x: 44, y: 55 },
  { code: "GT", name: "Guatemala", x: 36, y: 40 },
  { code: "HN", name: "Honduras", x: 38, y: 41 },
  { code: "MX", name: "Mexico", x: 30, y: 35 },
  { code: "NI", name: "Nicaragua", x: 39, y: 43 },
  { code: "PA", name: "Panama", x: 42, y: 46 },
  { code: "PE", name: "Peru", x: 47, y: 61 },
  { code: "PR", name: "Puerto Rico", x: 50, y: 37 },
  { code: "PY", name: "Paraguay", x: 55, y: 68 },
  { code: "SV", name: "El Salvador", x: 37, y: 41 },
  { code: "UY", name: "Uruguay", x: 58, y: 77 },
  { code: "US", name: "United States", x: 29, y: 24 },
  { code: "VE", name: "Venezuela", x: 50, y: 46 },
];

export function getCountryByCode(code: string | null | undefined) {
  return countryOptions.find((country) => country.code === code);
}
