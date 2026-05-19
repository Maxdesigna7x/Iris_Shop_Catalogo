# Iris_Shop_Catalogo

Catálogo web estático para mostrar colecciones, piezas destacadas, reseñas y un carrusel visual de productos.

## Qué es la página

Es una tienda tipo catálogo pensada para navegar imágenes de forma rápida y visual. La portada muestra una selección destacada y, más abajo, aparecen categorías y secciones con productos agrupados. Cada imagen se puede abrir en un visor modal para verla con más detalle.

## Cómo está hecha

- `index.html` contiene la estructura principal de la página.
- `styles.css` define el diseño, la disposición responsive y los estados visuales.
- `app.js` arma la interfaz a partir de los datos y maneja los modales, carruseles y la carga progresiva de imágenes.
- `catalog-data.js` y `catalog-data.json` se generan automáticamente desde los archivos dentro de `assets/`.
- `scripts/generate_catalog.py` recorre las carpetas de imágenes y construye el catálogo.

Optimización de imágenes:

- Las imágenes principales se recomprimieron a WebP con calidad 75.
- Si algún archivo fuente sigue en `jpg`, `jpeg`, `png`, `gif` o `avif`, el script lo convierte a `webp` y elimina el original.
- Para cada imagen se creó una versión de muy baja resolución en `*_ultra_low.webp` al 10% de tamaño y calidad 30.
- Para cada imagen se creó una versión de baja resolución en `*_low.webp` al 30% de tamaño.
- La app carga primero `*_ultra_low.webp`, después `*_low.webp` y finalmente la imagen completa en segundo plano.
- En conexiones lentas o con ahorro de datos, la descarga de la imagen completa se retrasa para priorizar la carga inicial.

## Cómo se usa

1. Abre `index.html` en un navegador moderno.
2. Navega la portada y las secciones del catálogo.
3. Haz clic en una imagen para verla en tamaño ampliado.
4. Haz clic en una categoría para abrir sus piezas relacionadas.

## Cómo actualizar el catálogo

Si agregas, quitas o cambias imágenes dentro de `assets/`, vuelve a generar los datos con:

```bash
python3 scripts/generate_catalog.py
```

Si quieres regenerar las versiones `*_ultra_low.webp` y `*_low.webp`, ejecuta primero:

```bash
python3 scripts/generate_image_derivatives.py
```

Si además quieres mantener la misma optimización de imágenes, vuelve a comprimir los `.webp` y a generar sus versiones `*_ultra_low.webp` y `*_low.webp` antes de regenerar el catálogo.

## Git rápido

Para hacer `add + commit + push` en un solo paso:

```bash
./scripts/git_commit_push.sh "mensaje del commit"
```

El script ignora `scripts/__pycache__/` para no arrastrar artefactos generados.

## Despliegue

El proyecto no necesita backend. Basta con subir los archivos estáticos al repositorio o servirlos desde cualquier hosting estático.
