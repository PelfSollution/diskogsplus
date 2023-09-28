
# Diskogs Plus: Enriqueciendo tu experiencia en Discogs

Una aplicación web adaptable diseñada para amantes de la música en vinilo, DJs y coleccionistas que utilizan Discogs. Desarrollada con Next.js y TypeScript, esta herramienta ofrece un conjunto robusto de funcionalidades para mejorar la experiencia del usuario.

## Funcionalidades Principales:

- **Exploración de Tu Catálogo:** No solo puedes visualizar tu catálogo de Discogs, sino que también puedes acceder a detalles enriquecidos de cada álbum. Esto se logra mediante la integración con otras APIs como Last.fm (etiquetas, coincidencias con otros artistas similares, etc.), Spotify y OpenAI, con las cuales podrás generar portadas y ampliar información.

- **Mixtape Personal:** Crea tu propia "mixtape" seleccionando canciones de diferentes álbumes. Además, cuentas con la posibilidad de filtrar y ordenar las pistas por BPM, clave musical y escala Camelot, facilitando así la preparación de sesiones para DJs. Una vez satisfecho, podrás exportar esta mixtape directamente a tu cuenta de Spotify y compartirla en redes sociales.

- **Ask to DiscBOT:** Realiza preguntas relacionadas con un álbum específico y obtén respuestas por medio de inteligencia artificial.

- **Comparativa de Catálogos:** Compara tu colección de discos con la de otros usuarios. Descubre y escucha álbumes que no posees y añádelos fácilmente a tu "Wantlist".

## Futuras Funcionalidades:

- [ ] Soporte Multi-idioma.
- [ ] Notificaciones de conciertos en tu ciudad de artistas de tu colección.
- [ ] Implementación de next-auth junto con Supabase para usuarios que no posean una cuenta en Discogs (consultas generales de discos).
- [ ] Utilización de Langchain para una mejor gestión de LLM (agentes, contexto específico, memoria, prevención de alucinaciones, etc.).

## Estructura de Carpetas
```
diskogsplus/
┣ app/
┃ ┗ api/
┃   ┗ chat/
┃ ┃   ┗ route.ts
┣ components/
┃ ┣ ui/
┃ ┃ ┗ button.tsx
┃ ┣ CustomCircularProgress.tsx
┃ ┣ CustomHead.tsx
┃ ┣ CustomSnackbar.tsx
┃ ┣ Layout.tsx
┃ ┣ MixtapeRow.tsx
┃ ┣ TopNavBar.tsx
┃ ┣ TurnTable.tsx
┃ ┗ Turntable.module.css
┣ hooks/
┃ ┣ useCompareAlbumList.ts
┃ ┣ useGetAlbumData.ts
┃ ┣ useGetAlbumInfo.ts
┃ ┣ useGetAlbumList.ts
┃ ┣ useGetMixtape.ts
┃ ┗ useGetUserData.ts
┣ lib/
┃ ┣ cryptoUtils.ts
┃ ┣ musicnotation.ts
┃ ┣ stringUtils.ts
┃ ┣ supabase.ts
┃ ┗ utils.ts
┣ pages/
┃ ┣ albums/
┃ ┃ ┣ [id].tsx
┃ ┃ ┗ index.tsx
┃ ┣ api/
┃ ┃ ┣ albums/
┃ ┃ ┃ ┣ addToWantlist.ts
┃ ┃ ┃ ┣ albumData.ts
┃ ┃ ┃ ┣ albumInfo.ts
┃ ┃ ┃ ┣ catalog.ts
┃ ┃ ┃ ┣ compare.ts
┃ ┃ ┃ ┣ enrichArtistInfo.ts
┃ ┃ ┃ ┣ importWantlistFromDiscogs.ts
┃ ┃ ┃ ┗ removeFromWantlist.ts
┃ ┃ ┣ auth/
┃ ┃ ┃ ┣ callback/
┃ ┃ ┃ ┣ authorize.ts
┃ ┃ ┃ ┣ authorizeSpotify.ts
┃ ┃ ┃ ┣ identity.ts
┃ ┃ ┃ ┗ logout.ts
┃ ┃ ┣ images/
┃ ┃ ┃ ┗ generate.ts
┃ ┃ ┣ getApiKey.ts
┃ ┃ ┗ saveApiKey.ts
┃ ┣ 404.tsx
┃ ┣ _app.tsx
┃ ┣ _document.tsx
┃ ┣ _error.tsx
┃ ┣ chat.tsx
┃ ┣ dashboard.module.css
┃ ┣ dashboard.tsx
┃ ┣ index.tsx
┃ ┣ matching.tsx
┃ ┣ mixtape.tsx
┃ ┣ mixtapeplayer.tsx
┃ ┗ wantlist.tsx
┣ public/
┃ ┣ diskogs-logo.gif
┃ ┣ favicon.png
┃ ┣ img-404.png
┃ ┗ no-portada.gif
┣ services/
┃ ┣ last.fm/
┃ ┃ ┗ fetchData.ts
┃ ┣ openai/
┃ ┃ ┣ enrichArtistInfo.ts
┃ ┃ ┗ generateImageFromPrompt.ts
┃ ┣ spotify/
┃ ┃ ┣ getAccessToken.ts
┃ ┃ ┣ getAlbumId.ts
┃ ┃ ┣ getMostPopularAlbum.ts
┃ ┃ ┣ getSpotifyMixtape.ts
┃ ┃ ┣ getTrackAudioFeatures.ts
┃ ┃ ┣ getTrackId.ts
┃ ┃ ┗ getTracklistWithSpotifyIds.ts
┃ ┗ supabase/
┃   ┣ addChatLogs.ts
┃   ┣ addMixtape.ts
┃   ┣ addUser.ts
┃   ┣ addWantlistEntry.ts
┃   ┣ checkAlbumInWantlist.ts
┃   ┣ checkUserExists.ts
┃   ┣ deleteChatLogs.ts
┃   ┣ deleteFromMixtape.ts
┃   ┣ deleteMixtapeURL.ts
┃   ┣ deleteWantlistEntry.ts
┃   ┣ getArtistImageFromSupabase.ts
┃   ┣ getArtistInfoSupabase.ts
┃   ┣ getChatLogsUser.ts
┃   ┣ getLastChatLogForUser.ts
┃   ┣ getMixtape.ts
┃   ┣ getMixtapeURLs.ts
┃   ┣ getSongsFromSupabase.ts
┃   ┣ getUserChats.ts
┃   ┣ getWantlistItemsUser.ts
┃   ┣ imageService.ts
┃   ┣ saveArtistInfotoSupabase.ts
┃   ┣ saveMixtapeURL.ts
┃   ┗ updateChatLogs.ts
┣ styles/
┃ ┗ globals.css
┣ types/
┃ ┣ Mixtape.ts
┃ ┗ types.ts
┣ .env.local
┣ .env.local.sample
┣ .eslintrc.json
┣ .gitignore
┣ README.md
┣ components.json
┣ next-env.d.ts
┣ next.config.js
┣ package-lock.json
┣ package.json
┣ postcss.config.js
┣ tailwind.config.js
┣ tailwind.config.ts
┗ tsconfig.json
```
## Diagrama de Entidades y Relaciones (ER):
```
+-------------+       +---------------------+       +------------------+       +----------------+
|   users     |       |     mixtape_urls    |       |     mixtape     |        |    wantlist    |     
+-------------+       +---------------------+       +------------------+       +----------------+
| username(PK)|------>| username (FK)       |<----- | username (FK)    |<----- | username (FK)  |  
| email       |       | id (PK)             |       | id (PK)          |       | id (PK)        |
| openai_key  |       | mixtape_url         |       | disco_id         |       | disco_id       |
+-------------+       | fecha_creacion      |       | spotifytrackid   |       | notes          |
        |             | spotify_username    |       | artista          |       | rating         | 
        |             +---------------------+       | trackname        |       | created_at     |
        |                                           | tempo            |       | artista        |
        |                                           | key              |       | album          |
        |---------------------------------|         | mode             |       | image_url      |
                                          |         | duration         |       +----------------+
                                          |         +------------------+       
                                          |              
                                          |      
+-----------------------+       +-------------------+      +-------------------+
|   generated_images_   |       |     chat_logs     |      |   enrich_artist_  | 
|     metadata          |       +-------------------+      |     info          |      
+-----------------------+       | id (PK)           |      +-------------------+  
| id (PK)               |       | username (FK)     |      | id (PK)           |
| artista               |<------| prompt            |----->| artista           |
| image_url             |       | response          |      | album             |    
| generated_at          |       | created_at        |      | disco_id          |
+-----------------------+       | artista           |      | enriched_info     |
            |                   | album             |      | created_at        |
            |                   | disco_id          |      +-------------------+
            |----------------|  +-------------------+
                             |
+-----------------+       +-----------------+       +-----------------+
| storage.buckets |       | storage.objects |       | storage.migrate |
+-----------------+       +-----------------+       +-----------------+
| id (PK)         |<------| bucket_id (FK)  |       | id (PK)         |
| name            |       | id (PK)         |       | name            |
| owner           |<------| owner (FK)      |       | hash            |
| created_at      |       | name            |       | executed_at     |
+-----------------+       | created_at      |       +-----------------+
                          | updated_at      |
                          | last_accessed_at|
                          | metadata        |
                          +-----------------+


```
## Stack Tecnológico

