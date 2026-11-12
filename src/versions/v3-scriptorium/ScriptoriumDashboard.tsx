import React from 'react';
import { Subject, UserSubjectState } from '../../types/subject';
import { calculateSubjectGrade, getAllItems } from '../../engine/calculator';
import { Terminal, ArrowRight } from 'lucide-react';

interface ScriptoriumDashboardProps {
  subjects: Subject[];
  states: Record<string, UserSubjectState>;
  onSelectSubject: (id: string) => void;
}

export const ScriptoriumDashboard: React.FC<ScriptoriumDashboardProps> = ({
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
    <div className="max-w-5xl mx-auto px-4 py-8 font-sans text-slate-100">
      {/* Telemetry Header */}
      <div className="bg-[#141c28] border border-[#243042] p-6 rounded-lg mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#243042] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-xs text-[#3b82f6] font-mono font-bold uppercase tracking-wider">
              <Terminal className="w-4 h-4" />
              <span>Scriptorium Nocturno // Estación de Calificaciones</span>
            </div>
            <h1 className="text-2xl font-bold font-newsreader text-white">
              Expediente y Simulación de Asignaturas
            </h1>
            <p className="text-xs text-[#94a3b8] mt-1">
              Terminal de cálculo académico y proyección matemática de exámenes pendientes.
            </p>
          </div>

          <div className="flex items-center gap-6 bg-[#0b0f17] border border-[#243042] px-5 py-3 rounded">
            <div>
              <span className="text-xs uppercase font-bold text-[#94a3b8] block">
                Media del Expediente
              </span>
              <div className="text-3xl font-bold font-mono text-white tabular-nums">
                {overallAverage !== null ? overallAverage : '--'}
                <span className="text-xs text-[#94a3b8] ml-1">/ 10</span>
              </div>
            </div>
            <div className="border-l border-[#243042] pl-5">
              <span className="text-xs uppercase font-bold text-[#94a3b8] block">
                Progreso
              </span>
              <div className="text-base font-bold font-mono text-emerald-400">
                {scoredSubjects.length} / {subjects.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects Cards */}
      <div className="space-y-4">
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
              className="bg-[#141c28] border border-[#243042] hover:border-slate-500 rounded-lg p-5 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-semibold text-[#3b82f6] bg-[#0b0f17] px-2 py-0.5 rounded border border-[#243042]">
                    {sub.id}
                  </span>
                  <span className="text-xs text-[#94a3b8]">
                    Plan {sub.academicYear} {sub.degree ? `• ${sub.degree}` : ''}
                  </span>
                </div>
                <h2 className="text-base font-bold font-newsreader text-white group-hover:text-[#3b82f6] transition-colors">
                  {sub.name}
                </h2>
                <div className="flex items-center gap-4 text-xs text-[#94a3b8] mt-2">
                  <span>Convocatorias: Ordinaria, Extraordinaria</span>
                  <span>•</span>
                  <span>{gradedCount} de {allItems.length} notas ({pct}%)</span>
                </div>
              </div>

              <div className="flex items-center gap-6 self-end sm:self-auto">
                <div className="text-right">
                  <span className="text-xs uppercase font-bold text-[#94a3b8] block">
                    Nota Calculada
                  </span>
                  <div className="text-2xl font-bold font-mono text-white tabular-nums">
                    {score !== null ? score.toFixed(2) : '--'}
                  </div>
                  <span
                    className={`text-xs uppercase font-bold tracking-wider ${
                      score === null
                        ? 'text-slate-500'
                        : calc.isPassed
                          ? 'text-emerald-400'
                          : calc.isCappedByPenalty
                            ? 'text-amber-400'
                            : 'text-rose-400'
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
                </div>

                <div className="w-8 h-8 rounded bg-[#0b0f17] border border-[#243042] group-hover:border-[#3b82f6] group-hover:bg-[#3b82f6] group-hover:text-white flex items-center justify-center text-[#94a3b8] transition-all">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
