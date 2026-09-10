# Criterios de aceptación — Milestone 1

Codex no debe declarar terminado el vertical jugable hasta comprobar estos criterios o documentar claramente los que el entorno impidió verificar.

Revisión 2026-09-09: ciclo de combate, colonos, rescate y oleada implementado y verificado con teclado y joypad emulado. Casillas visuales comprobadas en capturas de las escenas descritas en README, sin afirmar una prueba de estrés máximo. Pendientes: acabado artístico realista, evaluación humana del balance, mando físico y escucha del audio; no se declara cerrado el acabado completo del Milestone 1.

## A. Arranque y compatibilidad

- [x] `npm install` o equivalente instala sin errores no resueltos.
- [x] `npm run dev` inicia el juego localmente.
- [x] `npm run build` finaliza correctamente.
- [x] El chequeo estricto de TypeScript finaliza correctamente.
- [x] El juego abre en Chromium sin errores de consola (Chromium 151; incidencia de 153 documentada).
- [x] Se registra si el backend activo es WebGPU o WebGL2.
- [x] Existe procedimiento documentado para forzar/probar WebGL2.

## B. Bucle jugable

- [x] Hay pantalla inicial, controles visibles e inicio explícito.
- [x] El jugador puede moverse horizontal y verticalmente.
- [x] El movimiento horizontal posee aceleración y desaceleración controlables.
- [x] La nave se orienta y dispara en ambas direcciones.
- [x] El mundo se envuelve horizontalmente sin salto visual grave.
- [x] El radar representa correctamente ambos lados de la costura.
- [x] El jugador puede perder una nave y reaparecer.
- [x] Es posible pausar, reiniciar y silenciar.

## C. Colonos y rescate

- [x] Hay al menos ocho colonos activos al inicio del escenario principal.
- [x] Los Harvesters seleccionan colonos disponibles sin duplicar reservas inválidas.
- [x] Un Harvester puede descender, capturar y elevar a un colono.
- [x] Si el Harvester muere durante la elevación, el colono cae.
- [x] El jugador puede atrapar al colono durante la caída.
- [x] El colono puede depositarse o regresar con seguridad.
- [x] Una caída suave y una caída mortal producen resultados distintos.
- [x] Completar una abducción transforma al Harvester en Wraith.
- [x] El contador y radar reflejan correctamente los cambios de estado.

## D. Combate y oleada

- [x] Existen Harvester, Wraith, Interceptor y Flux Node con siluetas y comportamientos diferenciados.
- [x] Los impactos y destrucciones actualizan estado y puntuación una sola vez.
- [x] La bomba inteligente consume una carga y afecta únicamente objetivos válidos.
- [x] Los enemigos aparecen de forma escalonada y no encima del jugador.
- [x] La oleada sólo concluye cuando no quedan amenazas ni rescates pendientes.
- [x] Se muestra un resumen de oleada.
- [x] El portal puede prepararse y atravesarse mediante una condición de rescate documentada.

## E. Presentación

- [x] Nave y enemigos son modelos 3D originales, no sprites históricos.
- [x] La cámara mantiene el plano jugable claro en 16:9.
- [x] Existen parallax/profundidad, terreno, estrellas y atmósfera.
- [x] Propulsores, láseres, impactos, explosiones, captura y portal tienen efectos diferenciados.
- [x] Los colonos siguen siendo visibles durante combates intensos.
- [x] La interfaz parece instrumentación de nave y no una plantilla web genérica.
- [x] Hay control para reducir sacudida y destellos (cámara, propulsores, partículas, ondas y portal).
- [x] Los efectos no bloquean la lectura durante periodos prolongados.

## F. Audio

- [x] El audio comienza sólo después de interacción del usuario.
- [x] Motor, disparo, impacto, explosión, alerta, rescate, bomba y portal poseen sonidos originales diferenciados.
- [ ] No hay clipping audible evidente en combate normal (pendiente escucha humana; límite de voces y compresor implementados).
- [x] Silenciar funciona y persiste durante la sesión.

## G. Pruebas y diagnóstico

- [x] Las pruebas Vitest pasan (31 pruebas de núcleo, vuelo, combate y rescate).
- [x] Las pruebas Playwright pasan en Chromium (24 recorridos: 12 WebGPU y 12 WebGL2).
- [x] `window.__VOID_RESCUE__` expone estado, escenarios y métricas (diez escenarios, incluidos los seis obligatorios).
- [x] Los seis escenarios deterministas requeridos cargan correctamente.
- [x] Al menos una prueba usa controles reales y no sólo mutación directa del estado.
- [x] Se generó y revisó al menos una captura del combate principal.
- [x] No quedan errores de consola ni promesas rechazadas durante los recorridos de vuelo, rescate y oleada principal en Chromium 151.

## H. Rendimiento y documentación

- [x] Se midió FPS a 1920×1080 o se documentó la resolución disponible (vuelo, inicio de combate y escena de diagnóstico con efectos).
- [x] Se registraron draw calls y triángulos de la escena típica.
- [x] No se añadieron Web Workers sin evidencia de bloqueo del hilo principal.
- [x] `README.md` explica instalación, ejecución, controles, pruebas, backend y limitaciones.
- [x] `PLAN.md` refleja el estado verdadero de cada fase.
- [x] Se documentaron decisiones o desviaciones respecto a esta especificación.

## Definición de terminado

“Compila” no equivale a “terminado”. El hito está terminado cuando una persona puede iniciar una partida, comprender el objetivo, impedir una captura, rescatar un colono, utilizar sus armas, cerrar la oleada y recibir retroalimentación audiovisual consistente.
