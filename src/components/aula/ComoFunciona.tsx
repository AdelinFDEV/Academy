import { BookOpen, CalendarClock, ClipboardCheck, Award } from "lucide-react";

/**
 * «Cómo funciona un curso», en cuatro pasos. Solo los datos: los pinta
 * `PasosCurso` (src/app/cursos/PasosCurso.tsx), en el catálogo y en la ficha
 * de cada curso. Describe lo que hace el aula DE VERDAD (`cursos-progreso.ts`):
 * si cambia una regla, se cambia aquí también, o la página promete otra cosa.
 */
export const PASOS = [
  {
    icon: BookOpen,
    titulo: "Módulos y lecciones",
    corto: "Módulos cortos, con gráficos y minijuegos.",
    texto: "Cada curso se divide en módulos cortos, y cada módulo en lecciones con su tiempo estimado, gráficos animados y minijuegos para fijar lo aprendido.",
  },
  {
    icon: CalendarClock,
    titulo: "A tu ritmo",
    corto: "Tú eliges las horas; el curso te arma el calendario.",
    texto: "Eliges cuántas horas a la semana le dedicas y el curso te arma un cronograma. Ves cuánto te queda, si vas por delante o por detrás y cuándo terminarás.",
  },
  {
    icon: ClipboardCheck,
    titulo: "Examen por módulo",
    corto: "Con un 5 se abre el siguiente módulo.",
    texto: "Cada módulo se cierra con un examen, y el siguiente no se abre hasta aprobarlo con un 5. Si suspendes, te dice qué lecciones repasar y lo repites en 24 horas.",
  },
  {
    icon: Award,
    titulo: "Examen final y certificado",
    corto: "Lo apruebas y el certificado es tuyo.",
    texto: "Nota de 0 a 10, todas las preguntas obligatorias y las incorrectas restando. Al aprobar, certificado verificable y un logro en tu perfil.",
  },
];
