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
- Para cada imagen se creó una versión de baja resolución en `*_low.webp` al 30% de tamaño.
- La app carga primero la versión ligera y después cambia a la imagen completa en segundo plano.

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

Si además quieres mantener la misma optimización de imágenes, vuelve a comprimir los `.webp` y a generar sus versiones `*_low.webp` antes de regenerar el catálogo.

## Despliegue

El proyecto no necesita backend. Basta con subir los archivos estáticos al repositorio o servirlos desde cualquier hosting estático.
