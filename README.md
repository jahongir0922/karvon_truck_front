# Karvon Truck — frontend

Yuk tashish e'lonlari doskasi (Quasar 2 + Vue 3 + TypeScript + Pinia + UnoCSS).
Backend (NestJS + MongoDB) alohida repoda: `karvon_truck_backend`.

## Ishga tushirish

```bash
npm install
cp .env.example .env   # API_URL va WS_URL ni sozlang
npm run dev            # http://localhost:9000
```

Boshqa buyruqlar: `npm run build`, `npm run lint`, `npm run format`.

## Tuzilma

| Papka | Vazifa |
| --- | --- |
| `src/api` | Backend endpoint'lari (axios), javob turlari |
| `src/boot` | `i18n` (til), `axios` (token, loader, global xatolar, 401 → logout) |
| `src/composables` | `useCountrySelect` (mamlakat tanlash), `useLocationSearch` (manzil qidiruvi) |
| `src/constants` | Yo'nalish, mashina turlari, valyutalar, localStorage kalitlari |
| `src/utils` | Xato matni, sana/summa formatlash, tarjima tanlash |
| `src/pages` | Sahifalar; `pages/admin` — mamlakat/viloyat/shahar/foydalanuvchi boshqaruvi |
| `src/i18n` | `uz`, `uz-CY`, `ru` tarjimalari (`uz` — asosiy sxema) |

## Muhit o'zgaruvchilari

- `API_URL` — backend REST manzili (masalan `http://localhost:5000/api/`)
- `WS_URL` — WebSocket manzili (`ws://localhost:5000/ws/`; production'da `wss://`)

## Eslatmalar

- Real vaqt yangilanishlar `/ws/ads` orqali keladi; uzilganda 5 soniyadan keyin qayta ulanadi.
- Tarmoq va 5xx xatolar global bildirishnoma sifatida ko'rsatiladi; forma xatolari (400/409) sahifada.
- Token muddati tugasa (401) sessiya avtomatik tozalanadi.
