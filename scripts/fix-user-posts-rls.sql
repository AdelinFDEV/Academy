-- ============================================================
-- FIX: el contador de "guardados" se descuadra (se va a 0 al
--      quitar el guardado, en vez de volver al número anterior).
-- Causa: la política de SELECT de user_posts solo deja ver la
--        fila del propio usuario (auth.uid() = user_id), así que
--        cualquier consulta que cuente los guardados de TODOS los
--        usuarios para un post solo ve, como mucho, 1 fila (la
--        propia) en vez del total real. Es el mismo problema que
--        ya se arregló para post_likes en fix-post-likes-rls.sql,
--        pero nunca se aplicó a user_posts.
--
-- Ejecutar TODO este bloque en el SQL Editor de Supabase.
-- Es idempotente: se puede correr varias veces sin problema.
-- ============================================================

alter table public.user_posts enable row level security;

-- Borra políticas previas para recrearlas limpias
drop policy if exists "Users can read their own user_posts"   on public.user_posts;
drop policy if exists "Anyone can count saves"                on public.user_posts;
drop policy if exists "Users can insert their own user_posts" on public.user_posts;
drop policy if exists "Users can update their own user_posts" on public.user_posts;
drop policy if exists "Users can delete their own user_posts" on public.user_posts;

-- Lectura pública (para poder contar guardados de todos los usuarios en cada post).
-- El contenido de la fila (saved/read_at) no es sensible, así que es seguro.
create policy "Anyone can count saves"
  on public.user_posts for select
  using (true);

-- Un usuario autenticado solo puede crear/editar/borrar SU PROPIA fila
create policy "Users can insert their own user_posts"
  on public.user_posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own user_posts"
  on public.user_posts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own user_posts"
  on public.user_posts for delete
  using (auth.uid() = user_id);

-- ── Verificación: deberías ver 4 políticas (select, insert, update, delete) ──
select policyname, cmd from pg_policies where tablename = 'user_posts';
