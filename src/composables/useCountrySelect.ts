import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { apiGetCountries } from 'src/api';
import { countryLabel } from 'src/utils/location';
import type { Country } from 'src/types';

export interface CountryOption {
  label: string;
  value: number;
  iso2: string;
  name: string;
}

const LIMIT = 30;

/**
 * Mamlakat tanlash (q-select) uchun umumiy mantiq: qidiruv, sahifalab yuklash,
 * standart O'zbekistonni tanlash. Index / CreateAd / MyAds / Admin sahifalarida
 * bir xil kod takrorlanmasligi uchun.
 *
 * q-select bilan ishlatish:
 *   v-model="countryId" :options="countryOptions" option-label="label" option-value="value"
 *   emit-value map-options use-input @filter="filterCountry" @virtual-scroll="onCountryScroll"
 */
export function useCountrySelect() {
  const { locale } = useI18n();

  const countryId = ref<number | null>(null);
  const countryOptions = ref<CountryOption[]>([]);
  const countryHasMore = ref(false);

  // Qachondir ko'rilgan barcha variantlar — filtr natijasi o'zgarganda ham
  // tanlangan mamlakat ma'lumotlari (iso2, nom) yo'qolmasin
  const seen = new Map<number, CountryOption>();
  let currentQuery = '';

  function toOption(c: Country): CountryOption {
    const opt = { label: countryLabel(c, locale.value), value: c.id, iso2: c.iso2, name: c.name };
    seen.set(opt.value, opt);
    return opt;
  }

  async function fetchPage(q: string, offset = 0): Promise<CountryOption[]> {
    try {
      const res = await apiGetCountries({ q, limit: LIMIT, offset });
      return res.data.data.map(toOption);
    } catch {
      return [];
    }
  }

  /** Alifbo tartibida birinchi sahifani yuklaydi (admin ro'yxatlari uchun). */
  async function loadCountryOptions() {
    currentQuery = '';
    const opts = await fetchPage('');
    countryOptions.value = opts;
    countryHasMore.value = opts.length === LIMIT;
  }

  /** O'zbekistonni topib, hali tanlanmagan bo'lsa standart qilib qo'yadi. */
  async function loadDefaultCountry() {
    currentQuery = 'uzbek';
    const opts = await fetchPage(currentQuery);
    countryOptions.value = opts;
    countryHasMore.value = opts.length === LIMIT;
    if (countryId.value === null) {
      const uz = opts.find((o) => o.iso2 === 'UZ') ?? opts[0];
      if (uz) countryId.value = uz.value;
    }
  }

  function filterCountry(val: string, update: (fn: () => void) => void) {
    currentQuery = val;
    void fetchPage(val).then((opts) => {
      update(() => {
        countryOptions.value = opts;
        countryHasMore.value = opts.length === LIMIT;
      });
    });
  }

  async function loadMoreCountry() {
    if (!countryHasMore.value) return;
    const more = await fetchPage(currentQuery, countryOptions.value.length);
    countryOptions.value = [...countryOptions.value, ...more];
    countryHasMore.value = more.length === LIMIT;
  }

  function onCountryScroll(details: { to: number }) {
    if (details.to >= countryOptions.value.length - 3 && countryHasMore.value) {
      void loadMoreCountry();
    }
  }

  const selectedCountry = computed<CountryOption | null>(() =>
    countryId.value === null ? null : (seen.get(countryId.value) ?? null),
  );

  /** Jadval ustunlari uchun: id → tarjima qilingan nom */
  const countryLabelById = computed<Record<number, string>>(() =>
    Object.fromEntries(countryOptions.value.map((o) => [o.value, o.label])),
  );

  return {
    countryId,
    countryOptions,
    countryHasMore,
    selectedCountry,
    countryLabelById,
    loadCountryOptions,
    loadDefaultCountry,
    filterCountry,
    loadMoreCountry,
    onCountryScroll,
  };
}
