# Supabase: auditoría del esquema y nuevo proyecto (octubre 2026)

El proyecto original (`Diskogsplus`) quedó pausado en agosto de 2024 y ya no se puede restaurar desde el panel. Se crea un proyecto nuevo **desde cero**, con el esquema de [`supabase/schema.sql`](../supabase/schema.sql).

---

## 1. Auditoría del esquema

Fuentes: el diagrama ER del README antiguo y lo que usa realmente el código (`services/supabase/*`, `pages/api/*`).

| # | Hallazgo | Gravedad | Cambio en `schema.sql` |
| :-- | :-- | :--: | :-- |
| 1 | El esquema **no estaba en el repo**: sin el proyecto antiguo no había forma de recrear la base de datos. | Alta | `supabase/schema.sql` versionado e idempotente. |
| 2 | **Todo el acceso es con la clave pública desde el navegador** y sin Supabase Auth. Cualquiera con la clave puede leer o modificar los datos de todos los usuarios, incluidas las claves API cifradas. `pages/dashboard.tsx` borra la clave API llamando a `users` desde el cliente. | Alta | RLS activado en todas las tablas. Resuelto en la fase 2 (§3): todo pasa por rutas API con la clave secreta y `anon` no tiene acceso. |
| 3 | El diagrama dibujaba claves foráneas a `users`, pero el código no las necesita y no está claro que existieran. Podían quedar filas huérfanas. | Media | FK `username → users` con `on delete cascade` en `mixtape`, `mixtape_urls`, `wantlist` y `chat_logs`. |
| 4 | El mixtape y las URLs de playlists admitían **duplicados**. Solo se evitaban en `localStorage`. | Media | `unique (username, disco_id, artista, trackname)` y `unique (username, mixtape_url)`. |
| 5 | `addMixtape` convertía `key`/`mode` vacíos en `0`, que significa **Do menor**. | Media | Corregido en el código. Columnas nulas con `check` (`key` 0–11, `mode` 0/1, `tempo > 0`). |
| 6 | `generated_images_metadata` insertaba una fila nueva cada vez que se generaba una portada. | Baja | `unique (image_url)` e índice por `artista`. |
| 7 | El bucket `generated_images` aceptaba cualquier tipo y tamaño de fichero. | Baja | Solo `image/jpeg`, máximo 5 MB. |
| 8 | Las fechas se llamaban de forma distinta en cada tabla (`fecha_creacion`, `generated_at`, `created_at`). | Baja | `created_at timestamptz default now()` en todas. |
| 9 | `disco_id` es `bigint` en `wantlist`/`chat_logs` y `text` en `mixtape`/`enriched_artist_info`. | Baja | Se mantiene así porque coincide con los tipos del código. Unificar a `bigint` exige tocar `LocalMixtapeTrack`. |
| 10 | Faltaba un índice para la consulta de historial del chat (`username`, `artista`, `album`, ordenado por fecha). | Baja | `chat_logs_user_album_idx`. |

Otros puntos detectados fuera del esquema:

- `@supabase/supabase-js` está en la **2.33.1 (2023)**. Si las claves nuevas `sb_publishable_…` dan error, usar la clave *anon* (legacy) o actualizar el paquete (§2, paso 5).
- Los proyectos gratuitos **se pausan tras 7 días sin actividad**. Es lo que le pasó al proyecto antiguo.
- `addWantlistEntry`, `checkAlbumInWantlist`, `getUserChats` y otros servicios no comprueban `isSupabaseConfigured`. Solo registran el error, pero rompen el patrón de los demás.

---

## 2. Paso a paso: crear el proyecto nuevo

