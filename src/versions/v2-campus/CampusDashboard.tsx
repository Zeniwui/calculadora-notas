import React from 'react';
import { Subject, UserSubjectState } from '../../types/subject';
import { calculateSubjectGrade, getAllItems } from '../../engine/calculator';
import { ArrowRight, Library } from 'lucide-react';

interface CampusDashboardProps {
  subjects: Subject[];
  states: Record<string, UserSubjectState>;
  onSelectSubject: (id: string) => void;
}

export const CampusDashboard: React.FC<CampusDashboardProps> = ({
  subjects,
  states,
  onSelectSubject,
}) => {
  const scoredSubjects = subjects
    .map((s) => {
      const state = states[s.id] || {
        subjectId: s.id,
        activeConvocatoria: 'ordinaria',
        prerequisitesState: {},
        scores: {},
        targetScore: 5.0,
      };
      const res = calculateSubjectGrade(s, state);
      return res.finalScore;
    })
    .filter((score): score is number => score !== null);

  const overallAverage =
    scoredSubjects.length > 0
      ? (scoredSubjects.reduce((a, b) => a + b, 0) / scoredSubjects.length).toFixed(2)
      : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans text-[#121316]">
      {/* Architectural Banner */}
      <div className="bg-white border border-[#d9d7ce] p-6 sm:p-8 rounded-sm shadow-xs mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#ebe9e1] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-[#92400e] text-xs font-bold uppercase tracking-wider">
              <Library className="w-4 h-4" />
              <span>Campus Modernista // Archivo Docente</span>
            </div>
            <h1 className="text-3xl font-bold font-garamond text-[#121316]">
              Planificación y Simulación de Calificaciones
            </h1>
            <p className="text-xs text-[#5f6368] mt-1 max-w-xl">
              Cálculo de calificaciones finales y estimación inversa de exámenes pendientes conforme a las directrices de cada guía docente.
            </p>
          </div>

          <div className="bg-[#faf9f5] border border-[#d9d7ce] p-5 rounded-xs flex items-center gap-6 self-start md:self-auto">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-[#5f6368] block">
                Media del Semestre
              </span>
              <div className="text-3xl font-bold font-garamond text-[#121316] tabular-nums">
                {overallAverage !== null ? overallAverage : '--'}
                <span className="text-xs text-[#5f6368] font-sans font-normal ml-1">/ 10</span>
              </div>
            </div>
            <div className="border-l border-[#d9d7ce] pl-5">
              <span className="text-xs uppercase font-bold tracking-wider text-[#5f6368] block">
                Asignaturas
              </span>
              <div className="text-base font-bold font-garamond text-[#121316] tabular-nums">
                {scoredSubjects.length} evaluadas de {subjects.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Subject Dossiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subjects.map((sub) => {
          const state = states[sub.id] || {
            subjectId: sub.id,
            activeConvocatoria: 'ordinaria',
            prerequisitesState: {},
            scores: {},
            targetScore: 5.0,
          };
          const calc = calculateSubjectGrade(sub, state);
          const score = calc.finalScore;
          const allItems = getAllItems(sub.convocatorias[state.activeConvocatoria || 'ordinaria']);

          const gradedCount = allItems.filter((i) => {
            const s = state.scores[i.id];
            return s && s.score !== undefined && s.score !== null;
          }).length;

          const pct = Math.round((gradedCount / Math.max(1, allItems.length)) * 100);

          return (
            <div
              key={sub.id}
              onClick={() => onSelectSubject(sub.id)}
              className="bg-white border border-[#d9d7ce] rounded-sm p-6 shadow-xs hover:border-[#121316] transition-all cursor-pointer group flex flex-col justify-between space-y-5"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-mono text-[#92400e] bg-[#fdf6f0] px-2 py-0.5 border border-[#f5d0be] rounded-xs font-semibold">
                    {sub.id}
                  </span>
                  <span className="text-[#5f6368] text-xs">
                    Plan {sub.academicYear} {sub.degree ? `• ${sub.degree}` : ''}
                  </span>
                </div>

                <h2 className="text-lg font-bold font-garamond text-[#121316] group-hover:text-[#92400e] transition-colors leading-snug">
                  {sub.name}
                </h2>

                {/* Progress bar */}
                <div className="mt-4 pt-3 border-t border-[#f4f3ef]">
                  <div className="flex items-center justify-between text-xs text-[#5f6368] mb-1">
                    <span>Avance de evaluación</span>
                    <span className="font-semibold tabular-nums">{pct}% ({gradedCount}/{allItems.length} notas)</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#ebe9e1] rounded-full overflow-hidden">
                    <div className="h-full bg-[#121316]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#ebe9e1]">
                <div>
                  <span className="text-xs uppercase font-bold text-[#5f6368] block">
                    Nota estimada
                  </span>
                  <div className="text-2xl font-bold font-garamond text-[#121316] tabular-nums">
                    {score !== null ? score.toFixed(2) : '--'}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs border ${
                      score === null
                        ? 'bg-slate-50 text-slate-700 border-slate-200'
                        : calc.isPassed
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          : calc.isCappedByPenalty
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-rose-50 text-rose-900 border-rose-300'
                    }`}
                  >
                    {score === null
                      ? 'Pendiente'
                      : calc.isPassed
                        ? 'Aprobado'
                        : calc.isCappedByPenalty
                          ? 'Tope 4.0'
                          : 'Suspenso'}
                  </span>

                  <div className="w-7 h-7 bg-[#f4f3ef] group-hover:bg-[#121316] group-hover:text-white rounded-xs flex items-center justify-center text-[#44474f] transition-all">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
