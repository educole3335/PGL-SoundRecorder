# Arquitectura y flujo

## Resumen

La app es una grabadora de audio en React Native + Expo con una pantalla principal (`RecorderScreen`) que centraliza:

- captura de audio
- persistencia local de archivos
- persistencia de metadatos en JSON
- reproduccion de grabaciones
- interfaz animada

## Arquitectura de capas

1. Capa de UI

- `src/screens/RecorderScreen.tsx`: orquestacion principal.
- `src/components/RecordingCard.tsx`: cada elemento de audio guardado.
- `src/components/LoadingSpinner.tsx`: spinner animado de carga.

2. Capa de dominio

- `src/types/recording.ts`: contrato `StoredRecording`.

3. Capa de persistencia

- `src/services/recordingsService.ts`: lectura/escritura de metadatos y archivos.

## Flujo principal

### 1) Arranque

1. `App.tsx` renderiza `RecorderScreen`.
2. `RecorderScreen` configura audio en modo reproduccion.
3. Se cargan metadatos de grabaciones (`getStoredRecordings`).
4. La UI muestra estado vacio o lista de audios.

### 2) Grabacion y guardado

1. Usuario pulsa boton de grabar.
2. Se solicitan permisos de microfono.
3. Se configura modo de audio para grabacion.
4. Se inicia `Audio.Recording.createAsync`.
5. Al detener, se obtiene `sourceUri` y duracion.
6. Se prepara URI temporal en `pending-recordings`.
7. Se abre modal para nombre personalizado.
8. Al confirmar, `saveRecordingFromUri`:

- copia/mueve archivo a `documentDirectory/recordings`
- genera metadata (`id`, `title`, `createdAt`, etc.)
- persiste JSON en `recordings-metadata.json`

9. Se actualiza estado local y se limpia temporal.

### 3) Reproduccion

1. Usuario pulsa play en una tarjeta.
2. Se configura modo de audio para reproduccion.
3. Se crea `Audio.Sound` con la URI del archivo.
4. Se fuerza volumen maximo (`setVolumeAsync(1)`).
5. Callback de estado actualiza progreso de barra (`position/duration`).
6. Al terminar, se limpia estado de reproduccion.

### 4) Eliminacion

- Eliminacion individual: `deleteStoredRecording` elimina archivo y metadata.
- Eliminacion total: `clearStoredRecordings` elimina todos los archivos y el JSON de metadata.

## Persistencia local

- Archivos de audio: `FileSystem.documentDirectory + recordings/`
- Archivo de metadata: `FileSystem.documentDirectory + recordings-metadata.json`
- La app filtra entradas huerfanas (metadata sin archivo) durante la carga.
