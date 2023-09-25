
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
┃ ┃ ┗ images/
┃ ┃   ┗ generate.ts
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
+-------------+       | mixtape_url         |       | disco_id         |       | disco_id       |
        |             | fecha_creacion      |       | spotifytrackid   |       | notes          | 
        |             | spotify_username    |       | artista          |       | rating         |
        |             +---------------------+       | trackname        |       | created_at     |
        |                                           | tempo            |       | artista        |
        |---------------------------------|         | key              |       | album          |
                                          |         | mode             |       | image_url      |
                                          |         | duration         |       +----------------+
                                          |         +------------------+      
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

- Frontend: Next.js
- Estilos: Emotion, MUI, TailwindCSS 
- Estado y Datos: Supabase, React Query, SWR.
- APIs: Discogs, Last.fm, Spotify, OpenAI.
- Deploy: Vercel.
- Otros: TypeScript, ESLint, Prettier, Husky, Lint-Staged, Commitlint, Vercel AI SDK.
- VS Code, Cursor, Github Copilot

## Inicialización del Proyecto

1 - Primero, instala las dependencias:

```bash
npm install
```
2 -Inicia servidor de desarrollo:

```bash
npm run dev
```
