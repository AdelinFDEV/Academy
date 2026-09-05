import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import LiveCounter from "@/components/LiveCounter";
import GuideSearch from "@/components/GuideSearch";
import BlogMobileMenu from "@/components/BlogMobileMenu";

interface Props {
  user: boolean;
  isPremium?: boolean;
  userName?: string;
  isAdmin?: boolean;
}

// Nav compartido por todas las páginas del sitio (marca, contador de
// usuarios, buscador de guías y menú). Antes estaba duplicado línea por
// línea en 20 archivos distintos.
export default function SiteNav({ user, isPremium, userName, isAdmin }: Props) {
  return (
    <nav className="blog-nav">
      <Link href="/" className="blog-brand">
        adelin<span>btc</span>
      </Link>
      <div className="blog-nav-center">
        {/* Aquí estuvo un enlace suelto a /herramientas entre el 05 y el
            06-09-2026. Se retiró: la barra ya lleva el contador y el buscador,
            y a las herramientas se llega desde el menú, desde la banda del hero
            y desde el sidebar de la portada. No hace falta una cuarta puerta
            compitiendo por el mismo espacio. */}
        <LiveCounter />
        <span className="blog-nav-divider" aria-hidden="true" />
        <GuideSearch />
      </div>
      <div className="blog-nav-end">
        {/* Vuelta al panel desde cualquier página, sin abrir el menú.
            Hasta el 06-09-2026 la única forma de volver al dashboard era el
            desplegable: dos clics y escondido, en PC y en móvil. Es el gesto
            más repetido de quien tiene cuenta, así que ahora está siempre a la
            vista. En pantallas estrechas se queda solo el icono, para no
            empujar al menú fuera de la barra. */}
        {user && (
          <Link href="/dashboard" className="blog-nav-panel" title="Ir a mi dashboard">
            <LayoutDashboard size={15} strokeWidth={2.1} aria-hidden="true" />
            <span>Mi dashboard</span>
          </Link>
        )}
        <BlogMobileMenu user={user} isPremium={isPremium} userName={userName} isAdmin={isAdmin} />
      </div>
    </nav>
  );
}
