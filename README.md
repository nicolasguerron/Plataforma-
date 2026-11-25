# Urología ABP · Universidad del Valle

Plataforma web (un solo archivo HTML) de la Universidad del Valle para la enseñanza
de urología mediante Aprendizaje Basado en Problemas (ABP). Diseño oscuro con la
paleta institucional (rojo Univalle) y el logo embebido en el membrete.

## Contenido

- **Bienvenida** breve.
- **Introducción al ABP** en ideas principales y los siete pasos.
- **8 módulos**: Urolitiasis, Retención urinaria, Hematuria, Cáncer de próstata,
  Infección de vías urinarias, Disfunción eréctil, Incontinencia urinaria e
  Hiperplasia prostática.

Cada módulo incluye escenario clínico, objetivos de aprendizaje, preguntas
orientadoras, ruta ABP con lista de verificación, recursos y un espacio de notas.
El progreso y las notas se guardan en el navegador de cada estudiante.

## Uso

Abra `index.html` en cualquier navegador. No requiere instalación ni servidor.
Para publicarlo, puede usar GitHub Pages (Settings → Pages → rama y carpeta raíz).

## Editar el contenido

Todo el contenido de los módulos está en la lista `MODULOS`, dentro de la etiqueta
`<script>` de `index.html` (sección **CONTENIDO EDITABLE**). Para cada módulo puede
modificar `escenario`, `objetivos`, `preguntas` y agregar `recursos`, por ejemplo:

```js
recursos: [
  { t: "Lectura recomendada", url: "https://..." }
]
```
