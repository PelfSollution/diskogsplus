-- Esquema de Supabase para Diskogs Plus (proyecto nuevo, octubre 2026).
-- Deducido de services/supabase/* y pages/api/*. Auditoría y pasos en docs/supabase.md.
-- Ejecutar una vez en Supabase → SQL Editor. Es idempotente.
--
-- Los nombres de restricción users_pkey, users_email_key y
-- unique_username_disco_id los comprueba el código: no cambiarlos.

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

-- Usuarios de Discogs (se dan de alta en el callback de OAuth)
create table if not exists public.users (
  username       text primary key,              -- constraint "users_pkey"
  email          text,
  openai_api_key text,                          -- cifrada con CRYPT_KEY (lib/cryptoUtils)
  created_at     timestamptz not null default now(),
  constraint users_email_key unique (email)
);

-- Pistas del mixtape
create table if not exists public.mixtape (
  id             bigint generated always as identity primary key,
  username       text not null references public.users (username) on delete cascade,
  artista        text not null,
  trackname      text not null,
  disco_id       text not null,                 -- el código lo maneja como string
  spotifytrackid text,
  tempo          double precision check (tempo > 0),
  key            smallint check (key between 0 and 11),  -- clase de tono: 0 = Do
  mode           smallint check (mode in (0, 1)),        -- 0 = menor, 1 = mayor
  duration       text,
  created_at     timestamptz not null default now(),
  constraint mixtape_unique_track unique (username, disco_id, artista, trackname)
);

-- Playlists de Spotify exportadas desde el mixtape
create table if not exists public.mixtape_urls (
  id               bigint generated always as identity primary key,
  username         text not null references public.users (username) on delete cascade,
  mixtape_url      text not null,
  spotify_username text,
  created_at       timestamptz not null default now(),
  constraint mixtape_urls_unique unique (username, mixtape_url)
);

-- Wantlist propia
create table if not exists public.wantlist (
  id         bigint generated always as identity primary key,
  username   text not null references public.users (username) on delete cascade,
  disco_id   bigint not null,
  notes      text,
  rating     smallint,
  artista    text,
  album      text,
  image_url  text,
  created_at timestamptz not null default now(),
  constraint unique_username_disco_id unique (username, disco_id)
);

-- Historial de DiscBOT
create table if not exists public.chat_logs (
  id         bigint generated always as identity primary key,
  username   text references public.users (username) on delete cascade,
  prompt     text not null,
  response   text,
  artista    text,
  album      text,
  disco_id   bigint,
  created_at timestamptz not null default now()
);
create index if not exists chat_logs_user_album_idx
  on public.chat_logs (username, artista, album, created_at);

-- Caché de información de artista generada por IA (una por disco)
create table if not exists public.enriched_artist_info (
  id            bigint generated always as identity primary key,
  artista       text,
  album         text,
  disco_id      text not null unique,
  enriched_info text not null,
  created_at    timestamptz not null default now()
);

-- Portadas generadas por IA (el fichero vive en el bucket generated_images)
create table if not exists public.generated_images_metadata (
  id         bigint generated always as identity primary key,
  artista    text not null,
  image_url  text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists generated_images_metadata_artista_idx
  on public.generated_images_metadata (artista);

-- Caché de la lista de reproducción de cada disco (vídeos de Discogs + YouTube).
-- Evita repetir búsquedas en la API de YouTube (100 unidades de cuota cada una).
create table if not exists public.album_playlists (
  disco_id   text primary key,
  playlist   jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Storage: bucket público de portadas (solo JPEG, máx. 5 MB)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('generated_images', 'generated_images', true, 5242880, array['image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Seguridad (RLS)
-- ---------------------------------------------------------------------------

-- RLS activado en todas las tablas. Sin políticas, el rol anon no ve nada.
alter table public.users                     enable row level security;
alter table public.mixtape                   enable row level security;
alter table public.mixtape_urls              enable row level security;
alter table public.wantlist                  enable row level security;
alter table public.chat_logs                 enable row level security;
alter table public.enriched_artist_info      enable row level security;
alter table public.generated_images_metadata enable row level security;
alter table public.album_playlists           enable row level security;

-- Permisos explícitos: el proyecto se crea con «Automatically expose new tables»
-- desactivado, así que ningún rol de la Data API tiene acceso por defecto.
-- service_role (clave secreta, solo servidor) se salta RLS pero necesita el GRANT.
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;

-- «Enable automatic RLS» crea la función public.rls_auto_enable() (SECURITY DEFINER)
-- ejecutable por anon. Es de un event trigger: nadie de la API necesita llamarla.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;

-- ⚠️ ACCESO PROVISIONAL. Hoy el navegador consulta Supabase directamente con la
-- clave pública y sin Supabase Auth, así que la app solo funciona si anon puede
-- leer y escribir todo. Cualquiera con esa clave (visible en el navegador) puede
-- hacer lo mismo. Cuando todo el acceso pase a rutas API con la clave secreta
-- (docs/supabase.md, fase 2), borrar este bloque entero y revocar los permisos
-- de anon (revoke all on all tables in schema public from anon).
grant usage on schema public to anon;
grant select, insert, update, delete on all tables in schema public to anon;

do $$
declare t text;
begin
  foreach t in array array['users','mixtape','mixtape_urls','wantlist','chat_logs',
                           'enriched_artist_info','generated_images_metadata','album_playlists']
  loop
    execute format('drop policy if exists "provisional_anon_all" on public.%I', t);
    execute format(
      'create policy "provisional_anon_all" on public.%I for all to anon using (true) with check (true)', t);
  end loop;
end $$;

drop policy if exists "provisional_anon_generated_images" on storage.objects;
create policy "provisional_anon_generated_images" on storage.objects
  for all to anon
  using (bucket_id = 'generated_images')
  with check (bucket_id = 'generated_images');
