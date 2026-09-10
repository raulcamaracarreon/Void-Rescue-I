# VOID RESCUE — documento de diseño del vertical jugable

## 1. Visión

VOID RESCUE es un arcade de defensa y rescate espacial con desplazamiento horizontal libre. El jugador pilota una nave de respuesta rápida alrededor de una colonia planetaria y debe impedir que fuerzas hostiles capturen a sus habitantes.

La experiencia debe combinar:

- respuesta inmediata y dificultad creciente de un arcade clásico;
- claridad táctica mediante un radar panorámico;
- sensación de velocidad e inercia;
- espectáculo audiovisual 2.5D moderno;
- decisiones rápidas entre perseguir enemigos, rescatar colonos y sobrevivir.

El tono visual es ciencia ficción realista y hostil. La acción puede ser espectacular, pero siempre legible.

## 2. Fantasía del jugador

El jugador es la última nave defensora de una colonia aislada. Puede recorrer todo el perímetro del planeta, interceptar abductores, recoger colonos en caída, transportarlos a un lugar seguro y atravesar un portal de salto cuando cumple las condiciones de rescate.

## 3. Bucle principal

1. Localizar amenazas y colonos en el radar.
2. Desplazarse rápidamente alrededor del mundo circular.
3. Destruir abductores antes de que abandonen la atmósfera.
4. Atrapar colonos que caen y devolverlos con seguridad.
5. Sobrevivir a cazas, proyectiles y amenazas de apoyo.
6. Eliminar las fuerzas restantes.
7. Completar o atravesar el portal y cerrar la oleada.
8. Recibir puntuación y mostrar un resumen breve.

## 4. Espacio de juego

- Mundo horizontal circular y continuo.
- El borde derecho conecta con el izquierdo sin pausa, teletransporte visible ni discontinuidad del radar.
- El movimiento y las colisiones ocurren en un plano 2D `(x, y)`.
- Los modelos poseen profundidad, rotación, iluminación y animación 3D.
- El terreno es una franja planetaria continua con relieve visual y zonas colonizadas.
- El radar representa todo el perímetro y marca jugador, colonos, enemigos prioritarios y portal.

## 5. Nave del jugador

### Movimiento

- Empuje horizontal con aceleración, velocidad máxima y desaceleración gradual.
- Cambio inmediato de orientación cuando cambia la intención horizontal, acompañado por una transición visual breve.
- Movimiento vertical más directo que el horizontal, con límites superior e inferior.
- La cámara adelanta ligeramente la vista hacia la dirección y velocidad de desplazamiento.
- El control debe sentirse preciso; las animaciones no deben introducir latencia.

### Estado

- Una nave activa y dos reservas al comenzar, salvo ajuste posterior de balance.
- Breve invulnerabilidad después de reaparecer.
- Destrucción claramente comunicada mediante sonido, fragmentos y pausa mínima de impacto.

### Acciones

| Acción | Teclado inicial | Gamepad inicial |
| --- | --- | --- |
| Mover horizontalmente | `A/D` o flechas | Stick izquierdo / D-pad |
| Mover verticalmente | `W/S` o flechas | Stick izquierdo / D-pad |
| Disparo principal | `Espacio` | Botón sur |
| Bomba inteligente | `Shift` | Botón oeste |
| Portal/hipersalto contextual | `E` | Botón norte |
| Pausa | `Esc` | Start |
| Silencio | `M` | Menú de pausa |

Las teclas definitivas deben declararse en una única configuración.

## 6. Armas y habilidades del vertical

### Cañón lineal

- Disparo horizontal rápido en la dirección de la nave.
- Haz breve o proyectil alargado de alta luminosidad.
- Estela discreta, destello de boca, luz local corta e impacto visible.
- Cadencia suficientemente alta para sensación arcade, con límite que evite ruido visual.

### Bomba inteligente

- Recurso limitado.
- Elimina o daña gravemente amenazas activas dentro del área visible.
- Debe tener anticipación, onda expansiva y respuesta audiovisual diferenciada.
- No debe eliminar colonos ni ocultar durante demasiado tiempo el estado del juego.

### Portal de salto

- Objeto volumétrico presente o activado durante la oleada.
- El radar lo muestra de forma diferenciada.
- Al cumplir la condición de rescate, atravesarlo produce una transición y bonificación.
- En el vertical puede cerrar la oleada o demostrar el salto; no requiere múltiples mundos.

## 7. Colonos

Estados mínimos:

```text
en_tierra -> marcado_por_abductor -> capturado -> elevado
elevado -> perdido/mutación
elevado -> liberado_en_caída -> rescatado_por_jugador -> transportado
liberado_en_caída -> aterrizaje_seguro | muerte_por_impacto
transportado -> depositado_con_seguridad
```

