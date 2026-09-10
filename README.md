# VOID RESCUE

Arcade 2.5D de defensa y rescate espacial. Incluye una oleada completa con teclado y joypad: ocho colonos, abductores, mutación, caída, rescate, entrega, combate, bomba, portal, vidas y resumen. El acabado artístico y la evaluación humana del control/audio siguen pendientes.

## Ejecutar

Node.js 22.12 o posterior compatible con Vitest; verificado con Node 24.16.0 y npm 11.13.0.

```powershell
cd E:\Proyectos\JUEGOS\VoidRescue\void-rescue-codex-package
npm install
npm run dev
```

Abrir [VOID RESCUE local](http://127.0.0.1:5173) y pulsar **INICIAR VUELO**. Reutilizar el servidor si ya está activo; el puerto 5173 es fijo. `Ctrl+C` lo detiene.

```powershell
npm run build
npm run preview -- --port 4173
```

[Vista previa de producción](http://127.0.0.1:4173). No se ha desplegado a servicios externos.

## Cómo jugar

Protege la colonia y elimina todas las amenazas. En el radar: triángulos enemigos, rectángulos colonos, `!` objetivo amenazado, `↑` captura, `↓` caída y círculo del portal.

1. Destruye al Harvester antes de que escape. Si alcanza el límite superior con su víctima, ésta se pierde y el enemigo se convierte en Wraith.
2. Al destruir al captor, **intercepta con la nave al colono en caída**. Una caída corta puede ser segura; una caída rápida es mortal.
3. Con un colono a bordo, baja hasta el terreno y frena. La entrega es automática cerca del suelo, por debajo de 22 u/s horizontales y 12 u/s verticales. Dejar de empujar frena; el empuje contrario frena más rápido.
4. La primera entrega habilita el portal. Pulsa E o norte cerca del anillo: salta medio planeta, recibe protección breve y +1000 por el primer salto. Recarga de 5 s; no elimina amenazas ni apariciones pendientes.
5. La oleada termina al eliminar enemigos y resolver capturas, caídas y transportes. Perder las tres naves termina la misión. Ambos casos muestran resumen y permiten volver a jugar.

Oleada principal: cinco Harvesters, tres Interceptors y un Flux Node, escalonados entre los segundos 2 y 47. Flux genera hasta tres drones activos. Cada abducción completada puede producir un Wraith. Se comienza con tres naves y dos bombas; reaparición en 1.6 s con protección de 3 s.

La bomba carga 0.25 s, destruye amenazas activas dentro de la vista al pulsarla y limpia sus proyectiles. Conserva colonos y enemigos aún materializándose. Los supervivientes en tierra cuentan para cerrar la oleada: no es obligatorio provocar caídas para ganar.

## Controles

| Acción | Teclado | Joypad estándar (Xbox / PlayStation) |
| --- | --- | --- |
| Pilotar | WASD o flechas | Stick izquierdo o cruceta |
| Disparar, mantener para repetir | Espacio | Sur: A / × |
| Bomba inteligente | Shift | Oeste: X / □ |
| Portal cercano | E | Norte: Y / △ |
| Pausa / continuar | Esc | Start / Options |
| Elegir opción del menú | Tab / Shift+Tab | Stick o cruceta |
| Confirmar / iniciar | Enter sobre la opción | Sur: A / ×; Start inicia también |
| Volver desde pausa o resumen | Esc en pausa; botón del menú | Este: B / ○ |
| Ajustar volumen en pausa | Flechas sobre el deslizador | Izquierda / derecha |
| Silenciar / reiniciar | M / R durante la partida | Opciones del menú de pausa |
| Diagnóstico | F3 | — |

Menús con ratón, teclado y mando, foco visible y repetición controlada del stick. Las ayudas cambian al detectar joypad. Pulsa un botón si el navegador aún no lo detecta. Se admiten mandos estándar y USB con mapeo original, incluida cruceta reportada como eje hat. Cada dispositivo puede guardar su distribución de direcciones y botones.

Pausa automática al perder foco, cambiar de pestaña o desconectar el joypad detectado. Volumen, silencio y reducción de movimiento/destellos persisten localmente. Audio tras interacción de inicio/reanudación; algunos navegadores pueden exigir un clic/tecla para desbloquearlo.

## Mando USB y calibración

1. Haz clic en el juego y pulsa un botón del mando. Su nombre debe aparecer bajo **CONFIGURAR MANDO USB**, disponible en título y pausa.
2. Abre ese panel. Los ejes cambian de valor y los botones se iluminan; «Última señal» conserva el último control recibido.
3. Si las acciones no coinciden, suelta todos los controles y pulsa **CALIBRAR DIRECCIONES Y BOTONES**. Sigue las nueve indicaciones: izquierda, derecha, arriba, abajo, disparar/confirmar, bomba, portal, pausa/iniciar y volver. Suelta el control entre pasos.
4. El perfil se guarda localmente por modelo de mando. **LISTO / VOLVER** regresa al juego. **Restablecer** recupera el perfil inicial; cancelar conserva el perfil anterior.

Corrección: la versión anterior filtraba `mapping === 'standard'` y descartaba este USB. La [especificación de Gamepad](https://www.w3.org/TR/gamepad/) permite mapeo vacío para dispositivos originales y exige interacción para exponerlos. Ahora un bloqueo de la API se muestra en pantalla sin detener el juego. Si el panel no recibe señal, abrir la dirección del juego directamente en Chrome/Edge; el código no puede instalar controladores ni superar un bloqueo del navegador.

Verificación física del 2026-09-09: `USB Joystick (Vendor: 0079 Product: 0006)`, 12 botones, 10 ejes, mapeo original; eje hat con neutro fuera de [-1,1]. El usuario confirmó que números y botones responden. No se instaló ningún controlador externo.

## Dificultad y ritmo

| Nivel | Velocidad del juego |
| --- | --- |
| Relajado | 0.8× |
| Normal | 1× |
| Difícil | 1.25× |
| Experto | 1.5× |

Selector en título y pausa, con teclado, ratón o izquierda/derecha del mando sobre la opción. Se guarda y se aplica al reanudar, sin reiniciar. Escala nave, enemigos, disparos, caída, recargas y apariciones. Se conserva el paso fijo de 1/60; el nivel cambia cuántos pasos se ejecutan por segundo real. El tiempo del resumen es tiempo de simulación. No modifica daño, puntuación o número de enemigos.

## Audio y explosiones

Disparos con pulso agudo, golpe grave y ataque de ruido; impactos con ruido filtrado y resonancia; explosiones con transitorio, subgrave, cola de ruido y fragmentación metálica. Variación determinista, panorámica, límite de voces, compresor y saturación suave final. Se mantienen silencio y volumen.

Destrucciones con núcleo brillante breve, chispas alargadas, fragmentos giratorios y nube caliente que se disipa. Las partículas continúan disipándose detrás del resumen, pero se congelan en pausa. La opción de reducir efectos baja cantidad/intensidad y elimina las nubes; conserva la información del impacto.

La prueba offline usa diez explosiones/bombas superpuestas y seis disparos a 48 kHz estéreo: pico ~0.623, RMS ~0.081, sin muestras no finitas ni valores fuera de [-1,1]. Evidencia en `*-audio-mix.json`. No sustituye la escucha humana.

## Arquitectura y decisiones

- `src/core/`: reloj de 60 Hz, semilla y operaciones circulares.
- `src/game/combat/`: colonos, IA, colisiones, daños, vidas, oleada y escenarios separados del render.
- `src/input/`: acciones centralizadas, zona muerta y navegación.
- `src/render/`: modelos originales, cámara continua y TSL en propulsores, portal, impactos y bomba. Pools de 768 chispas, 128 fragmentos, 96 nubes luminosas y 160 partículas auxiliares; ondas y núcleos TSL.
- `src/audio/`: efectos Web Audio diferenciados, panorámica circular, límite de voces y compresor maestro.
- `src/ui/`: radar, avisos, instrumentos y resumen; `src/app/`: coordinación y diagnóstico.

Mundo circular de 2400 unidades, proyectiles y rescate con barrido para movimientos rápidos y costura. El límite inferior sigue el terreno: tocarlo no destruye la nave. Altura máxima 82. Colonos entregados a salvo de nuevas capturas. Portal de demostración sin segundo mundo. Parámetros principales en `config.ts` y `combat/types.ts`; apariciones en `combat/scenarios.ts`.

Geometría y sonidos procedurales originales. Ningún gráfico/sonido de las referencias se carga. Sin React, motor físico, ECS externo, workers, backend, telemetría, claves o CDN. Proyectiles con cadencia y vida limitadas; las mediciones no justifican un pool adicional de simulación.

## Backends y dependencias

Un único [WebGPURenderer de Three.js](https://threejs.org/docs/pages/WebGPURenderer.html) selecciona WebGPU o WebGL2. [Forzar WebGL2](http://127.0.0.1:5173/?backend=webgl2), [cambiar semilla](http://127.0.0.1:5173/?seed=19). Backend visible en HUD/F3; un error gráfico ofrece reiniciar con WebGL2.

Versiones conservadas del incremento anterior, fijadas en lockfile: Vite 8.2.2, TypeScript 7.0.2, Three.js 0.185.1, tipos 0.185.4, Vitest 5.0.0 y Playwright 1.62.0. Sin nuevas dependencias para combate.

Incidencia previa: Chromium 153 de Playwright 1.63 produjo errores internos Tint (`swizzle view instruction still has usages after lowering`) con PBR/WebGPU. Chromium 151.0.7922.34 de Playwright 1.62 pasa los recorridos; se conserva esa combinación. Se usa `channel: 'chromium'`, [headless moderno](https://playwright.dev/docs/browsers). El shell inicial usó WebGL2 por software (~4.6 FPS), ajeno al rendimiento de la RTX 3060.

## Pruebas

```powershell
npx playwright install chromium
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Playwright inicia/reutiliza desarrollo con un solo worker. `npm run test:e2e:headed` muestra recorridos. Con preview en 4173 activo, `npm run test:production` comprueba inicio, movimiento, pausa y ausencia del diagnóstico en el build, en ambos backends.

Resultados del incremento de combate, 2026-09-09:

- TypeScript estricto y build aprobados. Aviso de tamaño: ~958 kB JS / ~269 kB gzip, principalmente Three.js.
- 42 pruebas Vitest aprobadas: reservas, captura/mutación, liberación, caída suave/mortal, rescate/entrega, daño único, costura, bomba, portal, vidas, finales y determinismo.
- 32 pruebas Playwright aprobadas (16 WebGPU y 16 WebGL2), sin errores de consola o excepciones de página observados.
- Build de producción comprobado con WebGPU y WebGL2, sin errores observados.
- Oleada principal desde título hasta victoria con eventos de teclado, sin modificar la simulación. El piloto de pruebas lee estado para decidir acciones normales. Nueve apariciones eliminadas, ocho colonos supervivientes; el rescate se comprueba además en otro recorrido de abducción → bomba → caída → recogida → entrega.
- Joypad emulado estándar y USB original: vuelo, disparo, pausa, menús, volumen, silencio, dificultad, reducción de efectos, bomba, portal, resumen, inicio, desconexión y calibración con persistencia. Mando físico detectado y recepción de ejes/botones confirmada por el usuario.

## Capturas y rendimiento

Pares `chromium-auto-*` y `chromium-webgl2-*` en `docs/screenshots/`:

| Archivo | Evidencia |
| --- | --- |
| `combat.png` | Oleada principal en curso |
| `abduction.png`, `rescue.png`, `wave-complete.png` | Captura, transporte y entrega con teclado |
| `full-wave.png`, `full-wave.json` | Victoria principal y resultado |
| `enemy-families.png`, `effects.png` | Familias, portal y combate de diagnóstico |
| `combat-metrics.json`, `showcase-metrics.json` | Entidades, rendimiento y backend |
| `720p.png`, `seam.png` | Adaptación y costura |
| `usb-calibrated.png` | Asignación y guardado del mando USB emulado |
| `explosion-upgrade.png`, `player-explosion.png` | Bomba y destrucción propia con nuevos efectos |
| `explosion-metrics.json`, `audio-mix.json` | Carga de partículas y señal de audio medida |

Windows, NVIDIA GeForce RTX 3060, controlador 32.0.16.1088, Chromium 151, 1920×1080/DPR 1. Ventana móvil de hasta 180 cuadros tras 240 pasos. Escena inicial de combate: alrededor de 60 FPS; cada JSON identifica su carga. `combat-showcase` concentra cinco familias para revisión: no es una prueba de estrés máximo ni sustituye la oleada principal.

| Escena / backend | FPS | ms/cuadro | Draw calls | Triángulos |
| --- | --- | --- | --- | --- |
| Inicio de combate / WebGPU | 60.01 | 16.66 | 52 | 18 663 |
| Inicio de combate / WebGL2 | 60.01 | 16.66 | 52 | 18 663 |
| Combate de diagnóstico / WebGPU | 60.01 | 16.66 | 92 | 22 495 |
| Combate de diagnóstico / WebGL2 | 60.01 | 16.66 | 92 | 22 495 |

La segunda muestra contiene tres enemigos activos, siete colonos, cinco proyectiles y 104 partículas tras disparar durante cuatro segundos. No hubo tiempo de simulación descartado en estas muestras. El incremento de vuelo conservado en Git contiene la verificación inicial de referencias SHA-256 contra el ZIP original; siguen sin modificaciones.

La captura de bomba reúne más de 500 partículas, ~110 draw calls y ~24 700 triángulos. Esa muestra inicial incluye compilación de materiales y es más corta que la ventana estable: consultar su FPS real en `*-explosion-metrics.json`, sin extrapolar 60 FPS constantes durante todo arranque.

## Diagnóstico de desarrollo

`window.__VOID_RESCUE__` sólo existe en desarrollo. Sus instantáneas no modifican el estado interno.

```javascript
const vr = window.__VOID_RESCUE__;
vr.getState();
vr.getMetrics();
vr.loadScenario('abduction-start', 8042);
vr.setPaused(true);
vr.step(60); // Entrada neutral; sólo en pausa, máximo 3600 cuadros.
vr.listScenarios();
vr.restart(); // Nueva oleada principal desde un escenario de combate.
```

Escenarios: `combat-basic`, `abduction-start`, `falling-colonist`, `portal-ready`, `wave-near-complete`, `player-near-death`; auxiliares `last-life`, `combat-showcase`; regresión `flight-basic`, `world-seam`.

## Límites pendientes

Mando físico USB Joystick 0079:0006 detectado en Windows y en el navegador integrado; el usuario confirmó cambios de ejes y botones en el panel. Calibración, persistencia y juego con controles asignados se prueban además por emulación. Falta evaluar una partida completa con el mando físico y escuchar la mezcla en altavoces/auriculares. La medición offline de picos no certifica calidad perceptual.

Modelos procedurales de baja complejidad, aún sin alcanzar la dirección artística realista final. Se revisaron composición y legibilidad en capturas sin dar por cerrado el pulido visual del Milestone 1. Sin más oleadas, campaña, guardado de partida ni música. `PLAN.md` conserva el historial y `ACCEPTANCE_CRITERIA.md` detalla la revisión.
