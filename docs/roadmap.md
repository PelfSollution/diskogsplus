# Roadmap de Diskogs Plus (octubre 2026)

> Sustituye a la sección 4 de [`balance_v2_y_roadmap.md`](./balance_v2_y_roadmap.md).
> Idea central: **tu colección de vinilos → escuchar antes de pinchar → preparar sesiones → llevártelas (a la cabina o a un servicio de streaming)**.

---

## 1. El problema de la escucha

En la v1 cada disco tenía su álbum de Spotify embebido y se podía escuchar entero. En la v2 el reproductor depende de los vídeos que la comunidad enlaza en cada release de Discogs. Muchos discos tienen pocos vídeos o ninguno, y el orden no coincide con el tracklist.

**No existe una API gratuita y abierta que dé el disco entero en streaming.** Todas las opciones de audio completo exigen que *el oyente* tenga una suscripción y haya iniciado sesión en ese servicio. Por eso la solución es **dejar que cada usuario elija su servicio** y usar YouTube (Discogs) como respaldo universal.

### Comparativa de servicios (estado a octubre de 2026)

| Servicio | Escuchar el disco entero en la web | Crear playlists desde la app | Coste y límites para ti | Encaje |
| :-- | :-- | :-- | :-- | :--: |
| **Spotify**: *embed* de álbum | Sí, si el usuario tiene Premium y ha iniciado sesión en el navegador de escritorio. Si no, 30 s. | — | Para *buscar* el ID del álbum hace falta una app en *Development Mode*: el propietario necesita Premium y la búsqueda devuelve como máximo 10 resultados. | ⭐⭐⭐ |
| **Spotify**: Web API (playlists) | — | Sí, con OAuth. Los endpoints cambiaron en febrero de 2026 (`/tracks` → `/items`). | **Máximo 5 usuarios** por app en Development Mode, y el propietario debe tener Premium. La cuota ampliada solo se da a empresas con más de 250 000 usuarios activos al mes. | ⭐⭐ (uso personal) |
| **Apple Music**: MusicKit JS | Sí, para suscriptores de Apple Music. Hay informes de fallos fuera de Safari. | Sí, en la biblioteca del usuario. | Apple Developer Program, 99 $/año. Sin límite de usuarios. El token del usuario caduca a los 6 meses. | ⭐⭐ |
| **YouTube**: vídeos de Discogs (actual) | Sí, pero solo las pistas que tengan vídeo. | — | Gratis, sin clave. | ⭐⭐⭐ como respaldo |
| **YouTube Data API** | Busca las pistas que faltan, con un coste de 100 unidades por búsqueda. | Sí, con OAuth: 50 unidades por pista. | Gratis hasta 10 000 unidades al día, unas 100 búsquedas o 200 pistas añadidas. | ⭐⭐ |
| **Deezer** | Previews de 30 s por pista sin clave. El *widget* da audio completo a usuarios con sesión iniciada. | Con OAuth (registrar una app; no está claro si aceptan apps nuevas). | Gratis. | ⭐⭐ para preescucha rápida |
| **TIDAL** | El SDK web oficial solo reproduce *previews*. | API con OAuth. | Gratis. | ⭐ |
| **Odesli / song.link** (traducir enlaces entre servicios) | — | — | API pública cerrada desde julio de 2026. | ✗ |
| **Exportar fichero** (CSV / M3U) + Soundiiz o TuneMyMusic | — | El usuario importa el CSV en *cualquier* servicio. | Gratis, sin API. | ⭐⭐⭐ |

