# nubi-lab-utils

Colección de utilidades modernas en TypeScript pensadas para servicios internos de Nubi Lab. Incluye un **HttpClient** isomórfico, utilidades de logging/medición y helpers listos para usar (`DateUtils`, `StringUtils`, `StorageUtils`, etc.).

## Características principales

- ✅ 100 % ESM + tipos completos (`.d.ts`) listos para editores.
- 🌐 Funciona en Node.js 18+ y en navegadores que soporten `fetch`.
- 🔁 HttpClient con reintentos, localización de errores y configuración flexible.
- 🧩 Helper modules reutilizables (strings, fechas, validaciones, env, storage).
- 🪵 Logging estructurado con `createLogger`, `consoleTransport`, `Profiler` y `withTiming`.

## Instalación

```bash
npm install nubi-lab-utils
# o
pnpm add nubi-lab-utils
```

## Uso rápido

```ts
import {
  HttpClient,
  createLogger,
  DateUtils,
  StringUtils
} from 'nubi-lab-utils';

const http = new HttpClient({
  baseUrl: 'https://api.mi-servicio.com',
  defaultHeaders: { 'X-Team': 'nubi-lab' },
  locale: 'es',
  errorMessages: {
    es: { 418: 'Soy una tetera ☕' }
  }
});

const users = await http.get<{ id: string; name: string }[]>('/users');

const logger = createLogger({ namespace: 'users-service', level: 'info' });
logger.info('Usuarios sincronizados', { count: users.length });

logger.debug('Siguiente sincronización', {
  etaDays: DateUtils.diffInDays(new Date(), DateUtils.add(new Date(), { days: 7 }))
});

const slug = StringUtils.slugify('Nuevos Usuarios – Octubre 2024');
```

### HttpClient destacado

- `baseUrl` (requerido): prefijo para endpoints relativos.
- `defaultHeaders`: cabeceras compartidas (se combinan con las específicas).
- `locale` + `errorMessages`: mensajes localizados para errores HTTP.
- `fetchImpl`: inyecta tu implementación (útil en tests).

Cada `request` (o los atajos `get`, `post`, `put`, `patch`, `delete`) acepta:

- `searchParams`: objeto que se serializa como `URLSearchParams`.
- `body`: strings, objetos serializables o `FormData`.
- `errorLocale`: idioma puntual para la respuesta.
- Cualquier `RequestInit` nativo (`headers`, `signal`, etc.).

```ts
import { HttpError } from 'nubi-lab-utils';

try {
  await http.get('/usuarios');
} catch (error) {
  if (error instanceof HttpError) {
    console.error('Servidor respondió con error', error.status, error.body);
  }
}
```

### Logging, profiling y helpers

```ts
import {
  createLogger,
  withTiming,
  createStopwatch,
  StorageUtils,
  EnvManager
} from 'nubi-lab-utils';

const logger = createLogger({ namespace: 'payments', level: 'debug' });

await withTiming('liquidaciones', async () => {
  const stopwatch = createStopwatch({ label: 'descarga-batch', logger });
  const batch = await descargarPagos();
  stopwatch.log({ registros: batch.length });
});

StorageUtils.safeSetItem('token', 'abc123');
const apiKey = EnvManager.get('API_KEY', { required: true });
```

- `DateUtils`: parseo seguro, sumas/restas, diferencias configurables e `isSameDay`.
- `StringUtils`: slugify, capitalize, máscaras, interpolación, query strings.
- `Validator`: helpers básicos para validación sincronía.
- `StorageUtils`: adaptadores seguros para `localStorage`/`sessionStorage`.

## Scripts y flujo de desarrollo

- `npm run lint`: ejecuta TypeScript en modo análisis (`--noEmit`).
- `npm run build`: compila a `dist/` y genera tipos.
- `npm run clean`: elimina `dist/`.
- `npm run prepare`: compila automáticamente tras instalar dependencias.
- `npm run prepublishOnly`: lint + clean + build antes de publicar.

## Publicación en npm

1. Asegurate de tener acceso al registro deseado e inicia sesión (`npm login`).
2. Ajustá la versión según SemVer:
   ```bash
   npm version patch # o minor / major
   ```
3. Empujá los cambios/tag al repositorio (`git push --follow-tags`).
4. Ejecutá el pipeline previo (opcional pero recomendado):
   ```bash
   npm run lint && npm run build
   ```
5. Publicá:
   ```bash
   npm publish --access public
   ```

El script `prepublishOnly` se ejecutará automáticamente para asegurar que el paquete se construya con los últimos cambios.

## Compatibilidad

- Node.js >= 18 (ESM nativo con `fetch`, `AbortController`, `URL`).
- Navegadores modernos (incluye polyfill opcional de `cross-fetch`).

## Licencia

MIT © Nubi Lab
