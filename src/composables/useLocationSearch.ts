import { ref } from 'vue';
import { apiSearchLocations, type LocationResult } from 'src/api';

export function useLocationSearch(
  getDirection: () => 'international' | 'intercity',
  getCountryId?: () => number | undefined,
) {
  const fromOptions = ref<LocationResult[]>([]);
  const toOptions = ref<LocationResult[]>([]);

  async function _fetch(q: string): Promise<LocationResult[]> {
    try {
      const res = await apiSearchLocations(q, getDirection(), getCountryId?.());
      return res.data.data;
    } catch {
      return [];
    }
  }

  /** Sahifa yuklanganda yoki yo'nalish o'zgarganda default ro'yxatni olish */
  async function loadInitial() {
    const results = await _fetch('');
    fromOptions.value = results;
    toOptions.value = results;
  }

  /** q-select @filter event handler — "Qayerdan" uchun */
  function filterFrom(val: string, update: (fn: () => void) => void) {
    void _fetch(val).then((results) => update(() => { fromOptions.value = results; }));
  }

  /** q-select @filter event handler — "Qayerga" uchun */
  function filterTo(val: string, update: (fn: () => void) => void) {
    void _fetch(val).then((results) => update(() => { toOptions.value = results; }));
  }

  function clearOptions() {
    fromOptions.value = [];
    toOptions.value = [];
  }

  return { fromOptions, toOptions, loadInitial, filterFrom, filterTo, clearOptions };
}
