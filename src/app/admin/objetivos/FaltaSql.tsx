/** Lo que se enseña mientras no existan las tablas en Supabase. */
export default function FaltaSql() {
  return (
    <p className="cp-alerta">
      Faltan tablas o la última actualización. Ejecuta <code>scripts/create-objetivos.sql</code> entero en el SQL
      Editor de Supabase y recarga esta página. Se puede lanzar las veces que haga falta: no borra nada.
    </p>
  );
}
