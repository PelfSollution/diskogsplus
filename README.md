
# Diskogs Plus: Enriqueciendo tu experiencia en Discogs

Una aplicación web responsiva creada para los amantes de la música que usan Discogs. Desarrollada con Next.js y TypeScript, esta herramienta proporciona un conjunto robusto de funcionalidades para enriquecer la experiencia del usuario.

## Funcionalidades Principales:

- Exploración de Catálogo: No sólo puedes visualizar tu catálogo de Discogs, sino que también puedes acceder al detalle de cada álbum con información enriquecida a partir de otras APIs como Last.fm, Spotify y OpenAI.

- Mixtape Personal: Crea tu propia mixtape seleccionando canciones de diferentes álbumes. También puedes filtrar y ordenar las canciones por BPM, clave y escala camelot para facilitar el trabajo a los DJs preparando listas para tus sessiones. Una vez que estés satisfecho, puedes exportar esta mixtape como una lista directamente a tu cuenta de Spotify y compartir en redes sociales.

- Comparativa de Catálogos: Compara tu colección de discos con la de otros usuarios. Descubre y escucha álbumes que no posees y agrégales fácilmente a tu Wantlist.

## Futuras Funcionalidades (Roadmap):

- [x] Gen-D: Una característica que utiliza inteligencia artificial para generar álbumes que nunca existieron. 

- [x] Herramientas para DJs: Filtra y ordena canciones por características esenciales para DJs, como BPMs, armonía y color de los temas.

- [x] Ask to Album: Haz preguntas relacionadas con un álbum específico y recibe respuestas mediante inteligencia artificial.

## Usuario DEMO Discogs

- user: diskogsplus
- pass: diskogsplus

ejemplo user para matching: dayats 

## Estructura de Carpetas
```
diskogsplus/
┣ .next/
┣ app/
┃ ┗ api/
┃   ┗ chat/
┣ components/
┃ ┣ ui/
┃ ┃ ┗ button.tsx
┃ ┣ CustomCircularProgress.tsx
┃ ┣ CustomHead.tsx
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
┃ ┃ ┣ auth/
┃ ┃ ┗ images/
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
┃ ┣ spotify.tsx
┃ ┗ supabasetest.tsx
┣ public/
┃ ┣ diskogs-logo.gif
┃ ┣ favicon.png
┃ ┣ next.svg
┃ ┣ no-portada.gif
┃ ┗ vercel.svg
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
┃   ┣ deleteChatLogs.ts
┃   ┣ deleteFromMixtape.ts
┃   ┣ deleteMixtapeURL.ts
┃   ┣ getArtistImageFromSupabase.ts
┃   ┣ getChatLogsUser.ts
┃   ┣ getLastChatLogForUser.ts
┃   ┣ getMixtape.ts
┃   ┣ getMixtapeURLs.ts
┃   ┣ getSongsFromSupabase.ts
┃   ┣ getUserChats.ts
┃   ┣ imageService.ts
┃   ┣ saveMixtapeURL.ts
┃   ┗ updateChatLogs.ts
┣ styles/
┃ ┗ globals.css
┣ types/
┃ ┗ Mixtape.ts
┣ .env.local
┣ .env.local.sample
┣ .eslintrc.json
┣ .gitignore
┣ README.md
┣ components.json
┣ functions.jsonl
┣ next-env.d.ts
┣ next.config.js
┣ package-lock.json
┣ package.json
┣ postcss.config.js
┣ sampleData.jsonl
┣ tailwind.config.js
┣ tailwind.config.ts
┗ tsconfig.json
```
## Diagrama de Entidades y Relaciones (ER):
```
+-------------+       +---------------------+       +------------------+
|   users     |       |     mixtape_urls    |       |      mixtape     |
+-------------+       +---------------------+       +------------------+
| username(PK)|------>| username (FK)       |<----- | username (FK)    |
| email       |       | id (PK)             |       | id (PK)          |
+-------------+       | mixtape_url         |       | discogsalbumid   |
                      | fecha_creacion      |       | spotifytrackid   |
                      | spotify_username    |       | artistname       |
                      +---------------------+       | trackname        |
                                                    | tempo            |
                                                    | key              |
                                                    | mode             |
                                                    | duration         |
                                                    +------------------+

+-----------------------+       +-------------------+
|   generated_images_   |       |     chat_logs     |
|     metadata          |       +-------------------+
+-----------------------+       | id (PK)           |
| id (PK)               |       | username (FK)     |
| artist_name           |<------| prompt            |
| image_url             |       | response          |
| generated_at          |       | created_at        |
+-----------------------+       | artista           |
                                | album             |
                                | disco_id          |
                                +-------------------+

+-----------------+       +-----------------+       +-----------------+
|  storage.buckets|       | storage.objects |       | storage.migrate |
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

- Frontend: Next.js
- Estilos: Emotion, MUI, TailwindCSS 
- Estado y Datos: Supabase, React Query, SWR.
- APIs: Discogs, Last.fm, Spotify, OpenAI.
- Deploy: Vercel.
- Otros: TypeScript, ESLint, Prettier, Husky, Lint-Staged, Commitlint, Vercel AI SDK.


## Inicialización del Proyecto

1 - Primero, instala las dependencias:

```bash
npm install
```
2 -Inicia servidor de desarrollo:

```bash
npm run dev
```
