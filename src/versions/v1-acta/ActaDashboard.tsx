import React from 'react';
import { Subject, UserSubjectState } from '../../types/subject';
import { calculateSubjectGrade } from '../../engine/calculator';
import { FileSpreadsheet, ArrowRight } from 'lucide-react';

interface ActaDashboardProps {
  subjects: Subject[];
  states: Record<string, UserSubjectState>;
  onSelectSubject: (id: string) => void;
}

export const ActaDashboard: React.FC<ActaDashboardProps> = ({
  subjects,
  states,
  onSelectSubject,
}) => {
  // Compute overall average
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
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans">
      {/* Dossier Header Summary */}
      <div className="border border-[#cbd5e1] bg-white p-6 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e2e8f0] pb-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-[#475569] block mb-1">
              Secretaría Académica // Expediente de Matrícula
            </span>
            <h1 className="text-2xl font-bold font-newsreader text-[#0f172a]">
              Acta de Calificaciones Universitarias
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-xs uppercase tracking-wider text-[#475569] block font-semibold">
                Media Global de Expediente
              </span>
              <div className="text-3xl font-bold font-newsreader text-[#0f172a] tabular-nums">
                {overallAverage !== null ? overallAverage : '--'}
                <span className="text-xs text-[#475569] font-sans font-normal ml-1">/ 10</span>
              </div>
            </div>
            <div className="border-l border-[#e2e8f0] pl-6 text-right">
              <span className="text-xs uppercase tracking-wider text-[#475569] block font-semibold">
                Asignaturas
              </span>
              <div className="text-lg font-bold font-newsreader text-[#0f172a] tabular-nums">
                {scoredSubjects.length} / {subjects.length}
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-[#334155] mt-3">
          Simulador oficial de actas y previsión de calificaciones conforme a los criterios de evaluación de cada guía docente.
        </p>
      </div>

      {/* Official Registry Ledger */}
      <div className="border border-[#cbd5e1] bg-white shadow-xs">
        <div className="bg-[#f8fafc] px-6 py-3 border-b border-[#cbd5e1] flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#1e3a8a]" />
            Relación de Asignaturas Matriculadas
          </h2>
          <span className="text-xs text-[#475569] font-mono">
            {subjects.length} asignaturas
          </span>
        </div>

        <div className="divide-y divide-[#e2e8f0]">
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

            return (
              <div
                key={sub.id}
                onClick={() => onSelectSubject(sub.id)}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#f8fafc] transition-colors cursor-pointer group"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold font-mono text-[#0f172a] bg-[#f1f5f9] px-2 py-0.5 border border-[#cbd5e1]">
                      {sub.id}
                    </span>
                    <span className="text-xs text-[#475569]">
                      Curso Académico {sub.academicYear} {sub.degree ? `• ${sub.degree}` : ''}
                    </span>
                  </div>
                  <h3 className="text-base font-bold font-newsreader text-[#0f172a] group-hover:text-[#1e3a8a] transition-colors">
                    {sub.name}
                  </h3>
                  <span className="text-xs text-[#475569] mt-0.5 block">
                    Convocatorias disponibles: Ordinaria, Extraordinaria
                  </span>
                </div>

                <div className="flex items-center gap-6 self-end sm:self-auto">
                  <div className="text-right">
                    <span className="text-xs uppercase tracking-wider text-[#475569] block">
                      Nota actual
                    </span>
                    <strong className="text-2xl font-bold font-newsreader tabular-nums text-[#0f172a]">
                      {score !== null ? score.toFixed(2) : '--'}
                    </strong>
                    <span
                      className={`block text-xs uppercase font-bold tracking-wider ${
                        score === null
                          ? 'text-slate-600'
                          : calc.isPassed
                            ? 'text-emerald-800'
                            : calc.isCappedByPenalty
                              ? 'text-amber-800'
                              : 'text-rose-800'
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

                  <div className="w-8 h-8 border border-[#cbd5e1] group-hover:border-[#1e3a8a] group-hover:bg-[#1e3a8a] group-hover:text-white flex items-center justify-center text-[#64748b] transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
