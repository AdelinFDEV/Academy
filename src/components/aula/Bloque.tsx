"use client";

import Grafico, { validarGrafico } from "./bloques/Grafico";
import Pregunta, { validarPregunta } from "./bloques/Pregunta";
import VerdaderoFalso, { validarVF } from "./bloques/VerdaderoFalso";
import Clasificar, { validarClasificar } from "./bloques/Clasificar";
import Ordenar, { validarOrdenar } from "./bloques/Ordenar";
import CalculadoraTramos, { validarTramos } from "./bloques/CalculadoraTramos";
import SimuladorFifo, { validarFifo } from "./bloques/SimuladorFifo";
import { BloqueRoto } from "./bloques/comun";

/**
 * El catálogo de bloques del aula. **Es la única lista**: el nombre que va en
 * `data-bloque="…"` dentro del HTML de una lección tiene que estar aquí.
 *
 * Cada bloque trae su validador. Si los datos no encajan, el alumno no ve
 * nada —mejor un hueco que un componente roto— y el admin ve un aviso rojo
 * con el motivo, para arreglarlo antes de publicar.
 *
 * Para añadir uno nuevo: su componente en `bloques/`, su validador, su línea
 * aquí y su ficha en CURSOS.md.
 */
export default function Bloque({
  bloque,
  datos,
  error,
  esAdmin,
}: {
  bloque: string;
  datos: unknown;
  error?: string;
  esAdmin: boolean;
}) {
  if (error) return <BloqueRoto bloque={bloque} motivo={`El JSON no es válido: ${error}`} esAdmin={esAdmin} />;

  const invalido = () => <BloqueRoto bloque={bloque} motivo="Los datos no tienen la forma que pide (ver CURSOS.md)." esAdmin={esAdmin} />;

  switch (bloque) {
    case "grafico":
      return validarGrafico(datos) ? <Grafico datos={datos} /> : invalido();
    case "pregunta":
      return validarPregunta(datos) ? <Pregunta datos={datos} /> : invalido();
    case "verdadero-falso":
      return validarVF(datos) ? <VerdaderoFalso datos={datos} /> : invalido();
    case "clasificar":
      return validarClasificar(datos) ? <Clasificar datos={datos} /> : invalido();
    case "ordenar":
      return validarOrdenar(datos) ? <Ordenar datos={datos} /> : invalido();
    case "tramos":
      return validarTramos(datos) ? <CalculadoraTramos datos={datos} /> : invalido();
    case "fifo":
      return validarFifo(datos) ? <SimuladorFifo datos={datos} /> : invalido();
    default:
      return <BloqueRoto bloque={bloque} motivo="No existe ningún bloque con ese nombre." esAdmin={esAdmin} />;
  }
}
