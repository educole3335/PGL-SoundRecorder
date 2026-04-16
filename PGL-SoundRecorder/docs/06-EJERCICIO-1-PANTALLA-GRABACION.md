# Ejercicio 1 - Pantalla de grabacion con todos los elementos pedidos

## Objetivo

Disenar una pantalla de grabacion que incluya:

- Boton para grabar y detener.
- Indicador/animacion de grabacion.
- Listado de audios guardados.
- Reproduccion individual de cada audio.
- Eliminacion individual y eliminacion total.

## Como lo hice

1. Cree una pantalla principal que centraliza todo el flujo en `RecorderScreen`.
2. Agregue un boton principal que cambia entre grabar y detener segun el estado `isRecording`.
3. Mostre una animacion activa durante la grabacion con dos recursos visuales:
   - Pulso circular alrededor del boton (`pulseValue`).
   - Barras de onda animadas (`waveValues`).
4. Renderice el listado de audios con `FlatList` usando el estado `recordings`.
5. Para cada audio use un componente reutilizable `RecordingCard` con acciones de reproducir/pausar y borrar.
6. Incorpore el boton `Borrar todos` en el encabezado del listado cuando existen elementos.

## Implementacion por bloques

### Boton grabar/parar

- El `Pressable` principal ejecuta:
  - `startRecording` cuando no hay grabacion activa.
  - `stopRecording` cuando ya esta grabando.
- El icono cambia de microfono a stop mediante `MicGlyph`.

### Indicador de grabacion en curso

- Mientras `isRecording` es true, se activa:
  - Pulso animado con `Animated.loop` y `pulseValue`.
  - Onda de barras con escalado vertical en `waveValues`.
- El texto auxiliar cambia a `Grabando mm:ss`.

### Listado de audios grabados

- Se usa `FlatList` para dibujar cada item de `recordings`.
- El estado vacio muestra una vista de `Aun no tienes grabaciones`.

### Reproduccion individual

- Cada tarjeta recibe `onPlay`.
- La logica de reproduccion esta en `playRecording`:
  - Crea objeto `Audio.Sound`.
  - Inicia o pausa segun el estado actual.
  - Actualiza progreso con `setOnPlaybackStatusUpdate`.

### Eliminacion individual y total

- Eliminacion individual:
  - `RecordingCard` ejecuta `onDelete`.
  - Se llama `deleteRecording`, que usa `deleteStoredRecording`.
- Eliminacion total:
  - Boton `Borrar todos` llama a `clearAllRecordings`.
  - Internamente se usa `clearStoredRecordings` para borrar archivos y metadatos.

## Archivos clave

- `src/screens/RecorderScreen.tsx`
- `src/components/RecordingCard.tsx`
- `src/services/recordingsService.ts`
