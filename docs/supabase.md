# Supabase: auditoría del esquema y nuevo proyecto (octubre 2026)

El proyecto original (`Diskogsplus`) quedó pausado en agosto de 2024 y ya no se puede restaurar desde el panel. Se crea un proyecto nuevo **desde cero**, con el esquema de [`supabase/schema.sql`](../supabase/schema.sql).

---

## 1. Auditoría del esquema

Fuentes: el diagrama ER del README antiguo y lo que usa realmente el código (`services/supabase/*`, `pages/api/*`).

| # | Hallazgo | Gravedad | Cambio en `schema.sql` |
| :-- | :-- | :--: | :-- |
| 1 | El esquema **no estaba en el repo**: sin el proyecto antiguo no había forma de recrear la base de datos. | Alta | `supabase/schema.sql` versionado e idempotente. |
| 2 | **Todo el acceso es con la clave pública desde el navegador** y sin Supabase Auth. Cualquiera con la clave puede leer o modificar los datos de todos los usuarios, incluidas las claves API cifradas. `pages/dashboard.tsx` borra la clave API llamando a `users` desde el cliente. | Alta | RLS activado en todas las tablas y políticas `provisional_anon_all` en un bloque aparte, listo para borrarlo en la fase 2 (§3). |
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

1. **Crear el proyecto.** En [supabase.com/dashboard](https://supabase.com/dashboard) → *New project*. Nombre: `diskogsplus`. Región: *West EU* (Irlanda o París). Genera una contraseña de base de datos y guárdala en tu gestor de contraseñas. Plan *Free*.
2. **Crear las tablas.** *SQL Editor* → *New query* → pega `supabase/schema.sql` entero → *Run*. Debe terminar con "Success. No rows returned".
3. **Comprobar.** *Table Editor* debe mostrar 8 tablas, todas con la etiqueta *RLS enabled*. *Storage* debe mostrar el bucket `generated_images` como *Public*.
4. **Copiar las claves.** *Project Settings → API Keys*: copia la **Project URL** y la clave **publishable** (`sb_publishable_…`). La clave *secret* (`sb_secret_…`) **no** va todavía en `.env.local`, y nunca con el prefijo `NEXT_PUBLIC_`.
5. **Rellenar `.env.local`:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
   SUPABASE_URL=https://<ref>.supabase.co
   SUPABASE_ANON_KEY=sb_publishable_...
   ```
   Si al usar la app aparece `Invalid API key` o `JWT`, cambia a la pestaña *Legacy API keys* y usa la clave `anon`.
6. **Reiniciar** `npm run dev`. Las variables `NEXT_PUBLIC_` se leen al arrancar.
7. **Cerrar sesión y volver a entrar con Discogs.** El usuario se da de alta en `users` durante el login. Si usas una sesión anterior, el resto de tablas fallarán por la clave foránea.
8. **Probar:** añadir una pista al mixtape, añadir un disco a la wantlist, hablar con DiscBOT y guardar la clave API en el dashboard. Comprueba las filas en *Table Editor*.
9. *(Opcional)* **Security Advisor** (*Advisors → Security*): avisará de las políticas `provisional_anon_all`. Es esperado hasta la fase 2.

### Opcional: MCP oficial de Supabase en Claude Code

Permite que Claude aplique el esquema, consulte tablas y logs, ejecute los *advisors* y genere tipos TypeScript sin pasar por el panel. Conviene limitarlo a este proyecto con `project_ref`:

```bash
claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?project_ref=<ref>"
```

Después, en una terminal normal: `claude /mcp` → *supabase* → *Authenticate*. Añade `&read_only=true` a la URL si solo quieres consultas. No lo uses con datos de producción sin revisar cada llamada, por el riesgo de *prompt injection*.

> El MCP que anuncia el blog *Select 2026* (`@supabase/mcp-server` vía shadcn) es otra cosa: un servidor MCP que se añade a **tu app** para los agentes de **tus usuarios**. Necesita Supabase Auth, así que hoy no aplica a Diskogs.

---

## 3. Fase 2 (pendiente): cerrar el acceso público

1. Crear `lib/supabaseAdmin.ts` con la clave secreta (`SUPABASE_SECRET_KEY`, sin `NEXT_PUBLIC_`). Usarlo solo en el servidor.
2. Mover las llamadas que hoy se hacen desde el navegador a rutas API que tomen el usuario de `requireSessionUser`:
   - `pages/albums/[id].tsx`
   - `pages/dashboard.tsx`
   - `pages/mixtape.tsx`
   - `pages/mixtapeplayer.tsx`
   - `pages/wantlist.tsx`
   - `pages/chat.tsx`
   - `hooks/useGetMixtape.ts`
3. Borrar el bloque `provisional_anon_*` de `schema.sql` y ejecutar en el SQL Editor los `drop policy` correspondientes. RLS sin políticas deja fuera al rol anon, y la clave secreta se salta RLS.
