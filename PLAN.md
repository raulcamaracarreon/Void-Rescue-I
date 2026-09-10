# PLAN.md — Milestone 1

Estado inicial: **por comenzar**.

Estado actual (2026-09-09): **fases 0–2 implementadas y verificadas**. Primer incremento autorizado tras la revisión: vuelo, cámara, mundo circular y radar. El Milestone 1 completo sigue pendiente; no se anticipan sistemas de combate/rescate que todavía no existen.

Codex debe actualizar casillas, notas y resultados sin borrar el historial de decisiones.

## Fase 0 — Comprensión y decisiones

- [x] Leer todos los documentos del paquete.
- [x] Inspeccionar completamente `references/void_rescue.p8`.
- [x] Confirmar versiones compatibles de Node, Vite, Three.js, Vitest y Playwright.
- [x] Registrar decisiones menores y riesgos.
- [x] Confirmar que no es necesaria una pregunta bloqueante.

Salida: arquitectura final breve y lista de comandos previstos.

### Registro de decisiones — 2026-09-09

- El proyecto ejecutable vivirá junto a estos documentos en `void-rescue-codex-package/`; el ZIP y las referencias se conservan intactos.
- Mantener simulación serializable sin Three.js, paso fijo de 60 Hz, entrada por acciones y render 2.5D independiente. Coordenadas Y positivas hacia arriba en la nueva simulación.
- Primer incremento: escenario de vuelo libre claramente identificado como prueba de vuelo. No simular victorias, enemigos ni rescates que aún no están implementados.
- El renderizador único será `WebGPURenderer`, inicializado de forma asíncrona. `?backend=webgl2` permitirá verificar su respaldo. Geometría procedural y materiales de nodos originales, sin recursos externos.
- La cámara usará una posición horizontal continua para evitar saltos al envolver X. Radar con representación de la ventana visible a ambos lados de la costura.
- Añadir escenarios reales del incremento (`flight-basic`, `world-seam`). Los seis escenarios del hito se incorporarán con sus sistemas, sin sustitutos vacíos.
- Comandos previstos: `npm install`, `npm run typecheck`, `npm run test`, `npm run build`, `npx playwright install chromium`, `npm run test:e2e`, `npm run dev`.
- Riesgos a comprobar: compatibilidad real de materiales en ambos backends, cámara en la costura y disponibilidad de GPU en Chromium. Gamepad requiere además verificación física posterior si no hay mando disponible.
- Versiones verificadas: Node 24.16.0, npm 11.13.0, Vite 8.2.2, TypeScript 7.0.2, Three.js 0.185.1 y tipos 0.185.4, Vitest 5.0.0, Playwright 1.63.0. Se fija Three.js en r185 para coincidir con los tipos disponibles, aunque npm ofrece r186.
- La primera revisión visual detectó caras del terreno invertidas y ocultamiento de la nave por el radar a máxima altura. Se corrige el orden de los triángulos y se reserva la banda jugable Y=26–82 para mantener libres los instrumentos.
- Playwright usará `channel: 'chromium'` (headless moderno): el shell inicial eligió WebGL2 por software (~4.6 FPS a 1080p). El Chromium completo detecta la RTX 3060 y habilita WebGPU/WebGL. Se medirán ambos backends sin flags que fuercen capacidades incompatibles.
- Compatibilidad observada: Chromium 153 de Playwright 1.63 produce errores Tint en materiales PBR al usar WebGPU; WebGL2 funciona. Chrome estable 152 ejecuta WebGPU sin errores (~59.5 FPS a 720p). Se fija Playwright 1.62.0 / Chromium 151 para disponer de una ruta automatizada reproducible; queda registrada la incidencia de Chromium 153. El juego mostrará un enlace para reiniciar con WebGL2 si un backend falla durante la ejecución.

## Fase 1 — Base ejecutable

