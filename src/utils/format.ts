// Ilova locale'i ('uz' | 'uz-CY' | 'ru') → Intl locale
export function toIntlLocale(locale: string): string {
  if (locale === 'uz-CY') return 'uz-Cyrl-UZ';
  if (locale === 'uz') return 'uz-Latn-UZ';
  return locale;
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDate(value: string): Date | null {
  // 'YYYY-MM-DD' ni mahalliy sana sifatida o'qiymiz — aks holda UTC yarim tun
  // manfiy vaqt mintaqalarida bir kun oldinga surilib ketadi
  const m = DATE_ONLY.exec(value);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Sana (vaqtsiz) — joriy tilda. */
export function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) return '';
  const d = parseDate(value);
  return d ? d.toLocaleDateString(toIntlLocale(locale)) : value;
}

/** Sana va vaqt — joriy tilda. */
export function formatDateTime(value: string | null | undefined, locale: string): string {
  if (!value) return '';
  const d = parseDate(value);
  return d
    ? d.toLocaleString(toIntlLocale(locale), { dateStyle: 'short', timeStyle: 'short' })
    : value;
}

/** Summa + valyuta ("1 500 000 UZS"). Bo'sh/0 bo'lsa '' qaytaradi. */
export function formatMoney(
  value: string | number | null | undefined,
  currency: string | undefined,
  locale: string,
): string {
  if (value === null || value === undefined || value === '') return '';
  const n = Number(value);
  if (!n) return '';
  const formatted = Number.isFinite(n) ? n.toLocaleString(toIntlLocale(locale)) : String(value);
  return currency ? `${formatted} ${currency}` : formatted;
}
