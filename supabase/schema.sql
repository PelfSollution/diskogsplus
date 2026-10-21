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

-- Mixtapes con nombre de cada usuario ("Sesión jazz-funk sábado")
create table if not exists public.mixtapes (
  id         bigint generated always as identity primary key,
  username   text not null references public.users (username) on delete cascade,
  nombre     text not null check (length(trim(nombre)) between 1 and 80),
  created_at timestamptz not null default now(),
  constraint mixtapes_unique_nombre unique (username, nombre)
);

-- Pistas de las mixtapes (la tabla conserva su nombre histórico, en singular)
create table if not exists public.mixtape (
  id             bigint generated always as identity primary key,
  username       text not null references public.users (username) on delete cascade,
  mixtape_id     bigint not null references public.mixtapes (id) on delete cascade,
  artista        text not null,
  trackname      text not null,
  disco_id       text not null,                 -- el código lo maneja como string
  spotifytrackid text,
  tempo          double precision check (tempo > 0),
  key            smallint check (key between 0 and 11),  -- clase de tono: 0 = Do
  mode           smallint check (mode in (0, 1)),        -- 0 = menor, 1 = mayor
  duration       text,
  position       integer,                       -- orden dentro de la mixtape (0, 1, 2…)
  vinyl_position text check (length(vinyl_position) <= 12),  -- posición en Discogs: «A1», «B2»
  data_checked_at timestamptz,                  -- última búsqueda de datos (Discogs, ReccoBeats, Deezer)
  created_at     timestamptz not null default now(),
  constraint mixtape_unique_track unique (mixtape_id, disco_id, artista, trackname)
);

-- Migración desde una sola lista por usuario (oct. 2026): las pistas sin
-- mixtape_id pasan a una mixtape «Mi mixtape» de su usuario.
alter table public.mixtape
  add column if not exists mixtape_id bigint references public.mixtapes (id) on delete cascade;

insert into public.mixtapes (username, nombre)
select distinct username, 'Mi mixtape' from public.mixtape where mixtape_id is null
on conflict (username, nombre) do nothing;

update public.mixtape t set mixtape_id = m.id
from public.mixtapes m
where t.mixtape_id is null and m.username = t.username and m.nombre = 'Mi mixtape';

alter table public.mixtape alter column mixtape_id set not null;

do $$
begin
  if exists (select 1 from pg_constraint where conname = 'mixtape_unique_track'
             and pg_get_constraintdef(oid) not like '%mixtape_id%') then
    alter table public.mixtape drop constraint mixtape_unique_track;
    alter table public.mixtape
      add constraint mixtape_unique_track unique (mixtape_id, disco_id, artista, trackname);
  end if;
end $$;

create index if not exists mixtape_username_idx on public.mixtape (username);

-- Orden de las pistas (oct. 2026). Las que no tienen posición la reciben
-- conservando el orden en que se veían (la más reciente primero).
alter table public.mixtape add column if not exists position integer;

update public.mixtape t set position = o.pos
from (
  select id, row_number() over (partition by mixtape_id order by created_at desc, id desc) - 1 as pos
  from public.mixtape
  where position is null
) o
where t.id = o.id;

create index if not exists mixtape_position_idx on public.mixtape (mixtape_id, position);

-- Cara y posición del vinilo, y marca de pistas ya revisadas (oct. 2026)
alter table public.mixtape add column if not exists vinyl_position text check (length(vinyl_position) <= 12);
alter table public.mixtape add column if not exists data_checked_at timestamptz;

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
alter table public.mixtapes                  enable row level security;
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

-- Sin acceso para anon ni authenticated: el navegador nunca habla con Supabase.
-- Todo pasa por rutas API con la clave secreta (lib/supabase.ts). RLS activado y
-- sin políticas deja fuera a cualquiera que tenga la clave publishable.
do $$
declare t text;
begin
  foreach t in array array['users','mixtapes','mixtape','mixtape_urls','wantlist','chat_logs',
                           'enriched_artist_info','generated_images_metadata','album_playlists']
  loop
    execute format('drop policy if exists "provisional_anon_all" on public.%I', t);
  end loop;
end $$;
drop policy if exists "provisional_anon_generated_images" on storage.objects;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
