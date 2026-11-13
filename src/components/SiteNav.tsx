import Link from "next/link";
import { cache } from "react";
import NavPrincipal from "@/components/NavPrincipal";
import NavForo, { NavForoMovil } from "@/components/NavForo";
import BlogMobileMenu from "@/components/BlogMobileMenu";
import NavSaludo, { type PlanUsuario } from "@/components/NavSaludo";
import { foroALaVista } from "@/lib/foro/permisos";
import { createClient } from "@/lib/supabase/server";

interface Props {
  user: boolean;
  isPremium?: boolean;
  userName?: string;
  isAdmin?: boolean;
}

// Nav compartido por todas las páginas del sitio (marca, las tres piezas de
// pago y menú). Antes estaba duplicado línea por línea en 20 archivos.
/**
 * El nombre y el plan del usuario, resueltos una sola vez por petición.
 *
 * Existe porque de las ~20 páginas que pintan la barra, NUEVE no le pasaban
 * `userName`: las fichas de herramientas, el glosario, premium, logros… Pedirle
 * a cada página nueva que se acuerde es la misma trampa que ya nos costó cuatro
 * listas de herramientas distintas. Si no llega el dato, la barra lo busca.
 *
 * `cache()` es de React y dura lo que la petición: aunque la página ya haya
 * leído el perfil por su cuenta, esto no añade un segundo viaje por render.
 *
 * El plan sale de aquí y no de `isPremium`/`isAdmin` por lo mismo: hay
 * páginas que no los pasan, y la tarjeta del usuario diría «Plan gratuito» a
 * quien paga.
 */
const perfilDelUsuario = cache(async (): Promise<{ nombre: string; plan: PlanUsuario; avatar: string | null }> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { nombre: "", plan: "free", avatar: null };
  // La foto va en su propia consulta, en paralelo: si la columna aún no
  // existe (antes de ejecutar `scripts/create-perfil-publico.sql`), falla
  // sola y la barra sigue con la inicial, en vez de quedarse sin nombre.
  const [{ data }, { data: foto }] = await Promise.all([
    supabase.from("profiles").select("full_name, role").eq("id", user.id).single(),
    supabase.from("profiles").select("avatar").eq("id", user.id).maybeSingle(),
  ]);
  const plan: PlanUsuario = data?.role === "admin" ? "admin" : data?.role === "premium" ? "premium" : "free";
  return {
    nombre: data?.full_name || user.email?.split("@")[0] || "",
    plan,
    avatar: (foto as { avatar?: string | null } | null)?.avatar ?? null,
  };
});

export default async function SiteNav({ user, isPremium, userName, isAdmin }: Props) {
  const perfil = user ? await perfilDelUsuario() : { nombre: "", plan: "free" as const, avatar: null };
  const nombre = userName ?? perfil.nombre;
  // El foro solo sale en los menús para quien puede entrar: todos cuando esté
  // abierto, y solo el admin mientras está cerrado (FORO.md §16).
  const foro = await foroALaVista(user);

  return (
    <nav className="blog-nav">
      <Link href="/" className="blog-brand">
        adelin<span>btc</span>
      </Link>
      <div className="blog-nav-center">
        {/* Nova se decide por el plan leído aquí y no por `isPremium`: hay páginas que no lo pasan. */}
        <NavPrincipal logueado={user} premium={!!isPremium} conNova={perfil.plan !== "free"} />
        {/* El foro va fuera de la cápsula: dentro están las tres piezas de
            pago, que salen del catálogo de herramientas, y el foro no es una. */}
        {foro && <NavForo />}
      </div>
      <div className="blog-nav-end">
        {/* Identidad y accesos personales, en un solo sitio. Pulsando el
            nombre se abre el menú con «Mi dashboard» y «Mi cuenta».
            «Mi dashboard» fue un botón suelto aquí al lado durante unas horas:
            dos accesos personales pegados competían por el mismo hueco. */}
        {/* El foro en móvil: solo se ve por debajo de 1200 px, donde se esconde
            el de escritorio (globals.css, «El foro en la barra del móvil»). */}
        {foro && <NavForoMovil />}

        {user && nombre && <NavSaludo nombre={nombre} plan={perfil.plan} avatar={perfil.avatar} />}

        {/* Y para quien todavía no tiene cuenta, lo que sí le sirve: entrar o
            registrarse. Antes ambas cosas vivían solo dentro del desplegable,
            que es donde nadie busca el botón de registrarse. «Entrar» va en
            texto y «Registrarse» en naranja: son dos acciones distintas y una
            de ellas es la que interesa. */}
        {!user && (
          <span className="nav-acceso">
            <Link href="/login" className="nav-acceso-entrar">Entrar</Link>
            <Link href="/register" className="nav-acceso-registro">Registrarse</Link>
          </span>
        )}

        <BlogMobileMenu user={user} isPremium={isPremium} userName={nombre} isAdmin={isAdmin} avatar={perfil.avatar} foro={foro} />
      </div>
    </nav>
  );
}
