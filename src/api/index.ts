import axios from 'axios';
import type { Advertisement, AdCreateDto, City, Country, Province, User } from 'src/types';

// Backend barcha javoblarni { data: ... } ichiga o'raydi
type Wrapped<T> = { data: T };

// ─── Auth ────────────────────────────────────────────────────────────────────
export const apiLogin = (email: string, password: string) =>
  axios.post<Wrapped<User>>('auth', { email, password });

// ─── Users ───────────────────────────────────────────────────────────────────
export const apiGetMe = () => axios.get<Wrapped<User>>('users/me');

export const apiCreateUser = (data: { name: string; email: string; password: string; isAdmin?: boolean }) =>
  axios.post<Wrapped<User>>('users', data);

// ─── Advertisements ──────────────────────────────────────────────────────────
export const apiGetAds = (params?: { page?: number; perPage?: number }) =>
  axios.get<Wrapped<Advertisement[]>>('advertisements', { params });

export const apiGetMyAds = () =>
  axios.get<Wrapped<Advertisement[]>>('advertisements/my');

export const apiGetAd = (id: string) =>
  axios.get<Wrapped<Advertisement>>(`advertisements/${id}`);

export const apiCreateAd = (data: AdCreateDto) =>
  axios.post<Wrapped<Advertisement>>('advertisements', data);

export const apiUpdateAd = (id: string, data: Record<string, unknown>) =>
  axios.put<Wrapped<Advertisement>>(`advertisements/${id}`, data);

// ─── Countries ───────────────────────────────────────────────────────────────
export const apiGetCountries = (params?: { region?: string; subregion?: string; q?: string; limit?: number; offset?: number }) =>
  axios.get<Wrapped<Country[]>>('countries', {
    params,
    headers: { 'X-Skip-Loading': '1' },
  });

export const apiGetCountry = (id: number) =>
  axios.get<Wrapped<Country>>(`countries/${id}`, {
    headers: { 'X-Skip-Loading': '1' },
  });

// ─── Provinces ───────────────────────────────────────────────────────────────
export const apiGetProvincesByCountry = (countryId: number) =>
  axios.get<Wrapped<Province[]>>(`province/country/${countryId}`, {
    headers: { 'X-Skip-Loading': '1' },
  });

// ─── Cities ──────────────────────────────────────────────────────────────────
export const apiGetCities = (params: { name?: string; country_id?: number; state_id?: number }) =>
  axios.get<Wrapped<City[]>>('cities', {
    params,
    headers: { 'X-Skip-Loading': '1' },
  });

// ─── Admin: Countries ────────────────────────────────────────────────────────
export const apiAdminCreateCountry = (data: Record<string, unknown>) =>
  axios.post<Wrapped<Country>>('countries', data);

export const apiAdminUpdateCountry = (id: number, data: Record<string, unknown>) =>
  axios.put<Wrapped<Country>>(`countries/${id}`, data);

export const apiAdminDeleteCountry = (id: number) =>
  axios.delete(`countries/${id}`);

// ─── Admin: Provinces ─────────────────────────────────────────────────────────
export const apiAdminCreateProvince = (data: Record<string, unknown>) =>
  axios.post<Wrapped<Province>>('province', data);

export const apiAdminUpdateProvince = (id: string, data: Record<string, unknown>) =>
  axios.put<Wrapped<Province>>(`province/${id}`, data);

export const apiAdminDeleteProvince = (id: string) =>
  axios.delete(`province/${id}`);

// ─── Admin: Cities ────────────────────────────────────────────────────────────
export const apiAdminCreateCity = (data: Record<string, unknown>) =>
  axios.post<Wrapped<City>>('cities', data);

export const apiAdminUpdateCity = (id: string, data: Record<string, unknown>) =>
  axios.put<Wrapped<City>>(`cities/${id}`, data);

export const apiAdminDeleteCity = (id: string) =>
  axios.delete(`cities/${id}`);

// ─── Locations (unified search) ──────────────────────────────────────────────
export interface LocationResult {
  id: number;
  label: string;  // "O'zbekiston, Toshkent" yoki "O'zbekiston, Toshkent, Chirchiq"
  value: string;  // label bilan bir xil
  type: 'province' | 'city';
}

export const apiSearchLocations = (
  q: string,
  direction: 'international' | 'intercity',
  countryId?: number,
  limit = 30,
  offset = 0,
  lang = 'uz',
) =>
  axios.get<Wrapped<LocationResult[]>>('locations', {
    params: { q, direction, country_id: countryId, limit, offset, lang },
    headers: { 'X-Skip-Loading': '1' },
  });
