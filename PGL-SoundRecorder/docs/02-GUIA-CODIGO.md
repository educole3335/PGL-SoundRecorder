# Guia de codigo

## Entrada principal

### `App.tsx`

Responsabilidad:

- Monta la pantalla principal (`RecorderScreen`).

## Pantalla principal

### `src/screens/RecorderScreen.tsx`

Responsabilidades:

- Estado general de la app.
- Configuracion de audio (modo grabacion/reproduccion).
- Control de ciclo de grabacion.
- Apertura y confirmacion de modal de nombre.
- Reproduccion y tracking de progreso.
- Eliminacion individual y total.
- Animaciones del boton de grabar y ondas.

Funciones clave:

- `setRecordingAudioMode`: prepara el motor para grabar.
- `setPlaybackAudioMode`: prepara salida para reproducir.
- `startRecording`: permisos + inicio de grabacion.
- `stopRecording`: detiene, prepara temporal y abre modal.
- `confirmRecordingName`: persiste audio y metadata.
- `playRecording`: crea `Sound`, pone volumen, arranca playback.
- `deleteRecording`: borra un audio.
- `clearAllRecordings`: borra todos los audios.

Estados clave:

- `recordings`: lista de audios.
- `playingId`: ID del audio en reproduccion.
- `playbackProgress`: posicion y duracion para barra de progreso.
- `pendingRecording`: info del audio pendiente de nombre/guardado.

## Componentes de UI

### `src/components/RecordingCard.tsx`

Responsabilidades:

- Render de una grabacion guardada.
- Boton play/pause visual.
- Boton de borrar con animacion.
- Barra de progreso mientras se reproduce.

Props:

- `recording`
- `isPlaying`
- `playbackProgress`
- `onPlay`
- `onDelete`

### `src/components/LoadingSpinner.tsx`

Responsabilidad:

- Spinner con animaciones de rotacion y pulso.

## Persistencia

### `src/services/recordingsService.ts`

Responsabilidades:

- Guardar metadata en JSON.
- Copiar/mover archivo de audio al directorio final.
- Leer lista ordenada por fecha.
- Borrar audios individuales/todos.
- Filtrar metadatos de archivos inexistentes.

Funciones publicas:

- `getStoredRecordings`
- `saveRecordingFromUri`
- `deleteStoredRecording`
- `clearStoredRecordings`

## Tipos

### `src/types/recording.ts`

Define la estructura `StoredRecording`:

- `id`, `title`, `uri`, `fileName`, `createdAt`, `durationMs`