Comportamiento:

- Caminan cerca de la superficie con animaciones y variaciones moderadas.
- Emiten señales visuales y sonoras breves cuando son seleccionados o capturados.
- Un abductor debe reservar un objetivo para evitar selecciones incoherentes.
- Al destruir al captor, el colono cae con aceleración controlada.
- El jugador puede interceptarlo; el rescate debe sentirse claro y satisfactorio.
- Un aterrizaje suave permite sobrevivir; un impacto fuerte provoca pérdida.
- La interfaz muestra cuántos colonos permanecen con vida.

## 8. Enemigos del vertical

### Harvester — abductor

- Busca un colono disponible.
- Desciende, alinea, captura y asciende.
- Si alcanza el límite superior con su víctima, el colono se pierde y el Harvester se transforma en una amenaza agresiva.
- Es la prioridad táctica central.

### Wraith — forma mutada

- Persigue directamente al jugador.
- Posee movimiento errático controlado y mayor presión ofensiva.
- Debe ser visualmente reconocible como transformación del Harvester.

### Interceptor — caza hostigador

- Persigue al jugador, intenta alinearse y dispara.
- Realiza correcciones verticales suaves y pasadas laterales.

### Flux Node — amenaza de apoyo

- Se desplaza lentamente y libera drones o proyectiles guiados.
- Introduce presión espacial sin sustituir el objetivo de rescate.

El primer vertical requiere estas cuatro familias. Las demás conductas del `.p8` quedan documentadas para hitos posteriores.

## 9. Oleada del vertical

Composición inicial sugerida, ajustable tras pruebas:

- 8 colonos.
- 5 Harvesters escalonados.
- 3 Interceptors.
- 1 Flux Node.
- Hasta 2 Wraiths emergentes por abducciones fallidas.

La aparición debe ser escalonada y comunicada; no se deben materializar todos los enemigos sobre el jugador.

### Victoria

La oleada termina cuando:

- ya no quedan amenazas requeridas; y
- no existe una captura o caída pendiente.

Si el portal está listo, atravesarlo puede actuar como cierre ceremonial. Muestra resumen de colonos salvados, bajas, tiempo y puntuación.

### Derrota

- Se agotan la nave activa y las reservas; o
- opcionalmente, todos los colonos han muerto y el jugador pierde después sus naves.

La pérdida de todos los colonos debe transformar el tono visual del escenario y aumentar la hostilidad, aunque la versión completa de ese modo puede quedar fuera del primer hito.

## 10. Puntuación inicial

- Destruir Harvester: 150.
- Destruir Wraith: 250.
- Destruir Interceptor: 200.
- Destruir Flux Node: 500.
- Atrapar colono en caída: 500.
- Depositar colono con seguridad: bonificación acumulativa.
- Cerrar oleada: bonificación por supervivientes y tiempo.

Los valores deben estar en datos configurables, no dispersos como constantes mágicas.

## 11. Cámara y presentación

- Relación objetivo 16:9, adaptable a ventana.
- Cámara ortográfica con anticipación horizontal dependiente de dirección y velocidad.
- Parallax tridimensional mediante capas de estrellas, polvo, luna o estructuras orbitales.
- Inclinación visual de la nave según aceleración vertical, sin modificar su plano de colisión.
- Sacudida leve para impactos propios y moderada para bomba inteligente.
- Opción de reducir movimiento y destellos.

## 12. Interfaz

- Radar panorámico integrado en la parte superior.
- Puntuación, naves restantes, bombas y colonos vivos.
- Mensajes breves: captura detectada, colono cayendo, portal listo, oleada completada.
- Pantalla inicial con título VOID RESCUE, controles y botón para comenzar.
- Pausa con volumen, reducción de destellos, reinicio y regreso al menú.

Evita una interfaz genérica de aplicación web. Debe sentirse como instrumentación de una nave.

## 13. Audio

- Sonidos originales creados con Web Audio API.
- Motor con capas según aceleración y velocidad.
- Disparo seco y definido.
- Alarma espacializada o panorámica para capturas.
- Sonido de rescate cálido y ascendente.
- Explosiones con variación controlada mediante semilla.
- Bomba inteligente con carga, descarga y cola grave.
- Música ambiental opcional queda fuera del vertical si compromete tiempo o identidad.

## 14. Fuera del alcance inicial

- Campaña y narrativa extensa.
- Mejoras permanentes o roguelite.
- Jefes y oleadas especiales.
- Multijugador.
- Tablas en línea.
- Modelos externos de alta complejidad.
- Guardado persistente, salvo preferencias locales.
- Móvil táctil.

