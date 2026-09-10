# Criterios de aceptación — Milestone 1

Codex no debe declarar terminado el vertical jugable hasta comprobar estos criterios o documentar claramente los que el entorno impidió verificar.

Revisión 2026-09-09: las casillas marcadas corresponden a la base de vuelo (fases 0–2). **Milestone 1 pendiente**: aún no hay combate, rescate ni oleada. Las pruebas y métricas actuales no se extienden a esos sistemas futuros.

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
- [x] La nave se orienta y dispara en ambas direcciones (disparos de prueba sin colisiones).
- [x] El mundo se envuelve horizontalmente sin salto visual grave.
- [x] El radar representa correctamente ambos lados de la costura.
- [ ] El jugador puede perder una nave y reaparecer.
- [x] Es posible pausar, reiniciar y silenciar.

## C. Colonos y rescate

- [ ] Hay al menos ocho colonos activos al inicio del escenario principal.
- [ ] Los Harvesters seleccionan colonos disponibles sin duplicar reservas inválidas.
- [ ] Un Harvester puede descender, capturar y elevar a un colono.
- [ ] Si el Harvester muere durante la elevación, el colono cae.
- [ ] El jugador puede atrapar al colono durante la caída.
- [ ] El colono puede depositarse o regresar con seguridad.
- [ ] Una caída suave y una caída mortal producen resultados distintos.
- [ ] Completar una abducción transforma al Harvester en Wraith.
- [ ] El contador y radar reflejan correctamente los cambios de estado.

## D. Combate y oleada

- [ ] Existen Harvester, Wraith, Interceptor y Flux Node con siluetas y comportamientos diferenciados.
- [ ] Los impactos y destrucciones actualizan estado y puntuación una sola vez.
- [ ] La bomba inteligente consume una carga y afecta únicamente objetivos válidos.
- [ ] Los enemigos aparecen de forma escalonada y no encima del jugador.
- [ ] La oleada sólo concluye cuando no quedan amenazas ni rescates pendientes.
- [ ] Se muestra un resumen de oleada.
- [ ] El portal puede prepararse y atravesarse mediante una condición de rescate documentada.

## E. Presentación

- [ ] Nave y enemigos son modelos 3D originales, no sprites históricos.
- [x] La cámara mantiene el plano jugable claro en 16:9.
- [ ] Existen parallax/profundidad, terreno, estrellas y atmósfera.
- [ ] Propulsores, láseres, impactos, explosiones, captura y portal tienen efectos diferenciados.
- [ ] Los colonos siguen siendo visibles durante combates intensos.
- [ ] La interfaz parece instrumentación de nave y no una plantilla web genérica.
- [x] Hay control para reducir sacudida y destellos (anticipación/inclinación y propulsores del vuelo; no hay aún efectos de combate).
- [ ] Los efectos no bloquean la lectura durante periodos prolongados.

## F. Audio

- [x] El audio comienza sólo después de interacción del usuario.
- [ ] Motor, disparo, impacto, explosión, alerta, rescate, bomba y portal poseen sonidos originales diferenciados.
- [ ] No hay clipping audible evidente en combate normal.
- [x] Silenciar funciona y persiste durante la sesión.

## G. Pruebas y diagnóstico

- [x] Las pruebas Vitest pasan (14 pruebas del núcleo/vuelo).
- [x] Las pruebas Playwright pasan en Chromium (12 recorridos del incremento).
- [x] `window.__VOID_RESCUE__` expone estado, escenarios y métricas (dos escenarios de vuelo).
- [ ] Los seis escenarios deterministas requeridos cargan correctamente.
- [x] Al menos una prueba usa controles reales y no sólo mutación directa del estado.
- [ ] Se generó y revisó al menos una captura del combate principal.
- [x] No quedan errores de consola ni promesas rechazadas durante la ruta principal de vuelo en Chromium 151.

## H. Rendimiento y documentación

- [x] Se midió FPS a 1920×1080 o se documentó la resolución disponible (prueba de vuelo).
- [ ] Se registraron draw calls y triángulos de la escena típica.
- [x] No se añadieron Web Workers sin evidencia de bloqueo del hilo principal.
- [x] `README.md` explica instalación, ejecución, controles, pruebas, backend y limitaciones.
- [x] `PLAN.md` refleja el estado verdadero de cada fase.
- [x] Se documentaron decisiones o desviaciones respecto a esta especificación.

## Definición de terminado

“Compila” no equivale a “terminado”. El hito está terminado cuando una persona puede iniciar una partida, comprender el objetivo, impedir una captura, rescatar un colono, utilizar sus armas, cerrar la oleada y recibir retroalimentación audiovisual consistente.