1. **Crear el proyecto.** En [supabase.com/dashboard](https://supabase.com/dashboard) → *New project*. Nombre: `diskogsplus`. Región: *West EU* (Irlanda o París). Genera una contraseña de base de datos y guárdala en tu gestor de contraseñas. Plan *Free*. En las opciones de seguridad:
   - **Enable Data API**: activado (lo usa `supabase-js`).
   - **Automatically expose new tables**: desactivado. `schema.sql` da los permisos de forma explícita (`grant`).
   - **Enable automatic RLS**: activado. `schema.sql` ya activa RLS, esto cubre las tablas que se creen después.
2. **Crear las tablas.** *SQL Editor* → *New query* → pega `supabase/schema.sql` entero → *Run*. Debe terminar con "Success. No rows returned".
3. **Comprobar.** *Table Editor* debe mostrar 8 tablas, todas con la etiqueta *RLS enabled*. *Storage* debe mostrar el bucket `generated_images` como *Public*.
4. **Copiar las claves.** *Project Settings → API Keys*: copia la **Project URL** y la clave **secret** (`sb_secret_…`). La clave *publishable* no hace falta: el navegador no habla con Supabase.
5. **Rellenar `.env.local`** (nunca con el prefijo `NEXT_PUBLIC_`, que la mandaría al navegador):
   ```env
   SUPABASE_URL=https://<ref>.supabase.co
   SUPABASE_SECRET_KEY=sb_secret_...
   ```
6. **Reiniciar** `npm run dev`.
7. **Entrar con Discogs.** El usuario se da de alta en `users` en el login y, si falta (sesión anterior a configurar Supabase), al cargar la app (`/api/auth/identity`).
8. **Probar:** añadir una pista al mixtape, añadir un disco a la wantlist, hablar con DiscBOT y guardar la clave API en el dashboard. Comprueba las filas en *Table Editor*.
9. *(Opcional)* **Security Advisor** (*Advisors → Security*): no debería mostrar avisos.

### Opcional: MCP oficial de Supabase en Claude Code

Permite que Claude aplique el esquema, consulte tablas y logs, ejecute los *advisors* y genere tipos TypeScript sin pasar por el panel. Conviene limitarlo a este proyecto con `project_ref`:

```bash
claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?project_ref=<ref>"
```

Después, en una terminal normal: `claude /mcp` → *supabase* → *Authenticate*. Añade `&read_only=true` a la URL si solo quieres consultas. No lo uses con datos de producción sin revisar cada llamada, por el riesgo de *prompt injection*.

> El MCP que anuncia el blog *Select 2026* (`@supabase/mcp-server` vía shadcn) es otra cosa: un servidor MCP que se añade a **tu app** para los agentes de **tus usuarios**. Necesita Supabase Auth, así que hoy no aplica a Diskogs.

---

## 3. Fase 2 (hecha, octubre 2026): acceso solo desde el servidor

- `lib/supabase.ts` usa la clave secreta (`SUPABASE_SECRET_KEY`), que se salta RLS. Sin `NEXT_PUBLIC_`, en el navegador `isSupabaseConfigured` es `false`.
- Las páginas ya no importan `services/supabase/*`: llaman a rutas API que toman el usuario de `requireSessionUser`, a través de `services/client/mixtape.ts` y `services/client/userData.ts`.

  | Ruta | Uso |
  | :-- | :-- |
  | `GET/POST/PATCH/DELETE /api/mixtape` | Leer, añadir, reordenar y quitar pistas del mixtape |
  | `POST /api/mixtape/completeTracks` | Completar posición en el vinilo, BPM y tonalidad de las pistas que no los tienen |
  | `GET /api/albums/wantlist[?disco_id=]` | Wantlist, o si un disco está en ella |
  | `GET /api/albums/artistImage?artista=` | Portada generada por IA |
  | `GET /api/chatLogs[?artista=&album=]` | Discos con chat, o la conversación de uno |
  | `GET /api/mixtapeUrls` | Playlists de Spotify exportadas |
  | `POST /api/deleteApiKey` | Borrar la clave API guardada |

- En la base de datos no hay políticas y `anon`/`authenticated` no tienen permisos (`revoke all`). Con la clave publishable cualquier consulta devuelve `42501`.
- El bucket `generated_images` sigue siendo público para leer las portadas por URL; solo el servidor sube ficheros.
