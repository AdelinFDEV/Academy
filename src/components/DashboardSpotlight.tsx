"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  NotebookPen, Map, GraduationCap, Lock, Sparkles, Trophy,
  ClipboardCheck, BadgeCheck, Hourglass, ArrowRight,
} from "lucide-react";

interface Props {
  isPremium: boolean;
}

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function DashboardSpotlight({ isPremium }: Props) {
  return (
    <div className="dash-spot-grid">
      {/* ── Diario de Trading ── */}
      <motion.div
        className="dash-spot-card dash-spot-card--trading"
        custom={0}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        whileHover={{ y: -6 }}
      >
        <div className="dash-spot-glow" />
        <div className="dash-spot-top">
          <div className="dash-spot-icon dash-spot-icon--trading">
            <NotebookPen size={22} strokeWidth={2} />
          </div>
          <span className="dash-spot-badge dash-spot-badge--premium">
            <Sparkles size={11} /> Premium
          </span>
        </div>

        <h3 className="dash-spot-title">Diario de Trading</h3>
        <p className="dash-spot-desc">
          El diario de trading más completo e interactivo de internet. No solo registras
          tus operaciones — completas <strong>retos</strong> que te convierten, paso a paso, en un trader disciplinado.
        </p>

        <div className="dash-spot-chips">
          <span className="dash-spot-chip"><ClipboardCheck size={12} /> Registro de operaciones</span>
          <span className="dash-spot-chip"><Trophy size={12} /> Retos y niveles</span>
          <span className="dash-spot-chip"><BadgeCheck size={12} /> Estadísticas reales</span>
        </div>

        {isPremium ? (
          <Link href="/dashboard/trading" className="dash-spot-cta dash-spot-cta--trading">
            Abrir mi diario <ArrowRight size={15} />
          </Link>
        ) : (
          <Link href="/premium" className="dash-spot-cta dash-spot-cta--locked">
            <Lock size={13} /> Hazte Premium <ArrowRight size={15} />
          </Link>
        )}
      </motion.div>

      {/* ── Guías Interactivas ── */}
      <motion.div
        className="dash-spot-card dash-spot-card--guias"
        custom={1}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        whileHover={{ y: -6 }}
      >
        <div className="dash-spot-glow" />
        <div className="dash-spot-top">
          <div className="dash-spot-icon dash-spot-icon--guias">
            <Map size={22} strokeWidth={2} />
          </div>
          <span className="dash-spot-badge dash-spot-badge--star">
            ★ Lo más top
          </span>
        </div>

        <h3 className="dash-spot-title">Guías Interactivas</h3>
        <p className="dash-spot-desc">
          El elemento <strong>estrella</strong> de toda la academia. Aprende con quizzes,
          progreso guardado y logros exclusivos por cada guía completada.
        </p>

        <div className="dash-spot-chips">
          <span className="dash-spot-chip"><Sparkles size={12} /> 100% interactivas</span>
          <span className="dash-spot-chip"><Trophy size={12} /> Logros exclusivos</span>
        </div>

        <Link href="/guias" className="dash-spot-cta dash-spot-cta--guias">
          Explorar guías <ArrowRight size={15} />
        </Link>
      </motion.div>

      {/* ── Cursos ── */}
      <motion.div
        className="dash-spot-card dash-spot-card--cursos"
        custom={2}
        initial="hidden"
        animate="visible"
        variants={cardVariants}
      >
        <div className="dash-spot-glow" />
        <div className="dash-spot-top">
          <div className="dash-spot-icon dash-spot-icon--cursos">
            <GraduationCap size={22} strokeWidth={2} />
          </div>
          <span className="dash-spot-badge dash-spot-badge--soon">
            <Hourglass size={11} /> Próximamente
          </span>
        </div>

        <h3 className="dash-spot-title">Cursos</h3>
        <p className="dash-spot-desc">
          Formación estructurada de principio a fin, con módulos y evaluaciones.
          Uno de los pilares que vienen para la academia.
        </p>

        <div className="dash-spot-chips">
          <span className="dash-spot-chip dash-spot-chip--muted"><GraduationCap size={12} /> Formación paso a paso</span>
        </div>

        <span className="dash-spot-cta dash-spot-cta--soon">Muy pronto disponible</span>
      </motion.div>
    </div>
  );
}
