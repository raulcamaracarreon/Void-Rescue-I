# PLAN.md — Milestone 1

Estado inicial: **por comenzar**.

Estado actual (2026-09-09): **fases 0–4 implementadas y comprobadas; validación técnica de fase 6 completada**. La fase 5 tiene presentación funcional, pendiente acabado artístico realista y evaluación humana de audio/control. El ciclo de combate y rescate solicitado ya es jugable de extremo a extremo.

Codex debe actualizar casillas, notas y resultados sin borrar el historial de decisiones.

## Incremento autorizado — combate, rescate y joypad (2026-09-09)

Implementado y verificado: colonos, enemigos, rescate, oleada, efectos, audio y usabilidad de joypad. Se conserva la base de vuelo y sus escenarios para regresión.

- Ocho colonos, cinco Harvesters, tres Interceptors y un Flux Node; aparición escalonada. Wraith emerge al completar abducción; drones de apoyo limitados.
- Rescate por contacto con colono en caída; entrega automática al descender cerca del terreno con velocidad reducida. El límite inferior de vuelo pasa a seguir el terreno para permitir la entrega.
- Tres naves totales, dos bombas; invulnerabilidad de reaparición. Colisiones y proyectiles usan distancia circular y barrido para no atravesar objetivos a alta velocidad.
- Portal listo tras una entrega segura. E / botón norte cerca del portal activa una bonificación de salto y transporta al lado opuesto del mundo con protección temporal. Sólo cierra la oleada si no quedan amenazas, apariciones ni colonos capturados, cayendo o transportados. La victoria ordinaria se muestra al resolver todo; el portal nunca omite amenazas pendientes.
- Joypad estándar: sur disparar/confirmar, oeste bomba, norte portal, este volver, Start pausa; stick/cruceta navegan menús con repetición controlada, izquierda/derecha ajustan volumen. Pausa automática si se desconecta el mando activo. Indicar botones por posición y equivalentes Xbox/PlayStation sin depender del fabricante.
- Mantener dependencias verificadas del incremento anterior, sin nuevas instalaciones. Añadir estados y sistemas separados, modelos originales, audio/efectos de combate y pruebas unitarias/E2E de los seis escenarios obligatorios y del recorrido completo con controles.

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

- [x] Implementar estados de colonos.
- [x] Implementar Harvester y reserva de objetivo.
- [x] Implementar captura y elevación.
- [x] Implementar caída, aterrizaje, muerte, intercepción y transporte.
- [x] Implementar transformación en Wraith.
- [x] Añadir escenarios y pruebas correspondientes.

Punto de control: el ciclo captura–liberación–rescate funciona de extremo a extremo.

## Fase 4 — Combate y oleada

- [x] Implementar cañón lineal y colisiones.
- [x] Implementar Interceptor.
- [x] Implementar Flux Node y drones mínimos.
- [x] Implementar bomba inteligente.
- [x] Implementar aparición escalonada.
- [x] Implementar puntuación, vidas, reaparición, victoria y derrota.
- [x] Implementar portal y resumen de oleada.

Punto de control: una oleada completa puede jugarse y terminarse.

## Fase 5 — Presentación

- [ ] Aplicar materiales e iluminación de ciencia ficción realista (PBR y luces presentes; acabado procedural aún por pulir).
- [x] Añadir TSL a portal, propulsores, impactos y bomba.
- [x] Añadir partículas y sacudida controlada.
- [x] Crear HUD e instrumentación funcional del vertical (sujeto a pulido visual).
- [x] Crear audio procedural.
- [x] Añadir reducción de destellos y movimiento.

Punto de control: presentación coherente sin perder claridad jugable.

## Fase 6 — Validación

- [x] Completar escenarios de diagnóstico.
- [x] Ejecutar Vitest.
- [x] Ejecutar Playwright.
- [x] Revisar capturas visuales.
- [x] Medir rendimiento y registrar backend.
- [x] Corregir errores de consola y defectos críticos.
- [x] Completar `README.md`.
- [x] Revisar todos los criterios de aceptación.

Salida final: vertical jugable, pruebas, capturas e informe honesto de limitaciones.

## Resultado del incremento de combate — 2026-09-09

- 31 pruebas unitarias y 24 E2E aprobadas; Chromium 151 con WebGPU y WebGL2. TypeScript, build y comprobación de producción aprobados. Se repitieron seis recorridos visuales tras alinear el haz de captura y separar el rótulo de entrega de la nave.
- Oleada principal completada mediante teclado real generado por Playwright: nueve apariciones eliminadas, ocho supervivientes, resumen alrededor de 50 s. Recorrido separado con teclado comprueba abducción, bomba, caída, recogida, entrega y victoria.
- Joypad emulado controla juego y menús, volumen, silencio, reducción de efectos, bomba, portal, resultados y desconexión. No hay prueba con mando físico ni escucha humana del audio.
- Capturas revisadas: combate principal, cuatro familias y drones, portal, abducción, transporte, entrega, victoria principal y 720p. Se diferenciaron alertas de captura/caída/aterrizaje y símbolos críticos del radar; ondas e impactos usan bordes suaves TSL.
- Medición a 1080p: ~60 FPS en ambos backends; combate de diagnóstico con tres enemigos, siete colonos, cinco proyectiles y dieciocho partículas: 86 draw calls / 22 267 triángulos. No es una prueba de carga máxima.
- Decisiones de balance: todos los Harvesters que completan captura pueden mutar (sin tope artificial de dos); entregados quedan protegidos; el terreno limita la altura sin causar daño. Portal concede +1000 una vez y no omite amenazas. Documentado en README.
- Pendiente de cierre artístico/humano: modelos realistas finales, balance percibido, mando físico y clipping audible. Esto no impide jugar el incremento, pero no se declara cerrado el acabado completo del Milestone 1.

