# Ejercicio 4 - Guardado local y recuperacion entre sesiones

## Objetivo

Guardar los audios en la memoria del dispositivo y recuperarlos cuando la aplicacion vuelve a abrirse.

## Como lo hice

1. Cree un servicio de persistencia dedicado en `recordingsService.ts`.
2. Defini dos niveles de almacenamiento local:
   - Archivos de audio en `documentDirectory/recordings`.
   - Metadatos en `recordings-metadata.json`.
3. Al guardar una grabacion:
   - Copio/muevo el archivo temporal al directorio final.
   - Creo el registro `StoredRecording` con id, nombre, fecha, uri y duracion.
   - Persisto la lista actualizada en JSON.
4. Al iniciar la app:
   - Leo metadatos con `getStoredRecordings`.
   - Filtro entradas huerfanas (metadato sin archivo real) con `filterMissingFiles`.
   - Muestro la lista recuperada en pantalla.

## Funciones implementadas

- `getStoredRecordings`: lee JSON, ordena por fecha y filtra archivos faltantes.
- `saveRecordingFromUri`: guarda archivo fisico y metadato.
- `deleteStoredRecording`: elimina un audio y actualiza JSON.
- `clearStoredRecordings`: elimina todos los archivos y el metadato.

## Integracion con la pantalla

- En el montaje de `RecorderScreen`, se ejecuta la carga inicial de grabaciones guardadas.
- Cuando se confirma un nuevo nombre en el modal, se invoca `saveRecordingFromUri`.

## Archivos clave

- `src/services/recordingsService.ts`
- `src/types/recording.ts`
- `src/screens/RecorderScreen.tsx`
