# TASK-003 — Validación

## Automatizada

- Build Angular de producción en Node 24 dentro de Docker: correcto.
- Build Docker del frontend de producción: correcto.
- Suite backend dentro del contenedor API: 12 pruebas aprobadas, 0 fallidas.
- `npm audit --omit=dev`: 0 vulnerabilidades conocidas.
- `git diff --check`: correcto.
- API `/api/health`: `Healthy`.
- Cuatro servicios del stack de desarrollo: saludables.

Angular mantiene advertencias ya conocidas por módulos CommonJS transitivos de Mermaid; no impiden el build y Mermaid continúa en chunks diferidos.

## Assets

- Geist, Geist Mono y Font Awesome se sirven localmente con HTTP 200.
- No se agregaron CDN, scripts externos ni la versión Mermaid del template.
- El contexto Docker del frontend quedó en aproximadamente 1,38 MB para los archivos relevantes, sin copiar los SVGs de Font Awesome.

## Visual y responsive

- Comparación directa del login implementado contra `interproc-template/login.html`: alineada en layout, tipografía, colores, tarjeta y controles.
- Capturas verificadas en 1440×900 y viewport móvil real de 390×844.
- Sesión visual aislada con respuestas interceptadas, sin modificar la base: Dashboard, Procedimientos, Clientes y Cuentas renderizaron el shell autenticado y la navegación de administrador.
- Dashboard móvil: sidebar oculto, botón de menú visible, tarjetas en una columna y sin desbordamiento horizontal.
- Guard anónimo: una visita a `/procedures` sin sesión redirige al login.
- Consola de Chrome sin errores JavaScript durante el smoke anónimo.

## Limitación

No se ejecutó un recorrido UI autenticado contra las cuentas reales porque no hay credenciales de aplicación disponibles en las variables locales. Las operaciones de negocio permanecen cubiertas por las 12 pruebas backend y no fueron modificadas por esta tarea visual.
