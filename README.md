# @sebamar88/utils

**EN:** Modern TypeScript utilities for Nubi Lab services: an isomorphic **ApiClient**, structured logging/profiling helpers, and ready-to-use modules (`DateUtils`, `StringUtils`, `StorageManager`, etc.).  
**ES:** Colección moderna de utilidades TypeScript para los servicios de Nubi Lab: **ApiClient** isomórfico, logging/profiling estructurado y helpers listos (`DateUtils`, `StringUtils`, `StorageManager`, etc.).

---

## Overview / Resumen

**EN:** Ship consistent networking, logging, and helper APIs across Node.js and browsers with zero setup—everything is published as ESM plus typings.  
**ES:** Centralizá networking, logging y helpers tanto en Node.js como en navegadores sin configuración extra: todo se publica en ESM con definiciones de tipos.

## Highlights / Características

-   ✅ **EN:** Fully ESM with `.d.ts` definitions. **ES:** Build 100 % ESM con tipos listos.
-   🌐 **EN:** Works on Node.js 18+ and modern browsers (via `cross-fetch`). **ES:** Compatible con Node.js 18+ y navegadores modernos (usa `cross-fetch`).
-   🔁 **EN:** ApiClient with retries, localized errors, flexible options. **ES:** ApiClient con reintentos, errores localizados y configuración flexible.
-   🧩 **EN:** Helper modules (strings, dates, validators, env, storage). **ES:** Helpers para strings, fechas, validadores, env y storage.
-   🪵 **EN:** Structured logging/profiling: `createLogger`, `Profiler`, `withTiming`. **ES:** Logging/profiling estructurado: `createLogger`, `Profiler`, `withTiming`.

## Installation / Instalación

```bash
npm install @sebamar88/utils
# or / o
pnpm add @sebamar88/utils
```

## Quick Start / Inicio rápido

```ts
import {
    ApiClient,
    createLogger,
    DateUtils,
    StringUtils,
} from "@sebamar88/utils";

const http = new ApiClient({
    baseUrl: "https://api.my-service.com",
    defaultHeaders: { "X-Team": "@sebamar88" },
    locale: "es",
    errorMessages: {
        es: { 418: "Soy una tetera ☕" },
    },
});

const users = await http.get<{ id: string; name: string }[]>("/users");

const logger = createLogger({ namespace: "users-service", level: "info" });
logger.info("Users synced", { count: users.length });

logger.debug("Next sync ETA (days)", {
    etaDays: DateUtils.diffInDays(
        new Date(),
        DateUtils.add(new Date(), { days: 7 })
    ),
});

const slug = StringUtils.slugify("New Users – October 2024");
```

**EN:** Import everything from the root entry, configure the ApiClient once, reuse helpers everywhere.  
**ES:** Importá desde la raíz, configurá el ApiClient una sola vez y reutilizá los helpers en todos tus servicios.

## ApiClient Details / Detalles del ApiClient

-   `baseUrl`: **EN** required prefix for relative endpoints. **ES** prefijo requerido para endpoints relativos.
-   `defaultHeaders`: **EN** shared headers merged per request. **ES** cabeceras comunes que se combinan en cada request.
-   `locale` + `errorMessages`: **EN** localized HTTP errors. **ES** mensajes localizados por código HTTP.
-   `fetchImpl`: **EN** inject your own fetch (tests, custom environments). **ES** inyectá tu propio `fetch` (tests o entornos custom).

Each `request` (and `get`, `post`, `put`, `patch`, `delete`) accepts / Cada request acepta:

-   `searchParams`: **EN** serializes to URLSearchParams. **ES** se serializa automáticamente.
-   `body`: **EN** strings, serializable objects, or `FormData`. **ES** strings, objetos serializables o `FormData`.
-   `errorLocale`: **EN** override language per request. **ES** forzá un idioma específico.
-   Native `RequestInit` fields (`headers`, `signal`, etc.).

```ts
import { HttpError } from "@sebamar88/utils";

try {
    await http.get("/users");
} catch (error) {
    if (error instanceof HttpError) {
        console.error("Server error", error.status, error.body);
    }
}
```

