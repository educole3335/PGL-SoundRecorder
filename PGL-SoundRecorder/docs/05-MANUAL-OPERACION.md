# Manual de operacion y mantenimiento

## Requisitos

- Node.js + npm
- Expo CLI (via `npx expo`)
- Dispositivo o emulador Android/iOS

## Ejecucion

1. Instalar dependencias:

```bash
npm install
```

2. Iniciar proyecto:

```bash
npm run start
```

3. Abrir en Android/iOS:

```bash
npm run android
npm run ios
```

## Estructura relevante

- `App.tsx`
- `src/screens/RecorderScreen.tsx`
- `src/components/RecordingCard.tsx`
- `src/components/LoadingSpinner.tsx`
- `src/services/recordingsService.ts`
- `src/types/recording.ts`

## Operaciones tecnicas

### Limpiar datos de grabaciones

- Desde UI: boton "Borrar todos".
- Programaticamente: `clearStoredRecordings()`.

### Diagnostico rapido

1. No guarda audio:

- Revisar permisos de microfono.
- Revisar errores en consola al confirmar nombre.
- Verificar existencia de `documentDirectory`.

2. No reproduce:

- Verificar que `recording.uri` exista.
- Revisar callback `setOnPlaybackStatusUpdate`.

3. Volumen bajo:

- La app pone volumen maximo en `playRecording`.
- Revisar volumen fisico del dispositivo.
- Verificar que no haya salida de audio externa (bluetooth/earpiece).

## Buenas practicas de evolucion

1. Agregar tests unitarios para `recordingsService`.
2. Extraer constantes visuales en un tema compartido.
3. Añadir confirmacion modal para "Borrar todos".
4. Añadir soporte de pausa/reanudar reproduccion si se requiere UX avanzada.
