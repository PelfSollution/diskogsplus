# Sistema de diseño de Diskogs Plus

> Reglas visuales para que todas las pantallas se vean como una sola app.
> Si algo no encaja en estas reglas, se cambia este documento antes que el código.
> Rediseño de octubre de 2026: claro, sobrio y con el vinilo como detalle propio.
> Boceto de referencia: lienzo «Diskogs+ rediseño claro» (mixtape, ficha del disco y reproductor móvil).

---

## 1. Principios

1. **Claro y sobrio.** Fondo blanco, grises piedra cálidos y un solo acento verde. Nada de tarjetas con sombra por todas partes: listas y tablas limpias separadas por líneas finas.
2. **El color lo ponen las portadas.** Las carátulas (miniaturas, galletas del vinilo, tinte de la cabecera de la ficha) son la fuente principal de color. La interfaz no compite con ellas.
3. **El color también informa.** Los colores de la rueda Camelot se usan solo en la etiqueta de tonalidad, nunca en avatares ni como decoración.
4. **El vinilo es la firma.** La portada dentro de la galleta del vinilo (`VinylDisc`) aparece en el logo, la mixtape, la ficha, el reproductor, la colección y las cargas.
5. **Una sola lista por cosa** y **menos botones con texto**: las acciones que se repiten en cada fila son iconos con `title` y `aria-label`.

---

## 2. Color

Definidos en `tailwind.config.js` (`theme.extend.colors`). Recuerda el prefijo `tw-`.

| Token | Escala | Uso |
| :-- | :-- | :-- |
| `gray` | `colors.stone` (cálidos) | Texto, fondos, bordes, botones secundarios. Todo `gray-*` es piedra. |
| `brand` | Verde propio, `brand-600` = `#3E7F0A` | Acción principal (botón relleno con texto blanco, contraste 4,95:1), pista actual, progreso, foco, sobretítulos (`brand-700`). |
| `vinyl` | La escala `brand` desplazada un paso | Solo por compatibilidad. **No usar en código nuevo.** |
| `red` | Tailwind | **Solo** para borrar, cerrar sesión y errores. |
| Camelot | `getCamelotHex()` / `PITCH_CLASS_COLORS` en `lib/musicNotation.ts` | Etiquetas de tonalidad, siempre con `CamelotChip`. |

> No uses `accent` como nombre de color: es un token de shadcn.
> No uses `blue`, `orange`, `purple`, `amber` ni degradados en componentes nuevos.

### Tonos de referencia

| Elemento | Clases |
| :-- | :-- |
| Fondo de página | `bg-white` (el `Layout` ya lo pone) |
| Barra lateral | `bg-gray-50` + `border-r border-gray-200` |
| Línea entre filas | `border-b border-gray-100` (cabeceras de tabla: `border-gray-200`) |
| Texto principal / secundario | `text-gray-900` / `text-gray-500` (mínimo `gray-500` en texto pequeño) |
| Fila actual | `bg-brand-50`, título `text-brand-800` |
| Aviso informativo | `bg-brand-50 border-brand-100 text-brand-900` |
| Cabecera de la ficha | Tinte de la portada: `useCoverTint()` (color medio mezclado al 80 % con blanco) sobre `bg-gray-50` |

---

## 3. Tipografía

`next/font` en `pages/_app.tsx`: **Inter** (`font-sans`) para todo y **JetBrains Mono** (`font-mono`) para datos técnicos: posición en el vinilo (A1), BPM en etiquetas y códigos Camelot.

| Rol | Clases |
| :-- | :-- |
| Sobretítulo de página | `text-xs font-semibold uppercase tracking-wider text-brand-700` («MIXTAPE», «COLECCIÓN») |
| Título de página | `text-3xl md:text-4xl font-bold tracking-tight` |
| Título de sección | `text-lg font-bold` (cara del vinilo: `text-[15px] font-bold`) |
| Texto | `text-sm` / `text-[15px]` en el chat |
| Metadatos | `text-[13px] text-gray-500` o `text-xs` |
| Números en columnas | `tabular-nums` |

Textos en castellano. Títulos en minúscula salvo la primera letra («Artistas similares»), excepto nombres propios.

---

## 4. Estructura y espaciado