- Frontend / Backend (API routes): Next.js (React)
- Estilos: MUI, TailwindCSS 
- Estado y Datos: Supabase (PostgreSQL), SWR.
- APIs: Discogs (disconnect lib.), Last.fm, Spotify, OpenAI.
- Models: Vercel AI SDK (GPT-3.5 + DALL·E 2).
- Deploy: Vercel.
- Otros: TypeScript, ESLint, Prettier, VS Code, Cursor, Github Copilot

## Inicialización del Proyecto

1 - Primero, instala las dependencias:

```bash
npm install
```
2 - Configurar las variables de entorno:

Modifica el archivo .env.local.sample con tus credenciales y renómbralo a .env.local

```
CONSUMER_KEY=<tu_clave_de_discogs>
CONSUMER_SECRET=<tu_clave_secreta_de_discogs>
BASE_URL=<tu_url_de_despliegue>
NEXT_PUBLIC_BASE_URL=<tu_url_de_despliegue>
CRYPT_KEY=<tu_clave_para_encrypt_dencript>
LASTFM_API_KEY=<tu_clave_de_lastfm>
OPENAI_API_KEY=<tu_clave_api_de_openai>
SPOTIFY_CLIENT_ID=<tu_id_de_spotify
SPOTIFY_CLIENT_SECRET=<tu_clave_secreta_de_spotify>
NODE_ENTORNO=development / production
SUPABASE_URL=<tu_url_de_supabase>
SUPABASE_ANON_KEY=<tu_clave_de_supabase>
```

3 - Inicia servidor de desarrollo:

```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) con tu navegador para ver el resultado.

4 - Deploy a Vercel:

Una forma sencilla de desplegar este proyecto es utilizar la plataforma Vercel. Ves a [https://vercel.com/signup](https://vercel.com/signup) y crea una cuenta. Una vez creada, haz click en el botón "New Project" y selecciona "Import Project". Selecciona el repositorio de Github y sigue los pasos. Una vez desplegado, puedes acceder a la aplicación desde la URL que te proporciona Vercel.

