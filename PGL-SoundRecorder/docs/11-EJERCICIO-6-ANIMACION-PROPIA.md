# Ejercicio 6 - Animacion propia en la pantalla

## Objetivo

Agregar una animacion propia a un elemento de la pantalla de grabacion.

## Como lo hice

Implemente varias animaciones personalizadas para enriquecer la experiencia:

1. Pulso del boton principal de grabacion.
2. Ondas de grabacion con barras verticales animadas.
3. Aparicion animada de tarjetas de audio.
4. Feedback animado en botones de reproducir y borrar.

## Animacion destacada elegida

La animacion principal propia es el bloque visual de grabacion en vivo:

- Un pulso circular (`pulseValue`) se expande y desvanece alrededor del boton.
- Cinco barras (`waveValues`) escalan su altura de forma secuencial para simular actividad de audio.

Esta animacion aparece solo cuando `isRecording` es true, lo que da feedback inmediato del estado activo de grabacion.

## Tecnica usada

- API `Animated` de React Native.
- `Animated.loop`, `Animated.sequence` y `Animated.timing`.
- Easing para suavizar transiciones.
- Propiedad `useNativeDriver` para mejor rendimiento.

## Archivos clave

- `src/screens/RecorderScreen.tsx`
- `src/components/RecordingCard.tsx`
- `src/components/LoadingSpinner.tsx`
