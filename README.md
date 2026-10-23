# Diskogs Plus (v2.0)

**Enriqueciendo tu colección de Discogs y preparando tus sesiones de vinilo.**

Una aplicación web diseñada para coleccionistas de vinilo, selectores y DJs. Permite explorar tu catálogo de Discogs con información contextual enriquecida, escuchar pistas mediante un reproductor híbrido (Discogs, YouTube y Deezer), organizar y ordenar sesiones de DJ con datos armónicos (BPM y rueda Camelot), gestionar caras de vinilo físicas y utilizar a **DiscBOT** (con IA de Google Gemini) como selector inteligente para construir sets a partir de tus discos.

---

## 🚀 Funcionalidades Principales

- **Exploración Enriquecida de tu Catálogo:**
  - Visualización moderna de tu colección de Discogs con carátulas dinámicas interactivas (`VinylDisc`).
  - Metadatos biográficos y artistas similares integrados mediante **Last.fm**.
  - Tracklist completo con duraciones y posiciones físicas de cada prensaje.

- **Reproducción Híbrida de Audio:**
  - Reproductor con cola automática integrado en la ficha del disco y en las mixtapes.
  - Combina vídeos de Discogs, pistas oficiales «Artista - Topic» de **YouTube Music** y preescuchas de 30 segundos de **Deezer** sin requerir cuentas de pago.

- **Preparación de Sesiones y Mixtapes para DJs:**
  - **Múltiples mixtapes con nombre propio** para organizar distintas sesiones o sets.
  - **Detección de tempo y tono musical:** Detección automática de BPM, clave musical y escala armónica **Camelot** (mediante ReccoBeats y Deezer).
  - **Ordenación armónica automática:** Algoritmo que encadena tonalidades vecinas en la rueda Camelot y ordena por progresión de BPM (`lib/mixtapeOrder.ts`).
  - **Metadatos y ergonomía de vinilo:** Registro de caras y pistas (`A1`, `B2`), duración acumulada del set y **alertas visuales si colocas dos canciones consecutivas del mismo disco físico** (para evitar fallos en cabina si pinchas con una sola copia).

- **DiscBOT: Asistente y Selector con IA:**
  - Chat inteligente potenciado por **Google Gemini 2.5 Flash** (vía Vercel AI SDK).
  - Capacidad de consultar y analizar los vinilos de tu propia colección.
  - **Construcción de sesiones asistida (`build_session`):** Pídele un set temático (*ej: "prepárame una sesión soul de 1h entre 95 y 110 BPM"*) y DiscBOT seleccionará vinilos compatibles de tu colección, ordenará la sesión armónicamente y te permitirá guardarla directamente como mixtape con un clic.

- **Exportación de Mixtapes:**
  - Exportación directa de tus sesiones a playlists privadas de **Spotify** (actualizado a los endpoints de la API de 2026).

- **Comparador de Colecciones y Wantlist:**
  - Compara tu catálogo con el de otros usuarios de Discogs para descubrir joyas que no posees y añadirlas directamente a tu Wantlist sincronizada.

