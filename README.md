
# Diskogs Plus: Enriqueciendo tu experiencia en Discogs

Una aplicación web responsiva creada para los amantes de la música que usan Discogs. Desarrollada con Next.js y TypeScript, esta herramienta proporciona un conjunto robusto de funcionalidades para enriquecer la experiencia del usuario.

## Funcionalidades Principales:

- Exploración de Catálogo: No sólo puedes visualizar tu catálogo de Discogs, sino que también puedes acceder al detalle de cada álbum con información enriquecida a partir de otras APIs como Last.fm, Spotify y OpenAI.

- Mixtape Personal: Crea tu propia mixtape seleccionando canciones de diferentes álbumes. También puedes filtrar y ordenar las canciones por BPM, clave y escala camelot para facilitar el trabajo a los DJs preparando listas para tus sessiones. Una vez que estés satisfecho, puedes exportar esta mixtape como una lista directamente a tu cuenta de Spotify y compartir en redes sociales.

- Comparativa de Catálogos: Compara tu colección de discos con la de otros usuarios. Descubre y escucha álbumes que no posees y agrégales fácilmente a tu Wantlist.

## Futuras Funcionalidades (Roadmap):

- [ ] Gen-D: Una característica que utiliza inteligencia artificial para generar álbumes que nunca existieron. Una aventura musical como ninguna otra.

- [x] Herramientas para DJs: Filtra y ordena canciones por características esenciales para DJs, como BPMs, armonía y color de los temas.

- [ ] Ask to Album: Haz preguntas relacionadas con un álbum específico y recibe respuestas mediante inteligencia artificial.

## Usuario DEMO Discogs

- user: diskogsplus
- pass: diskogsplus

ejemplo user para matching: dayats 

## Estructura de Carpetas
```
diskogsplus/
┣ .next/
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
┃ ┃ ┗ auth/
┃ ┣ 404.tsx
┃ ┣ _app.tsx
┃ ┣ _document.tsx
┃ ┣ _error.tsx
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
┃ ┃ ┗ enrichArtistInfo.ts
┃ ┣ spotify/
┃ ┃ ┣ getAccessToken.ts
┃ ┃ ┣ getAlbumId.ts
┃ ┃ ┣ getMostPopularAlbum.ts
┃ ┃ ┣ getSpotifyMixtape.ts
┃ ┃ ┣ getTrackAudioFeatures.ts
┃ ┃ ┗ getTrackId.ts
┃ ┗ supabase/
┃   ┣ addMixtape.ts
┃   ┣ deleteFromMixtape.ts
┃   ┣ deleteMixtapeURL.ts
┃   ┣ getMixtape.ts
┃   ┣ getMixtapeURLs.ts
┃   ┣ getSongsFromSupabase.ts
┃   ┗ saveMixtapeURL.ts
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
+-----------------+       +---------------------+
|     mixtape     |       |     mixtape_urls    |
+-----------------+       +---------------------+
| id (PK)         |       | id (PK)             |
| username (FK)   |-----> | username (FK)       |
| discogsalbumid  |       | mixtape_url         |
| spotifytrackid  |       | fecha_creacion      |
| artistname      |       | spotify_username    |
| trackname       |       +---------------------+
| tempo           |
| key             |
| mode            |
| duration        |
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


Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
