import {
  Subject,
  ConvocatoriaRule,
  UserSubjectState,
  CalculationResult,
  BlockCalculationResult,
  MinimumCheckResult,
  PenaltyDiagnosis,
  InverseSimulationResult,
  ExplanationStep,
  AssessmentItem,
  EvaluationBlock,
  SubBlock,
} from '../types/subject';

/**
 * Normalizes scores to 2 decimal places.
 */
export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Helper to get user score for an item.
 */
export function getItemScore(
  state: UserSubjectState,
  itemId: string
): number | null {
  const item = state.scores[itemId];
  return item && typeof item.score === 'number' && !isNaN(item.score)
    ? item.score
    : null;
}

/**
 * Calculates a SubBlock (e.g., PI in Ingenieria de Servicios)
 */
function calculateSubBlock(
  subBlock: SubBlock,
  state: UserSubjectState,
  minimums: MinimumCheckResult[]
): { score: number | null; isComplete: boolean } {
  let weightedSum = 0;
  let totalWeight = 0;
  let allComplete = true;

  // Check special cases, like TPI in Ingenieria de Servicios (Tarea1 + Tarea2 promedian y tienen minScore 5.0 conjunto)
  const isTpiSpecial = subBlock.id === 'practica_individual';
  const tarea1 = getItemScore(state, 'tarea1');
  const tarea2 = getItemScore(state, 'tarea2');

  if (isTpiSpecial && (tarea1 !== null || tarea2 !== null)) {
    const tpiScore =
      tarea1 !== null && tarea2 !== null ? round2((tarea1 + tarea2) / 2) : null;
    const tpiMin = 5.0;
    if (tpiScore !== null) {
      minimums.push({
        targetId: 'tpi',
        targetName: 'Tareas individuales (TPI)',
        requiredMin: tpiMin,
        currentScore: tpiScore,
        status: tpiScore >= tpiMin ? 'passed' : 'failed',
        message:
          tpiScore >= tpiMin
            ? `Aprobado: ${tpiScore.toFixed(2)} (mínimo ${tpiMin.toFixed(1)})`
            : `Suspenso: ${tpiScore.toFixed(2)} (mínimo ${tpiMin.toFixed(1)})`,
      });
    } else {
      minimums.push({
        targetId: 'tpi',
        targetName: 'Tareas individuales (TPI)',
        requiredMin: tpiMin,
        currentScore: null,
        status: 'pending',
        message: `Pendiente: media mínima de ${tpiMin.toFixed(1)} entre ambas tareas`,
      });
    }
  }

  for (const item of subBlock.items) {
    const score = getItemScore(state, item.id);
    if (score === null) {
      allComplete = false;
    } else {
      weightedSum += score * item.weight;
      totalWeight += item.weight;

      if (item.minScore !== undefined) {
        minimums.push({
          targetId: item.id,
          targetName: item.name,
          requiredMin: item.minScore,
          currentScore: score,
          status: score >= item.minScore ? 'passed' : 'failed',
          message:
            score >= item.minScore
              ? `Aprobado: ${score.toFixed(2)} (mínimo ${item.minScore.toFixed(1)})`
              : `Suspenso: ${score.toFixed(2)} (mínimo ${item.minScore.toFixed(1)})`,
        });
      }
    }
  }

  const score = totalWeight > 0 ? round2(weightedSum / totalWeight) : null;

  if (subBlock.minScore !== undefined && score !== null) {
    minimums.push({
      targetId: subBlock.id,
      targetName: subBlock.name,
      requiredMin: subBlock.minScore,
      currentScore: score,
      status: score >= subBlock.minScore ? 'passed' : 'failed',
      message:
        score >= subBlock.minScore
          ? `Aprobado: ${score.toFixed(2)} (mínimo ${subBlock.minScore.toFixed(1)})`
          : `Suspenso: ${score.toFixed(2)} (mínimo ${subBlock.minScore.toFixed(1)})`,
    });
  }

  return { score, isComplete: allComplete };
}

/**
 * Calculates a main evaluation block.
 */
