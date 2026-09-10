# AGENTS.md — reglas de trabajo de VOID RESCUE

## Prioridad de instrucciones

Estas reglas se aplican a todo el repositorio. Lee también `GAME_DESIGN.md`, `ACCEPTANCE_CRITERIA.md`, `PLAN.md` y los documentos de `docs/` antes de implementar.

Si aparece una contradicción, conserva este orden:

1. Solicitud explícita más reciente del usuario.
2. `AGENTS.md`.
3. `ACCEPTANCE_CRITERIA.md`.
4. `GAME_DESIGN.md`.
5. `PLAN.md`.

No resuelvas decisiones importantes mediante suposiciones silenciosas. Documenta la decisión o pregunta al usuario cuando cambie alcance, identidad, controles o arquitectura.

## Alcance autorizado

Construye únicamente el vertical jugable definido como **Milestone 1**. No agregues metaprogresión, inventario, campaña, multijugador, backend, cuentas, monetización, editor de niveles ni servicios externos.

No lances subagentes, equipos paralelos ni ejecuciones masivas sin autorización explícita del usuario. Mantén el consumo controlado.

## Identidad y propiedad intelectual

- El nombre de trabajo y nombre visible es **VOID RESCUE**.
- Trátalo como sucesor espiritual, no como remake oficial.
- No uses `Stargate`, `Defender`, nombres de personajes, logotipos, sprites, sonidos, música, tipografías distintivas ni diseños identificables de terceros en el producto.
- `references/void_rescue.p8` se usa para comprender mecánicas y estados.
- Crea geometría, materiales, interfaz, sonidos y denominaciones originales.
- No descargues recursos con licencias ambiguas. Para el Milestone 1, prefiere geometría procedural y audio sintetizado propio.

## Tecnologías requeridas

- TypeScript estricto.
- Vite.
- Three.js.
- `WebGPURenderer`, con su backend WebGL2 de respaldo.
- Three.js Shading Language (TSL) para efectos compatibles con la arquitectura de nodos.
- Vitest para lógica de simulación.
- Playwright para pruebas end-to-end, capturas y recorridos jugables automatizados.
- Web Audio API para efectos de sonido originales y reproducibles.

No incorpores React, un motor de físicas, ECS externo, backend o Web Workers en el primer hito salvo necesidad demostrada y documentada.

## Principios de arquitectura

- Separa simulación y renderizado.
- La simulación vive en coordenadas 2D del mundo; la profundidad Z es principalmente visual.
- Usa paso fijo de simulación, objetivo de 60 actualizaciones por segundo.
- El resultado debe ser determinista con una semilla configurable.
- El mundo horizontal es circular; usa funciones comunes para distancia, interpolación y envoltura.
- No acoples reglas de juego directamente a mallas de Three.js.
- Usa pools para proyectiles y partículas si la medición muestra presión de asignación.
- Mantén módulos pequeños con interfaces explícitas y evita un único archivo monolítico.
- Fija versiones compatibles en el lockfile; no dependas de importaciones CDN.

## Arquitectura visual

- El juego es 2.5D: modelos y luces 3D con jugabilidad restringida a un plano.
- Usa cámara ortográfica y composición 16:9.
- La legibilidad jugable tiene prioridad sobre el realismo fotográfico.
- La nave, los disparos, los colonos y las amenazas deben reconocerse instantáneamente.
- Limita bloom, sacudida de cámara y aberraciones para no ocultar información.
- Incluye una opción para reducir destellos y sacudida.

## Accesibilidad y entrada

- Teclado y gamepad desde el primer hito.
- Permite reasignación posterior; centraliza las acciones en un `InputManager`.
- Incluye pausa, reinicio y silencio.
- No dependas exclusivamente del color para comunicar estados críticos.

## Método de trabajo

1. Inspecciona todos los documentos y el `.p8`.
2. Verifica versiones actuales y compatibilidad antes de instalar.
3. Actualiza `PLAN.md` sin borrar decisiones previas.
4. Implementa en incrementos pequeños y ejecutables.
5. Después de cada sistema importante, ejecuta las pruebas relacionadas.
6. Expón escenas deterministas de prueba y estado de diagnóstico.
7. Abre el juego con Playwright, toma capturas y revisa problemas visuales reales.
8. No marques el hito como terminado si sólo compila.

## Interfaz de diagnóstico obligatoria

Expón en desarrollo una interfaz de sólo diagnóstico en `window.__VOID_RESCUE__` con, como mínimo:

- `getState()`;
- `loadScenario(name, seed?)`;
- `setPaused(value)`;
- `step(frames)` cuando sea técnicamente razonable;
- `getMetrics()`;
- `restart()`.

Debe permitir a Playwright comprobar estados sin reemplazar las pruebas realizadas mediante controles reales.

Escenarios mínimos:

- `combat-basic`;
- `abduction-start`;
- `falling-colonist`;
- `portal-ready`;
- `wave-near-complete`;
- `player-near-death`.

## Verificación obligatoria

Antes de finalizar:

- `npm run build` debe concluir sin errores.
- El chequeo de tipos debe concluir sin errores.
- Las pruebas unitarias deben pasar.
- Las pruebas Playwright deben pasar en Chromium.
- Debe existir al menos una captura revisable del vertical jugable.
- Debe probarse la ruta WebGL2 de respaldo cuando el entorno lo permita.
- Registra comandos, resultados y limitaciones honestamente en `README.md`.

Si una verificación no puede ejecutarse por limitaciones del entorno, no inventes el resultado: explica exactamente qué quedó sin comprobar.

## Disciplina de cambios

- Conserva los archivos de referencia sin modificaciones.
- No borres trabajo del usuario.
- No reescribas todo el proyecto para resolver un defecto localizado.
- Crea un punto de control de Git al terminar una fase estable, si el repositorio permite commits.
- Mantén `PLAN.md` y `README.md` sincronizados con el estado real.

