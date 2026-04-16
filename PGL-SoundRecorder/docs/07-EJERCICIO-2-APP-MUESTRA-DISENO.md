# Ejercicio 2 - Aplicacion que muestra el diseno solicitado

## Objetivo

Crear una app funcional que muestre en pantalla el diseno de la grabadora construido en el ejercicio anterior.

## Como lo hice

1. Defini la pantalla de grabacion como pantalla principal en `RecorderScreen`.
2. En el punto de entrada de la aplicacion (`App.tsx`) renderice directamente esa pantalla.
3. Organice la interfaz en secciones para que el diseno se vea claro:
   - Hero de grabacion (titulo, boton, timer, indicador visual).
   - Seccion de lista de grabaciones.
   - Mensaje de estado en footer.

## Estructura visual aplicada

- Contenedor general con `SafeAreaView` para respetar areas seguras.
- Tarjeta central con esquinas redondeadas y sombra para dar jerarquia.
- Boton principal circular de grabacion en el centro.
- Lista de audios con tarjetas individuales (`RecordingCard`).
- Modal para nombrar la grabacion antes de guardarla.

## Flujo de render

1. `App.tsx` monta `RecorderScreen`.
2. `RecorderScreen` evalua estado de carga inicial:
   - Si esta cargando, muestra componente de carga.
   - Si termino, muestra el diseno completo.
3. La UI reacciona al estado en tiempo real (grabando, reproduciendo, vacio, con datos).

## Archivos clave

- `App.tsx`
- `src/screens/RecorderScreen.tsx`
- `src/components/RecordingCard.tsx`
- `src/components/LoadingSpinner.tsx`

