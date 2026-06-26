"use client";

import { useState, useMemo } from "react";
import { Bookmark } from "lucide-react";

interface Term {
  term: string;
  definition: string;
  category: "básicos" | "trading" | "defi" | "seguridad";
}

const TERMS: Term[] = [
  // Básicos
  { term: "Altcoin", category: "básicos", definition: "Cualquier criptomoneda que no sea Bitcoin. El término viene de 'alternative coin'. Ejemplos: Ethereum, Solana, XRP." },
  { term: "Bitcoin (BTC)", category: "básicos", definition: "La primera y más importante criptomoneda, creada en 2009 por Satoshi Nakamoto. Es descentralizada y tiene un suministro máximo de 21 millones de monedas." },
  { term: "Blockchain", category: "básicos", definition: "Tecnología de registro distribuido donde las transacciones se agrupan en bloques encadenados de forma cronológica. Es inmutable y transparente." },
  { term: "Halving", category: "básicos", definition: "Evento programado cada ~4 años en Bitcoin donde la recompensa por minar un bloque se reduce a la mitad. Históricamente ha precedido grandes subidas de precio." },
  { term: "Market Cap", category: "básicos", definition: "Capitalización de mercado: precio actual × suministro en circulación. Indica el tamaño relativo de una criptomoneda." },
  { term: "Wallet (Cartera)", category: "básicos", definition: "Software o dispositivo físico que almacena las claves privadas que dan acceso a tus criptomonedas. No almacena monedas, sino las claves para acceder a ellas." },
  { term: "Exchange", category: "básicos", definition: "Plataforma donde se compran, venden e intercambian criptomonedas. Pueden ser centralizados (CEX) como Binance o descentralizados (DEX) como Uniswap." },
  { term: "Gas", category: "básicos", definition: "Tarifa pagada en ETH para ejecutar transacciones o contratos inteligentes en la red Ethereum. Varía según la congestión de la red." },
  { term: "Hash Rate", category: "básicos", definition: "Poder de cómputo total de una red blockchain. Mayor hash rate = red más segura y descentralizada." },
  { term: "NFT", category: "básicos", definition: "Token No Fungible. Activo digital único en blockchain que representa la propiedad de un ítem digital o físico. No es intercambiable 1:1 como las monedas." },
  { term: "Stablecoin", category: "básicos", definition: "Criptomoneda diseñada para mantener un precio estable, generalmente anclado al dólar (USDT, USDC). Útil para evitar la volatilidad sin salir del ecosistema crypto." },
  { term: "Web3", category: "básicos", definition: "Visión de internet descentralizada basada en blockchain, donde los usuarios controlan sus propios datos y activos digitales sin depender de grandes empresas." },
  // Trading
  { term: "ATH", category: "trading", definition: "All Time High. El precio más alto que ha alcanzado un activo en toda su historia. Importante nivel de referencia psicológica." },
  { term: "ATL", category: "trading", definition: "All Time Low. El precio más bajo registrado de un activo. Otro nivel de referencia clave para evaluar el recorrido de un proyecto." },
  { term: "Bear Market", category: "trading", definition: "Mercado bajista. Período prolongado de caída de precios, generalmente superior al 20% desde máximos. Se caracteriza por pesimismo generalizado." },
  { term: "Bull Market", category: "trading", definition: "Mercado alcista. Período de subida sostenida de precios acompañado de optimismo y mayor adopción. Suele seguir a un halving de Bitcoin." },
  { term: "DCA", category: "trading", definition: "Dollar Cost Averaging. Estrategia de inversión que consiste en comprar una cantidad fija en intervalos regulares, sin importar el precio. Reduce el impacto de la volatilidad." },
  { term: "DYOR", category: "trading", definition: "Do Your Own Research (Haz tu propia investigación). Principio fundamental en crypto: nunca inviertas basándote solo en consejos de terceros." },
  { term: "FOMO", category: "trading", definition: "Fear Of Missing Out (Miedo a perderse algo). Emoción que lleva a comprar en máximos por el miedo a perder una subida. Uno de los errores más costosos en trading." },
  { term: "FUD", category: "trading", definition: "Fear, Uncertainty and Doubt (Miedo, incertidumbre y duda). Información negativa, a veces falsa, que genera pánico y caídas de precio." },
  { term: "HODL", category: "trading", definition: "Hold On for Dear Life. Estrategia de mantener criptomonedas a largo plazo sin vender durante caídas. Viene de un error tipográfico que se viralizó en 2013." },
  { term: "Liquidación", category: "trading", definition: "Cierre forzado de una posición apalancada cuando las pérdidas alcanzan el margen disponible. El exchange vende automáticamente tus activos." },
  { term: "Long / Short", category: "trading", definition: "Long: apostar a que el precio sube (comprar). Short: apostar a que el precio baja (vender en corto). Conceptos básicos del trading con derivados." },
  { term: "PnL", category: "trading", definition: "Profit and Loss (Ganancias y Pérdidas). Resultado financiero de tus operaciones. PnL realizado: ya cerrado. PnL no realizado: posición abierta." },
  { term: "Pump and Dump", category: "trading", definition: "Manipulación de mercado donde un grupo infla artificialmente el precio de un activo para luego vender masivamente, dejando pérdidas a los compradores tardíos." },
  { term: "Resistencia", category: "trading", definition: "Nivel de precio donde históricamente la presión vendedora detiene o revierte una subida. Zona clave en análisis técnico." },
  { term: "ROI", category: "trading", definition: "Return on Investment (Retorno sobre la inversión). Porcentaje de ganancia o pérdida sobre el capital invertido. ROI = (ganancia / inversión) × 100." },
  { term: "Soporte", category: "trading", definition: "Nivel de precio donde históricamente la presión compradora detiene o revierte una caída. Si se rompe, suele convertirse en resistencia." },
  { term: "Stop Loss", category: "trading", definition: "Orden automática para cerrar una posición con pérdida limitada cuando el precio cae a un nivel predeterminado. Herramienta esencial de gestión de riesgo." },
  { term: "Take Profit", category: "trading", definition: "Orden para cerrar una posición con ganancias cuando el precio alcanza un objetivo. Permite asegurar beneficios sin monitorear constantemente el mercado." },
  { term: "Whale", category: "trading", definition: "Gran inversor con capacidad para mover el mercado. Generalmente alguien con más de 1.000 BTC o su equivalente. Sus movimientos influyen en el precio." },
  // DeFi
  { term: "DeFi", category: "defi", definition: "Finanzas Descentralizadas. Ecosistema de aplicaciones financieras construidas sobre blockchain que operan sin intermediarios (bancos, brokers). Incluye préstamos, trading y más." },
  { term: "DEX", category: "defi", definition: "Exchange Descentralizado. Plataforma de intercambio de criptomonedas sin custodia central. Los usuarios operan directamente desde sus wallets (Uniswap, dYdX)." },
  { term: "Liquidity Pool", category: "defi", definition: "Fondo de criptomonedas bloqueadas en un smart contract que provee liquidez a un DEX. Los proveedores de liquidez ganan comisiones por las operaciones." },
  { term: "Staking", category: "defi", definition: "Bloquear criptomonedas para participar en la validación de transacciones (Proof of Stake) y ganar recompensas. Similar a un depósito bancario pero en crypto." },
  { term: "Yield Farming", category: "defi", definition: "Estrategia de maximizar rendimientos moviendo fondos entre diferentes protocolos DeFi. Ofrece altas rentabilidades pero con riesgos significativos." },
  { term: "Smart Contract", category: "defi", definition: "Contrato inteligente. Programa autoejecutado en blockchain que se activa cuando se cumplen condiciones predefinidas, sin necesidad de intermediarios." },
  // Seguridad
  { term: "Clave Privada", category: "seguridad", definition: "Código único que da acceso y control total sobre tus criptomonedas. Nunca la compartas con nadie. Si la pierdes, pierdes tus fondos permanentemente." },
  { term: "Seed Phrase", category: "seguridad", definition: "Frase de recuperación de 12 o 24 palabras que genera tu wallet. Es el respaldo de tu clave privada. Guárdala offline y nunca la introduzcas en ningún sitio web." },
  { term: "2FA", category: "seguridad", definition: "Autenticación de dos factores. Segunda capa de seguridad para acceder a exchanges. Usa una app como Google Authenticator en lugar de SMS, que es vulnerable." },
  { term: "Phishing", category: "seguridad", definition: "Ataque donde los estafadores suplantan sitios web o emails legítimos para robar tus credenciales o seed phrase. Verifica siempre la URL antes de introducir datos." },
  { term: "Cold Wallet", category: "seguridad", definition: "Wallet sin conexión a internet (hardware wallet como Ledger o Trezor). La forma más segura de guardar grandes cantidades de crypto a largo plazo." },
  { term: "Hot Wallet", category: "seguridad", definition: "Wallet conectada a internet (app móvil, extensión de navegador). Cómoda para uso diario pero más vulnerable a ataques. No guardes grandes cantidades en ella." },
];

const CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "básicos", label: "Básicos" },
  { id: "trading", label: "Trading" },
  { id: "defi", label: "DeFi" },
  { id: "seguridad", label: "Seguridad" },
] as const;

interface Props {
  isLoggedIn: boolean;
  initialSaved: string[];
}

export default function GlosarioClient({ isLoggedIn, initialSaved }: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [saved, setSaved] = useState<Set<string>>(new Set(initialSaved));
  const [toggling, setToggling] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return TERMS.filter((t) => {
      const matchesCat = category === "all" || t.category === category;
      const matchesSearch = !q || t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    }).sort((a, b) => a.term.localeCompare(b.term));
  }, [search, category]);

  async function toggleSave(t: Term) {
    if (!isLoggedIn) {
      window.location.href = "/login";
      return;
    }
    if (toggling === t.term) return;
    setToggling(t.term);

    const wasSaved = saved.has(t.term);
    setSaved((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(t.term);
      else next.add(t.term);
      return next;
    });

    try {
      const res = await fetch("/api/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: t.term, definition: t.definition, category: t.category }),
      });
      if (res.ok) {
        const data = await res.json();
        setSaved((prev) => {
          const next = new Set(prev);
          if (data.saved) next.add(t.term);
          else next.delete(t.term);
          return next;
        });
      } else {
        setSaved((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(t.term);
          else next.delete(t.term);
          return next;
        });
      }
    } catch {
      setSaved((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(t.term);
        else next.delete(t.term);
        return next;
      });
    }
    setToggling(null);
  }

  return (
    <>
      <div className="glosario-controls">
        <input
          type="search"
          className="glosario-search"
          placeholder="Buscar término…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoComplete="off"
        />
        <div className="glosario-cats">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`glosario-cat-btn${category === cat.id ? " active" : ""}`}
              onClick={() => setCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <p className="glosario-count">{filtered.length} término{filtered.length !== 1 ? "s" : ""}</p>

      <div className="glosario-list">
        {filtered.map((t) => {
          const isSaved = saved.has(t.term);
          return (
            <div key={t.term} className="glosario-term">
              <div className="glosario-term-head">
                <span className="glosario-term-name">{t.term}</span>
                <div className="glosario-term-actions">
                  <span className={`glosario-term-cat glosario-term-cat--${t.category}`}>{t.category}</span>
                  <button
                    className={`glosario-save-btn${isSaved ? " saved" : ""}`}
                    onClick={() => toggleSave(t)}
                    disabled={toggling === t.term}
                    aria-label={isSaved ? "Quitar de guardados" : "Guardar término"}
                    title={isLoggedIn ? (isSaved ? "Quitar de guardados" : "Guardar en tu diccionario") : "Inicia sesión para guardar términos"}
                  >
                    <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <p className="glosario-term-def">{t.definition}</p>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="glosario-empty">No se encontró ningún término para "{search}".</p>
        )}
      </div>
    </>
  );
}
