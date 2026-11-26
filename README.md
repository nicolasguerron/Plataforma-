# Urología · Universidad del Valle

Plataforma web de la Universidad del Valle para la enseñanza de urología mediante
Aprendizaje Basado en Problemas. Diseño sobrio sobre fondo blanco, con bordes
redondeados y paleta azul marino, vino, bronce y gris.

## Contenido

- **Bienvenida** con un carrusel de fotos que cambia cada 5 segundos.
- **Metodología**: breve introducción al Aprendizaje Basado en Problemas y cómo funciona.
- **8 módulos**: Urolitiasis, Retención urinaria, Hematuria, Cáncer de próstata,
  Infección de vías urinarias, Disfunción eréctil, Incontinencia urinaria e
  Hiperplasia prostática.

Cada sección de la página de inicio ocupa una pantalla completa. Cada módulo incluye
escenario clínico, objetivos de aprendizaje, preguntas orientadoras, ruta de trabajo
con lista de verificación, recursos y un espacio de notas. El progreso y las notas se
guardan en el navegador de cada estudiante.

## Casos interactivos

El módulo de **Retención urinaria** incluye un caso interactivo (sin inteligencia
artificial) que recorre 6 etapas: anamnesis, examen físico, análisis y plan, sonda
vesical, punción suprapúbica y cierre.

- En la anamnesis y el examen físico el estudiante escribe preguntas abiertas. El
  paciente las reconoce por **palabras clave** y responde según el caso.
- Las decisiones se toman con opciones y formularios, y cada etapa termina con
  retroalimentación (✅ / 🟡 / ❌) y mensajes clave.
- Como no usa IA, solo reconoce las formas de preguntar previstas. Si una pregunta
  frecuente no se reconoce, agregue palabras a la expresión `p` del tema
  correspondiente en `assets/casos/retencion-urinaria.js`.
- El contenido del caso está en un archivo público: un estudiante con conocimientos
  técnicos podría leerlo en el código fuente.

Para agregar un caso a otro módulo: cree `assets/casos/<id>.js` siguiendo el mismo
formato, cárguelo con una etiqueta `<script>` en `index.html` y agregue
`caso: "<id>"` al módulo en la lista `MODULOS`.

## Archivos

```
index.html                 Página completa (estilos, contenido y lógica)
assets/logo-univalle.webp  Logo del membrete
assets/fotos/foto-1..4     Fotos del carrusel
assets/js/simulador.js     Motor de los casos interactivos (chat, opciones, formularios)
assets/casos/              Casos interactivos (uno por archivo)
```

## Uso

Abra `index.html` en cualquier navegador, manteniendo la carpeta `assets` junto a él.
No requiere instalación ni servidor. Para publicarlo, puede usar GitHub Pages
(Settings → Pages → rama y carpeta raíz).

## Editar el contenido

**Módulos:** el contenido está en la lista `MODULOS`, dentro de la etiqueta `<script>`
de `index.html` (sección **CONTENIDO EDITABLE**). Para cada módulo puede modificar
`escenario`, `objetivos`, `preguntas` y agregar `recursos`, por ejemplo:

```js
recursos: [
  { t: "Lectura recomendada", url: "https://..." }
]
```

**Fotos del carrusel:** reemplace los archivos de `assets/fotos/` o agregue más
elementos `<figure class="slide">` dentro de `<div class="carousel">` en `index.html`.
Para una foto muy panorámica, agregue la clase `completa` y la variable `--foto`
(vea la foto 4 como ejemplo) para mostrarla sin recortes.
