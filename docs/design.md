# Sistema de diseño de Diskogs Plus

> Reglas visuales para que todas las pantallas se vean como una sola app.
> Si algo no encaja en estas reglas, se cambia este documento antes que el código.

---

## 1. Principios

1. **Un color para la acción, otro para el vinilo.** El morado (`brand`) marca lo que se puede hacer: botones, enlaces, pista activa. El ámbar (`vinyl`) es solo de la mixtape y del tocadiscos. Todo lo demás va en grises.
2. **El color también informa.** Los colores de la rueda Camelot se usan solo para la tonalidad, nunca como decoración.
3. **Una sola lista por cosa.** Cada dato aparece en un sitio. Por ejemplo, el tracklist de la ficha es a la vez lista de reproducción, ficha DJ (BPM y Camelot) y botón de mixtape.
4. **Menos botones con texto.** Las acciones que se repiten en cada fila son iconos redondos con `title` y `aria-label`.

---

## 2. Color

Definidos en `tailwind.config.js` (`theme.extend.colors`). Recuerda el prefijo `tw-`.

| Token | Escala | Uso |
| :-- | :-- | :-- |
| `brand` | `colors.purple` | Acción principal, enlaces, pista o pestaña activa, foco, etiquetas de género. |
| `vinyl` | `colors.amber` | Mixtape: botón `+`/`✓` de la mixtape, Mixtape Player, cola y página de la mixtape. |
| `gray` | Tailwind | Texto, bordes, fondos, botones secundarios. |
| `red` | Tailwind | **Solo** para borrar, cerrar sesión y errores. |
| Camelot | `PITCH_CLASS_COLORS` en `lib/musicNotation.ts` | Etiquetas de tonalidad. Usa `getCamelotColor()`, que ya incluye el texto blanco. |

> No uses `accent` como nombre de color: es un token de shadcn (`hsl(var(--accent))`) y pisa cualquier escala con ese nombre.
> No uses `blue`, `green`, `emerald` ni `orange` en componentes nuevos.

### Tonos de referencia

| Elemento | Claro | Oscuro (`dark:`) |
| :-- | :-- | :-- |
| Fondo de página | `gray-100` (en `components/Layout.tsx`) | sin definir todavía (pendiente: `gray-900`) |
| Tarjeta | `bg-white` + `border-gray-200` | `bg-gray-800` + `border-gray-700` |
| Texto principal | `text-gray-900` | `text-white` |
| Texto secundario | `text-gray-500` | `text-gray-400` |
| Botón principal | `bg-brand-600` → hover `bg-brand-700` | igual |
| Fondo de elemento activo | `bg-brand-50` | `bg-brand-950/40` |
| Texto de elemento activo | `text-brand-700` | `text-brand-300` |
| Botón de mixtape activo | `bg-vinyl-500` → hover `bg-vinyl-600` | igual |

---

## 3. Tipografía

Fuente del sistema (la *sans* por defecto de Tailwind). No hay fuentes web.

| Rol | Clases |
| :-- | :-- |
| Título de página | `text-2xl font-bold` (`md:text-3xl font-extrabold tracking-tight` en la ficha del disco) |
| Título de tarjeta | `text-base font-bold` |
| Texto | `text-sm` |
| Metadatos y etiquetas | `text-xs` |
| Sobretítulo (formato, sección) | `text-xs font-semibold uppercase tracking-wider text-brand-600` o `text-[11px] … text-gray-400` |

Textos en castellano. Títulos en minúscula salvo la primera letra ("Escuchar el disco", "Más vídeos"), excepto nombres propios.

---

## 4. Espaciado y forma

- Contenedor: `container mx-auto max-w-6xl p-4 md:p-6`.
- Ficha del disco: rejilla de 12 columnas, 7 + 5 en `lg`. La columna derecha es `sticky top-4`.
- Separación entre tarjetas: `space-y-4` o `mt-3`.
- Radios: tarjeta `rounded-2xl`, botón y campo `rounded-xl`, chip `rounded-lg` o `rounded-full`, botón de icono `rounded-full`.
- Sombras: `shadow-sm` en tarjetas y botones; nada más fuerte salvo el deck oscuro del Mixtape Player.