## Trabajo futuro no autorizado todavía

- Más familias de enemigos del `.p8`.
- Oleadas especiales y destrucción completa del planeta.
- Campaña, jefes, metaprogresión y guardado para reanudar la partida (las oleadas infinitas y los récords locales se autorizaron en el incremento posterior).
- Recursos glTF elaborados en Blender.
- Música adaptativa.
- Publicación y despliegue.

## Incremento autorizado — mando USB, dificultad y efectos (2026-09-09)

- Corregir el filtro que descartaba mapping vacío. Windows detecta mando HID VID_0079/PID_0006. Aceptar entrada original, mostrar ejes/botones en vivo, elegir dispositivo y calibrar direcciones/acciones; guardar perfil por identificador localmente. Gestionar bloqueo de Gamepad API sin romper la partida.
- Dificultad visible en título y pausa: Relajado 0.8×, Normal 1×, Difícil 1.25×, Experto 1.5×. Escalar ritmo global manteniendo pasos fijos de 1/60; afecta nave, enemigos, proyectiles, caídas y apariciones. Aplicación inmediata al reanudar, sin reiniciar partida. HUD muestra nivel.
- Sonidos de combate por capas de ruido filtrado, golpe grave y cola, con mezcla limitada; explosiones con núcleo suave, chispas, fragmentos y ondas TSL en pools, respetando reducción de efectos.
- Verificar mando no estándar y calibración/persistencia, dificultad, recorridos anteriores, picos de audio medidos y capturas de explosiones en ambos backends. La interacción física requiere señales del mando; no confundir emulación con prueba física.

Resultado de este incremento:

- Mando USB físico 0079:0006 observado en Windows y en el navegador integrado: 12 botones, 10 ejes, mapping vacío. El usuario confirmó que el panel responde al mover/pulsar controles. Calibración y partida con distribución asignada comprobadas además mediante emulación; no afirmar una oleada completa física.
- 42 pruebas unitarias aprobadas y suite completa de 32 E2E aprobada en Chromium 151, ambos backends. Se vuelven a comprobar los doce recorridos de mando/dificultad/efectos tras la corrección final de toques breves y ayudas con numeración real.
- Ritmo 0.8× / 1× / 1.25× / 1.5× verificado con reloj fijo y tiempo real del navegador. Persistencia y ajustes con mando comprobados.
- Sonidos por capas y mezcla offline estéreo a 48 kHz verificada: pico ~0.623, RMS ~0.081 para explosiones superpuestas; pendiente escucha humana.
- Capturas revisadas de título, calibración USB, explosiones múltiples y destrucción propia. Escena estable de combate: ~60 FPS, 92 draw calls / 22 495 triángulos, 104 partículas. La captura inicial de bomba tiene >500 partículas y 110 draw calls; su FPS incluye arranque de materiales.
- Sin nuevas dependencias ni cambios en referencias. Build con aviso de tamaño (~958 kB JS / ~269 kB gzip).

## Incremento autorizado — oleadas infinitas y récords (2026-09-09)

Solicitud explícita del usuario: continuar con oleadas de dificultad creciente y registrar récords. Amplía el vertical original; no introduce campaña ni cuentas.

- Mantener la oleada 1; generar las siguientes por semilla + número. Más enemigos (9 + 2 por nivel, máximo 33), mayor velocidad enemiga/proyectiles y menor intervalo de aparición/ataque. La presión crece asintóticamente hasta 1.8×; se combina con el ritmo global elegido, sin acelerar la nave respecto al mundo por nivel.
- Sin oleada final. Resumen intermedio y botón Siguiente oleada, accesible con teclado y mando (confirmar o Start). Conservar puntos, naves y reloj total; reiniciar reloj de oleada, colonos, portal y amenazas. +1 bomba (máximo 3) entre oleadas; +1 nave cada tres completadas (máximo 3).
- Top 10 local: iniciales de tres letras/dígitos elegibles con teclado o joypad, puntos, oleada alcanzada, dificultad mínima usada y fecha. Actualizar la misma entrada por partida al completar, perder, salir/reiniciar o cerrar página; no guardar posiciones para reanudar. Excluir escenarios/avance manual de diagnóstico. Si el almacenamiento falla, mantener tabla en memoria e informar.
- Verificar transición repetida, temporizadores/bonos independientes por oleada, presión acotada, persistencia/validación, teclado y joypad, ambos backends, producción y capturas.

Resultado del incremento infinito:

- 51 pruebas unitarias, suite de 36 E2E en WebGPU/WebGL2 y build/typecheck aprobados. Se repitieron los seis recorridos relevantes tras añadir combinación de récords entre pestañas y puesto en el resumen; todos aprobados.
- Tres oleadas consecutivas completadas por el piloto de simulación con acciones normales. Cien transiciones y presión/horarios hasta oleada 1 000 000 comprobados por pruebas de estado; no se afirma jugar todas esas oleadas.
- Oleada 1 completada con teclado en navegador (~50–51 s), continuación a 2, recursos intactos, nuevas apariciones, guardado y recuperación del récord tras recargar. Iniciales, tabla, continuación y derrota operadas con mando emulado.
- Producción comprobada en ambos backends: inicio, movimiento, pausa, apertura/cierre de tabla con Escape conservando pausa, iniciales persistentes y ausencia del diagnóstico. Sin errores observados.
- Capturas de título 720p, tabla local, informe y oleada 2 revisadas. Sin referencias ni dependencias modificadas. Build ~966 kB JS / ~272 kB gzip; permanece el aviso de tamaño.
- Pendiente balance humano de partidas largas; no se afirma una sesión infinita con mando físico ni rendimiento constante a cualquier carga.
