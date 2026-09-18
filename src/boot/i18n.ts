import { defineBoot } from '#q-app/wrappers';
import { createI18n } from 'vue-i18n';

import messages from 'src/i18n';
import { DEFAULT_LOCALE, LOCALE_KEY } from 'src/constants';

export type MessageLanguages = keyof typeof messages;
// Type-define 'uz' as the master schema for the resource
export type MessageSchema = (typeof messages)['uz'];

// See https://vue-i18n.intlify.dev/guide/advanced/typescript.html#global-resource-schema-type-definition
/* eslint-disable @typescript-eslint/no-empty-object-type */
declare module 'vue-i18n' {
  // define the locale messages schema
  export interface DefineLocaleMessage extends MessageSchema {}

  // define the datetime format schema
  export interface DefineDateTimeFormat {}

  // define the number format schema
  export interface DefineNumberFormat {}
}
/* eslint-enable @typescript-eslint/no-empty-object-type */

export function isMessageLanguage(value: unknown): value is MessageLanguages {
  return typeof value === 'string' && value in messages;
}

const saved = localStorage.getItem(LOCALE_KEY);
const initialLocale: MessageLanguages = isMessageLanguage(saved) ? saved : DEFAULT_LOCALE;

// Komponentlardan tashqarida (boot/axios, util'lar) ham ishlatish uchun eksport qilinadi
export const i18n = createI18n<{ message: MessageSchema }, MessageLanguages, false>({
  locale: initialLocale,
  fallbackLocale: DEFAULT_LOCALE,
  legacy: false,
  messages,
});

/** Tilni almashtirib, tanlovni saqlaydi. */
export function setLocale(locale: MessageLanguages) {
  i18n.global.locale.value = locale;
  localStorage.setItem(LOCALE_KEY, locale);
  document.documentElement.setAttribute('lang', locale);
}

export default defineBoot(({ app }) => {
  document.documentElement.setAttribute('lang', initialLocale);
  app.use(i18n);
});
