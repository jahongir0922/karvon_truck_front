import axios from 'axios';
import type {
  Advertisement,
  AdCreateDto,
  AdUpdateDto,
  City,
  Country,
  Province,
  Translations,
  User,
} from 'src/types';
import type { Direction } from 'src/constants';

// Backend barcha javoblarni { data: ... } ichiga o'raydi
type Wrapped<T> = { data: T };

// Fon so'rovlari (qidiruv, avto-to'ldirish) uchun global "Yuklanmoqda..." ko'rsatilmaydi
const silent = { skipLoading: true } as const;

// ─── Auth ────────────────────────────────────────────────────────────────────
// Token javob body'sida emas, `x-auth-token` header'ida keladi (body: true)
export const apiLogin = (email: string, password: string) =>
  axios.post<boolean>('auth', { email, password });

// ─── Users ───────────────────────────────────────────────────────────────────
export const apiGetMe = () => axios.get<Wrapped<User>>('users/me');

// Faqat admin
export const apiGetUsers = () => axios.get<Wrapped<User[]>>('users');

export const apiCreateUser = (data: { name: string; email: string; password: string }) =>
  axios.post<Wrapped<User>>('users', data);

// ─── Advertisements ──────────────────────────────────────────────────────────
export interface AdsQuery {
  page?: number | undefined;
  perPage?: number | undefined;
  direction?: Direction | undefined;
}

export const apiGetAds = (params?: AdsQuery) =>
  axios.get<Wrapped<Advertisement[]>>('advertisements', { params });

export const apiGetMyAds = () => axios.get<Wrapped<Advertisement[]>>('advertisements/my');

export const apiGetAd = (id: string) => axios.get<Wrapped<Advertisement>>(`advertisements/${id}`);

export const apiCreateAd = (data: AdCreateDto) =>
  axios.post<Wrapped<Advertisement>>('advertisements', data);

export const apiUpdateAd = (id: string, data: AdUpdateDto) =>
  axios.put<Wrapped<Advertisement>>(`advertisements/${id}`, data);

export const apiDeleteAd = (id: string) =>
  axios.delete<Wrapped<{ _id: string; deleted: boolean }>>(`advertisements/${id}`);

// ─── Countries ───────────────────────────────────────────────────────────────
export interface CountriesQuery {
  region?: string | undefined;
  subregion?: string | undefined;
  q?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}

export const apiGetCountries = (params?: CountriesQuery) =>
  axios.get<Wrapped<Country[]>>('countries', { params, ...silent });

// To'liq hujjat (ro'yxat faqat qisqa maydonlarni qaytaradi)
export const apiGetCountry = (id: number) =>
  axios.get<Wrapped<Country>>(`countries/${id}`, silent);

// ─── Provinces ───────────────────────────────────────────────────────────────
export const apiGetProvincesByCountry = (countryId: number) =>
  axios.get<Wrapped<Province[]>>(`province/country/${countryId}`, silent);

// ─── Cities ──────────────────────────────────────────────────────────────────
export interface CitiesQuery {
  name?: string | undefined;
  country_id?: number | undefined;
  state_id?: number | undefined;
}

export const apiGetCities = (params: CitiesQuery) =>
  axios.get<Wrapped<City[]>>('cities', { params, ...silent });

// ─── Admin: Countries ────────────────────────────────────────────────────────
export interface CountryPayload {
  id?: number | null | undefined;
  name: string;
  iso2: string;
  iso3: string;
  region: string;
  subregion: string;
  emoji: string;
  translations: Record<string, string>;
}

export const apiAdminCreateCountry = (data: CountryPayload) =>
  axios.post<Wrapped<Country>>('countries', data);

export const apiAdminUpdateCountry = (id: number, data: Partial<CountryPayload>) =>
  axios.put<Wrapped<Country>>(`countries/${id}`, data);

export const apiAdminDeleteCountry = (id: number) => axios.delete(`countries/${id}`);

// ─── Admin: Provinces ─────────────────────────────────────────────────────────
export interface ProvincePayload {
  id?: number | null | undefined;
  name: string;
  country_id: number | null;
  country_code: string;
  country_name: string;
  state_code: string;
  translations: Translations;
}

export const apiAdminCreateProvince = (data: ProvincePayload) =>
  axios.post<Wrapped<Province>>('province', data);

// PUT: umumiy maydonlar + { translations: { uz, en, ru } } ('' → tarjima o'chiriladi)
export const apiAdminUpdateProvince = (id: string, data: Partial<ProvincePayload>) =>
  axios.put<Wrapped<Province>>(`province/${id}`, data);

export const apiAdminDeleteProvince = (id: string) => axios.delete(`province/${id}`);

// ─── Admin: Cities ────────────────────────────────────────────────────────────
export interface CityPayload {
  id?: number | null | undefined;
  name: string;
  country_id: number | null;
  country_code: string;
  country_name: string;
  state_id: number | null;
  state_code?: string | undefined;
  state_name?: string | undefined;
  translations: Translations;
}

export const apiAdminCreateCity = (data: CityPayload) =>
  axios.post<Wrapped<City>>('cities', data);

export const apiAdminUpdateCity = (id: string, data: Partial<CityPayload>) =>
  axios.put<Wrapped<City>>(`cities/${id}`, data);

export const apiAdminDeleteCity = (id: string) => axios.delete(`cities/${id}`);

// ─── Locations (unified search) ──────────────────────────────────────────────
export interface LocationResult {
  id: number;
  label: string; // "O'zbekiston, Toshkent" yoki "O'zbekiston, Toshkent, Chirchiq"
  value: string; // label bilan bir xil
  type: 'province' | 'city';
}

export const apiSearchLocations = (
  q: string,
  direction: Direction,
  countryId?: number,
  limit = 30,
  offset = 0,
) =>
  axios.get<Wrapped<LocationResult[]>>('locations', {
    params: { q, direction, country_id: countryId, limit, offset },
    ...silent,
  });
