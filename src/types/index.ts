export interface User {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Advertisement {
  _id: string;
  direction: string;
  fromAddress: string;
  toAddress: string;
  truckType: string[];
  loadName?: string;
  weight?: number;
  paymentType?: string;
  loadingTime?: string;
  volume?: number;
  descriptions?: string;
  advance?: string | number;
  deliveryCost?: string | number;
  currency?: string;
  isActive: boolean;
  isAdditional: boolean;
  isAI: boolean;
  phone: string;
  clientName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface City {
  _id: string;
  id: number;
  name: string;
  state_code: string;
  state_name: string;
  province_id: number;
  country_id: number;
  country_code: string;
  country_name: string;
  latitude: string;
  longitude: string;
  translations: { uz?: string; en?: string; ru?: string };
}

export interface Country {
  _id: string;
  id: number;
  name: string;
  iso3: string;
  iso2: string;
  phonecode: string;
  capital: string;
  currency: string;
  region: string;
  subregion: string;
  emoji: string;
  translations: Record<string, string>;
}

export interface Province {
  _id: string;
  id: number;
  name: string;
  country_id: number;
  country_code: string;
  country_name: string;
  state_code: string;
  translations: { uz?: string; en?: string; ru?: string };
}

export interface AdCreateDto {
  direction: string;
  fromAddress: string;
  toAddress: string;
  truckType: string[];
  loadName?: string | undefined;
  weight?: number | undefined;
  paymentType?: string | undefined;
  loadingTime?: string | undefined;
  volume?: number | undefined;
  descriptions?: string | undefined;
  advance?: string | undefined;
  deliveryCost?: string | undefined;
  currency?: string | undefined;
  phone: string;
  clientName?: string | undefined;
}
