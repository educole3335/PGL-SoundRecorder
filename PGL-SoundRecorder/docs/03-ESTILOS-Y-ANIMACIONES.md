# Estilos y animaciones

## Sistema visual

La UI sigue una paleta clara con acento granate.

Colores frecuentes:

- Granate principal: `#b81a57` y variantes.
- Fondo principal tarjeta: `#ffffff`.
- Superficies secundarias: tonos beige/gris suave.

## Donde se definen los estilos

1. `src/screens/RecorderScreen.tsx`

- Layout principal.
- Boton de grabacion.
- Modal de nombre.
- Encabezado de lista y boton "Borrar todos".
- Footer de mensajes.

2. `src/components/RecordingCard.tsx`

- Estilo de tarjeta de grabacion.
- Boton play/pause.
- Boton de basura.
- Barra de progreso.

3. `src/components/LoadingSpinner.tsx`

- Estilo del spinner.

## Movimiento (Animated API)

### En `RecorderScreen`

- Pulso del boton de grabar: `pulseValue`.
- Escalado del boton de grabar: `buttonScale`.
- Barras de onda: `waveValues` en loop secuencial.

### En `RecordingCard`

- Aparicion de tarjeta: `appearValue` (opacidad + translateY).
- Feedback boton play: `playButtonScale`.
- Feedback boton borrar: `deleteButtonScale` + `deleteButtonRotate`.

### En `LoadingSpinner`

- Rotacion continua: `spinValue`.
- Pulso continuo: `pulseValue`.

## Barra de progreso de audio

Implementacion:

- El progreso se calcula en pantalla principal desde `expo-av`.
- Se envia a `RecordingCard` via prop `playbackProgress`.
- La tarjeta calcula `%` y lo refleja en ancho de `progressBarFill`.

## Recomendaciones de mantenimiento visual

1. Mantener consistencia de radios y espaciados en todos los botones.
2. Reutilizar tokens de color para evitar divergencias.
3. Evitar animaciones simultaneas muy largas que afecten bateria.
4. Si se agregan nuevos componentes, centralizar constants de color/tamaño en un archivo de tema.