function calculateBlock(
  block: EvaluationBlock,
  state: UserSubjectState
): BlockCalculationResult {
  const minimums: MinimumCheckResult[] = [];
  const subBlockResults: Record<
    string,
    { id: string; name: string; score: number | null }
  > = {};

  let blockWeightedSum = 0;
  let blockTotalWeight = 0;
  let allItemsComplete = true;

  // 1. Calculate direct items
  for (const item of block.items) {
    const score = getItemScore(state, item.id);
    if (score === null) {
      allItemsComplete = false;
      if (item.minScore !== undefined) {
        minimums.push({
          targetId: item.id,
          targetName: item.name,
          requiredMin: item.minScore,
          currentScore: null,
          status: 'pending',
          message: `Pendiente: mínimo ${item.minScore.toFixed(1)}`,
        });
      }
    } else {
      blockWeightedSum += score * item.weight;
      blockTotalWeight += item.weight;

      if (item.minScore !== undefined) {
        minimums.push({
          targetId: item.id,
          targetName: item.name,
          requiredMin: item.minScore,
          currentScore: score,
          status: score >= item.minScore ? 'passed' : 'failed',
          message:
            score >= item.minScore
              ? `Aprobado: ${score.toFixed(2)} (mínimo ${item.minScore.toFixed(1)})`
              : `Suspenso: ${score.toFixed(2)} (mínimo ${item.minScore.toFixed(1)})`,
        });
      }
    }
  }

  // 2. Calculate subblocks
  if (block.subBlocks && block.subBlocks.length > 0) {
    for (const sub of block.subBlocks) {
      const subRes = calculateSubBlock(sub, state, minimums);
      subBlockResults[sub.id] = {
        id: sub.id,
        name: sub.name,
        score: subRes.score,
      };
      if (!subRes.isComplete) {
        allItemsComplete = false;
      }
      if (subRes.score !== null) {
        blockWeightedSum += subRes.score * sub.weight;
        blockTotalWeight += sub.weight;
      }
    }
  }

  let rawScore: number | null = null;

  // Custom block calculation overrides
  if (block.id === 'teoria_gti') {
    const cp1 = getItemScore(state, 'cp1');
    const cp2 = getItemScore(state, 'cp2');
    if (cp1 !== null && cp2 !== null) {
      // Media geométrica: sqrt(cp1 * cp2)
      rawScore = round2(Math.sqrt(Math.max(0, cp1) * Math.max(0, cp2)));
      allItemsComplete = true;
    } else {
      rawScore = null;
      allItemsComplete = false;
    }
  } else if (block.id === 'teoria_in') {
    const trab = getItemScore(state, 'trabajos_teoria');
    const ex = getItemScore(state, 'examen_teoria');
    if (trab !== null && trab >= 7.0) {
      // Exento de examen teórico: los trabajos representan el 100% del bloque teórico
      rawScore = round2(trab);
      allItemsComplete = true;
    } else if (trab !== null) {
      if (ex !== null) {
        rawScore = round2(0.70 * trab + 0.30 * ex);
        allItemsComplete = true;
      } else {
        rawScore = null;
        allItemsComplete = false;
      }
    } else {
      rawScore = null;
      allItemsComplete = false;
    }
  } else {
    rawScore = blockTotalWeight > 0 ? round2(blockWeightedSum / blockTotalWeight) : null;
  }

  // Block level minimum check
  if (block.minScore !== undefined) {
    if (rawScore !== null) {
      minimums.push({
        targetId: block.id,
        targetName: block.name,
        requiredMin: block.minScore,
        currentScore: rawScore,
        status: rawScore >= block.minScore ? 'passed' : 'failed',
        message:
          rawScore >= block.minScore
            ? `Aprobado: media ${rawScore.toFixed(2)} (mínimo ${block.minScore.toFixed(1)})`
            : `Suspenso: media ${rawScore.toFixed(2)} (mínimo ${block.minScore.toFixed(1)})`,
      });
    } else {
      minimums.push({
        targetId: block.id,
        targetName: block.name,
        requiredMin: block.minScore,
        currentScore: null,
        status: 'pending',
        message: `Pendiente: media mínima ${block.minScore.toFixed(1)}`,
      });
    }
  }

  return {
    id: block.id,
    name: block.name,
    score: rawScore,
    rawScore,
    isComplete: allItemsComplete,
    subBlocks: subBlockResults,
    minimums,
  };
}

/**
 * Main Direct Grade Calculator
 */
