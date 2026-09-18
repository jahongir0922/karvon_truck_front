import axios from 'axios';

interface ApiErrorBody {
  statusCode?: number;
  message?: string | string[];
}

/** Backend xato javobidan foydalanuvchiga ko'rsatiladigan matnni ajratadi. */
export function getErrorMessage(err: unknown, fallback = ''): string {
  if (axios.isAxiosError<ApiErrorBody>(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string' && msg) return msg;
  }
  return fallback;
}

/** HTTP status (javob bo'lmasa undefined). */
export function getErrorStatus(err: unknown): number | undefined {
  return axios.isAxiosError(err) ? err.response?.status : undefined;
}
