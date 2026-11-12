import { Subject } from '../types/subject';
import gestion_tecnologias_informacionData from './subjects/gestion-tecnologias-informacion.json';
import ingenieria_serviciosData from './subjects/ingenieria-servicios.json';
import inteligencia_negocioData from './subjects/inteligencia-negocio.json';
import tecnologias_webData from './subjects/tecnologias-web.json';

export const subjectsCatalog: Subject[] = [
  gestion_tecnologias_informacionData as unknown as Subject,
  ingenieria_serviciosData as unknown as Subject,
  inteligencia_negocioData as unknown as Subject,
  tecnologias_webData as unknown as Subject,
];

export function getSubjectById(id: string): Subject | undefined {
  return subjectsCatalog.find((s) => s.id === id);
}
