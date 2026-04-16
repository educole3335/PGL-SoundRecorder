# Ejercicio 5 - Componente propio de carga y uso en 2 puntos criticos

## Objetivo

Crear un componente propio de carga (spinner o animacion) e integrarlo en dos procesos importantes:

- Carga inicial de grabaciones.
- Proceso de grabacion/guardado.

## Como lo hice

1. Cree el componente reutilizable `LoadingSpinner`.
2. Le di una animacion propia combinando:
   - Rotacion continua (`spinValue`).
   - Efecto pulso (`pulseValue`) en escala y opacidad.
3. Lo hice configurable con props:
   - `label`
   - `color`
   - `size`

## Donde lo implemente

### 1) Carga inicial de grabaciones

- En `RecorderScreen`, dentro de `renderContent`:
  - Si `isLoadingInitial` es true, se muestra `LoadingSpinner` con etiqueta `Cargando grabaciones`.

### 2) Durante grabacion/guardado

- En el boton principal de grabacion:
  - Si `isRequestingPermission` o `isSaving` son true, se reemplaza el icono por `LoadingSpinner`.
- Esto comunica claramente al usuario que la accion sigue en proceso.

## Archivos clave

- `src/components/LoadingSpinner.tsx`
- `src/screens/RecorderScreen.tsx`

