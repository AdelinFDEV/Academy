// ─── Token Vesting Data ───────────────────────────────────────────────────────
// Data researched from official tokenomics docs, whitepapers, and on-chain data.
// Update monthly amounts if schedules change due to governance votes.

export interface TokenAllocation {
  name: string
  pct: number
  tokens: number
  color: string
  schedule: string
  isActive: boolean
}

export interface VestingSchedule {
  category: string
  color: string
  monthlyTokens: number
  startDate: string  // YYYY-MM-DD — when linear vest begins (post cliff)
  endDate: string    // YYYY-MM-DD — when this tranche ends
  cliffDate?: string
  cliffTokens?: number
}

export interface Token {
  id: string
  symbol: string
  name: string
  color: string
  bgGradient: string
  totalSupply: number
  tge: string
  vestingEnd: string
  category: string
  description: string
  keyRisk: string
  allocations: TokenAllocation[]
  schedules: VestingSchedule[]
  isPremium: boolean
}

// ─── Helper ───────────────────────────────────────────────────────────────────

export interface UnlockEvent {
  date: string
  category: string
  color: string
  tokens: number
  type: "monthly" | "cliff"
}

export function getUpcomingUnlocks(token: Token, fromDate: Date, months = 12): UnlockEvent[] {
  const events: UnlockEvent[] = []
  const to = new Date(fromDate)
  to.setMonth(to.getMonth() + months)

  for (const s of token.schedules) {
    const start = new Date(s.startDate)
    const end = new Date(s.endDate)

    // Cliff event
    if (s.cliffDate && s.cliffTokens) {
      const cliff = new Date(s.cliffDate)
      if (cliff >= fromDate && cliff <= to) {
        events.push({ date: s.cliffDate, category: s.category, color: s.color, tokens: s.cliffTokens, type: "cliff" })
      }
    }

    // Monthly linear events
    const cursor = new Date(Math.max(start.getTime(), fromDate.getTime()))
    cursor.setDate(1)
    if (cursor < start) cursor.setMonth(cursor.getMonth() + 1)

    while (cursor <= end && cursor <= to) {
      const dateStr = cursor.toISOString().slice(0, 10)
      events.push({ date: dateStr, category: s.category, color: s.color, tokens: s.monthlyTokens, type: "monthly" })
      cursor.setMonth(cursor.getMonth() + 1)
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date))
}

export function getNextUnlock(token: Token, fromDate: Date): UnlockEvent | null {
  const events = getUpcomingUnlocks(token, fromDate, 24)
  return events.find(e => new Date(e.date) >= fromDate) ?? null
}

export function getMonthlyTotal(token: Token, fromDate: Date): number {
  const now = new Date(fromDate)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const events = getUpcomingUnlocks(token, now, 2)
  return events
    .filter(e => new Date(e.date) <= monthEnd)
    .reduce((sum, e) => sum + e.tokens, 0)
}

// ─── Tokens ───────────────────────────────────────────────────────────────────

