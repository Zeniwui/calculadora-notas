import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  FileText,
  Lock,
  Unlock,
  AlertCircle,
  X,
  Sparkles,
  Users,
  Compass
} from 'lucide-react';
import { Subject, UserSubjectState, ItemSimulationState } from '../../types/subject';
import {
  calculateSubjectGrade,
  solveInverseTarget,
  generateExplanationSteps,
  applyCarryOverFromOrdinaria,
  getAllItems,
} from '../../engine/calculator';

interface CampusSubjectViewProps {
  subject: Subject;
  state: UserSubjectState;
  onUpdateState: (newState: UserSubjectState) => void;
  onBackToDashboard: () => void;
}

export const CampusSubjectView: React.FC<CampusSubjectViewProps> = ({
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

  // Compute total evaluated weight percentage
  const evaluatedWeight = useMemo(() => {
    let weightSum = 0;
    for (const item of allItems) {
      const s = state.scores[item.id];
      if (s && s.score !== null && s.score !== undefined) {
        weightSum += item.weight;
      }
    }
    return Math.min(100, Math.round(weightSum * 100));
  }, [allItems, state.scores]);

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
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans text-[#121316]">
      {/* Top Academic Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#d9d7ce] pb-4 mb-6">
        <div>
          <button
            onClick={onBackToDashboard}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#44474f] hover:text-[#121316] mb-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver a asignaturas
          </button>
          <h1 className="text-2xl font-bold font-garamond text-[#121316] tracking-tight">
            {subject.name}
          </h1>
          <span className="text-xs text-[#5f6368]">
            Plan docente {subject.academicYear} • Código {subject.id} {subject.degree ? `• ${subject.degree}` : ''}
          </span>
        </div>

        {/* Convocatoria Switch */}
        <div className="flex items-center gap-1 bg-[#e8e6df] p-1 rounded-sm self-start sm:self-auto">
          {(['ordinaria', 'extraordinaria'] as const).map((key) => {
            const conv = subject.convocatorias[key];
            return (
              <button
                key={key}
                onClick={() => handleSwitchConvocatoria(key)}
                className={`px-3.5 py-1 text-xs font-semibold rounded-xs transition-all ${
                  activeConvKey === key
                    ? 'bg-white text-[#121316] shadow-xs'
                    : 'text-[#5f6368] hover:text-[#121316]'
                }`}
              >
                {conv.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Weight Gauge Strip */}
      <div className="bg-white border border-[#d9d7ce] p-4 rounded-sm mb-8 shadow-xs">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-[#44474f] flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#92400e]" />
            Progreso evaluativo del semestre
          </span>
          <span className="font-bold text-[#121316] tabular-nums">
            {evaluatedWeight}% del temario evaluado
          </span>
        </div>
        <div className="w-full h-2 bg-[#ebe9e1] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#121316] transition-all duration-300"
            style={{ width: `${evaluatedWeight}%` }}
          />
        </div>
      </div>

      {/* Split Desk Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Pane (5 Cols): Goal & Projection Cockpit */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
          <div className="bg-white border border-[#d9d7ce] p-6 rounded-sm shadow-xs space-y-5">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-[#5f6368] block">
                Calificación Actual Calculada
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-5xl font-bold font-garamond text-[#121316] tabular-nums">
                  {finalScore !== null ? finalScore.toFixed(2) : '--'}
                </span>
                <span
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-xs border ${
                    finalScore === null
                      ? 'bg-slate-50 text-slate-700 border-slate-200'
                      : isPassed
                        ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        : isCapped
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-rose-50 text-rose-900 border-rose-300'
                  }`}
                >
                  {finalScore === null
                    ? 'En Curso'
                    : isPassed
                      ? 'Aprobado'
                      : isCapped
                        ? 'Tope Reglamentario 4.0'
                        : 'Suspenso'}
                </span>
              </div>
            </div>

            {/* Penalty Diagnosis Banner */}
            {isCapped && calcResult.penaltyDiagnostics && calcResult.penaltyDiagnostics.length > 0 && (
              <div className="bg-[#fef9f5] border border-[#f5d0be] text-[#78350f] p-3.5 rounded-xs text-xs">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-[#b45309] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold mb-0.5">Normativa de evaluación continua:</strong>
                    <p className="leading-relaxed">
                      {calcResult.penaltyDiagnostics[0].formattedMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Prerequisites Section */}
            {activeConvocatoria.prerequisites && activeConvocatoria.prerequisites.length > 0 && (
              <div className="border-t border-[#ebe9e1] pt-4 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#121316] block">
                  Requisitos de Convocatoria
                </span>
                {activeConvocatoria.prerequisites.map((prereq) => {
                  const currentVal = state.prerequisitesState[prereq.id];
                  const numVal = typeof currentVal === 'number' ? currentVal : 100;
                  const isMet = numVal >= (prereq.requiredPercentage ?? 80);

                  return (
                    <div key={prereq.id} className="p-3 bg-[#faf9f5] border border-[#e8e6df] rounded-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#121316]">{prereq.name}</span>
                        <span
                          className={`text-xs font-bold px-1.5 py-0.5 rounded-xs border ${
                            isMet
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          {numVal}% {isMet ? 'Cumplido' : `Incumplido (< ${prereq.requiredPercentage ?? 80}%)`}
                        </span>
                      </div>
                      <p className="text-xs text-[#5f6368]">{prereq.description}</p>
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
                            className="flex-1 h-1.5 bg-[#d9d7ce] rounded-full appearance-none cursor-pointer"
                          />
                          <span className="text-xs font-garamond font-bold text-[#121316] w-10 text-right">
                            {numVal}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Simulator Cockpit */}
            <div className="border-t border-[#ebe9e1] pt-5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#121316] block mb-2">
                Simulador de Meta
              </span>

              <div className="flex items-center gap-1.5 mb-3">
                {[5.0, 6.0, 7.0, 8.0, 9.0].map((t) => (
                  <button
                    key={t}
                    onClick={() => onUpdateState({ ...state, targetScore: t })}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-xs border transition-colors ${
                      (state.targetScore || 5.0) === t
                        ? 'bg-[#121316] text-white border-[#121316]'
                        : 'bg-[#f4f3ef] text-[#44474f] border-[#d9d7ce] hover:border-[#121316]'
                    }`}
                  >
                    {t.toFixed(0)}
                  </button>
                ))}
              </div>

              {inverseResult.isAchievable ? (
                <div className="bg-[#f9f8f5] border border-[#e5e3dc] p-3.5 rounded-xs text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#5f6368]">Media requerida en pendientes:</span>
                    <strong className="text-sm font-bold text-[#121316] tabular-nums">
                      {inverseResult.requiredAverageOnPending.toFixed(2)}
                    </strong>
                  </div>
                  {inverseResult.pendingItemCount > 0 && (
                    <button
                      onClick={() => handleApplySuggested(inverseResult.suggestedScores)}
                      className="w-full py-2 bg-[#92400e] text-white text-xs font-semibold rounded-xs hover:bg-[#78350f] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                      Aplicar notas requeridas
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-xs text-xs">
                  Objetivo inalcanzable. Nota máxima alcanzable:{' '}
                  <strong className="font-bold tabular-nums">
                    {inverseResult.maxAchievableScore.toFixed(2)}
                  </strong>
                </div>
              )}
            </div>

            {/* Sub-block Averages Summary */}
            <div className="border-t border-[#ebe9e1] pt-4 space-y-1.5">
              <span className="text-xs uppercase font-bold tracking-wider text-[#5f6368] block">
                Ponderación por Bloques
              </span>
              {activeConvocatoria.blocks.map((b) => {
                const bRes = calcResult.blocks[b.id];
                return (
                  <div key={b.id} className="flex items-center justify-between text-xs py-1 border-b border-[#f4f3ef]">
                    <span className="text-[#44474f]">{b.name} ({(b.weight * 100).toFixed(0)}%)</span>
                    <strong className="font-garamond font-bold text-sm tabular-nums text-[#121316]">
                      {bRes?.score !== null ? bRes.score.toFixed(2) : '--'}
                    </strong>
                  </div>
                );
              })}
            </div>

            {/* Bottom Controls */}
            <div className="border-t border-[#ebe9e1] pt-4 flex items-center justify-between text-xs">
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-[#92400e] hover:underline font-semibold flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" />
                {showExplanation ? 'Ocultar fórmulas' : 'Auditoría matemática'}
              </button>
              <button
                onClick={handleResetScores}
                className="text-[#5f6368] hover:text-rose-700 font-medium flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Restablecer
              </button>
            </div>
          </div>
        </div>

        {/* Right Pane (7 Cols): Evaluation Modules */}
        <div className="lg:col-span-7 space-y-6">
          {activeConvocatoria.blocks.map((block) => {
            const bRes = calcResult.blocks[block.id];
            const totalItemCount =
              block.items.length +
              (block.subBlocks ? block.subBlocks.reduce((acc, sb) => acc + sb.items.length, 0) : 0);

            return (
              <div
                key={block.id}
                className="bg-white border border-[#d9d7ce] rounded-sm p-6 shadow-xs space-y-4"
              >
                <div className="border-b border-[#ebe9e1] pb-3 flex items-baseline justify-between">
                  <div>
                    <h3 className="text-base font-bold font-garamond text-[#121316]">
                      {block.name}
                    </h3>
                    <span className="text-xs text-[#5f6368]">
                      Ponderación en acta: {(block.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#5f6368] block">
                      {totalItemCount} {totalItemCount === 1 ? 'prueba' : 'pruebas'}
                    </span>
                    <strong className="text-sm font-bold font-garamond tabular-nums text-[#121316]">
                      {bRes?.score !== null && bRes?.score !== undefined
                        ? `Media: ${bRes.score.toFixed(2)}`
                        : 'Sin calificar'}
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
                          className={`p-3.5 border rounded-xs transition-colors ${
                            hasFailedMin
                              ? 'bg-rose-50/60 border-rose-300'
                              : isLocked
                                ? 'bg-[#fef9f5] border-[#f5d0be]'
                                : 'bg-[#faf9f5] border-[#e8e6df] hover:border-[#d9d7ce]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#121316]">
                                  {item.name}
                                </span>
                                {item.isGroup && (
                                  <span className="text-xs font-medium text-[#44474f] bg-white px-1.5 py-0.2 border border-[#d9d7ce] rounded-xs inline-flex items-center gap-0.5">
                                    <Users className="w-2.5 h-2.5" /> Grupal
                                  </span>
                                )}
                                {isCarriedOver && (
                                  <span className="text-xs font-medium text-[#1e3a8a] bg-[#eff6ff] px-1.5 py-0.2 border border-[#bfdbfe] rounded-xs">
                                    Conservada
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-[#5f6368] mt-0.5">
                                <span>Peso relativo: {(item.weight * 100).toFixed(0)}%</span>
                                {item.minScore !== undefined && (
                                  <span className={hasFailedMin ? 'text-rose-700 font-bold' : ''}>
                                    • Mínimo: {item.minScore.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Lock / Reset Actions */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleLock(item.id)}
                                className={`p-1.5 border rounded-xs text-xs transition-colors ${
                                  isLocked
                                    ? 'bg-[#92400e] text-white border-[#92400e]'
                                    : 'bg-white text-[#5f6368] border-[#d9d7ce] hover:text-[#121316]'
                                }`}
                                title={isLocked ? 'Desbloquear nota' : 'Fijar nota en simulación'}
                              >
                                {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                              </button>
                              {score !== null && (
                                <button
                                  type="button"
                                  onClick={() => handleScoreChange(item.id, null)}
                                  className="p-1.5 border border-[#d9d7ce] bg-white text-[#5f6368] hover:text-rose-700 text-xs rounded-xs"
                                  title="Borrar nota"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Slider & Input */}
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="0"
                              max={item.maxScore ?? 10}
                              step="0.1"
                              value={score ?? 0}
                              onChange={(e) => handleScoreChange(item.id, parseFloat(e.target.value))}
                              className="flex-1 h-1.5 bg-[#d9d7ce] rounded-full appearance-none cursor-pointer"
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
                                className={`w-full py-1 text-center text-xs font-bold font-garamond tabular-nums border rounded-xs ${
                                  score === null
                                    ? 'bg-white border-[#d9d7ce] text-[#9ca3af]'
                                    : hasFailedMin
                                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                                      : 'bg-white border-[#121316] text-[#121316]'
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
                  <div className="space-y-4 pt-2">
                    {block.subBlocks.map((sub) => {
                      const subRes = bRes?.subBlocks?.[sub.id];
                      return (
                        <div key={sub.id} className="border-l-2 border-[#d9d7ce] pl-4 space-y-3">
                          <div className="flex items-baseline justify-between border-b border-[#ebe9e1] pb-1.5">
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-[#121316]">
                                {sub.name}
                              </h4>
                              <span className="text-xs text-[#5f6368]">
                                Ponderación en bloque: {(sub.weight * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-[#5f6368] block uppercase">
                                Subtotal parte
                              </span>
                              <strong className="text-sm font-bold font-garamond tabular-nums text-[#121316]">
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
                                  className={`p-3.5 border rounded-xs transition-colors ${
                                    hasFailedMin
                                      ? 'bg-rose-50/60 border-rose-300'
                                      : isLocked
                                        ? 'bg-[#fef9f5] border-[#f5d0be]'
                                        : 'bg-[#faf9f5] border-[#e8e6df] hover:border-[#d9d7ce]'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-3 mb-2">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-[#121316]">
                                          {item.name}
                                        </span>
                                        {item.isGroup && (
                                          <span className="text-xs font-medium text-[#44474f] bg-white px-1.5 py-0.2 border border-[#d9d7ce] rounded-xs inline-flex items-center gap-0.5">
                                            <Users className="w-2.5 h-2.5" /> Grupal
                                          </span>
                                        )}
                                        {isCarriedOver && (
                                          <span className="text-xs font-medium text-[#1e3a8a] bg-[#eff6ff] px-1.5 py-0.2 border border-[#bfdbfe] rounded-xs">
                                            Conservada
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-[#5f6368] mt-0.5">
                                        <span>Peso relativo: {(item.weight * 100).toFixed(0)}%</span>
                                        {item.minScore !== undefined && (
                                          <span className={hasFailedMin ? 'text-rose-700 font-bold' : ''}>
                                            • Mínimo: {item.minScore.toFixed(1)}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Lock / Reset Actions */}
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleLock(item.id)}
                                        className={`p-1.5 border rounded-xs text-xs transition-colors ${
                                          isLocked
                                            ? 'bg-[#92400e] text-white border-[#92400e]'
                                            : 'bg-white text-[#5f6368] border-[#d9d7ce] hover:text-[#121316]'
                                        }`}
                                        title={isLocked ? 'Desbloquear nota' : 'Fijar nota en simulación'}
                                      >
                                        {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                      </button>
                                      {score !== null && (
                                        <button
                                          type="button"
                                          onClick={() => handleScoreChange(item.id, null)}
                                          className="p-1.5 border border-[#d9d7ce] bg-white text-[#5f6368] hover:text-rose-700 text-xs rounded-xs"
                                          title="Borrar nota"
                                        >
                                          <RotateCcw className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Slider & Input */}
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="range"
                                      min="0"
                                      max={item.maxScore ?? 10}
                                      step="0.1"
                                      value={score ?? 0}
                                      onChange={(e) => handleScoreChange(item.id, parseFloat(e.target.value))}
                                      className="flex-1 h-1.5 bg-[#d9d7ce] rounded-full appearance-none cursor-pointer"
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
                                        className={`w-full py-1 text-center text-xs font-bold font-garamond tabular-nums border rounded-xs ${
                                          score === null
                                            ? 'bg-white border-[#d9d7ce] text-[#9ca3af]'
                                            : hasFailedMin
                                              ? 'bg-rose-50 border-rose-300 text-rose-800'
                                              : 'bg-white border-[#121316] text-[#121316]'
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

          {/* Mathematical Audit Box */}
          {showExplanation && (
            <div className="bg-white border border-[#d9d7ce] p-6 rounded-sm shadow-xs space-y-4">
              <div className="border-b border-[#ebe9e1] pb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#121316] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#92400e]" />
                  Desglose de Fórmulas y Criterios Oficiales
                </span>
                <button
                  onClick={() => setShowExplanation(false)}
                  className="text-xs text-[#5f6368] hover:text-[#121316]"
                >
                  Cerrar
                </button>
              </div>

              <div className="space-y-2 text-xs font-mono">
                {explanationSteps.map((step, idx) => (
                  <div key={idx} className="p-3 bg-[#faf9f5] border border-[#e8e6df] rounded-xs">
                    <div className="font-sans font-bold text-[#121316] text-xs mb-1">
                      {step.title}
                    </div>
                    {step.note && <div className="text-[#5f6368] text-xs mb-1">{step.note}</div>}
                    <div className="text-[#92400e] bg-white p-2 border border-[#d9d7ce] text-xs font-bold">
                      {step.substituted} = {step.resultText}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Undo Toast */}
      {showUndoToast && (
        <div className="fixed bottom-6 right-6 bg-[#121316] text-white px-4 py-3 rounded-xs shadow-lg flex items-center gap-3 text-xs z-50">
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