export function calculateSubjectGrade(
  subject: Subject,
  state: UserSubjectState,
  convocatoriaKey: 'ordinaria' | 'extraordinaria' = state.activeConvocatoria
): CalculationResult {
  const convocatoria = subject.convocatorias[convocatoriaKey];
  const allMinimums: MinimumCheckResult[] = [];
  const blockResults: Record<string, BlockCalculationResult> = {};
  const penaltyReasons: string[] = [];

  // 1. Check prerequisites
  let prerequisitesMet = true;
  const prerequisiteFailures: string[] = [];

  for (const prereq of convocatoria.prerequisites) {
    const val = state.prerequisitesState[prereq.id];
    if (prereq.type === 'percentage') {
      const numVal = typeof val === 'number' ? val : 100;
      if (prereq.requiredPercentage && numVal < prereq.requiredPercentage) {
        prerequisitesMet = false;
        prerequisiteFailures.push(
          `${prereq.name}: ${numVal}% < ${prereq.requiredPercentage}% requerido. ${prereq.failureMessage}`
        );
      }
    } else {
      const boolVal = val !== false;
      if (!boolVal) {
        prerequisitesMet = false;
        prerequisiteFailures.push(`${prereq.name}: No cumplido. ${prereq.failureMessage}`);
      }
    }
  }

  // 2. Calculate each block
  let weightedFinalSum = 0;
  let totalFinalWeight = 0;
  let isEntirelyComplete = true;

  for (const block of convocatoria.blocks) {
    const bRes = calculateBlock(block, state);
    blockResults[block.id] = bRes;
    allMinimums.push(...bRes.minimums);

    if (!bRes.isComplete) {
      isEntirelyComplete = false;
    }

    if (bRes.score !== null) {
      weightedFinalSum += bRes.score * block.weight;
      totalFinalWeight += block.weight;
    }
  }

  const unpenalizedScore =
    totalFinalWeight > 0 ? round2(weightedFinalSum / totalFinalWeight) : null;

  // 3. Check for any failed minimums
  const failedMinimums = allMinimums.filter((m) => m.status === 'failed');
  const hasFailedMinimums = failedMinimums.length > 0;

  for (const fail of failedMinimums) {
    penaltyReasons.push(
      `No se alcanza la nota mínima en ${fail.targetName}: ${fail.currentScore?.toFixed(2)} < ${fail.requiredMin.toFixed(1)}`
    );
  }

  if (!prerequisitesMet) {
    penaltyReasons.push(...prerequisiteFailures);
  }

  let isCappedByPenalty = false;
  let finalScore: number | null = unpenalizedScore;

  if (unpenalizedScore !== null) {
    if (hasFailedMinimums || !prerequisitesMet) {
      isCappedByPenalty = true;
      finalScore = round2(Math.min(convocatoria.failPenaltyCap, unpenalizedScore));
    }
  }

  const penaltyDiagnostics: PenaltyDiagnosis[] = [];

  if (isCappedByPenalty && unpenalizedScore !== null) {
    const capFormatted = convocatoria.failPenaltyCap.toFixed(1).replace('.', ',');
    const unpenalizedFormatted = unpenalizedScore.toFixed(2).replace('.', ',');

    // Deduplicate block failures if a single-item child already failed with the same score
    const distinctFailures = failedMinimums.filter((fail) => {
      const isDuplicateBlock = convocatoria.blocks.some(
        (b) =>
          b.id === fail.targetId &&
          b.items.length === 1 &&
          failedMinimums.some((other) => other.targetId === b.items[0].id)
      );
      return !isDuplicateBlock;
    });

    for (const fail of distinctFailures) {
      const score = fail.currentScore ?? 0;
      const deficit = round2(Math.max(0, fail.requiredMin - score));
      const scoreFormatted = score.toFixed(2).replace('.', ',');
      const minFormatted = fail.requiredMin.toFixed(2).replace('.', ',');
      const deficitFormatted = deficit.toFixed(2).replace('.', ',');

      const formattedMessage = `Tope reglamentario aplicado (${capFormatted}): ${fail.targetName} tiene una calificación de ${scoreFormatted} (mínimo exigido: ${minFormatted}). Se precisan +${deficitFormatted} puntos en esta parte para liberar la calificación media real de ${unpenalizedFormatted}.`;

      penaltyDiagnostics.push({
        targetId: fail.targetId,
        targetName: fail.targetName,
        currentScore: score,
        requiredMin: fail.requiredMin,
        deficit,
        unpenalizedScore,
        formattedMessage,
      });
    }

    if (distinctFailures.length === 0 && !prerequisitesMet) {
      for (const failure of prerequisiteFailures) {
        penaltyDiagnostics.push({
          targetId: 'prerequisite',
          targetName: 'Prerrequisito',
          currentScore: null,
          requiredMin: null,
          deficit: null,
          unpenalizedScore,
          formattedMessage: `Tope reglamentario aplicado (${capFormatted}): ${failure}. Se precisa cumplir este requisito para liberar la calificación media real de ${unpenalizedFormatted}.`,
        });
      }
    }

    if (penaltyDiagnostics.length === 0 && penaltyReasons.length > 0) {
      for (const reason of penaltyReasons) {
        penaltyDiagnostics.push({
          targetId: 'regulatory_cap',
          targetName: 'Normativa',
          currentScore: null,
          requiredMin: null,
          deficit: null,
          unpenalizedScore,
          formattedMessage: `Tope reglamentario aplicado (${capFormatted}): ${reason}. Se precisa subsanar esta penalización para liberar la calificación media real de ${unpenalizedFormatted}.`,
        });
      }
    }
  }

  const isPassed =
    finalScore !== null &&
    finalScore >= convocatoria.passingScore &&
    !hasFailedMinimums &&
    prerequisitesMet;

  // 4. Calculate Max Achievable Score (assuming 10 on all pending)
  const maxState = createHypotheticalState(subject, state, convocatoriaKey, 10.0);
  const maxResult = calculateSubjectGradeInternal(subject, maxState, convocatoriaKey);

  return {
    subjectId: subject.id,
    convocatoria: convocatoriaKey,
    finalScore,
    unpenalizedScore,
    isCappedByPenalty,
    penaltyCapValue: convocatoria.failPenaltyCap,
    penaltyReasons,
    penaltyDiagnostics,
    isPassed,
    isComplete: isEntirelyComplete,
    blocks: blockResults,
    allMinimums,
    prerequisitesMet,
    prerequisiteFailures,
    maxAchievableScore: maxResult.finalScore ?? 10.0,
  };
}

