import type { Country, Translations } from 'src/types';

type TranslationMap = Translations | Record<string, string | undefined> | undefined;

/**
 * Joriy tilga mos tarjima. Backend (locations.service) bilan bir xil tartib:
 *   ru → ru, uz, asl nom;  uz / uz-CY → uz, ru, asl nom.
 */
export function translatedName(
  translations: TranslationMap,
  locale: string,
  fallback: string,
): string {
  if (!translations) return fallback;
  const tr = translations as Record<string, string | undefined>;
  if (locale === 'ru') return tr['ru'] || tr['uz'] || fallback;
  return tr['uz'] || tr['ru'] || fallback;
}

export function countryLabel(c: Country, locale: string): string {
  return translatedName(c.translations, locale, c.name);
}

/** "Mamlakat, Viloyat[, Shahar]" → shaharlararo rejimda mamlakat qismisiz. */
export function stripCountry(label: string): string {
  const idx = label.indexOf(', ');
  return idx !== -1 ? label.slice(idx + 2) : label;
}