export const TOKENS: Token[] = [
  // ── ARB ──────────────────────────────────────────────────────────────────
  {
    id: "arbitrum",
    symbol: "ARB",
    name: "Arbitrum",
    color: "#28A0F0",
    bgGradient: "linear-gradient(135deg, #0c2340 0%, #0a1628 100%)",
    totalSupply: 10_000_000_000,
    tge: "2023-03-23",
    vestingEnd: "2027-03-23",
    category: "Layer 2",
    description: "La red Ethereum L2 líder por TVL. El equipo y los inversores tienen el 44% del supply vesting durante 4 años con cliff de 1 año.",
    keyRisk: "Alta presión vendedora mensual del equipo e inversores (~92M ARB/mes). Monitorizar el comportamiento del precio entorno a cada unlock.",
    allocations: [
      { name: "DAO Treasury", pct: 42.78, tokens: 4_278_000_000, color: "#1a3a5c", schedule: "Controlado por governance — sin vesting forzado", isActive: true },
      { name: "Equipo + Futuro Equipo", pct: 26.94, tokens: 2_694_000_000, color: "#28A0F0", schedule: "4 años, cliff 1 año desde TGE (mar 2024 – mar 2027)", isActive: true },
      { name: "Inversores", pct: 17.53, tokens: 1_753_000_000, color: "#1565C0", schedule: "4 años, cliff 1 año desde TGE (mar 2024 – mar 2027)", isActive: true },
      { name: "Fundación", pct: 7.53, tokens: 753_000_000, color: "#4FC3F7", schedule: "Parcialmente liberado, resto vesting gradual", isActive: true },
      { name: "Airdrop Usuarios", pct: 5.22, tokens: 522_000_000, color: "#0D47A1", schedule: "Completamente distribuido en TGE", isActive: false },
    ],
    schedules: [
      { category: "Equipo + Futuro Equipo", color: "#28A0F0", monthlyTokens: 56_125_000, startDate: "2024-03-23", endDate: "2027-03-23" },
      { category: "Inversores", color: "#1565C0", monthlyTokens: 36_520_833, startDate: "2024-03-23", endDate: "2027-03-23" },
      { category: "Fundación", color: "#4FC3F7", monthlyTokens: 10_416_667, startDate: "2024-03-23", endDate: "2026-03-23" },
    ],
    isPremium: false,
  },

  // ── ZK ───────────────────────────────────────────────────────────────────
  {
    id: "zksync",
    symbol: "ZK",
    name: "zkSync",
    color: "#1755F4",
    bgGradient: "linear-gradient(135deg, #0a0f2e 0%, #0a1628 100%)",
    totalSupply: 21_000_000_000,
    tge: "2024-06-17",
    vestingEnd: "2028-06-17",
    category: "Layer 2",
    description: "L2 ZK-rollup de Matter Labs. Los inversores y el equipo tienen el 33% del supply con cliff de 1 año (jun 2025) y vesting lineal de 3 años.",
    keyRisk: "Unlocks masivos post-cliff activos desde junio 2025. ~194M ZK/mes en circulación nueva de inversores y equipo.",
    allocations: [
      { name: "Comunidad", pct: 66.7, tokens: 14_007_000_000, color: "#1a2a5e", schedule: "Airdrop + ecosistema — gradual", isActive: true },
      { name: "Inversores", pct: 17.2, tokens: 3_612_000_000, color: "#1755F4", schedule: "1 año cliff (jun 2025), luego 3 años lineales hasta jun 2028", isActive: true },
      { name: "Equipo", pct: 16.1, tokens: 3_381_000_000, color: "#4E7AFF", schedule: "1 año cliff (jun 2025), luego 3 años lineales hasta jun 2028", isActive: true },
    ],
    schedules: [
      { category: "Inversores", color: "#1755F4", monthlyTokens: 100_333_333, startDate: "2025-06-17", endDate: "2028-06-17" },
      { category: "Equipo", color: "#4E7AFF", monthlyTokens: 93_916_667, startDate: "2025-06-17", endDate: "2028-06-17" },
    ],
    isPremium: false,
  },

  // ── STRK ─────────────────────────────────────────────────────────────────
  {
    id: "starknet",
    symbol: "STRK",
    name: "Starknet",
    color: "#EC796B",
    bgGradient: "linear-gradient(135deg, #2a0f0a 0%, #0a1628 100%)",
    totalSupply: 10_000_000_000,
    tge: "2024-02-20",
    vestingEnd: "2028-02-20",
    category: "Layer 2",
    description: "L2 ZK-rollup de StarkWare. StarkWare y los inversores retienen el 50% del supply con vesting de 3 años tras cliff de 1 año (feb 2025).",
    keyRisk: "La mayor fuente de presión es StarkWare (32.9% del total) liberando ~91M STRK/mes durante 3 años.",
    allocations: [
      { name: "StarkWare", pct: 32.9, tokens: 3_290_000_000, color: "#EC796B", schedule: "1 año cliff (feb 2025), 3 años lineales hasta feb 2028", isActive: true },
      { name: "Inversores", pct: 17.3, tokens: 1_730_000_000, color: "#C0392B", schedule: "1 año cliff (feb 2025), 3 años lineales hasta feb 2028", isActive: true },
      { name: "Core Contributors", pct: 12.93, tokens: 1_293_000_000, color: "#FF8A70", schedule: "4 años lineales desde TGE (feb 2024 – feb 2028)", isActive: true },
      { name: "Fundación Starknet", pct: 12.93, tokens: 1_293_000_000, color: "#BDC3C7", schedule: "Grants + ecosistema, sin cliff estricto", isActive: true },
      { name: "Comunidad + Airdrop", pct: 23.94, tokens: 2_394_000_000, color: "#2c3e50", schedule: "Distribuido en TGE y drops progresivos", isActive: false },
    ],
    schedules: [
      { category: "StarkWare", color: "#EC796B", monthlyTokens: 91_388_889, startDate: "2025-02-20", endDate: "2028-02-20" },
      { category: "Inversores", color: "#C0392B", monthlyTokens: 48_055_556, startDate: "2025-02-20", endDate: "2028-02-20" },
      { category: "Core Contributors", color: "#FF8A70", monthlyTokens: 26_937_500, startDate: "2024-02-20", endDate: "2028-02-20" },
    ],
    isPremium: true,
  },

  // ── SUI ──────────────────────────────────────────────────────────────────
  {
    id: "sui",
    symbol: "SUI",
    name: "Sui",
    color: "#6FBCF0",
    bgGradient: "linear-gradient(135deg, #0a1e2e 0%, #0a1628 100%)",
    totalSupply: 10_000_000_000,
    tge: "2023-05-03",
    vestingEnd: "2027-05-03",
    category: "Layer 1",
    description: "Blockchain L1 de Mysten Labs orientada a gaming y DeFi. Early contributors e inversores tienen el 34% vesting 4 años con cliff de 1 año desde TGE.",
    keyRisk: "~94M SUI/mes de early contributors e inversores con vesting activo hasta mayo 2027.",
    allocations: [
      { name: "Reserva Comunitaria", pct: 50, tokens: 5_000_000_000, color: "#1a3a4e", schedule: "Controlada por Sui Foundation para grants y ecosistema", isActive: true },
      { name: "Early Contributors", pct: 20, tokens: 2_000_000_000, color: "#6FBCF0", schedule: "4 años, cliff 1 año desde TGE (may 2024 – may 2027)", isActive: true },
      { name: "Inversores", pct: 14, tokens: 1_400_000_000, color: "#2196F3", schedule: "4 años, cliff 1 año desde TGE (may 2024 – may 2027)", isActive: true },
      { name: "Mysten Labs Treasury", pct: 10, tokens: 1_000_000_000, color: "#4FC3F7", schedule: "Sin calendario público — controlado por Mysten Labs", isActive: true },
      { name: "Contribuidores Comunidad", pct: 6, tokens: 600_000_000, color: "#0D47A1", schedule: "Distribuido progresivamente vía grants", isActive: true },
    ],
    schedules: [
      { category: "Early Contributors", color: "#6FBCF0", monthlyTokens: 41_666_667, startDate: "2024-05-03", endDate: "2027-05-03" },
      { category: "Inversores", color: "#2196F3", monthlyTokens: 29_166_667, startDate: "2024-05-03", endDate: "2027-05-03" },
    ],
    isPremium: true,
  },

  // ── WLD ──────────────────────────────────────────────────────────────────
  {
    id: "worldcoin",
    symbol: "WLD",
    name: "Worldcoin",
    color: "#00C2FF",
    bgGradient: "linear-gradient(135deg, #001a2e 0%, #0a1628 100%)",
    totalSupply: 10_000_000_000,
    tge: "2023-07-24",
    vestingEnd: "2027-07-24",
    category: "Identidad Web3",
    description: "Proyecto de identidad digital de Sam Altman (OpenAI) y Alex Blania. Máximo supply de 10B WLD a lo largo de 15 años. Inversores y TFH (equipo) tienen cliff de 1 año y vesting de 3 años.",
    keyRisk: "Alta controversia regulatoria y presión constante de ~64M WLD/mes de inversores y equipo. Monitorizar adopción de World ID para anticipar narrativa.",
    allocations: [
      { name: "Comunidad (largo plazo)", pct: 75, tokens: 7_500_000_000, color: "#1a3a4e", schedule: "Distribuido gradualmente durante 15 años vía inflación y grants", isActive: true },
      { name: "Inversores", pct: 13.5, tokens: 1_350_000_000, color: "#00C2FF", schedule: "1 año cliff (jul 2024), 3 años lineales hasta jul 2027", isActive: true },
      { name: "Tools for Humanity (Equipo)", pct: 9.8, tokens: 980_000_000, color: "#0080AA", schedule: "1 año cliff (jul 2024), 3 años lineales hasta jul 2027", isActive: true },
      { name: "Reserva TFH", pct: 1.7, tokens: 170_000_000, color: "#E0F7FA", schedule: "Reserva operacional sin vesting público", isActive: true },
    ],
    schedules: [
      { category: "Inversores", color: "#00C2FF", monthlyTokens: 37_500_000, startDate: "2024-07-24", endDate: "2027-07-24" },
      { category: "Tools for Humanity", color: "#0080AA", monthlyTokens: 27_222_222, startDate: "2024-07-24", endDate: "2027-07-24" },
    ],
    isPremium: true,
  },

  // ── JUP ──────────────────────────────────────────────────────────────────
  {
    id: "jupiter",
    symbol: "JUP",
    name: "Jupiter",
    color: "#C7F284",
    bgGradient: "linear-gradient(135deg, #0a1f0a 0%, #0a1628 100%)",
    totalSupply: 10_000_000_000,
    tge: "2024-01-31",
    vestingEnd: "2028-01-31",
    category: "DEX Aggregator",
    description: "El mayor agregador DEX de Solana. El equipo (20%) tiene cliff de 2 años desde TGE — empezó a vesting en enero 2026. La Cold Wallet (50%) se libera por decisión de governance.",
    keyRisk: "Desde enero 2026 hay 83M JUP/mes del equipo en vesting + decisiones de governance sobre la Cold Wallet pueden crear unlocks masivos no programados.",
    allocations: [
      { name: "Cold Wallet (Ecosystem)", pct: 50, tokens: 5_000_000_000, color: "#1a2e1a", schedule: "Liberado por decisiones de governance de Jupiter — sin calendario fijo", isActive: true },
      { name: "Equipo", pct: 20, tokens: 2_000_000_000, color: "#C7F284", schedule: "2 años cliff (ene 2026), 2 años lineales hasta ene 2028", isActive: true },
      { name: "Launch Pool + Airdrops", pct: 10, tokens: 1_000_000_000, color: "#8BC34A", schedule: "Distribuido en TGE y airdrops JUP1–JUP4", isActive: false },
      { name: "Community + Grants", pct: 20, tokens: 2_000_000_000, color: "#33691E", schedule: "Grants de ecosistema — vesting variable por proyecto", isActive: true },
    ],
    schedules: [
      { category: "Equipo", color: "#C7F284", monthlyTokens: 83_333_333, startDate: "2026-01-31", endDate: "2028-01-31" },
      { category: "Cold Wallet (Governance)", color: "#8BC34A", monthlyTokens: 50_000_000, startDate: "2026-01-31", endDate: "2028-01-31" },
    ],
    isPremium: true,
  },

  // ── APT ──────────────────────────────────────────────────────────────────
  {
    id: "aptos",
    symbol: "APT",
    name: "Aptos",
    color: "#00D4FF",
    bgGradient: "linear-gradient(135deg, #001a20 0%, #0a1628 100%)",
    totalSupply: 1_028_400_000,
    tge: "2022-10-17",
    vestingEnd: "2032-10-17",
    category: "Layer 1",
    description: "Blockchain L1 con Move VM creada por ex-equipo de Diem (Meta). Vesting extremadamente largo — core contributors y fundación tienen 10 años de vesting desde TGE.",
    keyRisk: "Menor presión mensual que otros tokens pero el vesting dura hasta 2032. Los inversores (cliff oct 2023) aún liberan ~2.8M APT/mes hasta oct 2027.",
    allocations: [
      { name: "Comunidad", pct: 51.02, tokens: 524_900_000, color: "#1a3a4e", schedule: "Grants, staking rewards, incentivos de red", isActive: true },
      { name: "Core Contributors", pct: 19, tokens: 195_400_000, color: "#00D4FF", schedule: "10 años lineales desde TGE (oct 2022 – oct 2032)", isActive: true },
      { name: "Fundación", pct: 16.5, tokens: 169_700_000, color: "#00B4D8", schedule: "10 años lineales desde TGE (oct 2022 – oct 2032)", isActive: true },
      { name: "Inversores", pct: 13.48, tokens: 138_700_000, color: "#0077B6", schedule: "Sin cliff inicial, 4 años lineales (oct 2022 – oct 2026)", isActive: true },
    ],
    schedules: [
      { category: "Core Contributors", color: "#00D4FF", monthlyTokens: 1_628_333, startDate: "2022-10-17", endDate: "2032-10-17" },
      { category: "Fundación", color: "#00B4D8", monthlyTokens: 1_414_167, startDate: "2022-10-17", endDate: "2032-10-17" },
      { category: "Inversores", color: "#0077B6", monthlyTokens: 2_894_583, startDate: "2023-10-17", endDate: "2026-10-17" },
    ],
    isPremium: true,
  },

  // ── TIA ──────────────────────────────────────────────────────────────────
  {
    id: "celestia",
    symbol: "TIA",
    name: "Celestia",
    color: "#7B2BF9",
    bgGradient: "linear-gradient(135deg, #1a0a2e 0%, #0a1628 100%)",
    totalSupply: 1_000_000_000,
    tge: "2023-10-31",
    vestingEnd: "2026-10-31",
    category: "Modular Blockchain",
    description: "La primera blockchain modular de disponibilidad de datos. El equipo y los early backers tenían cliff hasta oct 2024. Los early backers ya terminaron — el equipo libera hasta oct 2026.",
    keyRisk: "Vesting casi terminando — solo el core team sigue liberando ~11M TIA/mes hasta octubre 2026. Después la presión de vesting desaparece casi por completo.",
    allocations: [
      { name: "Core Team + Founders", pct: 26.8, tokens: 268_000_000, color: "#7B2BF9", schedule: "1 año cliff (oct 2024), 2 años lineales hasta oct 2026 — ACTIVO", isActive: true },
      { name: "Early Backers (Series A+B)", pct: 15.9, tokens: 159_000_000, color: "#5B1FD9", schedule: "1 año cliff (oct 2024), 1 año lineal hasta oct 2025 — COMPLETADO", isActive: false },
      { name: "Public Allocation + Airdrop", pct: 7.4, tokens: 74_000_000, color: "#E0C7FF", schedule: "Distribuido en TGE y airdrop inicial", isActive: false },
      { name: "Fondos de Ecosistema", pct: 26.8, tokens: 268_000_000, color: "#3a1a6e", schedule: "Grants para desarrolladores y proyectos en Celestia", isActive: true },
      { name: "Investigación + Desarrollo", pct: 23.1, tokens: 231_000_000, color: "#9B59B6", schedule: "Fondo para investigación modular y crecimiento del ecosistema", isActive: true },
    ],
    schedules: [
      { category: "Core Team + Founders", color: "#7B2BF9", monthlyTokens: 11_166_667, startDate: "2024-10-31", endDate: "2026-10-31" },
    ],
    isPremium: true,
  },

  // ── SOL ──────────────────────────────────────────────────────────────────
  {
    id: "solana",
    symbol: "SOL",
    name: "Solana",
    color: "#9945FF",
    bgGradient: "linear-gradient(135deg, #1a0a2e 0%, #0a1628 100%)",
    totalSupply: 589_000_000,
    tge: "2020-03-16",
    vestingEnd: "2031-01-01",
    category: "Layer 1",
    description: "Blockchain de alto rendimiento con Proof-of-Stake. El vesting original de VCs y equipo (4 años) concluyó entre 2024 y 2025. La presión de supply actual proviene de la inflación de staking (~5.5% anual) y los grants continuos de la Solana Foundation.",
    keyRisk: "Sin grandes cliffs pendientes. La presión continua es la inflación (~2.7M SOL/mes a validadores) y las distribuciones de la Foundation para grants de ecosistema (~1.5M SOL/mes). Total ~4.2M SOL/mes entrando al mercado de forma sostenida.",
    allocations: [
      { name: "Reserva Comunitaria", pct: 38.89, tokens: 194_450_000, color: "#1a0a2e", schedule: "Grants, incentivos de validadores y programas de ecosistema — distribución continua", isActive: true },
      { name: "Seed Sale (VC)", pct: 15.86, tokens: 79_300_000, color: "#9945FF", schedule: "4 años con cliff de 9 meses desde TGE (mar 2020) — COMPLETADO en 2024", isActive: false },
      { name: "Founding Sale", pct: 12.92, tokens: 64_600_000, color: "#6A1FC2", schedule: "Distribuido en múltiples tranches 2020–2022 — COMPLETADO", isActive: false },
      { name: "Equipo (Solana Labs)", pct: 12.79, tokens: 63_950_000, color: "#C084FC", schedule: "4 años lineales desde ene 2021 — COMPLETADO en ene 2025", isActive: false },
      { name: "Solana Foundation", pct: 10.46, tokens: 52_300_000, color: "#7C3AED", schedule: "Treasury activo para grants, validadores y desarrollo del ecosistema", isActive: true },
      { name: "Validator Sale + Público", pct: 9.08, tokens: 45_400_000, color: "#4C1D95", schedule: "Distribuido en TGE y ventas públicas 2020 — COMPLETADO", isActive: false },
      { name: "Inflación Staking (acumulada)", pct: 15.11, tokens: 89_000_000, color: "#A78BFA", schedule: "Nuevos SOL emitidos continuamente a validadores vía inflación (~5.5% TAE, reduciéndose 15%/año hasta 1.5%)", isActive: true },
    ],
    schedules: [
      // Inflación de staking: ~5.5% sobre 589M / 12 meses ≈ 2.7M SOL/mes a validadores
      { category: "Inflación de Staking (Validadores)", color: "#9945FF", monthlyTokens: 2_700_000, startDate: "2020-03-16", endDate: "2031-01-01" },
      // Foundation grants: estimado ~1.5M SOL/mes basado en informes trimestrales públicos
      { category: "Grants Solana Foundation", color: "#7C3AED", monthlyTokens: 1_500_000, startDate: "2020-03-16", endDate: "2031-01-01" },
    ],
    isPremium: true,
  },

  // ── XRP ──────────────────────────────────────────────────────────────────
  {
    id: "xrp",
    symbol: "XRP",
    name: "XRP (Ripple)",
    color: "#00AAE4",
    bgGradient: "linear-gradient(135deg, #001a2e 0%, #0a1628 100%)",
    totalSupply: 100_000_000_000,
    tge: "2012-01-01",
    vestingEnd: "2031-06-01",
    category: "Pagos / RWA",
    description: "Ripple colocó 55B XRP en escrow en diciembre de 2017 para garantizar transparencia. Cada mes se libera 1B XRP del escrow — Ripple usa entre 300M y 600M y devuelve el resto a nuevos contratos de escrow. Con ~36.5B XRP aún en escrow, el mecanismo continuará hasta aproximadamente 2031.",
    keyRisk: "1B XRP brutos liberados del escrow el 1º de cada mes. Ripple distribuye históricamente entre 300M y 600M XRP netos (ventas institucionales, ODL, market makers). El escrow restante (~36.5B XRP) representa una sobresalida de supply permanente que presiona estructuralmente el precio.",
    allocations: [
      { name: "Circulante (holders + exchanges)", pct: 57.5, tokens: 57_500_000_000, color: "#1a3a4e", schedule: "Tokens en circulación libre en el mercado", isActive: true },
      { name: "Escrow Ripple (por liberar)", pct: 36.5, tokens: 36_500_000_000, color: "#00AAE4", schedule: "1B XRP liberados del escrow el 1º de cada mes — Ripple distribuye ~300–600M netos y devuelve el resto a nuevo escrow. Duración estimada: hasta 2031", isActive: true },
      { name: "Ripple Holdings (no escrow)", pct: 5, tokens: 5_000_000_000, color: "#0080B3", schedule: "Reserva operacional de Ripple fuera del escrow — disponible para ventas institucionales y partnership deals", isActive: true },
      { name: "On-Demand Liquidity (ODL)", pct: 1, tokens: 1_000_000_000, color: "#4FC3F7", schedule: "XRP utilizado en el producto de liquidez transfronteriza de Ripple — rotación continua", isActive: true },
    ],
    schedules: [
      // Escrow bruto: 1B XRP el 1º de cada mes (mecanismo on-chain desde ene 2018)
      { category: "Escrow Ripple (liberación bruta)", color: "#00AAE4", monthlyTokens: 1_000_000_000, startDate: "2018-01-01", endDate: "2031-06-01" },
      // Net distribution: Ripple usa históricamente ~400M netos (promedio Q1 2023–Q4 2024 de informes XRP Markets Reports)
      { category: "Distribución neta Ripple", color: "#0080B3", monthlyTokens: 400_000_000, startDate: "2018-01-01", endDate: "2031-06-01" },
    ],
    isPremium: true,
  },
]

export const FREE_TOKEN_IDS = ["arbitrum", "zksync"]
