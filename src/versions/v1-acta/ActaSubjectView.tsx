import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  FileText,
  Lock,
  Unlock,
  AlertCircle,
  X,
  Target,
  Sparkles,
  Users
} from 'lucide-react';
import { Subject, UserSubjectState, ItemSimulationState } from '../../types/subject';
import {
  calculateSubjectGrade,
  solveInverseTarget,
  generateExplanationSteps,
  applyCarryOverFromOrdinaria,
  getAllItems,
} from '../../engine/calculator';

interface ActaSubjectViewProps {
  subject: Subject;
  state: UserSubjectState;
  onUpdateState: (newState: UserSubjectState) => void;
  onBackToDashboard: () => void;
}

export const ActaSubjectView: React.FC<ActaSubjectViewProps> = ({
  subject,
  state,
  onUpdateState,
  onBackToDashboard,
}) => {
  const activeConvKey = state.activeConvocatoria || 'ordinaria';
  const activeConvocatoria = subject.convocatorias[activeConvKey];
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [showUndoToast, setShowUndoToast] = useState<boolean>(false);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastClearedStateRef = useRef<Record<string, ItemSimulationState> | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  const allItems = useMemo(() => getAllItems(activeConvocatoria), [activeConvocatoria]);

  const calcResult = useMemo(() => {
    return calculateSubjectGrade(subject, state, activeConvKey);
  }, [subject, state, activeConvKey]);

  const inverseResult = useMemo(() => {
    const target = state.targetScore || 5.0;
    return solveInverseTarget(subject, state, target);
  }, [subject, state]);

  const explanationSteps = useMemo(() => {
    return generateExplanationSteps(subject, state, calcResult);
  }, [subject, state, calcResult]);

  const handleScoreChange = (itemId: string, newScore: number | null) => {
    const nextScores = { ...state.scores };
    nextScores[itemId] = {
      ...(nextScores[itemId] || {}),
      score: newScore,
    };
    onUpdateState({ ...state, scores: nextScores });
  };

  const handleToggleLock = (itemId: string) => {
    const nextScores = { ...state.scores };
    const current = nextScores[itemId];
    nextScores[itemId] = {
      ...(current || { score: null }),
      isLocked: !current?.isLocked,
    };
    onUpdateState({ ...state, scores: nextScores });
  };

  const handlePrereqChange = (prereqId: string, value: number | boolean) => {
    onUpdateState({
      ...state,
      prerequisitesState: {
        ...state.prerequisitesState,
        [prereqId]: value,
      },
    });
  };

  const handleSwitchConvocatoria = (conv: 'ordinaria' | 'extraordinaria') => {
    let nextScores = { ...state.scores };
    if (conv === 'extraordinaria') {
      const carried = applyCarryOverFromOrdinaria(subject, state);
      for (const [itemId, info] of Object.entries(carried)) {
        nextScores[itemId] = {
          score: info.score,
          isLocked: true,
          isCarriedOver: true,
        };
      }
    }
    onUpdateState({
      ...state,
      activeConvocatoria: conv,
      scores: nextScores,
    });
  };

  const handleResetScores = () => {
    lastClearedStateRef.current = { ...state.scores };

    const newScores: Record<string, ItemSimulationState> = {};
    for (const item of allItems) {
      newScores[item.id] = { score: null, isLocked: false };
    }

    onUpdateState({ ...state, scores: newScores });
    setShowUndoToast(true);

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
      setShowUndoToast(false);
      lastClearedStateRef.current = null;
    }, 6000);
  };

  const handleUndoReset = () => {
    if (!lastClearedStateRef.current) return;
    onUpdateState({
      ...state,
      scores: lastClearedStateRef.current,
    });
    setShowUndoToast(false);
    lastClearedStateRef.current = null;
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
  };

  const handleApplySuggested = (suggested: Record<string, number>) => {
    const nextScores = { ...state.scores };
    for (const [id, val] of Object.entries(suggested)) {
      nextScores[id] = {
        ...(nextScores[id] || {}),
        score: val,
      };
    }
    onUpdateState({ ...state, scores: nextScores });
  };

  const finalScore = calcResult.finalScore;
  const isCapped = calcResult.isCappedByPenalty;
  const isPassed = calcResult.isPassed;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans">
      {/* Top Ledger Navigation */}
      <div className="flex items-center justify-between border-b border-[#cbd5e1] pb-3 mb-6">
        <button
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#1e3a8a] hover:text-[#0f172a] uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Índice de Asignaturas
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#64748b]">Convocatoria:</span>
          <div className="inline-flex border border-[#cbd5e1] p-0.5 bg-[#f8fafc]">
            {(['ordinaria', 'extraordinaria'] as const).map((key) => {
              const conv = subject.convocatorias[key];
              return (
                <button
                  key={key}
                  onClick={() => handleSwitchConvocatoria(key)}
                  className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-colors ${
                    activeConvKey === key
                      ? 'bg-[#0f172a] text-white'
                      : 'text-[#475569] hover:text-[#0f172a]'
                  }`}
                >
                  {conv.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Two-Column Docket Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 Cols): Official Certification Docket */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
          {/* Certificate Card */}
          <div className="border border-[#cbd5e1] bg-white p-6 shadow-xs">
            <div className="border-b border-[#e2e8f0] pb-4 mb-5">
              <span className="text-xs uppercase font-bold tracking-widest text-[#475569] block mb-1">
                Expediente Docente // {subject.academicYear}
              </span>
              <h1 className="text-xl font-bold font-newsreader text-[#0f172a] leading-snug">
                {subject.name}
              </h1>
              <span className="text-xs text-[#64748b] font-mono mt-1 block">
                Código: {subject.id} {subject.degree ? `• ${subject.degree}` : ''}
              </span>
            </div>

            {/* Seal / Big Grade Display */}
            <div className="bg-[#f8fafc] border border-[#e2e8f0] p-5 text-center my-4 relative">
              <span className="text-xs uppercase tracking-widest text-[#475569] block font-semibold">
                Calificación Global Estimada
              </span>
              <div className="text-5xl font-bold font-newsreader text-[#0f172a] tabular-nums my-1">
                {finalScore !== null ? finalScore.toFixed(2) : '--'}
                <span className="text-xs text-[#64748b] font-sans font-normal ml-1">/ 10</span>
              </div>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span
                  className={`inline-block px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider border ${
                    finalScore === null
                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                      : isPassed
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : isCapped
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-rose-50 text-rose-900 border-rose-300'
                  }`}
                >
                  {finalScore === null
                    ? 'Sin Calificar'
                    : isPassed
                      ? 'Aprobado'
                      : isCapped
                        ? 'Tope Reglamentario 4.0'
                        : 'Suspenso'}
                </span>
              </div>
            </div>

            {/* Immediate Penalty Diagnosis Notice */}
            {isCapped && calcResult.penaltyDiagnostics && calcResult.penaltyDiagnostics.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-950 p-3.5 text-xs mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold mb-0.5">Tope Reglamentario a 4,00:</strong>
                    <p className="leading-relaxed">
                      {calcResult.penaltyDiagnostics[0].formattedMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Prerequisites Section (e.g. Asistencia Obligatoria a Laboratorios) */}
            {activeConvocatoria.prerequisites && activeConvocatoria.prerequisites.length > 0 && (
              <div className="border-t border-[#e2e8f0] pt-4 mt-4 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0f172a] block">
                  Requisitos Previos de Convocatoria
                </span>
                {activeConvocatoria.prerequisites.map((prereq) => {
                  const currentVal = state.prerequisitesState[prereq.id];
                  const numVal = typeof currentVal === 'number' ? currentVal : 100;
                  const isMet = numVal >= (prereq.requiredPercentage ?? 80);

                  return (
                    <div key={prereq.id} className="p-2.5 bg-[#f8fafc] border border-[#e2e8f0] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#0f172a]">{prereq.name}</span>
                        <span
                          className={`text-xs font-bold px-1.5 py-0.5 border ${
                            isMet
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          {numVal}% {isMet ? 'Cumplido' : `Incumplido (< ${prereq.requiredPercentage ?? 80}%)`}
                        </span>
                      </div>
                      <p className="text-xs text-[#475569]">{prereq.description}</p>
                      {prereq.type === 'percentage' && (
                        <div className="flex items-center gap-2 pt-0.5">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={numVal}
                            onChange={(e) =>
                              handlePrereqChange(prereq.id, parseInt(e.target.value, 10))
                            }
                            aria-label={`Porcentaje para ${prereq.name}`}
                            className="flex-1 h-1.5 bg-[#cbd5e1] appearance-none cursor-pointer"
                          />
                          <span className="text-xs font-mono font-bold text-[#0f172a] w-10 text-right">
                            {numVal}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Target Simulator (Acta Style) */}
            <div className="border-t border-[#e2e8f0] pt-4 mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0f172a] flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[#1e3a8a]" />
                  Simulación de Nota Objetivo
                </span>
                <span className="text-xs font-semibold text-[#1e3a8a] tabular-nums">
                  Objetivo: {(state.targetScore || 5.0).toFixed(1)}
                </span>
              </div>

              {/* Target Pills */}
              <div className="flex items-center gap-1.5 mb-3">
                {[5.0, 6.0, 7.0, 8.0, 9.0].map((t) => (
                  <button
                    key={t}
                    onClick={() => onUpdateState({ ...state, targetScore: t })}
                    className={`flex-1 py-1 text-xs font-semibold tabular-nums border transition-colors ${
                      (state.targetScore || 5.0) === t
                        ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                        : 'bg-white text-[#475569] border-[#cbd5e1] hover:border-[#0f172a]'
                    }`}
                  >
                    {t.toFixed(0)}
                  </button>
                ))}
              </div>

              {/* Simulator Verdict */}
              {inverseResult.isAchievable ? (
                <div className="bg-[#f8fafc] border border-[#e2e8f0] p-3 text-xs">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-[#64748b]">Media en lo pendiente:</span>
                    <strong className="text-sm font-bold text-[#0f172a] tabular-nums">
                      {inverseResult.requiredAverageOnPending.toFixed(2)}
                    </strong>
                  </div>
                  {inverseResult.pendingItemCount > 0 && (
                    <button
                      onClick={() => handleApplySuggested(inverseResult.suggestedScores)}
                      className="w-full mt-2 py-1.5 bg-[#0f172a] text-white text-xs font-medium uppercase tracking-wider hover:bg-[#1e293b] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      Rellenar notas sugeridas
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-200 text-rose-900 p-2.5 text-xs">
                  Meta inalcanzable. Nota máxima posible:{' '}
                  <strong className="font-bold tabular-nums">
                    {inverseResult.maxAchievableScore.toFixed(2)}
                  </strong>
                </div>
              )}
            </div>

            {/* Clear and Actions Footer */}
            <div className="border-t border-[#e2e8f0] pt-4 mt-5 flex items-center justify-between text-xs">
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-[#1e3a8a] hover:underline font-medium inline-flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                {showExplanation ? 'Ocultar auditoría legal' : 'Auditoría matemática paso a paso'}
              </button>
              <button
                onClick={handleResetScores}
                className="text-[#64748b] hover:text-rose-700 font-medium inline-flex items-center gap-1"
                title="Limpiar calificaciones registradas"
              >
                <RotateCcw className="w-3 h-3" />
                Limpiar notas
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Official Evaluation Ledger */}
        <div className="lg:col-span-7 space-y-6">
          <div className="border border-[#cbd5e1] bg-white divide-y divide-[#cbd5e1] shadow-xs">
            <div className="bg-[#f8fafc] px-5 py-3 border-b border-[#cbd5e1] flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0f172a]">
                Criterios de Evaluación y Calificaciones
              </span>
              <span className="text-xs text-[#64748b] font-mono">
                {allItems.length} partes evaluables
              </span>
            </div>

            {/* Blocks and Items */}
            {activeConvocatoria.blocks.map((block) => {
              const bRes = calcResult.blocks[block.id];
              return (
                <div key={block.id} className="p-5 space-y-4">
                  {/* Block Header */}
                  <div className="flex items-baseline justify-between border-b border-[#e2e8f0] pb-2">
                    <div>
                      <h3 className="text-sm font-bold font-newsreader text-[#0f172a]">
                        {block.name}
                      </h3>
                      <span className="text-xs text-[#475569]">
                        Ponderación global: {(block.weight * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#475569] block uppercase">
                        Subtotal bloque
                      </span>
                      <strong className="text-base font-bold font-newsreader tabular-nums text-[#0f172a]">
                        {bRes?.score !== null ? bRes.score.toFixed(2) : '--'}
                      </strong>
                    </div>
                  </div>

                  {/* Direct Items */}
                  {block.items.length > 0 && (
                    <div className="space-y-3 pt-1">
                      {block.items.map((item) => {
                        const itemState = state.scores[item.id];
                        const score = itemState?.score ?? null;
                        const isLocked = itemState?.isLocked ?? false;
                        const isCarriedOver = itemState?.isCarriedOver ?? false;
                        const suggested = inverseResult.suggestedScores[item.id];
                        const hasFailedMin =
                          score !== null && item.minScore !== undefined && score < item.minScore;

                        return (
                          <div
                            key={item.id}
                            className={`p-3 border transition-colors ${
                              hasFailedMin
                                ? 'bg-rose-50/50 border-rose-300'
                                : isLocked
                                  ? 'bg-amber-50/40 border-amber-300'
                                  : 'bg-white border-[#e2e8f0] hover:border-[#cbd5e1]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-[#0f172a]">
                                    {item.name}
                                  </span>
                                  {item.isGroup && (
                                    <span className="text-xs font-medium text-[#334155] bg-[#f1f5f9] px-1.5 py-0.5 border border-[#cbd5e1] inline-flex items-center gap-0.5">
                                      <Users className="w-3 h-3" /> Grupal
                                    </span>
                                  )}
                                  {isCarriedOver && (
                                    <span className="text-xs font-medium text-[#1e3a8a] bg-[#eff6ff] px-1.5 py-0.5 border border-[#bfdbfe]">
                                      Conservada
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-[#475569] mt-0.5">
                                  <span>Peso: {(item.weight * 100).toFixed(0)}%</span>
                                  {item.minScore !== undefined && (
                                    <span className={hasFailedMin ? 'text-rose-700 font-bold' : ''}>
                                      • Mínimo exigido: {item.minScore.toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Actions: Lock and Reset */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleLock(item.id)}
                                  className={`p-1.5 border text-xs transition-colors ${
                                    isLocked
                                      ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                                      : 'bg-white text-[#475569] border-[#cbd5e1] hover:text-[#0f172a]'
                                  }`}
                                  title={isLocked ? 'Desbloquear nota' : 'Fijar nota en simulación'}
                                  aria-label={isLocked ? `Desbloquear ${item.name}` : `Fijar nota de ${item.name}`}
                                >
                                  {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                </button>
                                {score !== null && (
                                  <button
                                    type="button"
                                    onClick={() => handleScoreChange(item.id, null)}
                                    className="p-1.5 border border-[#cbd5e1] bg-white text-[#475569] hover:text-rose-700 text-xs"
                                    title="Borrar calificación"
                                    aria-label={`Borrar calificación de ${item.name}`}
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Controls: Slider + Number Input */}
                            <div className="flex items-center gap-3">
                              <input
                                type="range"
                                min="0"
                                max={item.maxScore ?? 10}
                                step="0.1"
                                value={score ?? 0}
                                onChange={(e) => handleScoreChange(item.id, parseFloat(e.target.value))}
                                aria-label={`Calificación para ${item.name}`}
                                className="flex-1 h-1.5 bg-[#e2e8f0] appearance-none cursor-pointer"
                              />
                              <div className="w-16">
                                <input
                                  type="number"
                                  min="0"
                                  max={item.maxScore ?? 10}
                                  step="0.1"
                                  placeholder={suggested !== undefined ? `~${suggested.toFixed(1)}` : '—'}
                                  value={score !== null ? score : ''}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                    handleScoreChange(item.id, isNaN(val as number) ? null : val);
                                  }}
                                  aria-label={`Puntuación numérica para ${item.name}`}
                                  className={`w-full py-1 text-center text-xs font-bold tabular-nums border ${
                                    score === null
                                      ? 'bg-[#f8fafc] border-[#cbd5e1] text-[#94a3b8]'
                                      : hasFailedMin
                                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                                        : 'bg-white border-[#0f172a] text-[#0f172a]'
                                  }`}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* SubBlocks (e.g. Evaluación Individual de Prácticas) */}
                  {block.subBlocks && block.subBlocks.length > 0 && (
                    <div className="space-y-4 pt-2">
                      {block.subBlocks.map((sub) => {
                        const subRes = bRes?.subBlocks?.[sub.id];
                        return (
                          <div key={sub.id} className="border-l-2 border-[#cbd5e1] pl-3.5 space-y-3">
                            <div className="flex items-baseline justify-between border-b border-[#e2e8f0] pb-1.5">
                              <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0f172a]">
                                  {sub.name}
                                </h4>
                                <span className="text-xs text-[#475569]">
                                  Ponderación en bloque: {(sub.weight * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs text-[#475569] block uppercase">
                                  Subtotal parte
                                </span>
                                <strong className="text-sm font-bold font-newsreader tabular-nums text-[#0f172a]">
                                  {subRes?.score !== null && subRes?.score !== undefined
                                    ? subRes.score.toFixed(2)
                                    : '--'}
                                </strong>
                              </div>
                            </div>

                            <div className="space-y-3 pt-1">
                              {sub.items.map((item) => {
                                const itemState = state.scores[item.id];
                                const score = itemState?.score ?? null;
                                const isLocked = itemState?.isLocked ?? false;
                                const isCarriedOver = itemState?.isCarriedOver ?? false;
                                const suggested = inverseResult.suggestedScores[item.id];
                                const hasFailedMin =
                                  score !== null && item.minScore !== undefined && score < item.minScore;

                                return (
                                  <div
                                    key={item.id}
                                    className={`p-3 border transition-colors ${
                                      hasFailedMin
                                        ? 'bg-rose-50/50 border-rose-300'
                                        : isLocked
                                          ? 'bg-amber-50/40 border-amber-300'
                                          : 'bg-white border-[#e2e8f0] hover:border-[#cbd5e1]'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-semibold text-[#0f172a]">
                                            {item.name}
                                          </span>
                                          {item.isGroup && (
                                            <span className="text-xs font-medium text-[#334155] bg-[#f1f5f9] px-1.5 py-0.5 border border-[#cbd5e1] inline-flex items-center gap-0.5">
                                              <Users className="w-3 h-3" /> Grupal
                                            </span>
                                          )}
                                          {isCarriedOver && (
                                            <span className="text-xs font-medium text-[#1e3a8a] bg-[#eff6ff] px-1.5 py-0.5 border border-[#bfdbfe]">
                                              Conservada
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-[#475569] mt-0.5">
                                          <span>Peso: {(item.weight * 100).toFixed(0)}%</span>
                                          {item.minScore !== undefined && (
                                            <span className={hasFailedMin ? 'text-rose-700 font-bold' : ''}>
                                              • Mínimo exigido: {item.minScore.toFixed(1)}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Actions: Lock and Reset */}
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => handleToggleLock(item.id)}
                                          className={`p-1.5 border text-xs transition-colors ${
                                            isLocked
                                              ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                                              : 'bg-white text-[#475569] border-[#cbd5e1] hover:text-[#0f172a]'
                                          }`}
                                          title={isLocked ? 'Desbloquear nota' : 'Fijar nota en simulación'}
                                          aria-label={isLocked ? `Desbloquear ${item.name}` : `Fijar nota de ${item.name}`}
                                        >
                                          {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                        </button>
                                        {score !== null && (
                                          <button
                                            type="button"
                                            onClick={() => handleScoreChange(item.id, null)}
                                            className="p-1.5 border border-[#cbd5e1] bg-white text-[#475569] hover:text-rose-700 text-xs"
                                            title="Borrar calificación"
                                            aria-label={`Borrar calificación de ${item.name}`}
                                          >
                                            <RotateCcw className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Controls: Slider + Number Input */}
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="range"
                                        min="0"
                                        max={item.maxScore ?? 10}
                                        step="0.1"
                                        value={score ?? 0}
                                        onChange={(e) => handleScoreChange(item.id, parseFloat(e.target.value))}
                                        aria-label={`Calificación para ${item.name}`}
                                        className="flex-1 h-1.5 bg-[#e2e8f0] appearance-none cursor-pointer"
                                      />
                                      <div className="w-16">
                                        <input
                                          type="number"
                                          min="0"
                                          max={item.maxScore ?? 10}
                                          step="0.1"
                                          placeholder={suggested !== undefined ? `~${suggested.toFixed(1)}` : '—'}
                                          value={score !== null ? score : ''}
                                          onChange={(e) => {
                                            const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                            handleScoreChange(item.id, isNaN(val as number) ? null : val);
                                          }}
                                          aria-label={`Puntuación numérica para ${item.name}`}
                                          className={`w-full py-1 text-center text-xs font-bold tabular-nums border ${
                                            score === null
                                              ? 'bg-[#f8fafc] border-[#cbd5e1] text-[#94a3b8]'
                                              : hasFailedMin
                                                ? 'bg-rose-50 border-rose-300 text-rose-800'
                                                : 'bg-white border-[#0f172a] text-[#0f172a]'
                                          }`}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mathematical Explanation Accordion */}
          {showExplanation && (
            <div className="border border-[#cbd5e1] bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0f172a] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1e3a8a]" />
                  Desglose Legal y Auditoría de Fórmulas
                </span>
                <button
                  onClick={() => setShowExplanation(false)}
                  className="text-xs text-[#64748b] hover:text-[#0f172a]"
                >
                  Cerrar
                </button>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {explanationSteps.map((step, idx) => (
                  <div key={idx} className="p-2.5 bg-[#f8fafc] border border-[#e2e8f0]">
                    <div className="font-sans font-bold text-[#0f172a] text-xs mb-1">
                      {step.title}
                    </div>
                    {step.note && <div className="text-[#475569] text-xs mb-1">{step.note}</div>}
                    <div className="text-[#1e3a8a] bg-white p-1.5 border border-[#e2e8f0] text-xs font-bold">
                      {step.substituted} = {step.resultText}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Reversible Undo Toast */}
      {showUndoToast && (
        <div className="fixed bottom-6 right-6 bg-[#0f172a] text-white px-4 py-3 shadow-lg flex items-center gap-3 text-xs z-50 border border-slate-700">
          <span>Se han restablecido las notas de esta asignatura.</span>
          <button
            onClick={handleUndoReset}
            className="text-amber-300 font-bold hover:underline uppercase tracking-wider text-xs ml-1"
          >
            Deshacer
          </button>
          <button
            onClick={() => setShowUndoToast(false)}
            className="text-slate-400 hover:text-white p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
