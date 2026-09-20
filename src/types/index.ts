import type { Direction } from 'src/constants';

export interface User {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Manzilning bazadagi viloyat/shaharga bog'langan ko'rinishi */
export interface AdLocationRef {
  countryId: number;
  provinceId: number | null;
  cityId: number | null;
  label: string;
}

/** Formadan tanlangan manzil ID'lari (backend shu bo'yicha bog'laydi) */
export interface LocationRef {
  countryId?: number | null;
  provinceId?: number | null;
  cityId?: number | null;
}

export interface Advertisement {
  _id: string;
  // Odatda Direction, lekin backend (Telegram/AI import) boshqa satr ham saqlashi mumkin
  direction: string;
  fromAddress: string;
  toAddress: string;
  fromLocation?: AdLocationRef | null;
  toLocation?: AdLocationRef | null;
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
  /** Telegram'dan AI yaratgan e'londa — xabarning asl matni (qo'lda joylanganda yo'q) */
  sourceText?: string | null;
  phone: string;
  clientName?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Translations {
  uz?: string;
  en?: string;
  ru?: string;
}

export interface City {
  _id: string;
  id: number;
  name: string;
  state_code: string;
  state_name: string;
  state_id: number;
  country_id: number;
  country_code: string;
  country_name: string;
  latitude: string;
  longitude: string;
  translations: Translations;
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
  translations: Translations;
}

export interface AdCreateDto {
  direction: Direction;
  fromAddress: string;
  toAddress: string;
  fromLocation?: LocationRef | undefined;
  toLocation?: LocationRef | undefined;
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

// ─── Telegram kuzatuvi (admin) ───────────────────────────────────────────────
export interface TelegramSource {
  _id: string;
  link: string;
  title: string;
  isActive: boolean;
  chatId: string | null;
  topicId: number | null;
  lastResolvedAt: string | null;
  resolveError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TelegramMessage {
  _id: string;
  chatId: string;
  chatTitle?: string | null;
  sourceLink?: string | null;
  messageId: number;
  topicId?: number | null;
  message: string;
  fullName?: string | null;
  username?: string | null;
  userPhone?: string | null;
  isMediaExsist?: boolean | null;
  sentAt?: string | null;
  isProcessed: boolean;
  processedAt?: string | null;
  aiAttempts?: number;
  aiError?: string | null;
  adsCreated?: number;
  /** AI ga yuborilmagan sabab: takror yoki matn yo'q */
  skipReason?: 'duplicate' | 'empty' | null;
  /** Takror bo'lsa — asl xabar */
  duplicateOf?: string | null;
  createdAt: string;
}

export type TelegramLoginStep =
  | 'idle'
  | 'sending_code'
  | 'waiting_code'
  | 'waiting_password'
  | 'signing_in'
  | 'done'
  | 'error';

export interface TelegramLoginState {
  step: TelegramLoginStep;
  phone: string | null;
  error: string | null;
  hint: string | null;
  updatedAt: string;
}

export interface TelegramStatus {
  configured: boolean;
  connected: boolean;
  // Saqlangan sessiya Telegram tomonidan bekor qilingan — qayta kirish kerak
  sessionInvalid: boolean;
  login: TelegramLoginState;
  sources: { link: string; chatId: string; topicId: number | null; title: string | null }[];
  messagesSaved: number;
  lastMessageAt: string | null;
  lastError: string | null;
  startedAt: string;
  ai: {
    enabled: boolean;
    configured: boolean;
    provider: 'openrouter' | 'claude-code';
    providerInfo: string | null;
    model: string;
    isProcessing: boolean;
    processedSinceStart: number;
    adsCreatedSinceStart: number;
    /** Takror deb topilib, AI ga yuborilmagan xabarlar */
    duplicatesSinceStart: number;
    lastError: string | null;
    /** Limit tugagan bo'lsa tiklanish vaqti (ISO) */
    retryAt: string | null;
  };
}

/**
 * Tahrirlash: undefined → maydon tegilmaydi, null → maydon tozalanadi
 * (backend '' ni ham null deb qabul qiladi).
 */
export interface AdUpdateDto {
  direction?: Direction;
  fromAddress?: string;
  toAddress?: string;
  fromLocation?: LocationRef | null;
  toLocation?: LocationRef | null;
  truckType?: string[];
  loadName?: string | null;
  weight?: number | null;
  paymentType?: string | null;
  loadingTime?: string | null;
  volume?: number | null;
  descriptions?: string | null;
  advance?: string | null;
  deliveryCost?: string | null;
  currency?: string | null;
  isActive?: boolean;
  phone?: string;
  clientName?: string | null;
}
