import Link from "next/link";
import { cache } from "react";
import NavPrincipal from "@/components/NavPrincipal";
import NavForo, { NavForoMovil } from "@/components/NavForo";
import BlogMobileMenu from "@/components/BlogMobileMenu";
import NavSaludo, { type PlanUsuario } from "@/components/NavSaludo";
import { foroALaVista } from "@/lib/foro/permisos";
import { createClient } from "@/lib/supabase/server";
import { INSTAGRAM_DM_URL, YOUTUBE_URL } from "@/lib/contacto";
import { PREMIUM_PRICE_EUR, precioEur } from "@/lib/stripe";
import { InstagramIcon } from "@/components/SocialLinks";
import Tecla from "@/components/cuaderno/Tecla";
import SonidoColgante from "@/components/SonidoColgante";
import "./site-nav.css";

interface Props {
  user: boolean;
  isPremium?: boolean;
  userName?: string;
  isAdmin?: boolean;
}

// Nav compartido por todas las páginas del sitio (marca, las tres piezas de
// pago y menú). Antes estaba duplicado línea por línea en 20 archivos.
//
// Estilo «Cuaderno de estudio» desde el 17-11-2026 (ESTILO.md): una tira de
// papel sobre el fondo lavanda, la marca en Fraunces y cada enlace con el
// color de su sección. Su CSS vive en `site-nav.css`, no en globals.css.
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
  // Lo mismo con el plan: si la página no lo pasa, manda el perfil. Sin esto,
  // en esas páginas el menú le ofrecía Premium a quien ya paga y las piezas de
  // la barra le llevaban a la ficha pública en vez de a su herramienta.
  const premium = isPremium ?? perfil.plan !== "free";
  const admin = isAdmin ?? perfil.plan === "admin";
  // El foro solo sale en los menús para quien puede entrar: todos cuando esté
  // abierto, y solo el admin mientras está cerrado (FORO.md §16).
  const foro = await foroALaVista(user);

  return (
    <nav className="blog-nav">
      <Link href="/" className="blog-brand">
        Adelin<em>BTC</em>
      </Link>
      <div className="blog-nav-center">
        <NavPrincipal logueado={user} premium={premium} />
        {/* El foro va fuera de la cápsula: dentro están las tres piezas de
            pago, que salen del catálogo de herramientas, y el foro no es una. */}
        {foro && <NavForo />}
      </div>
      <div className="blog-nav-end">
        {/* Contacto directo: un mensaje por Instagram (13-11-2026), y el canal
            de YouTube, su pareja. Solo el icono, en su color de marca: se
            reconocen sin texto. Cuando la barra no tiene sitio, viven en el
            menú. */}
        <span className="nav-redes">
          <Tecla
            href={INSTAGRAM_DM_URL}
            target="_blank"
            rel="noopener noreferrer"
            color="blanca"
            tamano="peq"
            icono
            className="nav-red nav-red--instagram"
            aria-label="Escríbeme por Instagram"
            title="Escríbeme por Instagram"
          >
            <InstagramIcon size={18} />
          </Tecla>
          <Tecla
            href={YOUTUBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            color="blanca"
            tamano="peq"
            icono
            className="nav-red nav-red--youtube"
            aria-label="Mi canal de YouTube"
            title="Mi canal de YouTube"
          >
            <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor" aria-hidden="true">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.5 15.5v-7l6.3 3.5-6.3 3.5z" />
            </svg>
          </Tecla>
        </span>

        {/* El altavoz: los sonidos vienen encendidos, así que silenciarlos
            tiene que estar siempre a mano, en todas las pantallas (ESTILO.md,
            «Los sonidos»). */}
        <SonidoColgante />

        {/* El foro en móvil: solo se ve por debajo de 1200 px, donde se esconde
            el de escritorio (site-nav.css). Solo con sesión: sin ella, ahí van
            únicamente «Entrar» y «Registrarse» (pedido por el admin el
            13-11-2026); el foro sigue en el menú. */}
        {foro && user && <NavForoMovil />}

        {/* Identidad y accesos personales, en un solo sitio. Pulsando el
            nombre se abre el menú con «Mi dashboard» y «Mi perfil». */}
        {user && nombre && <NavSaludo nombre={nombre} plan={perfil.plan} avatar={perfil.avatar} />}

        {/* Para quien todavía no tiene cuenta, solo «Entrar» (18-11-2026, pedido
            por el admin): crear la cuenta lo hace la tecla grande del hero de la
            portada y el menú, así la barra respira. */}
        {!user && (
          <span className="nav-acceso">
            <Tecla href="/login" color="blanca" tamano="peq" className="nav-acceso-entrar">Entrar</Tecla>
          </span>
        )}

        <BlogMobileMenu
          user={user}
          isPremium={premium}
          userName={nombre}
          isAdmin={admin}
          avatar={perfil.avatar}
          foro={foro}
          precio={precioEur(PREMIUM_PRICE_EUR)}
        />
      </div>
    </nav>
  );
}