Fuentes: [guía de migración de Spotify (feb. 2026)](https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide), [TechCrunch sobre los límites de Spotify](https://techcrunch.com/2026/02/06/spotify-changes-developer-mode-api-to-require-premium-accounts-limits-test-users/), [foro de Spotify sobre los embeds](https://community.spotify.com/t5/Spotify-for-Developers/30-second-preview-showing-when-try-to-embed-playlist/m-p/5655484/highlight/true), [foros de MusicKit JS](https://developer.apple.com/forums/thread/771759), [TIDAL Web SDK](https://github.com/orgs/tidal-music/discussions/40), [cuotas de YouTube Data API](https://developers.google.com/youtube/v3/determine_quota_cost), [estado de Odesli](https://linktree.notion.site/API-d0ebe08a5e304a55928405eb682f6741).

### Propuesta: "fuentes de escucha" en capas

1. **Spotify embed por disco**, como en la v1, para quien tenga Premium. Ya existe en `AlbumMediaSidebar.tsx`. Hay que arreglar `getAlbumId.ts`: el `limit=50` ya no es válido (el máximo es 10), y conviene buscar por código de barras (`upc:`) cuando Discogs lo tenga, antes de buscar por artista y título.
2. **YouTube como respaldo**: primero los vídeos de Discogs y, si faltan pistas, una búsqueda en YouTube Data API (opcional, con clave) para completar el tracklist. Con la API de JavaScript de YouTube se consigue pausa real y paso automático de pista.
3. **Preescucha de 30 s con Deezer** en cada línea del tracklist. No necesita clave y sirve para decidir rápido si una pista entra en la sesión.
4. **Preferencia por usuario** en el dashboard ("Escucho en: Spotify / Apple Music / YouTube"). El reproductor elige la fuente según esa preferencia.
5. **Apple Music**: solo si te compensa pagar el Developer Program. Es la única opción con audio completo *y* playlists sin el límite de 5 usuarios.

### Llevarse la sesión fuera

- **Spotify**: arreglar `services/spotify/getSpotifyMixtape.ts`, que usa `/v1/users/{id}/playlists` y `/v1/playlists/{id}/tracks` (ambos cambiaron en febrero de 2026). Vale para ti y hasta 4 personas más.
- **Exportación universal**: un CSV con artista, pista y álbum que se importa en Soundiiz o TuneMyMusic hacia cualquier servicio. Es lo más robusto porque no depende de ninguna API.
- **Para DJ**: M3U o Rekordbox XML con BPM y Camelot, y una **hoja de cajón en PDF** (qué discos llevar, cara, pista, BPM y tono).

---

## 2. Roadmap por fases

### Fase 0: cerrar la actualización (en curso)
- [x] Crear el proyecto nuevo de Supabase ([`supabase.md`](./supabase.md)) y probar que guarda y carga.
- [x] Probar en el navegador DiscBOT, la ficha del disco y el mixtape; mezclar `upgrade/next-react-ai` en `main`.
- [ ] Vulnerabilidades altas: Tailwind/PostCSS dentro de la v3 y quitar `sharp` 0.32.

### Fase 1: volver a escuchar los discos ⭐ prioridad
- [x] Lista por disco en el orden del tracklist: vídeos de Discogs → pistas oficiales «Artista - Topic» de YouTube (`YOUTUBE_API_KEY`) → vídeo «full album» → preview de 30 s de Deezer (`services/youtube/getAlbumPlaylist.ts`, `GET /api/albums/playlist`). Caché en la tabla `album_playlists`.
- [x] Reproductor con la API de JavaScript de YouTube (`hooks/useTrackPlayer.ts`): pausa real, paso automático de pista y salto de vídeos bloqueados. Ficha del disco y mixtape.
- [ ] Arreglar la búsqueda de Spotify (`getAlbumId.ts`: límite 10, búsqueda por UPC). Solo útil con Spotify Premium.
- [ ] Bandcamp para casetes y tiradas pequeñas (sin API oficial; estudiar el embed).
- [ ] Preferencia de servicio de escucha por usuario.
- [ ] **Reproductor global flotante**: seguir escuchando mientras navegas por la colección.

> Prueba con la colección real (`dayats`, oct. 2026): 9 de 15 discos al ≥80 % solo con Discogs + YouTube; con Deezer, 36 de 47 pistas en 8 discos. Lo que falta son sobre todo casetes y EP de tirada mínima.

### Fase 2: preparar sesiones
- [x] **Varias mixtapes con nombre** ("Sesión jazz-funk sábado") en lugar de una sola lista por usuario: tabla `mixtapes` y columna `mixtape_id` en `mixtape` (oct. 2026). La posición para reordenar queda para el punto siguiente.
- [x] Reordenar arrastrando (o con flechas, en el móvil) y **ordenar automáticamente por armonía y BPM** (oct. 2026): columna `position` en `mixtape`, `PATCH /api/mixtape` y `lib/mixtapeOrder.ts` (empieza por la pista más lenta y encadena tonalidades vecinas en la rueda Camelot). Las pistas nuevas van al final de la sesión.
- [x] DiscBOT trabaja con la mixtape abierta (oct. 2026): «Analizar armonía» y las preguntas de la página del disco leen solo esa mixtape, en el orden de la sesión, con sugerencias propias (transiciones, curva de energía).
- [x] Datos de vinilo en cada pista (oct. 2026): **cara y posición** (A1, B2, columna `vinyl_position`), duración total de la sesión y aviso cuando dos pistas seguidas son del mismo disco (con una sola copia no se mezclan; si cambian de cara, «dar la vuelta»). El orden automático evita ponerlas seguidas. Queda la duración por cara, que Discogs casi nunca trae.
- [x] Rellenar BPM y tonalidad de las pistas antiguas (oct. 2026): en vez de un script, aviso en `/mixtape` con el botón «Completar datos» (`POST /api/mixtape/completeTracks`, hasta 50 pistas por vez), que también trae de Discogs la posición en el vinilo. Las pistas revisadas sin resultado se marcan (`data_checked_at`) para no avisar otra vez. Solo rellena campos vacíos; lo que no esté en ReccoBeats ni en Deezer se queda sin datos (p. ej. casetes y EP de tirada mínima).
- [x] DiscBOT como asistente de sesión (oct. 2026): "hazme un set de 1 h, 95–110 BPM, solo con mis discos de soul". Tool `build_session` (`services/agent/sessionBuilder.ts`): vinilos de la colección filtrados por género/estilo de Discogs, como mucho 8 discos al azar por propuesta, BPM y tonalidad de ReccoBeats/Deezer, mismo orden que el botón automático y corte por duración. `save_session_as_mixtape` la guarda como mixtape nueva solo si el usuario lo confirma. La propuesta vive en memoria del servidor (1 h).

### Fase 3: llevarse la sesión
- [ ] Exportar CSV (Soundiiz/TuneMyMusic) y M3U.
- [ ] Hoja de cajón en PDF/impresión: qué discos sacar de la estantería.
- [ ] Arreglar la exportación a playlist de Spotify (endpoints de 2026). Ya exporta una sola mixtape (`/api/auth/authorizeSpotify?mixtape_id=`), pero ninguna página enlaza a ella.
- [ ] Rekordbox XML con BPM/tono para quien pinche también en digital.
- [ ] Enlace público para compartir una sesión (solo lectura).

### Fase 4: colección y wantlist
- [ ] Sincronizar carpetas, estado y notas de la colección de Discogs.
- [ ] Wantlist con precios del Marketplace y aviso cuando un disco baje de precio.
- [ ] "¿Qué me falta?": discos de un artista o sello que no tienes, a partir de las sesiones.

### Fase 5: infraestructura y seguridad
- [x] Supabase, fase 2: todo el acceso a datos desde rutas API con la clave secreta y sin políticas para anon ([`supabase.md` §3](./supabase.md#3-fase-2-hecha-octubre-2026-acceso-solo-desde-el-servidor)).
- [ ] Despliegue en Vercel + GitHub Actions (tsc + lint + build).
- [ ] ESLint 10 y los 5 avisos de `set-state-in-effect`.
- [ ] PWA para usarla en la cabina desde el móvil o el iPad, con la sesión disponible sin conexión.