---

## 5. Componentes

### Tarjeta
```html
<div class="tw-bg-white dark:tw-bg-gray-800 tw-rounded-2xl tw-border tw-border-gray-200 dark:tw-border-gray-700 tw-shadow-sm">
```
Cabecera: icono Lucide `w-5 h-5 text-brand-600` + título `font-bold text-base` + dato secundario `text-xs text-gray-500` opcional. Si es plegable, `ChevronDown` gris a la derecha.

### Botones
| Tipo | Clases |
| :-- | :-- |
| Principal | `bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm px-4 py-2 rounded-xl shadow-sm` |
| Secundario | `border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50` |
| Discreto | `bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-xs px-3 py-1.5 rounded-lg` (compartir, filtros) |
| Peligro | `text-red-600 hover:bg-red-50` (solo borrar y salir) |
| Icono | `w-8 h-8 rounded-full flex items-center justify-center`, siempre con `title` y `aria-label` |
| Interruptor activo/inactivo | Activo relleno `bg-brand-600 text-white`; inactivo como secundario (p. ej. wantlist) |

### Chips
- Género: `bg-brand-50 text-brand-700 border border-brand-200 rounded-full text-xs`.
- Etiqueta de Last.fm: `bg-gray-100 text-gray-600 rounded-full text-xs`, con `#`.
- Camelot: `${getCamelotColor(code)} font-bold px-1.5 rounded text-xs`.
- BPM: texto `font-medium text-gray-700`, sin fondo.
- Fuente del audio: `text-[10px] uppercase tracking-wide text-gray-400`.

### Fila de pista (`AlbumTracklist`)
`[ posición / ▶ ]  título + duración · BPM · Camelot · fuente  [ + / ✓ ]`
- El círculo de la izquierda muestra la posición (A1…) y un ▶ al pasar el ratón; en la pista actual, fondo `brand-600` con ▶/⏸.
- Fila actual: `bg-brand-50`. Pista sin audio: posición en `text-gray-300`, sin hover.
- Botón de mixtape a la derecha: `+` con borde gris → `✓` relleno `vinyl-500`.

### Reproductor
- Ficha del disco: el estado vive en `hooks/useAlbumPlayer.ts` y lo comparten `AlbumTracklist` (play por pista) y `AlbumMediaSidebar` (vídeo, controles, "Más vídeos").
- Vídeo siempre en `aspect-video`, nunca en una tira de altura fija.
- Controles: anterior y siguiente como iconos grises; play/pausa redondo relleno (`brand-600` en la ficha, `vinyl-500` en el Mixtape Player).
- Si suena una preview de Deezer, capa oscura encima del vídeo con un disco girando y "Preview de 30 s · Deezer".

### Mixtape Player
Única pantalla con fondo oscuro (`from-gray-900 to-gray-950`). Vinilo girando con galleta en degradado `from-vinyl-600 to-brand-600` y el nombre del artista (`line-clamp-2`). Cola a la derecha con la pista actual en `vinyl`.

---

## 6. Iconos

Lucide (`lucide-react`). Tamaños: `w-5 h-5` en cabeceras, `w-4 h-4` en botones, `w-3.5 h-3.5` en chips. Iconos de sección en `text-brand-600` (o `text-vinyl-500` en la mixtape).

---

## 7. Modo oscuro

Por clase (`darkMode: ["class"]`). Cada color de fondo, texto o borde lleva su pareja `dark:`; usa las equivalencias de la tabla del §2. Para fondos tintados en oscuro, la escala `950` con opacidad (`dark:tw-bg-brand-950/40`).

---

## 8. Pendiente

- Nombre y logo propios: el logo actual imita el de Discogs.
- Unificar Home, Matching, Dashboard y DiscBOT con el patrón de tarjeta y cabecera del §5.
- Reproductor global flotante (roadmap, fase 1) con los mismos controles.
