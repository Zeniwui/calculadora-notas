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

interface ScriptoriumSubjectViewProps {
  subject: Subject;
  state: UserSubjectState;
  onUpdateState: (newState: UserSubjectState) => void;
  onBackToDashboard: () => void;
}

export const ScriptoriumSubjectView: React.FC<ScriptoriumSubjectViewProps> = ({
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
    <div className="max-w-5xl mx-auto px-4 py-8 font-sans text-slate-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#243042] pb-4 mb-6">
        <div>
          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-white mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Terminal de Asignaturas
          </button>
          <h1 className="text-2xl font-bold font-newsreader text-white">
            {subject.name}
          </h1>
          <span className="text-xs text-[#94a3b8] font-mono">
            {subject.id} • {subject.academicYear} {subject.degree ? `• ${subject.degree}` : ''}
          </span>
        </div>

        {/* Convocatoria Switcher */}
        <div className="inline-flex p-1 bg-[#141c28] border border-[#243042] rounded self-start sm:self-auto">
          {(['ordinaria', 'extraordinaria'] as const).map((key) => {
            const conv = subject.convocatorias[key];
            return (
              <button
                key={key}
                onClick={() => handleSwitchConvocatoria(key)}
                className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                  activeConvKey === key
                    ? 'bg-[#3b82f6] text-white'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                {conv.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Terminal Dossier */}
      <div className="space-y-6">
        {/* Telemetry Hero Card */}
        <div className="bg-[#141c28] border border-[#243042] p-6 rounded-lg space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Grade Display */}
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-[#94a3b8] block">
                Calificación Actual
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-5xl font-bold font-newsreader text-white tabular-nums">
                  {finalScore !== null ? finalScore.toFixed(2) : '--'}
                </span>
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    finalScore === null
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : isPassed
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                        : isCapped
                          ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                          : 'bg-rose-950/80 text-rose-300 border-rose-700'
                  }`}
                >
                  {finalScore === null
                    ? 'Pendiente'
                    : isPassed
                      ? 'Aprobado'
                      : isCapped
                        ? 'Tope 4.0'
                        : 'Suspenso'}
                </span>
              </div>
            </div>

            {/* Target Simulator Section */}
            <div className="md:col-span-2 border-t md:border-t-0 md:border-l border-[#243042] pt-4 md:pt-0 md:pl-6 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#94a3b8] flex items-center gap-1.5 font-semibold">
                  <Target className="w-3.5 h-3.5 text-[#3b82f6]" />
                  Simulación de Nota Objetivo
                </span>
                <span className="font-bold font-mono text-white">
                  Objetivo: {(state.targetScore || 5.0).toFixed(1)}
                </span>
              </div>

              {/* Target Pills */}
              <div className="flex items-center gap-1.5">
                {[5.0, 6.0, 7.0, 8.0, 9.0].map((t) => (
                  <button
                    key={t}
                    onClick={() => onUpdateState({ ...state, targetScore: t })}
                    className={`flex-1 py-1 text-xs font-mono font-semibold rounded border transition-colors ${
                      (state.targetScore || 5.0) === t
                        ? 'bg-[#3b82f6] text-white border-[#3b82f6]'
                        : 'bg-[#0b0f17] text-[#94a3b8] border-[#243042] hover:border-slate-500'
                    }`}
                  >
                    {t.toFixed(0)}
                  </button>
                ))}
              </div>

              {/* Inverse Result Banner */}
              {inverseResult.isAchievable ? (
                <div className="bg-[#0b0f17] border border-[#243042] p-3 rounded flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#94a3b8] block text-xs">Media necesaria en pendientes:</span>
                    <strong className="text-sm font-mono font-bold text-white tabular-nums">
                      {inverseResult.requiredAverageOnPending.toFixed(2)}
                    </strong>
                  </div>
                  {inverseResult.pendingItemCount > 0 && (
                    <button
                      onClick={() => handleApplySuggested(inverseResult.suggestedScores)}
                      className="px-3 py-1.5 bg-[#3b82f6] text-white text-xs font-semibold rounded hover:bg-[#2563eb] flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      Rellenar sugeridas
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-2.5 rounded text-xs">
                  Objetivo inalcanzable. Nota máxima posible:{' '}
                  <strong className="font-bold font-mono">
                    {inverseResult.maxAchievableScore.toFixed(2)}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* Penalty Diagnostic Banner */}
          {isCapped && calcResult.penaltyDiagnostics && calcResult.penaltyDiagnostics.length > 0 && (
            <div className="bg-amber-950/40 border border-amber-800 text-amber-200 p-3.5 rounded text-xs">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold mb-0.5">Tope Reglamentario Aplicado (4.0):</strong>
                  <p className="leading-relaxed text-amber-100">
                    {calcResult.penaltyDiagnostics[0].formattedMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Prerequisites */}
          {activeConvocatoria.prerequisites && activeConvocatoria.prerequisites.length > 0 && (
            <div className="border-t border-[#243042] pt-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                Requisitos Previos de Convocatoria
              </span>
              {activeConvocatoria.prerequisites.map((prereq) => {
                const currentVal = state.prerequisitesState[prereq.id];
                const numVal = typeof currentVal === 'number' ? currentVal : 100;
                const isMet = numVal >= (prereq.requiredPercentage ?? 80);

                return (
                  <div key={prereq.id} className="p-3 bg-[#0b0f17] border border-[#243042] rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{prereq.name}</span>
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded border ${
                          isMet
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                            : 'bg-rose-950/80 text-rose-300 border-rose-700'
                        }`}
                      >
                        {numVal}% {isMet ? 'Cumplido' : `Incumplido (< ${prereq.requiredPercentage ?? 80}%)`}
                      </span>
                    </div>
                    <p className="text-xs text-[#94a3b8]">{prereq.description}</p>
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
                          className="flex-1 h-1.5 bg-[#243042] rounded-full appearance-none cursor-pointer accent-blue-500"
                        />
                        <span className="text-xs font-mono font-bold text-white w-10 text-right">
                          {numVal}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Evaluation Modules Ledger */}
        <div className="space-y-4">
          {activeConvocatoria.blocks.map((block) => {
            const bRes = calcResult.blocks[block.id];
            return (
              <div
                key={block.id}
                className="bg-[#141c28] border border-[#243042] rounded-lg p-5 space-y-4"
              >
                <div className="flex items-baseline justify-between border-b border-[#243042] pb-2">
                  <div>
                    <h3 className="text-sm font-bold font-newsreader text-white">
                      {block.name}
                    </h3>
                    <span className="text-xs text-[#94a3b8]">
                      Ponderación: {(block.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs uppercase text-[#94a3b8] block">Subtotal</span>
                    <strong className="text-sm font-mono font-bold text-white tabular-nums">
                      {bRes?.score !== null && bRes?.score !== undefined
                        ? bRes.score.toFixed(2)
                        : '--'}
                    </strong>
                  </div>
                </div>

                {/* Direct Items */}
                {block.items.length > 0 && (
                  <div className="space-y-2.5">
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
                          className={`p-3 rounded border transition-colors ${
                            hasFailedMin
                              ? 'bg-rose-950/30 border-rose-800'
                              : isLocked
                                ? 'bg-[#1e293b]/50 border-amber-600/50'
                                : 'bg-[#0b0f17] border-[#243042] hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-white">
                                  {item.name}
                                </span>
                                {item.isGroup && (
                                  <span className="text-xs font-medium text-slate-300 bg-slate-800 px-1.5 py-0.2 rounded inline-flex items-center gap-0.5">
                                    <Users className="w-2.5 h-2.5" /> Grupal
                                  </span>
                                )}
                                {isCarriedOver && (
                                  <span className="text-xs font-medium text-blue-300 bg-blue-950/80 px-1.5 py-0.2 rounded border border-blue-800">
                                    Conservada
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-[#94a3b8] mt-0.5 font-mono">
                                <span>{(item.weight * 100).toFixed(0)}%</span>
                                {item.minScore !== undefined && (
                                  <span className={hasFailedMin ? 'text-rose-400 font-bold' : ''}>
                                    • mín {item.minScore.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Lock / Reset */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleLock(item.id)}
                                className={`p-1.5 rounded text-xs transition-colors ${
                                  isLocked
                                    ? 'bg-amber-600 text-white'
                                    : 'text-[#94a3b8] hover:text-white bg-[#141c28]'
                                }`}
                                title={isLocked ? 'Desbloquear nota' : 'Fijar nota en simulación'}
                              >
                                {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                              </button>
                              {score !== null && (
                                <button
                                  type="button"
                                  onClick={() => handleScoreChange(item.id, null)}
                                  className="p-1.5 rounded text-[#94a3b8] hover:text-rose-400 bg-[#141c28] text-xs"
                                  title="Borrar nota"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Slider and Box */}
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="0"
                              max={item.maxScore ?? 10}
                              step="0.1"
                              value={score ?? 0}
                              onChange={(e) => handleScoreChange(item.id, parseFloat(e.target.value))}
                              className="flex-1 h-1.5 bg-[#243042] rounded-full appearance-none cursor-pointer accent-blue-500"
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
                                className={`w-full py-1 text-center text-xs font-mono font-bold rounded border ${
                                  score === null
                                    ? 'bg-[#141c28] border-[#243042] text-slate-500'
                                    : hasFailedMin
                                      ? 'bg-rose-950/60 border-rose-700 text-rose-300'
                                      : 'bg-[#141c28] border-slate-500 text-white'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* SubBlocks */}
                {block.subBlocks && block.subBlocks.length > 0 && (
                  <div className="space-y-3 pt-2">
                    {block.subBlocks.map((sub) => {
                      const subRes = bRes?.subBlocks?.[sub.id];
                      return (
                        <div key={sub.id} className="border-l-2 border-[#243042] pl-3.5 space-y-2.5">
                          <div className="flex items-baseline justify-between border-b border-[#243042] pb-1.5">
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                                {sub.name}
                              </h4>
                              <span className="text-xs text-[#94a3b8]">
                                Ponderación: {(sub.weight * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-[#94a3b8] block uppercase">
                                Subtotal
                              </span>
                              <strong className="text-xs font-mono font-bold text-white tabular-nums">
                                {subRes?.score !== null && subRes?.score !== undefined
                                  ? subRes.score.toFixed(2)
                                  : '--'}
                              </strong>
                            </div>
                          </div>

                          <div className="space-y-2">
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
                                  className={`p-3 rounded border transition-colors ${
                                    hasFailedMin
                                      ? 'bg-rose-950/30 border-rose-800'
                                      : isLocked
                                        ? 'bg-[#1e293b]/50 border-amber-600/50'
                                        : 'bg-[#0b0f17] border-[#243042] hover:border-slate-600'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3 mb-2">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-white">
                                          {item.name}
                                        </span>
                                        {item.isGroup && (
                                          <span className="text-xs font-medium text-slate-300 bg-slate-800 px-1.5 py-0.2 rounded inline-flex items-center gap-0.5">
                                            <Users className="w-2.5 h-2.5" /> Grupal
                                          </span>
                                        )}
                                        {isCarriedOver && (
                                          <span className="text-xs font-medium text-blue-300 bg-blue-950/80 px-1.5 py-0.2 rounded border border-blue-800">
                                            Conservada
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-[#94a3b8] mt-0.5 font-mono">
                                        <span>{(item.weight * 100).toFixed(0)}%</span>
                                        {item.minScore !== undefined && (
                                          <span className={hasFailedMin ? 'text-rose-400 font-bold' : ''}>
                                            • mín {item.minScore.toFixed(1)}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Lock / Reset */}
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleLock(item.id)}
                                        className={`p-1.5 rounded text-xs transition-colors ${
                                          isLocked
                                            ? 'bg-amber-600 text-white'
                                            : 'text-[#94a3b8] hover:text-white bg-[#141c28]'
                                        }`}
                                        title={isLocked ? 'Desbloquear nota' : 'Fijar nota en simulación'}
                                      >
                                        {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                      </button>
                                      {score !== null && (
                                        <button
                                          type="button"
                                          onClick={() => handleScoreChange(item.id, null)}
                                          className="p-1.5 rounded text-[#94a3b8] hover:text-rose-400 bg-[#141c28] text-xs"
                                          title="Borrar nota"
                                        >
                                          <RotateCcw className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Slider and Box */}
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="range"
                                      min="0"
                                      max={item.maxScore ?? 10}
                                      step="0.1"
                                      value={score ?? 0}
                                      onChange={(e) => handleScoreChange(item.id, parseFloat(e.target.value))}
                                      className="flex-1 h-1.5 bg-[#243042] rounded-full appearance-none cursor-pointer accent-blue-500"
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
                                        className={`w-full py-1 text-center text-xs font-mono font-bold rounded border ${
                                          score === null
                                            ? 'bg-[#141c28] border-[#243042] text-slate-500'
                                            : hasFailedMin
                                              ? 'bg-rose-950/60 border-rose-700 text-rose-300'
                                              : 'bg-[#141c28] border-slate-500 text-white'
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

        {/* Bottom Toolbar */}
        <div className="flex items-center justify-between text-xs text-[#94a3b8] pt-2">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-[#3b82f6] hover:underline flex items-center gap-1 font-semibold"
          >
            <FileText className="w-3.5 h-3.5" />
            {showExplanation ? 'Ocultar terminal de fórmulas' : 'Auditoría matemática de fórmulas'}
          </button>
          <button
            onClick={handleResetScores}
            className="hover:text-rose-400 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Limpiar notas
          </button>
        </div>

        {/* Formula Terminal Box */}
        {showExplanation && (
          <div className="bg-[#0b0f17] border border-[#243042] p-5 rounded-lg space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-white border-b border-[#243042] pb-2">
              <span className="font-semibold text-emerald-400">
                [AUDITORÍA DE SUSTITUCIÓN Y NORMAS]
              </span>
              <button
                onClick={() => setShowExplanation(false)}
                className="text-[#94a3b8] hover:text-white"
              >
                Cerrar
              </button>
            </div>
            <div className="space-y-2">
              {explanationSteps.map((step, idx) => (
                <div key={idx} className="p-2.5 bg-[#141c28] border border-[#243042] rounded">
                  <div className="text-white font-bold mb-1">{step.title}</div>
                  <div className="text-emerald-400 bg-[#0b0f17] p-1.5 rounded border border-[#243042]">
                    {step.substituted} = {step.resultText}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Undo Toast */}
      {showUndoToast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-3 rounded shadow-xl flex items-center gap-3 text-xs border border-slate-700 z-50">
          <span>Se han restablecido las notas de esta asignatura.</span>
          <button
            onClick={handleUndoReset}
            className="text-amber-400 font-bold hover:underline uppercase tracking-wider text-xs ml-1"
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
