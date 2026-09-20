// Ilova bo'ylab takrorlanadigan qiymatlar bir joyda — sahifalarda nusxalanmasin.

export const DIRECTIONS = ['international', 'intercity'] as const;
export type Direction = (typeof DIRECTIONS)[number];

export function isDirection(value: unknown): value is Direction {
  return value === 'international' || value === 'intercity';
}

// Backend bu ro'yxatlarni tekshirmaydi — matn e'londa qanday tanlansa shunday saqlanadi
export const TRUCK_TYPES: string[] = ['Tent', 'Ref', 'Konteyner', 'Bortovoy', 'Samosval', 'Ploshadka', 'Tandem', 'Isuzu', 'Chakman', 'Paravoz'];
export const PAYMENT_TYPES: string[] = ['Naqd', "Pul o'tkazish"];
export const CURRENCIES: string[] = ['UZS', 'USD', 'RUB'];

// localStorage kalitlari
export const TOKEN_KEY = 'x-auth-token';
export const LOCALE_KEY = 'locale';
export const DIRECTION_KEY = 'direction';
export const CREATE_AD_DIRECTION_KEY = 'createAd_direction';

export const DEFAULT_LOCALE = 'uz';