/**
 * Internal calculator avoiding recursion
 */
function calculateSubjectGradeInternal(
  subject: Subject,
  state: UserSubjectState,
  convocatoriaKey: 'ordinaria' | 'extraordinaria'
): { finalScore: number | null } {
  const convocatoria = subject.convocatorias[convocatoriaKey];
  let weightedFinalSum = 0;
  let totalFinalWeight = 0;
  let failed = false;

  for (const block of convocatoria.blocks) {
    const bRes = calculateBlock(block, state);
    if (bRes.minimums.some((m) => m.status === 'failed')) {
      failed = true;
    }
    if (bRes.score !== null) {
      weightedFinalSum += bRes.score * block.weight;
      totalFinalWeight += block.weight;
    }
  }

  const unpenalized = totalFinalWeight > 0 ? round2(weightedFinalSum / totalFinalWeight) : null;
  if (unpenalized === null) return { finalScore: null };
  if (failed) return { finalScore: round2(Math.min(convocatoria.failPenaltyCap, unpenalized)) };
  return { finalScore: unpenalized };
}

/**
 * Creates a cloned state where all pending items receive a fixed hypothetical score
 */
function createHypotheticalState(
  subject: Subject,
  state: UserSubjectState,
  convocatoriaKey: 'ordinaria' | 'extraordinaria',
  fillValue: number
): UserSubjectState {
  const cloned: UserSubjectState = {
    ...state,
    scores: { ...state.scores },
  };

  const convocatoria = subject.convocatorias[convocatoriaKey];
  const allItems = getAllItems(convocatoria);

  for (const item of allItems) {
    const existing = cloned.scores[item.id];
    if (!existing || existing.score === null) {
      cloned.scores[item.id] = {
        score: fillValue,
        isLocked: false,
      };
    }
  }

  return cloned;
}

/**
 * Collects all leaf assessment items in a convocatoria
 */
export function getAllItems(convocatoria: ConvocatoriaRule): AssessmentItem[] {
  const items: AssessmentItem[] = [];
  for (const b of convocatoria.blocks) {
    items.push(...b.items);
    if (b.subBlocks) {
      for (const s of b.subBlocks) {
        items.push(...s.items);
      }
    }
  }
  return items;
}

