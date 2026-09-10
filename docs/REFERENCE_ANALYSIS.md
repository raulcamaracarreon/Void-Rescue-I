# Análisis de `references/void_rescue.p8`

## Función del archivo

El cartucho es un prototipo PICO-8 denominado `void rescue`, versión 0.1. Su código Lua constituye una referencia compacta de comportamiento. La nueva implementación debe preservar sus relaciones sistémicas más valiosas sin imitar píxeles, audio o identidad visual de terceros.

## Sistemas identificados

### Estado global y flujo

- `_init()` abre en modo de título.
- `game_init()` inicializa mundo, oleada, dificultad, vidas, bombas, invisibilidad, puntuación, colecciones y terreno.
- `_update60()` controla entrada, oleadas, estados de salto, reaparición, actualización de entidades, colisiones y transición entre planeta y espacio.
- `_draw()` compone terreno, radar, estrellas, entidades, partículas y HUD.

### Mundo circular

- `mapsize=1024`.
- Las posiciones X menores que cero vuelven al final del mundo y viceversa.
- Las comparaciones ajustan distancias superiores a media circunferencia.
- El radar comprime todo el mundo horizontal en aproximadamente 64 posiciones.

**Regla que debe preservarse:** ninguna IA, colisión, cámara ni proyectil puede usar distancia cartesiana horizontal ingenua cerca de la costura del mundo.

### Terreno y colonos

- `generate_planet()` crea un perfil montañoso procedural con restricciones de altura.
- Genera diez humanoides en el prototipo completo.
- Los humanoides caminan, pueden ser capturados, liberados, caer, aterrizar, morir o ser recogidos por el jugador.
- Cuando el jugador los transporta, siguen a la nave hasta ser depositados.

### Jugador

- Empuje horizontal con aceleración y fricción.
- Movimiento vertical acotado.
- Orientación por dirección.
- Disparo principal.
- Acción secundaria contextual: bomba inteligente, invisibilidad o hipersalto según estado de botones y recursos.
- Reaparición con una secuencia breve.

### Abducción y mutación

- El enemigo de tipo 0 selecciona un humanoide libre.
- Desciende hasta el objetivo, lo captura y asciende.
- Si llega a altura superior, elimina al humanoide y se transforma en mutante.
- Al morir el captor, el humanoide se libera y entra en caída.

Esta máquina de estados es la identidad mecánica principal y tiene prioridad sobre la cantidad de efectos gráficos.

### Portal

- El portal aparece en posiciones predefinidas del mundo.
- Entrar con suficientes humanoides transportados activa un salto especial y bonificación.
- Entrar sin cumplir la condición produce otro desplazamiento/warp.

Para el vertical moderno se simplificará la activación, pero debe conservarse la relación entre rescate y salto.

### Oleadas

- Las composiciones cambian por número de oleada.
- Cada cinco oleadas existe una variación espacial.
- Cada diez se presenta una composición especial.
- Cuando todos los enemigos requeridos son eliminados y no hay rescates pendientes, se calcula una bonificación y comienza la transición.

### Pérdida de la colonia

- Cuando no queda ningún humanoide, el planeta entra en destrucción y el juego pasa a espacio.
- Los abductores normales se transforman o cambian de comportamiento.

Esta consecuencia sistémica se reserva parcialmente para después del vertical, pero la arquitectura no debe impedirla.

### Economía arcade

- La puntuación se acumula por destrucción y rescate.
- Cada umbral de 10,000 puntos concede una vida, una bomba y energía de habilidad.
- La bonificación de oleada depende del número de humanoides conservados.

## Familias de entidad observadas

La función `spawn_enemy(n,t,...)` define tipos numéricos con comportamientos diferentes. La equivalencia moderna es funcional, no nominal:

| Tipo PICO-8 | Rol observado | Equivalente de trabajo |
| --- | --- | --- |
| `0` | Abductor y forma mutada | Harvester / Wraith |
| `1` | Enemigo móvil de hostigamiento | Interceptor u oleada posterior |
| `2` | Cápsula que libera unidades | Hive Pod, posterior |
| `3` | Unidad rápida derivada de cápsula | Drone Swarm, posterior |
| `4` | Plataforma de apoyo | Flux Node |
| `5` | Unidad/proyectil guiado lanzado por otra entidad | Flux Drone |
| `6` | Atacante con patrón de fuego especializado | Incinerator, posterior |
| `7` | Perseguidor con animación direccional | Ray Hunter, posterior |
| `8+` | Refuerzos y amenazas de presión | Baiter variants, posterior |

No es necesario implementar todos los tipos en el Milestone 1.

## Diferencias deliberadas en la nueva versión

- Resolución 16:9 adaptable en lugar de 128×128.
- Simulación tipada y modular.
- Colisiones geométricas sencillas en lugar de máscaras por píxel.
- Modelos 3D originales en lugar de sprites.
- Audio procedural original en lugar de copiar SFX.
- Acciones separadas para mejorar accesibilidad; no replicar combinaciones crípticas de dos botones.
- Estado observable para pruebas automáticas.

## Riesgos de traducción

1. **Perder el ritmo por perseguir realismo.** Las mallas no pueden hacer lenta la lectura del combate.
2. **Romper la costura circular.** Todas las consultas espaciales necesitan utilidades de wrap.
3. **Acoplar IA y render.** Una animación no debe decidir cuándo se completa una captura.
4. **Partículas excesivas.** Deben reforzar el impacto sin cubrir colonos ni proyectiles.
5. **Construir demasiados enemigos.** Primero debe funcionar perfectamente el ciclo captura–liberación–rescate.
6. **Copiar apariencia histórica.** La versión debe poseer identidad propia.

