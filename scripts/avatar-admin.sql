-- La foto real del admin como foto de perfil (10-11-2026).
--
-- `adelin` es AVATAR_ADMIN en src/lib/perfilPublico.ts: no está en la lista
-- que ven los usuarios y /api/perfil no deja guardarla a nadie que no sea
-- admin. Se puede lanzar varias veces: solo toca las filas con rol admin.

update public.profiles
set avatar = 'adelin'
where role = 'admin';

-- Verificación: debe salir una fila por admin, con avatar = adelin.
select id, alias, role, avatar
from public.profiles
where role = 'admin';