/**
 * Solves Inverse Target: "Qué necesito sacar"
 */
export function solveInverseTarget(
  subject: Subject,
  state: UserSubjectState,
  targetScore: number = state.targetScore || 5.0
): InverseSimulationResult {
  const convocatoria = subject.convocatorias[state.activeConvocatoria];
  const allItems = getAllItems(convocatoria);

  // Identify pending items that are not locked
  const pendingUnlockedItems = allItems.filter((item) => {
    const s = state.scores[item.id];
    return !s || s.score === null || (!s.isLocked && s.score === null);
  });

  // Calculate current max achievable score (if user gets 10 on all pending)
  const maxState = createHypotheticalState(subject, state, state.activeConvocatoria, 10.0);
  const maxGradeResult = calculateSubjectGrade(subject, maxState, state.activeConvocatoria);
  const maxAchievable = maxGradeResult.finalScore ?? 10.0;

  // Check if target is impossible
  if (targetScore > maxAchievable + 0.001) {
    return {
      targetScore,
      isAchievable: false,
      impossibleReason: `Con un 10 en todas las pruebas pendientes tu nota máxima sería de ${maxAchievable.toFixed(2)}, inferior a la meta deseada de ${targetScore.toFixed(2)}.`,
      maxAchievableScore: maxAchievable,
      requiredAverageOnPending: round2(
        10.0 + (targetScore - maxAchievable) * 2 // Theoretical required score > 10
      ),
      pendingItemCount: pendingUnlockedItems.length,
      suggestedScores: {},
    };
  }

  // Check if any prerequisite is permanently unmet
  for (const prereq of convocatoria.prerequisites) {
    const val = state.prerequisitesState[prereq.id];
    if (prereq.type === 'percentage') {
      const numVal = typeof val === 'number' ? val : 100;
      if (prereq.requiredPercentage && numVal < prereq.requiredPercentage) {
        return {
          targetScore,
          isAchievable: false,
          impossibleReason: `El requisito de asistencia (${numVal}% < ${prereq.requiredPercentage}%) suspende la convocatoria ordinaria con tope a 4.0.`,
          maxAchievableScore: Math.min(convocatoria.failPenaltyCap, maxAchievable),
          requiredAverageOnPending: 0,
          pendingItemCount: pendingUnlockedItems.length,
          suggestedScores: {},
        };
      }
    }
  }

  if (pendingUnlockedItems.length === 0) {
    const current = calculateSubjectGrade(subject, state, state.activeConvocatoria);
    const currScore = current.finalScore ?? 0;
    return {
      targetScore,
      isAchievable: currScore >= targetScore,
      impossibleReason:
        currScore >= targetScore
          ? undefined
          : `Todas las pruebas ya están calificadas y la nota final es ${currScore.toFixed(2)}.`,
      maxAchievableScore: currScore,
      requiredAverageOnPending: 0,
      pendingItemCount: 0,
      suggestedScores: {},
    };
  }

  // Binary search for uniform score X in [0, 10]
  let low = 0.0;
  let high = 10.0;
  let bestX = 10.0;

  for (let iter = 0; iter < 40; iter++) {
    const mid = (low + high) / 2;
    const testState: UserSubjectState = {
      ...state,
      scores: { ...state.scores },
    };

    for (const item of pendingUnlockedItems) {
      testState.scores[item.id] = {
        score: mid,
        isLocked: false,
      };
    }

    const res = calculateSubjectGrade(subject, testState, state.activeConvocatoria);
    const achieved = res.finalScore ?? 0;

    if (achieved >= targetScore - 0.001) {
      bestX = mid;
      high = mid; // try lower
    } else {
      low = mid; // need higher
    }
  }

  // Ensure individual item minimums are met
  const suggestedScores: Record<string, number> = {};
  for (const item of pendingUnlockedItems) {
    let reqScore = round2(bestX);
    if (item.minScore && reqScore < item.minScore) {
      reqScore = item.minScore;
    }
    suggestedScores[item.id] = reqScore;
  }

  return {
    targetScore,
    isAchievable: true,
    maxAchievableScore: maxAchievable,
    requiredAverageOnPending: round2(bestX),
    pendingItemCount: pendingUnlockedItems.length,
    suggestedScores,
  };
}

