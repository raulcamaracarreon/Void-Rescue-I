# VOID RESCUE

Primera base ejecutable del arcade de defensa y rescate espacial. **Este incremento es una prueba de vuelo; el Milestone 1 completo todavía está en desarrollo.**

Incluye nave 3D original, vuelo con aceleración e inercia, cámara ortográfica con anticipación, mundo circular de 2400 unidades, terreno y planeta procedurales, tres estaciones de referencia, radar panorámico, disparos de prueba, audio de motor/disparo, menús y preferencias locales.

## Ejecutar

Requiere Node.js 22.12 o posterior compatible con Vitest (se verificó con Node 24.16.0 y npm 11.13.0).

En PowerShell:

```powershell
cd E:\Proyectos\JUEGOS\VoidRescue\void-rescue-codex-package
npm install
npm run dev
```

Abrir [VOID RESCUE local](http://127.0.0.1:5173) y pulsar **INICIAR VUELO**. El puerto 5173 es fijo; si ya hay un servidor del proyecto activo, reutilizar su dirección. `Ctrl+C` detiene el servidor.

Para compilar y comprobar la versión de producción:

```powershell
npm run build
npm run preview -- --port 4173
```

Abrir [vista previa de producción](http://127.0.0.1:4173). No se ha desplegado el juego a un servicio externo.

## Controles disponibles

| Acción | Teclado | Gamepad con mapeo estándar |
| --- | --- | --- |
| Pilotar | WASD o flechas | Stick izquierdo o cruceta |
| Disparo de prueba | Espacio, mantener para repetir | Botón sur |
| Pausa / continuar | Esc | Start |
| Iniciar desde título | Botón de inicio; Tab y Enter | Start |
| Silenciar | M | Opción del menú de pausa con teclado/ratón |
| Reiniciar vuelo | R o menú de pausa | Opción del menú con teclado/ratón |
| Diagnóstico | F3 | — |

Los menús admiten ratón y navegación nativa con Tab/Enter. Start permite pausar y reanudar con mando; la navegación completa de sus ajustes mediante cruceta queda pendiente. Las acciones están centralizadas en `src/input/bindings.ts`.

Al perder el foco o cambiar de pestaña, el vuelo se pausa. El menú permite ajustar volumen, silenciar y reducir movimiento/destellos. Las preferencias persisten localmente. El audio sólo se inicializa tras iniciar el vuelo mediante interacción; no hay música ni sonidos externos.

## Arquitectura

- `src/core/`: paso fijo de 60 Hz, semilla y operaciones de mundo circular.
- `src/game/`: estado serializable, movimiento, proyectiles de prueba, configuración y altura del terreno.
- `src/input/`: acciones de teclado y gamepad con zona muerta y limpieza al perder foco.
- `src/render/`: cámara continua, nave, mundo 3D y materiales TSL. Sin reglas de juego dentro de las mallas.
- `src/audio/`: Web Audio con compresor maestro y control de volumen.
- `src/ui/`: título, pausa, instrumentos y radar.
- `src/app/`: coordinación del bucle y API de diagnóstico.

Geometría y materiales originales; ningún sprite, sonido ni gráfico de las referencias se carga en la aplicación. No hay React, motor físico, ECS externo, workers, backend, telemetría, claves ni importaciones CDN.

Y crece hacia arriba; el vuelo de este incremento queda entre 26 y 82 para reservar espacio a los instrumentos. La nave gira su orientación de disparo inmediatamente y conserva la velocidad hasta frenar. El mundo y el terreno son periódicos; las normales de sus extremos también coinciden. Las colisiones con terreno pertenecen a un incremento posterior.

## Backends y dependencias

Se usa un único `WebGPURenderer`, con selección automática WebGPU/WebGL2 e inicialización asíncrona, conforme a la [documentación de Three.js](https://threejs.org/docs/pages/WebGPURenderer.html).

- [Forzar WebGL2 en desarrollo](http://127.0.0.1:5173/?backend=webgl2).
- [Usar otra semilla](http://127.0.0.1:5173/?seed=19).
- El backend activo aparece abajo a la derecha y en F3.
- Un error gráfico durante la ejecución detiene el bucle y ofrece reiniciar con WebGL2.

Versiones fijadas en `package.json` y `package-lock.json`: Vite 8.2.2, TypeScript 7.0.2, Three.js 0.185.1, `@types/three` 0.185.4, Vitest 5.0.0 y Playwright 1.62.0. Se mantuvo Three.js r185 para coincidir con los tipos disponibles. Node instalado cumple los [requisitos de Vite](https://vite.dev/guide/).

**Incidencia de compatibilidad observada:** Playwright 1.63 / Chromium 153.0.8010.12 produjo errores internos Tint (`swizzle view instruction still has usages after lowering`) al compilar materiales PBR con WebGPU en este equipo. No se ocultaron esos errores: se fijó Playwright 1.62 / Chromium 151.0.7922.34, que pasó los mismos recorridos. Chrome estable 152.0.7977.83 también pasó una comprobación WebGPU a 720p. WebGL2 funcionó además en Chromium 153.

Las pruebas usan `channel: 'chromium'` para el [modo headless moderno](https://playwright.dev/docs/browsers). El shell headless inicial eligió WebGL2 por software (~4.6 FPS a 1080p); esa medición no representa la ruta acelerada por la RTX 3060.

## Pruebas

```powershell
npx playwright install chromium
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Playwright inicia el servidor local cuando no está activo. Usa un solo worker. `npm run test:e2e:headed` permite ver sus recorridos.

Para la comprobación adicional del build, dejar `npm run preview -- --port 4173` activo y ejecutar en otra terminal:

```powershell
npm run test:production
```

Resultados del 2026-09-09:

| Comprobación | Resultado |
| --- | --- |
| `npm install --no-fund` | Correcto; auditoría npm sin vulnerabilidades reportadas |
| TypeScript estricto | Correcto |
| Vitest | 14 pruebas aprobadas |
| Build de producción | Correcto; aviso de tamaño del bundle (~908 kB JS / ~253 kB gzip, incluye Three.js) |
| Playwright Chromium 151 | 12 pruebas aprobadas: 6 con selección automática WebGPU y 6 forzando WebGL2 |
| `npm run test:production` | Correcto con WebGPU y WebGL2; inicio, movimiento y pausa por interfaz, API de diagnóstico ausente |
| Consola durante recorridos E2E | Sin errores de consola, excepciones de página ni promesas rechazadas observadas |
| Referencias | SHA-256 idéntico al contenido del ZIP original |

Las pruebas cubren paso fijo a 30/60/144 FPS de presentación, reproducibilidad, límites y frenado, disparo en ambas direcciones, limpieza de proyectiles, costura en cámara/radar, pausa, preferencias, reinicio, pérdida de foco, diagnóstico, adaptación de ventana y gamepad emulado. Los recorridos de vuelo usan eventos reales de teclado. La emulación del mando prueba la integración, pero no sustituye una prueba con dispositivo físico.

## Capturas y rendimiento

Capturas revisadas en `docs/screenshots/`:

- `chromium-auto-title.png`: pantalla inicial con WebGPU.
- `chromium-auto-flight.png`: vuelo tras movimiento y disparo real.
- `chromium-auto-seam.png`: cruce del mundo y ventana del radar dividida.
- `chromium-auto-720p.png`: lectura de instrumentos a 1280×720.
- Sus equivalentes `chromium-webgl2-*`: ruta de respaldo.

Métricas guardadas en `chromium-auto-metrics.json`, `chromium-webgl2-metrics.json` y datos de equipo en `environment.json`. Equipo observado: NVIDIA GeForce RTX 3060, controlador 32.0.16.1088, Windows, Chromium 151 en headless moderno.

| Escena medida | Resolución / DPR | FPS medios | Tiempo de cuadro | Draw calls | Triángulos |
| --- | --- | --- | --- | --- | --- |
| Vuelo, WebGPU | 1920×1080 / 1 | 60.01 | 16.66 ms | 28 | 17 911 |
| Vuelo, WebGL2 | 1920×1080 / 1 | 60.01 | 16.66 ms | 28 | 17 911 |

Se mide una ventana móvil de hasta 180 cuadros de render, después de al menos 240 pasos de simulación. Son resultados del escenario de vuelo, sin enemigos ni combate intenso; no prueban el rendimiento del Milestone 1 completo. Los contadores gráficos se reinician por cuadro. La resolución 1280×720 y el encuadre 16:9 dentro de una ventana cuadrada también se comprobaron.

## Diagnóstico de desarrollo

`window.__VOID_RESCUE__` existe sólo con `npm run dev`. No está expuesto en el build de producción.

```javascript
const vr = window.__VOID_RESCUE__;
vr.getState();
vr.getMetrics();
vr.loadScenario('world-seam', 8042);
vr.setPaused(true);
vr.step(60); // Entrada neutral; sólo estando en pausa, máximo 3600 cuadros.
vr.restart();
```

Escenarios implementados: `flight-basic` y `world-seam`. Los nombres del hito de combate aún no están implementados y devuelven un error explícito; no existen escenarios vacíos que simulen haberlos completado. Las instantáneas no permiten modificar el estado interno.

## Pendiente para Milestone 1

El siguiente incremento es el ciclo completo de colonos: reserva de objetivo, abducción, liberación, caída, intercepción y entrega segura. Después: Harvester/Wraith/Interceptor/Flux Node, colisiones y daños, bomba, portal, vidas, puntuación, oleada y resumen. También faltan sus seis escenarios de diagnóstico, efectos/audio completos y validación de combate.

La presentación actual es una base procedural para probar el vuelo, no la dirección artística final del vertical. El ajuste del control necesita evaluación humana; faltan prueba con gamepad físico, navegación completa de ajustes con mando y escucha humana del audio para valorar mezcla/clipping. Los disparos actuales no causan daño y las estaciones son referencias de navegación.

Consultar `PLAN.md` y `ACCEPTANCE_CRITERIA.md` para distinguir la base comprobada de los criterios todavía pendientes. No se ha declarado terminado el Milestone 1.
