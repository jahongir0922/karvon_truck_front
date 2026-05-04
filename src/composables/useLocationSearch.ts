import { ref } from 'vue';
import { apiSearchLocations, type LocationResult } from 'src/api';

const LIMIT = 30;

export function useLocationSearch(
  getDirection: () => 'international' | 'intercity',
  getCountryId?: () => number | undefined,
) {
  const fromOptions = ref<LocationResult[]>([]);
  const toOptions = ref<LocationResult[]>([]);
  const fromHasMore = ref(false);
  const toHasMore = ref(false);

  // Joriy query ni saqlab qolamiz (loadMore uchun)
  let currentFromQuery = '';
  let currentToQuery = '';

  async function _fetch(q: string, offset = 0): Promise<LocationResult[]> {
    try {
      const res = await apiSearchLocations(q, getDirection(), getCountryId?.(), LIMIT, offset);
      return res.data.data;
    } catch {
      return [];
    }
  }

  async function loadInitial() {
    currentFromQuery = '';
    currentToQuery = '';
    const results = await _fetch('');
    fromOptions.value = results;
    toOptions.value = [...results];
    fromHasMore.value = results.length === LIMIT;
    toHasMore.value = results.length === LIMIT;
  }

  function filterFrom(val: string, update: (fn: () => void) => void) {
    currentFromQuery = val;
    void _fetch(val).then((results) => {
      update(() => {
        fromOptions.value = results;
        fromHasMore.value = results.length === LIMIT;
      });
    });
  }

  function filterTo(val: string, update: (fn: () => void) => void) {
    currentToQuery = val;
    void _fetch(val).then((results) => {
      update(() => {
        toOptions.value = results;
        toHasMore.value = results.length === LIMIT;
      });
    });
  }

  async function loadMoreFrom() {
    if (!fromHasMore.value) return;
    const results = await _fetch(currentFromQuery, fromOptions.value.length);
    fromOptions.value = [...fromOptions.value, ...results];
    fromHasMore.value = results.length === LIMIT;
  }

  async function loadMoreTo() {
    if (!toHasMore.value) return;
    const results = await _fetch(currentToQuery, toOptions.value.length);
    toOptions.value = [...toOptions.value, ...results];
    toHasMore.value = results.length === LIMIT;
  }

  function clearOptions() {
    fromOptions.value = [];
    toOptions.value = [];
    fromHasMore.value = false;
    toHasMore.value = false;
  }

  return {
    fromOptions,
    toOptions,
    fromHasMore,
    toHasMore,
    loadInitial,
    filterFrom,
    filterTo,
    loadMoreFrom,
    loadMoreTo,
    clearOptions,
  };
}
