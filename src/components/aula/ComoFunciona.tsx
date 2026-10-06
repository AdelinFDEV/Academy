import { BookOpen, CalendarClock, ClipboardCheck, Award } from "lucide-react";

/**
 * «Cómo funciona un curso», en cuatro pasos. Lo pintan el catálogo y la ficha
 * de cada curso. Describe lo que hace el aula DE VERDAD (`cursos-progreso.ts`):
 * si cambia una regla, se cambia aquí también, o la página promete otra cosa.
 */
const PASOS = [
  {
    icon: BookOpen,
    titulo: "Módulos y lecciones",
    texto: "Cada curso se divide en módulos cortos, y cada módulo en lecciones con su tiempo estimado, gráficos animados y minijuegos para fijar lo aprendido.",
  },
  {
    icon: CalendarClock,
    titulo: "A tu ritmo",
    texto: "Eliges cuántas horas a la semana le dedicas y el curso te arma un cronograma. Ves cuánto te queda, si vas por delante o por detrás y cuándo terminarás.",
  },
  {
    icon: ClipboardCheck,
    titulo: "Examen por módulo",
    texto: "Cada módulo se cierra con un examen, y el siguiente no se abre hasta aprobarlo con un 5. Si suspendes, te dice qué lecciones repasar y lo repites en 24 horas.",
  },
  {
    icon: Award,
    titulo: "Examen final y certificado",
    texto: "Nota de 0 a 10, todas las preguntas obligatorias y las incorrectas restando. Al aprobar, certificado verificable y un logro en tu perfil.",
  },
];

export default function ComoFunciona() {
  return (
    <ol className="cur-pasos">
      {PASOS.map((p, i) => {
        const Icon = p.icon;
        return (
          <li key={p.titulo} className="cur-paso">
            <span className="cur-paso-num">{String(i + 1).padStart(2, "0")}</span>
            <span className="cur-paso-icon" aria-hidden="true">
              <Icon size={18} strokeWidth={1.9} />
            </span>
            <span className="cur-paso-title">{p.titulo}</span>
            <span className="cur-paso-text">{p.texto}</span>
          </li>
        );
      })}
    </ol>
  );
}