/**
 * Automatic carry-over of passing components from Ordinaria to Extraordinaria
 */
export function applyCarryOverFromOrdinaria(
  subject: Subject,
  ordinariaState: UserSubjectState
): Record<string, { score: number; isCarriedOver: boolean }> {
  const ordinariaResult = calculateSubjectGrade(subject, ordinariaState, 'ordinaria');
  const carriedScores: Record<string, { score: number; isCarriedOver: boolean }> = {};

  if (subject.id === 'ingenieria-servicios') {
    // Teoria: si TEO >= 5.0, se conserva para ET
    const teo = ordinariaResult.blocks['teoria'];
    if (teo && teo.score !== null && teo.score >= 5.0) {
      carriedScores['et'] = { score: teo.score, isCarriedOver: true };
    }
    // TG: si TG >= 5.0, se conserva para tg_ext
    const tgScore = getItemScore(ordinariaState, 'tg');
    if (tgScore !== null && tgScore >= 5.0) {
      carriedScores['tg_ext'] = { score: tgScore, isCarriedOver: true };
    }
    // TPI: si TPI >= 5.0, se conserva para tpi_ext
    const t1 = getItemScore(ordinariaState, 'tarea1');
    const t2 = getItemScore(ordinariaState, 'tarea2');
    if (t1 !== null && t2 !== null) {
      const tpi = round2((t1 + t2) / 2);
      if (tpi >= 5.0) {
        carriedScores['tpi_ext'] = { score: tpi, isCarriedOver: true };
      }
    }
  } else if (subject.id === 'tecnologias-web') {
    // Si la práctica continua NP >= 5.0, se conserva. Si no, queda en 0.0
    const np = ordinariaResult.blocks['practica_tw'];
    if (np && np.score !== null && np.score >= 5.0) {
      carriedScores['np_conservada'] = { score: np.score, isCarriedOver: true };
    } else {
      carriedScores['np_conservada'] = { score: 0.0, isCarriedOver: true };
    }
  } else if (subject.id === 'gestion-tecnologias-informacion') {
    // Si el trabajo en equipo fue >= 5.0 en ordinaria, se conserva para extraordinaria
    const trab = getItemScore(ordinariaState, 'trab_equipo');
    if (trab !== null && trab >= 5.0) {
      carriedScores['trab_equipo_ext'] = { score: trab, isCarriedOver: true };
    }
  } else if (subject.id === 'inteligencia-negocio') {
    // Prácticas: si el bloque práctico de ordinaria fue >= 5.0, se conserva
    const prac = ordinariaResult.blocks['practica_in'];
    if (prac && prac.score !== null && prac.score >= 5.0) {
      carriedScores['prac_ext'] = { score: prac.score, isCarriedOver: true };
    }
    // Teoría: si el bloque teórico de ordinaria fue >= 5.0, se conserva
    const teo = ordinariaResult.blocks['teoria_in'];
    if (teo && teo.score !== null && teo.score >= 5.0) {
      carriedScores['teo_ext'] = { score: teo.score, isCarriedOver: true };
    }
  }

  return carriedScores;
}

/**
 * Step-by-step explanatory generator
 */
