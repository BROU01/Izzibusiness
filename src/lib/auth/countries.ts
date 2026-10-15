/**
 * Pays proposés à l'inscription, avec l'indicatif utilisé pour composer
 * le numéro international (E.164). Bénin en tête : marché principal.
 * `digits` = longueur du numéro national attendu.
 */
export const COUNTRIES = [
  { code: 'BJ', name: 'Bénin', dial: '229', digits: [10] },
  { code: 'TG', name: 'Togo', dial: '228', digits: [8] },
  { code: 'CI', name: "Côte d'Ivoire", dial: '225', digits: [10] },
  { code: 'SN', name: 'Sénégal', dial: '221', digits: [9] },
  { code: 'BF', name: 'Burkina Faso', dial: '226', digits: [8] },
  { code: 'ML', name: 'Mali', dial: '223', digits: [8] },
  { code: 'NE', name: 'Niger', dial: '227', digits: [8] },
  { code: 'CM', name: 'Cameroun', dial: '237', digits: [9] },
  { code: 'GA', name: 'Gabon', dial: '241', digits: [8, 9] },
  { code: 'CG', name: 'Congo-Brazzaville', dial: '242', digits: [9] },
  { code: 'CD', name: 'RD Congo', dial: '243', digits: [9] },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]['code'];

export const COUNTRY_CODES = COUNTRIES.map((c) => c.code) as [CountryCode, ...CountryCode[]];

export function findCountry(code: string) {
  return COUNTRIES.find((c) => c.code === code) ?? null;
}

/**
 * Normalise un numéro national saisi librement ("97 00 00 00") en E.164
 * ("+22997000000"). Renvoie null si la longueur ne correspond pas au pays.
 */
export function toE164(countryCode: string, nationalNumber: string): string | null {
  const country = findCountry(countryCode);
  if (!country) return null;
  let digits = nationalNumber.replace(/\D/g, '');
  // L'utilisateur a pu taper l'indicatif malgré tout.
  if (digits.startsWith(country.dial) && digits.length > Math.max(...country.digits)) {
    digits = digits.slice(country.dial.length);
  }
  if (!(country.digits as readonly number[]).includes(digits.length)) return null;
  return `+${country.dial}${digits}`;
}