## Logging, Profiling & Helpers / Logging, profiling y helpers

```ts
import {
    createLogger,
    withTiming,
    createStopwatch,
    StorageManager,
    EnvManager,
} from "@sebamar88/utils";

const logger = createLogger({ namespace: "payments", level: "debug" });

await withTiming("settlements", async () => {
    const stopwatch = createStopwatch({ label: "batch-download", logger });
    const batch = await downloadPayments();
    stopwatch.log({ records: batch.length });
});

const storage = new StorageManager();
storage.set("token", "abc123", 60_000);
const env = new EnvManager();
const apiKey = env.require("API_KEY");
```

-   `DateUtils`: **EN** safe parsing, add/subtract, configurable diffs, `isSameDay`. **ES** parseo seguro, sumas/restas, diferencias configurables e `isSameDay`.
-   `StringUtils`: **EN** slugify, capitalize, masking, interpolation, query strings. **ES** slugify, capitalización, máscaras, interpolación, query strings.
-   `Validator`: **EN** lightweight synchronous validators. **ES** validadores sincrónicos livianos.
-   `StorageManager`: **EN** safe wrapper for `localStorage`/`sessionStorage`. **ES** adaptador seguro para storage del navegador.

## Toolkit Catalog / Catálogo de herramientas

### ApiClient

-   **EN**: Typed HTTP client with retries, localized errors, interceptors, and custom fetch support for Node/browsers.  
    **ES**: Cliente HTTP tipado con reintentos, errores localizados, interceptores y `fetch` personalizable para Node/navegadores.

```ts
import { ApiClient } from "@sebamar88/utils";

const api = new ApiClient({
    baseUrl: "https://api.example.com",
    defaultHeaders: { "X-Team": "nubi" },
});

const user = await api.get("/users/1", {
    searchParams: { locale: "es" },
});
```

### createLogger

-   **EN**: Structured logger with levels, namespaces, transports for Node/browser, and child loggers.  
    **ES**: Logger estructurado con niveles, namespaces, transports para Node/browser y loggers hijos.

```ts
import { createLogger } from "@sebamar88/utils";

const logger = createLogger({ namespace: "payments", level: "info" });
logger.warn("payment delayed", { id: "tx_1" });

const workerLogger = logger.child("worker");
workerLogger.debug("processing batch", { size: 20 });
```

### Timing & Debug Utilities

-   **EN**: `createStopwatch`, `withTiming`, `measureAsync`, `captureDebug`, and `Profiler` help you capture execution times and emit logs automatically.  
    **ES**: `createStopwatch`, `withTiming`, `measureAsync`, `captureDebug` y `Profiler` facilitan medir tiempos y loguear automáticamente.

```ts
import {
    createStopwatch,
    withTiming,
    measureAsync,
    Profiler,
} from "@sebamar88/utils";

const stopwatch = createStopwatch({ label: "sync-users" });
// ... run task
stopwatch.log({ records: 42 });

await withTiming("refresh-cache", async () => fetchCache());
const { result, durationMs } = await measureAsync(
    "bill-run",
    () => processBills()
);

const profiler = new Profiler();
profiler.start("db");
await queryDb();
profiler.end("db");
console.table(profiler.summary());
```

### DateUtils

-   **parse / isValid**: **EN** accept `Date`, ISO strings, timestamps; return normalized Date or boolean. **ES** aceptan `Date`, string ISO o timestamp y devuelven Date normalizada o booleano.
-   **toISODate**: **EN** format to `YYYY-MM-DD` without timezone surprises. **ES** formatea como `YYYY-MM-DD` evitando problemas de zona horaria.
-   **startOfDay / endOfDay**: **EN** clamp hours to `00:00:00.000` or `23:59:59.999`. **ES** ajusta horas al inicio o final del día.
-   **add**: **EN** add duration (`days`, `hours`, `minutes`, `seconds`, `milliseconds`). **ES** suma duraciones con granularidad configurable.
-   **diff / diffInDays**: **EN** difference between two dates with unit + rounding + absolute options. **ES** diferencia entre fechas con unidad, redondeo y valor absoluto configurable.
-   **isSameDay / isBefore / isAfter**: **EN** compare normalized dates. **ES** compara fechas normalizadas.
-   **format**: **EN** locale-aware short date (`es-AR` default). **ES** formatea con `toLocaleDateString`.