export function generateExplanationSteps(
  subject: Subject,
  state: UserSubjectState,
  result: CalculationResult
): ExplanationStep[] {
  const steps: ExplanationStep[] = [];
  const activeKey = state.activeConvocatoria || result.convocatoria || 'ordinaria';
  const convocatoria = subject.convocatorias[activeKey];
  if (!convocatoria) return steps;

  // 1. Prerequisites step
  if (convocatoria.prerequisites.length > 0) {
    const prereqNotes = convocatoria.prerequisites.map((p) => {
      const val = state.prerequisitesState[p.id];
      const valDisplay = p.type === 'percentage' ? `${val ?? 100}%` : val ? 'Cumplido' : 'No cumplido';
      return `${p.name}: ${valDisplay} (mínimo ${p.requiredPercentage ? `${p.requiredPercentage}%` : 'sí'})`;
    });

    steps.push({
      title: 'Asistencia a clase',
      formula: 'Asistencia y seguimiento',
      substituted: prereqNotes.join(' | '),
      resultText: result.prerequisitesMet ? 'Cumplido' : 'No alcanzado',
      type: result.prerequisitesMet ? 'success' : 'warning',
      note: result.prerequisitesMet
        ? 'Cumples los requisitos de asistencia para la evaluación continua.'
        : result.prerequisiteFailures.join('. '),
    });
  }

  // 2. Block by block steps
  for (const block of convocatoria.blocks) {
    const bRes = result.blocks[block.id];
    const bScore = bRes?.score !== null ? `${bRes.score.toFixed(2)}` : 'Pendiente';

    // Show item breakdown
    const itemSubstitutions: string[] = [];
    for (const item of block.items) {
      const s = getItemScore(state, item.id);
      itemSubstitutions.push(`${item.shortName} = ${s !== null ? s.toFixed(2) : '?'}`);
    }

    if (block.subBlocks) {
      for (const s of block.subBlocks) {
        const subRes = bRes?.subBlocks?.[s.id];
        const subItemsSub = s.items.map((i) => {
          const val = getItemScore(state, i.id);
          return `${i.shortName} = ${val !== null ? val.toFixed(2) : '?'}`;
        });
        itemSubstitutions.push(
          `${s.shortName} (${subItemsSub.join(', ')}) = ${subRes?.score !== null && subRes?.score !== undefined ? subRes.score.toFixed(2) : '?'}`
        );
      }
    }

    steps.push({
      title: `${block.name} (${(block.weight * 100).toFixed(0)}%)`,
      formula: block.formulaText,
      substituted: itemSubstitutions.join(' | '),
      resultText: `Nota = ${bScore}`,
      type: 'formula',
      note: block.minScore
        ? `Nota mínima: ${block.minScore.toFixed(1)}`
        : undefined,
    });
  }

  // 3. Minimum requirements verification step
  const minCheckItems = result.allMinimums.map((m) => {
    return `${m.targetName}: ${m.message}`;
  });

  steps.push({
    title: 'Notas mínimas',
    formula: 'Requisitos de la guía docente',
    substituted: minCheckItems.join('\n'),
    resultText:
      result.allMinimums.some((m) => m.status === 'failed')
        ? 'Mínimo no alcanzado'
        : result.allMinimums.some((m) => m.status === 'pending')
          ? 'Notas pendientes'
          : 'Mínimos aprobados',
    type: result.allMinimums.some((m) => m.status === 'failed') ? 'warning' : 'success',
  });

  // 4. Final aggregation formula
  const blockSubstitutions = convocatoria.blocks
    .map((b) => {
      const bRes = result.blocks[b.id];
      const sc = bRes?.score !== null ? bRes.score.toFixed(2) : '?';
      return `${(b.weight).toFixed(2)} · ${sc}`;
    })
    .join(' + ');

  steps.push({
    title: 'Cálculo de la nota',
    formula: convocatoria.finalFormulaText,
    substituted: blockSubstitutions,
    resultText: `Nota ponderada = ${result.unpenalizedScore !== null ? result.unpenalizedScore.toFixed(2) : 'Pendiente'}`,
    type: 'formula',
  });

  // 5. Penalties and final result
  if (result.isCappedByPenalty) {
    steps.push({
      title: 'Límite reglamentario por nota mínima',
      formula: `Nota final = min(${convocatoria.failPenaltyCap.toFixed(1)}, fórmula)`,
      substituted: `min(${convocatoria.failPenaltyCap.toFixed(1)}, ${result.unpenalizedScore?.toFixed(2) ?? '?'})`,
      resultText: `Calificación: ${result.finalScore?.toFixed(2)} (Suspenso)`,
      type: 'warning',
      note: `La guía docente establece que si no se aprueba alguna nota mínima, la calificación final no puede superar ${convocatoria.failPenaltyCap.toFixed(1)}. Motivos: ${result.penaltyReasons.join('. ')}.`,
    });
  } else {
    steps.push({
      title: 'Calificación final',
      formula: 'Nota ponderada',
      substituted: `Nota = ${result.finalScore !== null ? result.finalScore.toFixed(2) : 'Pendiente'}`,
      resultText:
        result.finalScore !== null
          ? result.isPassed
            ? `Aprobado (${result.finalScore.toFixed(2)})`
            : `Suspenso (${result.finalScore.toFixed(2)})`
          : 'Pendiente',
      type: result.isPassed ? 'success' : 'formula',
    });
  }

  return steps;
}