- **Layout** (`components/Layout.tsx`): barra lateral fija de 256 px en `lg` (`AppSidebar`: navegación, «Mis mixtapes», sesión); en el móvil, barra superior con el logo y un panel lateral.
- Contenido: `max-w-6xl mx-auto px-4 md:px-10 py-8 md:py-10` (colección y wantlist: `max-w-7xl`).
- Cabecera de página: sobretítulo + título + resumen a la izquierda, filtros o acciones a la derecha (`flex flex-wrap items-end justify-between`).
- Radios: botón `rounded-full`; campo y botón pequeño `rounded-lg`; panel `rounded-xl`/`rounded-2xl`; portada `rounded-md`; miniatura `rounded`.
- Sombras: solo en portadas y vinilos. Paneles y tablas, sin sombra.

---

## 5. Componentes

### VinylDisc (`components/VinylDisc.tsx`)
Vinilo con surcos y brillo. Props: `size` (px o `"fill"`), `cover` (portada en la galleta), `covers` (mosaico 2×2 en la mixtape), `labelColor`, `spinning`, `paused`, `flat` (sin sombra, para iconos). Crea su propia capa (`isolation: isolate`) para no pintarse sobre lo que lo tape. Respeta `prefers-reduced-motion`.

### Botones
| Tipo | Clases |
| :-- | :-- |
| Principal | `h-11 px-5 rounded-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold` |
| Secundario | `h-11 px-4 rounded-full border border-gray-200 bg-white text-sm font-medium hover:bg-gray-50` |
| Pequeño / filtro | `h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm` |
| Icono | `w-8 h-8 rounded-lg` (o `rounded-full`), con `title` y `aria-label` |
| Peligro | `hover:text-red-600 hover:bg-red-50` (solo quitar y borrar) |
| Añadir a la mixtape | `+` con borde gris → `✓` relleno `bg-brand-600` |

### Etiquetas
- **Camelot** (`CamelotChip`): fondo del color de la tonalidad al 12 %, borde al 35 %, punto sólido y código en `font-mono`; texto `gray-800`.
- **Cara del vinilo** (A1) y **BPM**: `font-mono text-xs font-semibold bg-gray-100 border border-gray-200 rounded-md px-1.5`.
- **Género / sello**: `bg-white border border-gray-200 rounded-full text-xs`. Etiquetas de Last.fm: `bg-black/5`, con `#`.

### Tabla de la mixtape (`MixtapeRow`, `MIXTAPE_GRID`)
`[# / ▶] [portada · pista · artista] [disco] [cara] [BPM] [tono] [duración] [arrastrar · quitar]`. En el móvil, cara, BPM y tono bajo el título, y flechas en lugar del asa. Aviso de mismo disco entre filas (`sameRecordWarning`).

### Tracklist de la ficha (`AlbumTracklist`)
Agrupado por **Cara A / Cara B** con la duración de cada cara. Fila: posición/▶, título, BPM, `CamelotChip`, duración y `+`.

### Cuadrícula de portadas (`AlbumCoverCard`, `COVER_GRID`)
Portada cuadrada, título y artista debajo; al pasar el ratón, el vinilo asoma por la derecha.

### Reproductores
- **Ficha**: funda delante y vinilo asomando con la portada en la galleta; gira mientras suena (`AlbumCoverFlip`).
- **Mixtape** (`/mixtapeplayer`): vinilo grande con la portada de la pista y brazo del tocadiscos, controles en verde, tarjeta «Siguiente» con `encaja`/`salto` (`camelotCompatible`) y cola con miniaturas.

### DiscBOT (`/chat`)
Cabecera con el contexto (disco, mixtape o colección), respuestas sin burbuja con `ChatMarkdown`, etiquetas de herramientas («Consultando Discogs…»), mensajes del usuario en burbuja `bg-gray-100`, campo de texto que crece.

### Estados vacíos y errores
Panel `border-dashed border-gray-300 rounded-2xl` con un vinilo o icono, título, una frase y un botón principal. Errores: `ErrorScreen` (`pages/404.tsx`, `pages/_error.tsx`). Las URL inexistentes las sirve el App Router con `app/global-not-found.tsx` (flag `experimental.globalNotFound` en `next.config.js`), que repite el mismo diseño con sus propios estilos y fuentes.

---

## 6. Iconos

Lucide (`lucide-react`). `w-4 h-4` en botones, `w-[18px]` en la navegación, `w-5 h-5` en cabeceras. Sin emojis en la interfaz.

---

## 7. Modo oscuro

No se usa: la app es clara. Las clases `dark:` antiguas no hacen nada (no se activa la clase `dark`); no hace falta añadirlas en código nuevo.

---

## 8. Pendiente

- Reproductor global fijo abajo (roadmap): seguir escuchando al navegar.
- Retirar del todo la escala `vinyl` y las clases `dark:` antiguas.
