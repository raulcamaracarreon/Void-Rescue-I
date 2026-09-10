# VOID RESCUE

Arcade 2.5D de defensa y rescate espacial. Incluye oleadas sin final, dificultad creciente y récords locales, con teclado y joypad: ocho colonos, abductores, mutación, caída, rescate, entrega, combate, bomba, portal, vidas y resumen. El acabado artístico y la evaluación humana del control/audio siguen pendientes.

## Jugar en línea

▶ **[Abrir VOID RESCUE](https://raulcamaracarreon.github.io/Void-Rescue-I/)**

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

[Vista previa local de producción](http://127.0.0.1:4173).

## Compartir en GitHub Pages

El juego está publicado en **[raulcamaracarreon.github.io/Void-Rescue-I](https://raulcamaracarreon.github.io/Void-Rescue-I/)**. El repositorio incluye `.github/workflows/deploy-pages.yml`; cada push a `master` construye y publica automáticamente la versión nueva mediante GitHub Actions.

No hace falta que quien juegue instale nada: abre ese enlace en un navegador moderno. Los récords son locales a cada navegador y no se comparten entre jugadores. GitHub Pages sirve el juego estático; no incluye cuentas, clasificación global ni guardado de partidas en servidor.

## Cómo jugar

Protege la colonia y elimina todas las amenazas. En el radar: triángulos enemigos, rectángulos colonos, `!` objetivo amenazado, `↑` captura, `↓` caída y círculo del portal.

1. Destruye al Harvester antes de que escape. Si alcanza el límite superior con su víctima, ésta se pierde y el enemigo se convierte en Wraith.
2. Al destruir al captor, **intercepta con la nave al colono en caída**. Una caída corta puede ser segura; una caída rápida es mortal.
3. Con un colono a bordo, baja hasta el terreno y frena. La entrega es automática cerca del suelo, por debajo de 22 u/s horizontales y 12 u/s verticales. Dejar de empujar frena; el empuje contrario frena más rápido.
4. La primera entrega habilita el portal. Pulsa E o norte cerca del anillo: salta medio planeta, recibe protección breve y +1000 por el primer salto. Recarga de 5 s; no elimina amenazas ni apariciones pendientes.
5. La oleada termina al eliminar enemigos y resolver capturas, caídas y transportes. Perder las tres naves termina la misión. El resumen de victoria permite continuar a la siguiente oleada; la derrota permite iniciar otra partida.

Primera oleada: cinco Harvesters, tres Interceptors y un Flux Node, escalonados entre los segundos 2 y 47. Flux genera hasta tres drones activos. Cada abducción completada puede producir un Wraith. Se comienza con tres naves y dos bombas; reaparición en 1.6 s con protección de 3 s.

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

| Nivel | Ritmo | Recursos iniciales | Impactos por enemigo | Perfil de combate |
| --- | --- | --- | --- | --- |
| Recluta | 0.9× | 4 naves, 3 bombas | 1 | Menos amenazas; cañón más rápido; enemigos lentos. |
| Relajado | 1× | 4 naves, 3 bombas | 1 | Presión suave, arma ágil y 90% de las apariciones. |
| Normal | 1.2× | 3 naves, 2 bombas | 2 | Ritmo arcade más ágil; valores de combate y primera oleada de referencia. |
| Difícil | 1.4× | 3 naves, 2 bombas | 2 | 20% más amenazas, fuego y movimiento enemigos más intensos; cañón algo menos eficaz. |
| Experto | 1.6× | 2 naves, 1 bomba | 3 | 40% más amenazas y disparos muy frecuentes. |
| Sobremarcha | 1.8× | 1 nave, 1 bomba | 4 | 60% más amenazas, máxima movilidad/fuego enemigo y cañón deliberadamente limitado. |

Selector en título y pausa, con teclado, ratón o izquierda/derecha del mando sobre la opción. Se conserva el paso fijo de 1/60; el nivel cambia cuántos pasos se ejecutan por segundo real. Además del ritmo global, cada perfil controla naves/bombas iniciales y sus límites de reposición, cadencia y velocidad del cañón, impactos necesarios para destruir cada enemigo, y cantidad, velocidad, velocidad de proyectil y frecuencia de fuego enemigos. La bomba sigue eliminando enemigos dentro de su área sin requerir impactos. Cambiarlo durante una partida aplica inmediatamente el ritmo, cañón e IA; los recursos iniciales y la población se aplican al iniciar/reiniciar y en la siguiente oleada para no modificar entidades o conceder recursos a mitad de combate. El tiempo del resumen es tiempo de simulación y la puntuación no se multiplica por dificultad.

Verificación del ajuste (2026-09-10): `npm run typecheck`, `npm test` (58 pruebas), `npm run build` y los 36 recorridos Playwright de Chromium/WebGPU y WebGL2 aprobados. El build conserva el aviso conocido por un paquete JavaScript de ~971 kB, no un error.

## Oleadas infinitas y récords

No hay última oleada. Tras el resumen elige **SIGUIENTE OLEADA** con Enter o confirmar/Start del mando. Continúas con puntos y naves restantes; cada oleada recibe ocho colonos nuevos y reinicia el portal. Recibes una bomba (máximo tres) y una nave extra cada tres oleadas completadas (máximo tres). Reiniciar comienza desde la primera oleada con cero puntos.

La oleada 1 conserva sus nueve apariciones. Las siguientes añaden dos enemigos por nivel, hasta 33 apariciones por oleada, más un máximo global de tres drones activos. Las composiciones incluyen Harvesters, Interceptors, Wraiths y Flux. La presión `1 + 0.8 × (oleada - 1) / (oleada + 9)` aumenta velocidad enemiga, velocidad de sus proyectiles y frecuencia de ataque; también reduce el intervalo entre apariciones. Se aproxima a 1.8× sin multiplicar entidades indefinidamente. Se combina con la dificultad global elegida. Los bonos de tiempo se calculan con el reloj de cada oleada; el HUD conserva el tiempo total.

Elige tus tres iniciales (A–Z / 0–9) antes de iniciar. Con mando: arriba/abajo cambia el control seleccionado; izquierda/derecha cambia su letra o número. **VER RÉCORDS** está en título, pausa y resumen. El top 10 muestra iniciales, puntos acumulados, oleada alcanzada y dificultad mínima utilizada durante la partida; la fecha aparece al pasar el cursor sobre la fila. Desempate por oleada y fecha. No registra partidas con cero puntos.

Se actualiza una sola entrada por partida al cerrar una oleada, perder, salir al menú, reiniciar, consultar la tabla o cerrar/recargar la página. No necesitas escribir al perder y puedes jugar todo con mando. Si bajas la dificultad, el récord refleja ese nivel aunque luego lo subas. Los escenarios y pasos manuales de diagnóstico no registran récords.

Guardado únicamente en este navegador/origen mediante `localStorage` (`void-rescue.records.v1` e iniciales en `void-rescue.pilot`). Desarrollo y preview tienen tablas separadas por puerto. No hay cuentas ni clasificación en línea; borrar los datos del sitio elimina los récords. Cerrar el proceso por la fuerza podría perder puntos posteriores al último guardado. Si el almacenamiento está bloqueado o lleno, se mantiene la tabla durante la sesión y el panel avisa. No guarda posiciones para continuar una partida tras recargar.

## Audio y explosiones

El propulsor combina un núcleo filtrado y un silbido de iones ligado a velocidad/aceleración, en lugar de un motor de combustión. Los disparos usan un chirrido de plasma ascendente y una cola cristalina; las explosiones combinan transitorio, subgrave, ruido amplio y fragmentación metálica durante más de un segundo. Variación determinista, panorámica, límite de voces, compresor y saturación suave final. Se mantienen silencio y volumen.

Destrucciones con núcleo brillante breve, chispas alargadas y fragmentos giratorios que se disipan durante ~3 s (hasta ~3.2 s para bomba o destrucción propia). El radio de las partículas se abre gradualmente a lo largo de toda esa animación, en vez de expandirse casi por completo al inicio. Las partículas continúan disipándose detrás del resumen, pero se congelan en pausa. La opción de reducir efectos baja cantidad/intensidad y elimina las nubes; conserva la información del impacto.

La prueba offline usa diez explosiones/bombas superpuestas y seis disparos a 48 kHz estéreo: pico ~0.639, RMS ~0.092, sin muestras no finitas ni valores fuera de [-1,1]. Evidencia en `*-audio-mix.json`. No sustituye la escucha humana.

## Arquitectura y decisiones

- `src/core/`: reloj de 60 Hz, semilla y operaciones circulares.
- `src/game/combat/`: colonos, IA, colisiones, daños, vidas, oleada y escenarios separados del render.
- `src/input/`: acciones centralizadas, zona muerta y navegación.
- `src/render/`: modelos originales, cámara continua y TSL en propulsores, portal, impactos y bomba. Pools de 1536 chispas, 128 fragmentos, 96 nubes luminosas y 160 partículas auxiliares; ondas y núcleos TSL.
- `src/audio/`: efectos Web Audio diferenciados, panorámica circular, límite de voces y compresor maestro.
- `src/ui/`: radar, avisos, instrumentos y resumen; `src/app/`: coordinación y diagnóstico.

Mundo circular de 2400 unidades, proyectiles y rescate con barrido para movimientos rápidos y costura. El límite inferior es el terreno: tocarlo no destruye la nave y permite alcanzar a los colonos a ras de suelo. Los colonos en suelo, objetivo, captura o caída pueden morir por fuego del defensor; los transportados y entregados siguen protegidos. Altura máxima 82. Portal de demostración sin segundo mundo. Parámetros principales en `config.ts` y `combat/types.ts`; progresión y apariciones en `combat/Progression.ts`; récords en `game/Records.ts`.

## Ajuste de cámara y combate — 2026-09-10

La cámara ahora coloca la nave en el primer cuarto horizontal al orientarse a la derecha y en el tercer cuarto al orientarse a la izquierda. El recorrido hacia esa composición tarda aproximadamente un segundo y es continuo, incluso al cruzar la costura del mundo. El pequeño adelanto de velocidad no altera esa referencia visual.

Los disparos del jugador sólo pueden dañar objetivos dentro de la ventana principal de juego; los contactos que sólo aparecen en el radar no reciben colisiones. Las destrucciones abandonan el patrón espiral: usan dispersión radial determinista, caótica y breve que alcanza el campo visible. Las apariciones invierten el efecto: partículas cian se contraen desde la pantalla hasta la nave antes de activarla.

Se sumó **Crossfire**, una cañonera horizontal de tres impactos que dispara dos proyectiles a la vez, uno vertical hacia arriba y otro hacia abajo. Aparece dos veces más en la primera oleada y entra en las composiciones de las siguientes.

Verificación de este ajuste: `npm test` completó 54 pruebas unitarias; `npm run build` completó el chequeo estricto y la compilación. Playwright ejecutó los 36 recorridos de Chromium y regeneró las capturas WebGPU/WebGL2; las regresiones nuevas de siluetas y costura pasaron explícitamente en ambos backends. Permanece el aviso conocido del bundle JavaScript mayor de 900 kB; no es un error de compilación.

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

Resultados previos de combate y mando, 2026-09-09 (conservados como historial):

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

La segunda muestra contiene tres enemigos activos, siete colonos, cinco proyectiles y 104 partículas tras disparar durante cuatro segundos. El campo droppedSeconds de cada JSON registra cualquier tiempo descartado durante arranque o interrupciones; no se deduce del FPS estable. El incremento de vuelo conservado en Git contiene la verificación inicial de referencias SHA-256 contra el ZIP original; siguen sin modificaciones.

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

Modelos procedurales de baja complejidad, aún sin alcanzar la dirección artística realista final. Se revisaron composición y legibilidad en capturas sin dar por cerrado el pulido visual del Milestone 1. Sin campaña, guardado para reanudar partida ni música. Los récords locales sí persisten. `PLAN.md` conserva el historial y `ACCEPTANCE_CRITERIA.md` detalla la revisión.

## Verificación del modo infinito — 2026-09-09

- `npm run typecheck`, `npm test` y `npm run build`: aprobados; 51 pruebas unitarias. Build ~966 kB JS / ~272 kB gzip, con el aviso conocido de tamaño.
- `npm run test:e2e`: 36 recorridos aprobados, 18 en WebGPU y 18 en WebGL2, sin errores observados.
- El piloto de simulación completa tres oleadas consecutivas usando acciones ordinarias. Pruebas de estado recorren cien transiciones; horarios/presión también se verifican hasta oleada 1 000 000. No equivale a jugar un millón de oleadas.
- Navegador: victoria real con teclado (~50–51 s), puntos conservados al iniciar oleada 2, nuevas apariciones escalonadas, cambio de dificultad y récord recuperado tras recarga. Mando emulado elige iniciales, abre/cierra tabla, continúa oleada y reinicia tras derrota.
- Tras el ajuste final de combinación entre pestañas y puesto visible, seis recorridos relevantes repetidos y aprobados. `npm run test:production` aprobado en WebGPU y WebGL2: vuelo, pausa, tabla, iniciales persistentes y ausencia de diagnóstico, sin errores observados.
- Persistencia: top 10 ordenado, duplicados, datos malformados, almacenamiento bloqueado/lleno y combinación de registros de instancias abiertas. Diagnósticos excluidos.
- Capturas revisadas: `*-endless-title-720p.png`, `*-records.png`, `*-full-wave.png` y `*-wave-two.png`. Referencias sin cambios; sin dependencias nuevas.
- Pendiente balance percibido de sesiones largas y una partida completa con el mando físico. Los límites de población evitan crecimiento indefinido, pero no se certifica FPS constante para todas las oleadas.
