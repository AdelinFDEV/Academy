import "server-only";
import { bd } from "../bd";
import { urlPublica } from "../imagenes/almacen";
import { nivelDe } from "../limites";
import type { AutorForo, CategoriaForo, HiloEnListado, HiloForo, ListadoForo, MensajeForo } from "../tipos";

/**
 * Lo PÚBLICO del foro: el listado de preguntas y un hilo con sus respuestas.
 *
 * Es lo que ve cualquiera, con cuenta o sin ella, y también Google. Por eso:
 *   · solo salen filas `publicada` (y las réplicas de una respuesta oculta se
 *     esconden con ella);
 *   · cada tipo se construye campo a campo. Los ids de usuario se usan aquí
 *     dentro para buscar el alias y la foto, y NO salen de esta función;
 *   · el orden de las respuestas se decide aquí, en el servidor, igual para
 *     todos (FORO.md §9): nunca en el navegador.
 *
 * Nada de esto depende de quién mira. Lo personal (sus me gusta, si puede
 * participar) se pide aparte: `datos/mio.ts`.
 */

export const HILOS_POR_PAGINA = 20;
/** Con menos respuestas que esto, van por orden de llegada (FORO.md §9.1). */
const MINIMO_PARA_ORDENAR = 5;
const DOS_DIAS = 48 * 60 * 60 * 1000;

type Cliente = ReturnType<typeof bd>;

/** Alias, foto y nivel de un puñado de usuarios. El mapa no sale de este archivo. */
async function autores(cliente: Cliente, ids: (string | null)[]): Promise<Map<string, NonNullable<AutorForo>>> {
  const unicos = Array.from(new Set(ids.filter((x): x is string => typeof x === "string" && x !== "")));
  const mapa = new Map<string, NonNullable<AutorForo>>();
  if (!unicos.length) return mapa;
  const [perfiles, reputaciones] = await Promise.all([
    cliente.from("profiles").select("id, alias, avatar, role").in("id", unicos),
    cliente.from("foro_reputacion").select("usuario_id, puntos").in("usuario_id", unicos),
  ]);
  const puntos = new Map((reputaciones.data ?? []).map((r) => [String(r.usuario_id), Number(r.puntos)]));
  for (const p of perfiles.data ?? []) {
    // Sin alias no se firma: no se enseña nunca el nombre de la cuenta.
    if (typeof p.alias !== "string" || !p.alias) continue;
    mapa.set(String(p.id), {
      alias: p.alias,
      avatar: typeof p.avatar === "string" ? p.avatar : null,
      nivel: nivelDe(Math.max(0, puntos.get(String(p.id)) ?? 0)),
      esAdmin: p.role === "admin",
    });
  }
  return mapa;
}

async function categorias(cliente: Cliente): Promise<CategoriaForo[]> {
  const [{ data: cats }, { data: hilos }] = await Promise.all([
    cliente.from("foro_categorias").select("slug, nombre, descripcion, orden").eq("activa", true).order("orden", { ascending: true }),
    cliente.from("foro_preguntas").select("categoria").eq("estado", "publicada").limit(5000),
  ]);
  const cuenta = new Map<string, number>();
  for (const h of hilos ?? []) cuenta.set(String(h.categoria), (cuenta.get(String(h.categoria)) ?? 0) + 1);
  return (cats ?? []).map((c) => ({
    slug: String(c.slug),
    nombre: String(c.nombre),
    descripcion: String(c.descripcion ?? ""),
    hilos: cuenta.get(String(c.slug)) ?? 0,
  }));
}

/**
 * El listado: las fijadas primero y luego por última actividad.
 * `categoria` es un slug; si no existe, devuelve null (la página dará 404).
 */
export async function listado(categoria: string | null, pagina: number): Promise<ListadoForo | null> {
  const cliente = bd();
  const cats = await categorias(cliente);
  const actual = categoria ? (cats.find((c) => c.slug === categoria) ?? null) : null;
  if (categoria && !actual) return null;

  const n = Number.isSafeInteger(pagina) && pagina > 0 ? pagina : 1;
  const desde = (n - 1) * HILOS_POR_PAGINA;

  let consulta = cliente
    .from("foro_preguntas")
    .select("id, slug, titulo, categoria, autor_id, creada_at, ultima_actividad_at, respuestas, ganadora_id, fijada, yo_tambien", { count: "exact" })
    .eq("estado", "publicada");
  if (actual) consulta = consulta.eq("categoria", actual.slug);
  const { data: filas, count } = await consulta
    .order("fijada", { ascending: false })
    .order("ultima_actividad_at", { ascending: false })
    .order("id", { ascending: false })
    .range(desde, desde + HILOS_POR_PAGINA - 1);

  const quien = await autores(cliente, (filas ?? []).map((f) => f.autor_id as string | null));
  const nombreDe = new Map(cats.map((c) => [c.slug, c.nombre]));

  const hilos: HiloEnListado[] = (filas ?? []).map((f) => ({
    id: Number(f.id),
    slug: String(f.slug),
    titulo: String(f.titulo),
    categoria: { slug: String(f.categoria), nombre: nombreDe.get(String(f.categoria)) ?? String(f.categoria) },
    autor: f.autor_id ? (quien.get(String(f.autor_id)) ?? null) : null,
    fecha: String(f.creada_at),
    ultimaActividad: String(f.ultima_actividad_at),
    respuestas: Number(f.respuestas),
    resuelto: f.ganadora_id != null,
    fijado: Boolean(f.fijada),
    yoTambien: Number(f.yo_tambien),
  }));

  const total = count ?? hilos.length;
  return {
    categorias: cats,
    categoria: actual,
    hilos,
    pagina: n,
    paginas: Math.max(1, Math.ceil(total / HILOS_POR_PAGINA)),
    total,
  };
}

