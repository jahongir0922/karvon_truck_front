import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiGetCountries } from 'src/api';
import type { Country } from 'src/types';

export interface SelectOption { label: string; value: number }

export function countryLabel(c: Country, locale: string): string {
  if (locale === 'ru') {
    return c.translations?.['ru'] ?? c.name;
  }
  // uz / uz-CY: no uz translation data in source, use English name
  return c.translations?.['uz'] ?? c.name;
}

export function useAdminCountrySelect() {
  const { locale } = useI18n();
  const countryOptions = ref<SelectOption[]>([]);

  async function loadCountryOptions(q = '') {
    const res = await apiGetCountries({ q: q || 'a', limit: 30 });
    countryOptions.value = res.data.data.map((c) => ({
      label: countryLabel(c, locale.value),
      value: c.id,
    }));
  }

  function filterCountryOptions(val: string, update: (fn: () => void) => void) {
    void apiGetCountries({ q: val || 'a', limit: 30 }).then((res) => {
      update(() => {
        countryOptions.value = res.data.data.map((c) => ({
          label: countryLabel(c, locale.value),
          value: c.id,
        }));
      });
    });
  }

  return { countryOptions, loadCountryOptions, filterCountryOptions };
}

export function getErrorMessage(err: unknown): string {
  const msg = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  return Array.isArray(msg) ? msg.join(', ') : typeof msg === 'string' ? msg : 'Xatolik yuz berdi.';
}