```ts
DateUtils.isSameDay("2024-10-10", new Date());
DateUtils.diff(new Date("2024-01-01"), Date.now(), {
    unit: "days",
    rounding: "round",
    absolute: true,
});
```

### StringUtils

-   **removeDiacritics / compactWhitespace**: **EN** normalize text for comparisons or rendering. **ES** normalizan texto para comparaciones o UI.
-   **slugify**: **EN** create URL-friendly IDs with configurable separator/lowercase. **ES** genera slugs configurables.
-   **capitalize / capitalizeWords**: **EN/ES** capitaliza respetando locale.
-   **truncate**: **EN** trims long strings with optional ellipsis + word boundaries. **ES** recorta textos largos respetando palabras.
-   **mask**: **EN** hide sensitive parts with custom `maskChar`, `visibleStart`, `visibleEnd`. **ES** oculta secciones sensibles con máscara configurable.
-   **interpolate**: **EN** replace `{{placeholders}}` with nested object values (strict/fallback/transform). **ES** interpolación con soporte para rutas y validación.
-   **initials**: **EN** generate up to `limit` initials. **ES** genera iniciales rápido.
-   **toQueryString**: **EN** serialize nested objects/arrays with formats (`repeat`, `bracket`, `comma`). **ES** serializa objetos y arrays a query strings.

```ts
StringUtils.mask("4242424242424242", { visibleStart: 4, visibleEnd: 2 });
StringUtils.toQueryString({
    page: 1,
    tags: ["lab", "team"],
    filters: { status: "active" },
});
```

### StorageManager

-   **StorageManager**: **EN** wraps any `Storage` (default `localStorage`) with safe JSON parsing and TTL support. **ES** envuelve cualquier `Storage` con parseo seguro y expiración opcional.
-   **set/get/remove/clear**: **EN** persist typed values, remove expired entries automatically. **ES** guarda valores tipados y limpia expirados.

```ts
const storage = new StorageManager(sessionStorage);
storage.set("session", { token: "abc" }, 60_000);
const session = storage.get<{ token: string }>("session");
```

### EnvManager

-   **get / require**: **EN** read ENV vars from Node (via `process.env`) or Vite-style browser builds (`import.meta.env`). **ES** lee env vars en Node o navegador y marca obligatorias con `require`.
-   **isProd**: **EN** check `NODE_ENV`/`MODE`. **ES** detecta modo producción.

```ts
const env = new EnvManager();
const apiBase = env.require("API_BASE_URL");
if (env.isProd()) {
    // toggle prod-only behavior
}
```

### Validator

-   **Identity**: **EN** `isEmail`, `isUUIDv4`, `isDni`, `isCuit`, `isCbu`. **ES** validaciones de identidad y banking locales.
-   **Phones**: **EN** `isInternationalPhone`, `isPhoneE164`, `isLocalPhone(locale)`. **ES** valida teléfonos internacionales y locales con patrones por país.
-   **Security**: **EN** `isStrongPassword`, `isOneTimeCode`. **ES** contraseñas fuertes y códigos OTP.
-   **General**: **EN** `isUrl`, `isEmpty`, length guards, regex matcher, `isDateRange`. **ES** helpers generales para formularios.

```ts
Validator.isStrongPassword("NubiLab!2024", { minLength: 10 });
Validator.isLocalPhone("11 5555-7777", "es-AR");
```

## Compatibility / Compatibilidad

-   Node.js >= 18 (ESM, `fetch`, `AbortController`, `URL`).
-   Modern browsers (ships optional `cross-fetch` polyfill).

## License / Licencia

MIT © 2024 Nubi Lab
