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

export const apiGetAd = (id: string) =>
  axios.get<Wrapped<Advertisement>>(`advertisements/${id}`);

export const apiCreateAd = (data: AdCreateDto) =>
  axios.post<Wrapped<Advertisement>>('advertisements', data);

export const apiUpdateAd = (id: string, data: Record<string, unknown>) =>
  axios.put<Wrapped<Advertisement>>(`advertisements/${id}`, data);

// ─── Countries ───────────────────────────────────────────────────────────────
export const apiGetCountries = (params?: { region?: string; subregion?: string }) =>
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
export const apiGetCities = (params: { name?: string; country_id?: number; province_id?: number }) =>
  axios.get<Wrapped<City[]>>('cities', {
    params,
    headers: { 'X-Skip-Loading': '1' },
  });

// ─── Locations (unified search) ──────────────────────────────────────────────
export interface LocationResult {
  id: number;
  label: string;
  value: string;
  type: 'country' | 'province' | 'city';
  meta?: string;
}

export const apiSearchLocations = (
  q: string,
  direction: 'international' | 'intercity',
  countryId?: number,
  limit = 20,
) =>
  axios.get<Wrapped<LocationResult[]>>('locations', {
    params: { q, direction, country_id: countryId, limit },
    headers: { 'X-Skip-Loading': '1' },
  });
