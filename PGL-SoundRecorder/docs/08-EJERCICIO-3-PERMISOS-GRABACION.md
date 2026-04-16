# Ejercicio 3 - Solicitud de permisos antes de grabar

## Objetivo

Pedir permiso de microfono cada vez que el usuario intenta iniciar una nueva grabacion, y bloquear el inicio si no fue concedido.

## Como lo hice

1. Centralice la logica en la funcion `startRecording`.
2. Antes de crear la grabacion, solicite permisos con `Audio.requestPermissionsAsync()`.
3. Si `permission.granted` es false:
   - No inicio la grabacion.
   - Muestro mensaje para informar que debe habilitar el microfono.
4. Si el permiso es true:
   - Configuro modo de audio para grabacion.
   - Creo la grabacion con `Audio.Recording.createAsync`.

## Control de estados durante el permiso

- Uso `isRequestingPermission` para:
  - Evitar doble toque y llamadas simultaneas.
  - Mostrar feedback visual de que la app esta gestionando permisos.
- Durante este estado, el boton principal queda deshabilitado.

## Flujo resumido

1. Usuario pulsa `Grabar`.
2. La app solicita permiso.
3. Si no hay permiso -> mensaje y salida.
4. Si hay permiso -> comienza la grabacion.

## Archivos clave

- `src/screens/RecorderScreen.tsx`
