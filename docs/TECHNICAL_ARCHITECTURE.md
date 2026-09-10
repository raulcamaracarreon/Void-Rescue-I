# Arquitectura técnica inicial

## Objetivo

Construir un juego web 2.5D autónomo, rápido y verificable, sin backend. La simulación debe poder probarse sin render y el render debe consumir instantáneas del estado, no gobernar las reglas.

## Pila

- TypeScript con `strict: true`.
- Vite.
- Three.js usando el paquete de nodos/WebGPU compatible con la versión seleccionada.
- TSL para materiales y efectos propios.
- Vitest.
- Playwright.
- Web Audio API.
- ESLint y Prettier sólo si no complican innecesariamente el primer arranque.

## Renderizador

Usa `WebGPURenderer` y permite que seleccione WebGPU cuando esté disponible o WebGL2 como respaldo. No mantengas dos renderizadores manuales independientes.

Antes de implementar:

- confirma la ruta de importación requerida por la versión instalada de Three.js;
- confirma qué postprocesado y nodos son compatibles;
- usa los métodos asíncronos requeridos por el renderizador;
- registra el backend activo en el panel de diagnóstico.

## Estructura sugerida

```text
src/
  app/
    GameApp.ts
    bootstrap.ts
  core/
    Clock.ts
    EventBus.ts
    Random.ts
    WorldWrap.ts
  game/
    config/
    entities/
    systems/
    scenarios/
    state/
  input/
    InputManager.ts
    bindings.ts
  render/
    Renderer.ts
    CameraRig.ts
    SceneFactory.ts
    materials/
    effects/
    models/
  audio/
    AudioEngine.ts
  ui/
    Hud.ts
    Menu.ts
  debug/
    DebugApi.ts
    DebugOverlay.ts
tests/
  unit/
  e2e/
```

Codex puede ajustar nombres, pero debe conservar la separación conceptual.

## Modelo de simulación

### Tiempo

- Paso fijo recomendado: `1/60` segundos.
- Acumulador con límite para evitar espiral de actualización después de pestañas suspendidas.
- Interpolación visual opcional entre estados.
- Pausa real de simulación; el render y menú pueden continuar.

### Coordenadas

- X: posición circular normalizada en `[0, worldWidth)`.
- Y: altura jugable.
- Z: profundidad de presentación, no utilizada para reglas ordinarias.
- Centraliza `wrapX`, `signedWrappedDeltaX`, `wrappedDistanceX` y representación cercana a cámara.

### Colisiones

- Círculos, cápsulas o cajas 2D simples.
- Broad phase elemental por celdas sólo si las mediciones lo requieren.
- Los modelos visuales pueden exceder ligeramente la forma de colisión, pero no engañar al jugador.

### Entidades

No se requiere ECS externo. Usa identificadores estables, datos de simulación serializables y sistemas explícitos. Evita que objetos de Three.js aparezcan en el estado de simulación.

### Estados principales

- `boot`;
- `title`;
- `playing`;
- `waveComplete`;
- `playerRespawning`;
- `paused`;
- `gameOver`.

## Render 2.5D

- Cámara ortográfica.
- Malla de nave construida con geometría procedural hard-surface suficientemente detallada para el vertical.
- Instancing para estrellas y grupos repetidos.
- Luces limitadas y cuidadosamente presupuestadas.
- Materiales PBR/NodeMaterial; evita texturas externas si no son necesarias.
- Sombras sólo donde aporten lectura, no como requisito universal.
- Escala visual independiente de unidades de simulación mediante adaptadores.

## Efectos TSL prioritarios

1. Portal con distorsión, borde energético y profundidad aparente.
2. Propulsores con intensidad dependiente del empuje.
3. Láser y destello de impacto.
4. Escudo o invulnerabilidad temporal.
5. Pulso de bomba inteligente.
6. Atmósfera y gradación del horizonte.

Si un efecto no funciona en ambos backends, implementa una degradación explícita y documentada.

## Audio

- Inicialización después de interacción del usuario para cumplir políticas del navegador.
- Nodos y osciladores reutilizables.
- Mezcladores separados para motor, armas, alertas e interfaz.
- Limitador o compresor maestro para evitar picos.
- Preferencia de silencio persistida localmente.

## Diagnóstico y pruebas

La API `window.__VOID_RESCUE__` debe proporcionar instantáneas JSON seguras, escenarios y métricas.

`getMetrics()` debe incluir, cuando estén disponibles:

- backend (`webgpu` o `webgl2`);
- FPS y tiempo medio de cuadro;
- draw calls;
- triángulos;
- geometrías y texturas;
- entidades por tipo;
- proyectiles y partículas activos;
- semilla y estado de oleada.

### Pruebas unitarias prioritarias

- envoltura y distancia circular;
- integración del movimiento;
- semilla determinista;
- máquina de estados del colono;
- reserva/liberación de objetivos;
- transformación del Harvester;
- puntuación;
- conclusión de oleada.

### Pruebas Playwright prioritarias

- carga sin errores de consola;
- inicio desde menú;
- movimiento y disparo con entrada real;
- captura de un colono;
- destrucción del captor y rescate;
- bomba inteligente;
- portal preparado;
- cierre de oleada;
- pausa y reinicio;
- captura visual del escenario principal.

No confíes exclusivamente en comparaciones de píxeles para escenas con partículas aleatorias. Usa semilla fija y enmascara datos volátiles cuando sea necesario.

## Presupuesto inicial

- Objetivo: 60 FPS a 1920×1080 en un equipo de escritorio moderno.
- El juego debe seguir siendo funcional a 1280×720.
- Evita más de 300 draw calls en la escena típica del vertical.
- Evita asignaciones masivas por cuadro.
- No introduzcas Web Workers hasta detectar una tarea que bloquee el hilo principal.

Estos valores son objetivos, no resultados que puedan declararse sin medición.

## Dependencias y seguridad

- Usa paquetes npm mantenidos y necesarios.
- No agregues telemetría.
- No requieras claves de API.
- No cargues código remoto durante la partida.
- Incluye lockfile.

