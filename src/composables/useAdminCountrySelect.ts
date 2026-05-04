import { ref } from 'vue';
import { apiGetCountries } from 'src/api';

export interface SelectOption { label: string; value: number }

export function useAdminCountrySelect() {
  const countryOptions = ref<SelectOption[]>([]);

  async function loadCountryOptions(q = '') {
    const res = await apiGetCountries({ q: q || 'a', limit: 30 });
    countryOptions.value = res.data.data.map((c) => ({
      label: c.translations?.['uz'] ?? c.translations?.['ru'] ?? c.name,
      value: c.id,
    }));
  }

  function filterCountryOptions(val: string, update: (fn: () => void) => void) {
    void apiGetCountries({ q: val || 'a', limit: 30 }).then((res) => {
      update(() => {
        countryOptions.value = res.data.data.map((c) => ({
          label: c.translations?.['uz'] ?? c.translations?.['ru'] ?? c.name,
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