- **Persistencia Híbrida y Fiabilidad:**
  - Base de datos en la nube con **Supabase (PostgreSQL)** mediante arquitectura segura *server-only* (Service Role).
  - Respaldo automático offline en `localStorage` si no hay conexión o si Supabase no está configurado.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Framework Web** | [Next.js 16](https://nextjs.org/) (Pages Router + App Router para el streaming de chat) y [React 19](https://react.dev/) |
| **Lenguaje** | [TypeScript](https://www.typescriptlang.org/) |
| **Estilos & UI** | [Tailwind CSS](https://tailwindcss.com/) (prefijo `tw-`), componentes [shadcn/ui](https://ui.shadcn.com/), iconos [Lucide](https://lucide.dev/) |
| **Inteligencia Artificial** | Google Gemini 2.5 Flash (`@ai-sdk/google`, AI SDK v7) / OpenAI compatible |
| **Base de Datos** | [Supabase](https://supabase.com/) (PostgreSQL) con acceso restringido al servidor |
| **APIs Externas** | Discogs API (OAuth 1.0a), Last.fm API, YouTube Data API v3, Deezer API, ReccoBeats, Spotify Web API |
| **Entorno de Ejecución** | Node.js 24 LTS (configurado vía `.nvmrc` y `fnm`) |

---

## 📂 Estructura del Repositorio

```
diskogsplus/
├── app/                        # App Router (streaming y rutas globales)
│   ├── api/chat/route.ts       # Endpoint streaming del agente DiscBOT
│   └── global-not-found.tsx    # Pantalla 404 global
├── components/                 # Componentes reutilizables de UI
│   ├── album/                  # Tracklist, cabecera, acordeón bio y sidebar multimedia
│   ├── chat/                   # Renderizado de Markdown y herramientas de DiscBOT
│   ├── ui/                     # Primitivas accesibles shadcn/ui (Button, etc.)
│   ├── AppSidebar.tsx          # Navegación principal de la app
│   ├── VinylDisc.tsx           # Componente interactivo del disco de vinilo
│   └── CamelotChip.tsx         # Etiqueta visual para tonos de la rueda Camelot
├── docs/                       # Documentación técnica, diseño y roadmap detallado
│   ├── actualizacion_dependencias_2026.md
│   ├── balance_v2_y_roadmap.md
│   ├── design.md               # Sistema de diseño, paleta y tipografía
│   ├── roadmap.md              # Roadmap de fases y comparativa de audio
│   └── supabase.md             # Guía de configuración del esquema de base de datos
├── hooks/                      # Custom React Hooks (reproductores, mixtapes, datos)
├── lib/                        # Utilidades (Camelot, notas musicales, vinilo, cifrado, cliente IA)
├── pages/                      # Pages Router
│   ├── albums/                 # Catálogo y detalle de cada disco ([id].tsx)
│   ├── api/                    # Rutas de API internas (auth Discogs/Spotify, mixtapes, etc.)
│   ├── chat.tsx                # Interfaz de DiscBOT
│   ├── dashboard.tsx           # Panel de usuario y configuración
│   ├── mixtape.tsx             # Detalle y edición de una mixtape concreta
│   ├── mixtapes.tsx            # Índice de mixtapes y sesiones
│   └── wantlist.tsx            # Lista de deseos
├── services/                   # Clientes de integración externos y lógica de dominio
│   ├── agent/                  # Herramientas del agente y creador de sesiones
│   ├── audioFeatures/          # Extracción de BPM y claves musicales
│   ├── client/                 # Clientes fetch para el navegador
│   ├── discogs/                # Conexión con Discogs API
│   ├── last.fm/                # Metadatos biográficos
│   ├── local/                  # Almacenamiento fallback en localStorage
│   ├── spotify/                # Búsqueda y exportación a Spotify
│   ├── supabase/               # Consultas server-side a PostgreSQL
│   └── youtube/                # Playlists y búsqueda de vídeo
└── supabase/
    └── schema.sql              # Esquema DDL idempotente para la base de datos
```

---

## ⚙️ Instalación y Puesta en Marcha

### 1. Requisitos Previos

- **Node.js 22+** (recomendado **Node 24 LTS**). Si usas `fnm` o `nvm`:
  ```bash
  nvm use || fnm use
  ```

### 2. Instalación de Dependencias

```bash
npm install
```

> **Nota de seguridad:** El archivo `.npmrc` tiene configurado `ignore-scripts=true` y `save-exact=true` para proteger la cadena de suministro.

### 3. Configuración de Variables de Entorno

Copia el archivo de plantilla `.env.local.sample` a `.env.local`:

```bash
cp .env.local.sample .env.local
```

Rellena las claves necesarias:

```env
# URLs del entorno
BASE_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Cifrado local AES (32 caracteres recomendados)
CRYPT_KEY=tu_clave_secreta_para_cifrar_sesiones

# Discogs API (OAuth 1.0a)
CONSUMER_KEY=tu_consumer_key_de_discogs
CONSUMER_SECRET=tu_consumer_secret_de_discogs

# Google AI Studio (DiscBOT con Gemini 2.5 Flash)
GEMINI_API_KEY=tu_clave_de_gemini
GEMINI_MODEL=gemini-2.5-flash

# Last.fm API
LASTFM_API_KEY=tu_clave_lastfm

# YouTube Data API v3 (para completar pistas oficiales de audio)
YOUTUBE_API_KEY=tu_clave_de_youtube

# Supabase (server-only)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SECRET_KEY=tu_secret_key_de_supabase

# Spotify API (Opcional, para exportar mixtapes a Spotify)
SPOTIFY_CLIENT_ID=tu_client_id
SPOTIFY_CLIENT_SECRET=tu_client_secret
```

> 💡 **Tip para Spotify:** Si vas a probar la exportación a Spotify en local, Spotify ya no permite `localhost` como redirect URI. Configura `http://127.0.0.1:3000` en `BASE_URL` y añade `http://127.0.0.1:3000/api/auth/callback/spotify` en tu Spotify Developer Dashboard.

### 4. Base de Datos (Supabase)

Si vas a usar persistencia en Supabase, ejecuta el script SQL idempotente [`supabase/schema.sql`](./supabase/schema.sql) en el **SQL Editor** de tu proyecto Supabase. La guía completa se detalla en [`docs/supabase.md`](./docs/supabase.md).

### 5. Iniciar en Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) (o `http://127.0.0.1:3000` si pruebas Spotify) en tu navegador.

---

## 🧪 Verificación y Comandos

- **Comprobar tipos TypeScript:**
  ```bash
  npx tsc --noEmit
  ```
- **Comprobar linter:**
  ```bash
  npm run lint
  ```
- **Compilar para producción:**
  ```bash
  npm run build
  ```

---

## 📖 Documentación Adicional

Para consultar los detalles de arquitectura y el trabajo en curso, revisa los documentos dentro de [`docs/`](./docs/):

* [**`docs/roadmap.md`**](./docs/roadmap.md): Hoja de ruta por fases, comparativa de servicios de audio y tareas activas.
* [**`docs/design.md`**](./docs/design.md): Guía de diseño de la v2.0 (paleta cromática, tipografías y componentes).
* [**`docs/balance_v2_y_roadmap.md`**](./docs/balance_v2_y_roadmap.md): Balance detallado del paso de v1 a v2.
* [**`docs/supabase.md`**](./docs/supabase.md): Auditoría de seguridad y configuración de base de datos.
* [**`docs/actualizacion_dependencias_2026.md`**](./docs/actualizacion_dependencias_2026.md): Plan de dependencias y actualización a Node 24.