- [x] Crear proyecto Vite TypeScript.
- [x] Configurar scripts de desarrollo, build, tipos y pruebas.
- [x] Inicializar `WebGPURenderer` con respaldo WebGL2.
- [x] Crear bucle de paso fijo, semilla y utilidades de mundo circular.
- [x] Crear pantalla inicial mínima y panel de diagnóstico.
- [x] Añadir pruebas unitarias de núcleo.

Punto de control: aplicación abre, renderiza y las pruebas de núcleo pasan.

## Fase 2 — Nave, cámara y mundo

- [x] Implementar entrada centralizada de teclado y gamepad.
- [x] Implementar movimiento, orientación, límites verticales y wrap.
- [x] Construir modelo original de nave y propulsores.
- [x] Implementar cámara con anticipación.
- [x] Crear fondo, terreno y radar funcional.
- [x] Verificar costura circular mediante prueba determinista.

Punto de control: volar alrededor del mundo se siente estable y legible.

Resultado del incremento: 14 pruebas unitarias y 12 pruebas E2E aprobadas; TypeScript estricto y build aprobados. Chromium 151 comprobó WebGPU y WebGL2 en RTX 3060 (~60 FPS a 1920×1080). Capturas revisadas a 1080p, 720p y en la costura; también se corrigieron las normales de los extremos del terreno para evitar una unión de iluminación. Entrada de gamepad verificada por emulación e integración, pendiente prueba con mando físico. Referencias cotejadas con el ZIP por SHA-256, sin cambios.

Se adelantaron únicamente apoyos de vuelo: proyectiles de prueba sin colisiones, motor/disparo con Web Audio, pausa y preferencias locales. Esto no completa los sistemas de combate ni la presentación final de las fases 4–5.

## Fase 3 — Colonos y abducción

- [ ] Implementar estados de colonos.
- [ ] Implementar Harvester y reserva de objetivo.
- [ ] Implementar captura y elevación.
- [ ] Implementar caída, aterrizaje, muerte, intercepción y transporte.
- [ ] Implementar transformación en Wraith.
- [ ] Añadir escenarios y pruebas correspondientes.

Punto de control: el ciclo captura–liberación–rescate funciona de extremo a extremo.

## Fase 4 — Combate y oleada

- [ ] Implementar cañón lineal y colisiones.
- [ ] Implementar Interceptor.
- [ ] Implementar Flux Node y drones mínimos.
- [ ] Implementar bomba inteligente.
- [ ] Implementar aparición escalonada.
- [ ] Implementar puntuación, vidas, reaparición, victoria y derrota.
- [ ] Implementar portal y resumen de oleada.

Punto de control: una oleada completa puede jugarse y terminarse.

## Fase 5 — Presentación

- [ ] Aplicar materiales e iluminación de ciencia ficción realista.
- [ ] Añadir TSL a portal, propulsores, impactos y bomba.
- [ ] Añadir partículas y sacudida controlada.
- [ ] Crear HUD e instrumentación final del vertical.
- [ ] Crear audio procedural.
- [ ] Añadir reducción de destellos y movimiento.

Punto de control: presentación coherente sin perder claridad jugable.

## Fase 6 — Validación

- [ ] Completar escenarios de diagnóstico.
- [ ] Ejecutar Vitest.
- [ ] Ejecutar Playwright.
- [ ] Revisar capturas visuales.
- [ ] Medir rendimiento y registrar backend.
- [ ] Corregir errores de consola y defectos críticos.
- [ ] Completar `README.md`.
- [ ] Revisar todos los criterios de aceptación.

Salida final: vertical jugable, pruebas, capturas e informe honesto de limitaciones.

## Trabajo futuro no autorizado todavía

- Más familias de enemigos del `.p8`.
- Oleadas especiales y destrucción completa del planeta.
- Progresión, campaña, jefes y guardado.
- Recursos glTF elaborados en Blender.
- Música adaptativa.
- Publicación y despliegue.