/**
 * El orden de las respuestas (FORO.md §9.1). Recibe las respuestas POR ORDEN
 * DE LLEGADA (fecha y, a igualdad, id), que es como las da la consulta.
 *
 *   · con menos de 5, se quedan así: se lee como una conversación, y un me
 *     gusta temprano no entierra a quien llegó después;
 *   · con 5 o más: primero las de más me gusta y, a igualdad, la más antigua;
 *   · «recientes»: la última primero;
 *   · la ganadora, siempre la primera, en los dos.
 *
 * `sort` es estable: los empates conservan el orden de llegada, así que el
 * resultado es idéntico en cada carga, para todos y para Google.
 */
export function ordenar(porLlegada: MensajeForo[], orden: "relevancia" | "recientes"): MensajeForo[] {
  let lista = [...porLlegada];
  if (orden === "recientes") lista.reverse();
  else if (lista.length >= MINIMO_PARA_ORDENAR) lista.sort((a, b) => b.meGusta - a.meGusta);
  lista = lista.sort((a, b) => Number(b.esGanadora) - Number(a.esGanadora));
  return lista;
}

/**
 * Un hilo entero, o null si no existe o no está publicado. Uno oculto o
 * borrado responde igual que uno que nunca existió (FORO.md §6.2).
 *
 * `orden`: "relevancia" (el de siempre) o "recientes". La ganadora va la
 * primera en los dos.
 */
export async function hilo(id: number, orden: "relevancia" | "recientes" = "relevancia"): Promise<HiloForo | null> {
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  const cliente = bd();

  const { data: p } = await cliente
    .from("foro_preguntas")
    .select("id, slug, titulo, cuerpo, categoria, autor_id, estado, cerrada, fijada, ganadora_id, interesante, gracias, yo_tambien, editada_at, editada_por_admin, creada_at")
    .eq("id", id)
    .maybeSingle();
  if (!p || p.estado !== "publicada") return null;

  const [{ data: filas }, { data: imagenes }, { data: categoria }, { count: reportesAbiertos }] = await Promise.all([
    cliente
      .from("foro_respuestas")
      .select("id, padre_id, autor_id, citado_id, cuerpo, me_gusta, editada_at, editada_por_admin, creada_at")
      .eq("pregunta_id", id)
      .eq("estado", "publicada")
      .order("creada_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(2000),
    cliente.from("foro_imagenes").select("id, ancho, alto, orden").eq("pregunta_id", id).eq("estado", "publicada").order("orden", { ascending: true }),
    cliente.from("foro_categorias").select("slug, nombre").eq("slug", String(p.categoria)).maybeSingle(),
    cliente.from("foro_reportes").select("id", { count: "exact", head: true }).eq("pregunta_id", id).eq("estado", "abierto"),
  ]);

  const todas = filas ?? [];
  const quien = await autores(cliente, [
    p.autor_id as string | null,
    ...todas.map((f) => f.autor_id as string | null),
    ...todas.map((f) => f.citado_id as string | null),
  ]);
  const autorDe = (uid: unknown) => (typeof uid === "string" && uid ? (quien.get(uid) ?? null) : null);

  const mensaje = (f: (typeof todas)[number], replicas: MensajeForo[]): MensajeForo => ({
    id: String(f.id),
    texto: String(f.cuerpo),
    fecha: String(f.creada_at),
    editado: f.editada_at != null,
    editadoPorModeracion: Boolean(f.editada_por_admin),
    autor: autorDe(f.autor_id),
    meGusta: Number(f.me_gusta),
    esGanadora: p.ganadora_id != null && String(f.id) === String(p.ganadora_id),
    citado: autorDe(f.citado_id)?.alias ?? null,
    replicas,
  });

  // Las réplicas cuelgan de su respuesta. Como solo se han leído las
  // publicadas, las de una respuesta oculta se quedan sin padre y no salen.
  const raices = todas.filter((f) => f.padre_id == null);
  const idsRaiz = new Set(raices.map((f) => String(f.id)));
  const porPadre = new Map<string, MensajeForo[]>();
  for (const f of todas) {
    if (f.padre_id == null || !idsRaiz.has(String(f.padre_id))) continue;
    const lista = porPadre.get(String(f.padre_id)) ?? [];
    lista.push(mensaje(f, []));
    porPadre.set(String(f.padre_id), lista);
  }
  const respuestas = raices.map((f) => mensaje(f, porPadre.get(String(f.id)) ?? []));

  const ordenadas = ordenar(respuestas, orden);

  return {
    id: Number(p.id),
    slug: String(p.slug),
    titulo: String(p.titulo),
    texto: String(p.cuerpo),
    categoria: { slug: String(p.categoria), nombre: String(categoria?.nombre ?? p.categoria) },
    autor: autorDe(p.autor_id),
    fecha: String(p.creada_at),
    editado: p.editada_at != null,
    editadoPorModeracion: Boolean(p.editada_por_admin),
    cerrado: Boolean(p.cerrada),
    fijado: Boolean(p.fijada),
    etiquetas: { interesante: Number(p.interesante), gracias: Number(p.gracias), yoTambien: Number(p.yo_tambien) },
    imagenes: (imagenes ?? []).map((i) => ({ url: urlPublica(String(i.id)), ancho: Number(i.ancho), alto: Number(i.alto) })),
    respuestas: ordenadas,
    totalRespuestas: respuestas.length,
    // Google espera: con respuesta, 48 horas publicada y sin reportes abiertos.
    indexable:
      respuestas.length > 0 &&
      Date.now() - new Date(String(p.creada_at)).getTime() > DOS_DIAS &&
      (reportesAbiertos ?? 0) === 0,
  };
}
