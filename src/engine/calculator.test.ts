import { subjectsCatalog } from '../data/index';
import {
  calculateSubjectGrade,
  solveInverseTarget,
  applyCarryOverFromOrdinaria,
  generateExplanationSteps,
} from './calculator';
import { UserSubjectState } from '../types/subject';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    process.exit(1);
  } else {
    console.log(`[PASS] ${msg}`);
  }
}

console.log('--- Testing Engine on Ingenieria de Servicios ---');
const isSubject = subjectsCatalog.find((s) => s.id === 'ingenieria-servicios')!;
assert(!!isSubject, 'Subject found');

// Scenario 1: All passed with 6.0
const stateAll6: UserSubjectState = {
  subjectId: 'ingenieria-servicios',
  activeConvocatoria: 'ordinaria',
  prerequisitesState: { asistencia_lab: 90 },
  scores: {
    t1: { score: 6.0 },
    t2: { score: 6.0 },
    t3: { score: 6.0 },
    tg: { score: 6.0 },
    pp1: { score: 6.0 },
    pp2: { score: 6.0 },
    tarea1: { score: 6.0 },
    tarea2: { score: 6.0 },
  },
  targetScore: 5.0,
};

const resAll6 = calculateSubjectGrade(isSubject, stateAll6, 'ordinaria');
assert(resAll6.finalScore === 6.0, `Expected 6.0, got ${resAll6.finalScore}`);
assert(resAll6.isPassed === true, 'Subject should be passed');
assert(resAll6.isCappedByPenalty === false, 'Should not be capped');

// Scenario 2: Teoria average is 8.0, but TG is 4.0 (< 5.0).
// Formula without penalty: 0.60 * 8.0 + 0.40 * (0.75 * 8.0 + 0.25 * 4.0) = 4.8 + 0.40 * (6.0 + 1.0) = 4.8 + 2.8 = 7.6.
// Because TG is 4.0, final grade MUST be capped at 4.0!
const stateFailTG: UserSubjectState = {
  subjectId: 'ingenieria-servicios',
  activeConvocatoria: 'ordinaria',
  prerequisitesState: { asistencia_lab: 85 },
  scores: {
    t1: { score: 8.0 },
    t2: { score: 8.0 },
    t3: { score: 8.0 },
    tg: { score: 4.0 }, // Failed minimum!
    pp1: { score: 8.0 },
    pp2: { score: 8.0 },
    tarea1: { score: 8.0 },
    tarea2: { score: 8.0 },
  },
  targetScore: 5.0,
};

const resFailTG = calculateSubjectGrade(isSubject, stateFailTG, 'ordinaria');
assert(resFailTG.unpenalizedScore === 7.6, `Expected unpenalized 7.6, got ${resFailTG.unpenalizedScore}`);
assert(resFailTG.finalScore === 4.0, `Expected capped 4.0, got ${resFailTG.finalScore}`);
assert(resFailTG.isCappedByPenalty === true, 'Must be capped by penalty');
assert(resFailTG.isPassed === false, 'Cannot pass when capped by failed minimum');
assert(resFailTG.penaltyDiagnostics.length === 1, 'Should produce 1 penalty diagnosis for TG failure');
assert(resFailTG.penaltyDiagnostics[0].deficit === 1.0, 'Deficit for TG must be 1.00');

// Scenario 3: Attendance < 75%
const stateFailAttendance: UserSubjectState = {
  ...stateAll6,
  prerequisitesState: { asistencia_lab: 60 },
};
const resFailAtt = calculateSubjectGrade(isSubject, stateFailAttendance, 'ordinaria');
assert(resFailAtt.finalScore === 4.0, `Expected 4.0 due to attendance failure, got ${resFailAtt.finalScore}`);
assert(resFailAtt.prerequisitesMet === false, 'Prerequisites should not be met');

// Scenario 4: Inverse solver
const statePending: UserSubjectState = {
  subjectId: 'ingenieria-servicios',
  activeConvocatoria: 'ordinaria',
  prerequisitesState: { asistencia_lab: 100 },
  scores: {
    t1: { score: 6.0 },
    t2: { score: null },
    t3: { score: null },
    tg: { score: null },
    pp1: { score: 6.0 },
    pp2: { score: null },
    tarea1: { score: null },
    tarea2: { score: null },
  },
  targetScore: 5.0,
};

const invRes = solveInverseTarget(isSubject, statePending, 5.0);
assert(invRes.isAchievable === true, '5.0 should be achievable');
assert(invRes.requiredAverageOnPending <= 6.0, `Expected required <= 6.0, got ${invRes.requiredAverageOnPending}`);

// Scenario 5: Extraordinary carryover
const carried = applyCarryOverFromOrdinaria(isSubject, stateAll6);
assert(carried['et']?.score === 6.0, 'Teoria should carry over to ET');
assert(carried['tg_ext']?.score === 6.0, 'TG should carry over to tg_ext');
assert(carried['tpi_ext']?.score === 6.0, 'TPI should carry over to tpi_ext');

// Explanation generation
const steps = generateExplanationSteps(isSubject, stateFailTG, resFailTG);
assert(steps.length >= 4, `Expected at least 4 steps, got ${steps.length}`);

console.log('--- Testing Engine on Tecnologías Web ---');
const twSubject = subjectsCatalog.find((s) => s.id === 'tecnologias-web')!;
assert(!!twSubject, 'Tecnologias Web found');

// Ordinaria: NT 20%, NP 80% (EP1 20%, ExP1 30%, EP2 20%, ExP2 30%)
// Test NT=6, EP1=7, ExP1=8, EP2=7, ExP2=8
// NP = 0.2*7 + 0.3*8 + 0.2*7 + 0.3*8 = 1.4 + 2.4 + 1.4 + 2.4 = 7.6
// Final = 0.20*6 + 0.80*7.6 = 1.2 + 6.08 = 7.28
const stateTW: UserSubjectState = {
  subjectId: 'tecnologias-web',
  activeConvocatoria: 'ordinaria',
  prerequisitesState: { asistencia_activa: 90 },
  scores: {
    nt: { score: 6.0 },
    ep1: { score: 7.0 },
    exp1: { score: 8.0 },
    ep2: { score: 7.0 },
    exp2: { score: 8.0 },
  },
  targetScore: 5.0,
};

const resTW = calculateSubjectGrade(twSubject, stateTW, 'ordinaria');
assert(resTW.finalScore === 7.28, `Expected 7.28, got ${resTW.finalScore}`);
assert(resTW.isPassed === true, 'TW should be passed');

// Test TW failing an individual practical exam (e.g. ExP1 = 3.5, which is < 4.0 minimum required)
const stateTWFailMin: UserSubjectState = {
  ...stateTW,
  scores: {
    ...stateTW.scores,
    exp1: { score: 3.5 }, // Failed individual minimum of 4.0!
  },
};
const resTWFail = calculateSubjectGrade(twSubject, stateTWFailMin, 'ordinaria');
assert(resTWFail.isCappedByPenalty === true, 'Must be capped because ExP1 < 4.0');
assert(resTWFail.finalScore === 4.0, `Expected 4.0, got ${resTWFail.finalScore}`);
assert(resTWFail.penaltyDiagnostics.length === 1, 'Should produce 1 penalty diagnosis for ExP1 failure');
assert(resTWFail.penaltyDiagnostics[0].targetName === 'Examen Práctico 1', 'Failed target name must be Examen Practico 1');
assert(resTWFail.penaltyDiagnostics[0].currentScore === 3.5, 'Current score must be 3.50');
assert(resTWFail.penaltyDiagnostics[0].requiredMin === 4.0, 'Required minimum must be 4.00');
assert(resTWFail.penaltyDiagnostics[0].deficit === 0.5, 'Deficit must be +0.50');
assert(
  resTWFail.penaltyDiagnostics[0].formattedMessage.includes(
    'Tope reglamentario aplicado (4,0): Examen Práctico 1 tiene una calificación de 3,50 (mínimo exigido: 4,00). Se precisan +0,50 puntos en esta parte para liberar la calificación media real de'
  ),
  'Formatted diagnosis text must match required diagnostic copy format'
);

// Test TW Extraordinary carryover:
// If NP >= 5.0, NP is carried over.
const carriedTW = applyCarryOverFromOrdinaria(twSubject, stateTW);
assert(carriedTW['np_conservada']?.score === 7.6, `Expected carried NP 7.6, got ${carriedTW['np_conservada']?.score}`);

console.log('--- Testing Engine on Gestión de Tecnologías de la Información ---');
const gtiSubject = subjectsCatalog.find((s) => s.id === 'gestion-tecnologias-informacion')!;
assert(!!gtiSubject, 'Gestion de Tecnologias de la Informacion found');

// Scenario 1: Media geométrica de teoría sqrt(4.0 * 9.0) = 6.0
// Participación = 8.0, Simulación = 6.0, Trabajo = 7.0
// Asistencia = 85% (>= 80%)
// Nota final = 0.30 * 6.0 + 0.15 * 8.0 + 0.15 * 6.0 + 0.40 * 7.0 = 1.8 + 1.2 + 0.9 + 2.8 = 6.70
const stateGTI: UserSubjectState = {
  subjectId: 'gestion-tecnologias-informacion',
  activeConvocatoria: 'ordinaria',
  prerequisitesState: { asistencia_lab_gti: 85 },
  scores: {
    cp1: { score: 4.0 },
    cp2: { score: 9.0 },
    part_clase: { score: 8.0 },
    sim_apolo: { score: 6.0 },
    trab_equipo: { score: 7.0 },
  },
  targetScore: 5.0,
};

const resGTI = calculateSubjectGrade(gtiSubject, stateGTI, 'ordinaria');
assert(resGTI.blocks['teoria_gti']?.score === 6.0, `Expected geometric mean theory 6.0, got ${resGTI.blocks['teoria_gti']?.score}`);
assert(resGTI.finalScore === 6.7, `Expected final score 6.70, got ${resGTI.finalScore}`);
assert(resGTI.isPassed === true, 'GTI should be passed');

// Scenario 2: Falla de mínimo en Simulación (sim_apolo = 4.0 < 5.0)
// Debe aplicarse tope reglamentario a 4.5 según la guía docente oficial
const stateGTIFailSim: UserSubjectState = {
  ...stateGTI,
  scores: {
    ...stateGTI.scores,
    sim_apolo: { score: 4.0 }, // Falla mínimo 5.0
  },
};
const resGTIFailSim = calculateSubjectGrade(gtiSubject, stateGTIFailSim, 'ordinaria');
assert(resGTIFailSim.isCappedByPenalty === true, 'GTI must be capped by penalty on failed simulation');
assert(resGTIFailSim.finalScore === 4.5, `Expected penalty cap 4.5, got ${resGTIFailSim.finalScore}`);
assert(resGTIFailSim.penaltyCapValue === 4.5, 'Penalty cap value must be 4.5');

// Scenario 3: Falla de asistencia a laboratorios (< 80%)
const stateGTIFailAtt: UserSubjectState = {
  ...stateGTI,
  prerequisitesState: { asistencia_lab_gti: 70 }, // < 80%
};
const resGTIFailAtt = calculateSubjectGrade(gtiSubject, stateGTIFailAtt, 'ordinaria');
assert(resGTIFailAtt.isCappedByPenalty === true, 'GTI must be capped when attendance < 80%');
assert(resGTIFailAtt.finalScore === 4.5, `Expected 4.5 due to attendance cap, got ${resGTIFailAtt.finalScore}`);

// Scenario 4: Carryover a extraordinaria del trabajo en equipo si >= 5.0
const carriedGTI = applyCarryOverFromOrdinaria(gtiSubject, stateGTI);
assert(carriedGTI['trab_equipo_ext']?.score === 7.0, `Expected carried trab_equipo 7.0, got ${carriedGTI['trab_equipo_ext']?.score}`);

console.log('--- Testing Engine on Inteligencia de Negocio ---');
const inSubject = subjectsCatalog.find((s) => s.id === 'inteligencia-negocio')!;
assert(!!inSubject, 'Inteligencia de Negocio found');

// Scenario 1: Exención de examen de teoría porque Trabajos de Teoría >= 7.0 (ej. 8.0)
// Prácticas continua = 7.0 (40%), final = 8.0 (60%) -> PRAC = 0.4*7 + 0.6*8 = 7.6
// TEO = 8.0 (exento)
// Final = 0.50 * 7.6 + 0.50 * 8.0 = 3.8 + 4.0 = 7.80
const stateINExempt: UserSubjectState = {
  subjectId: 'inteligencia-negocio',
  activeConvocatoria: 'ordinaria',
  prerequisitesState: {},
  scores: {
    prac_continua: { score: 7.0 },
    prac_final: { score: 8.0 },
    trabajos_teoria: { score: 8.0 },
    examen_teoria: { score: null }, // Exento
  },
  targetScore: 5.0,
};

const resINExempt = calculateSubjectGrade(inSubject, stateINExempt, 'ordinaria');
assert(resINExempt.blocks['teoria_in']?.score === 8.0, `Expected exempt theory 8.0, got ${resINExempt.blocks['teoria_in']?.score}`);
assert(resINExempt.blocks['practica_in']?.score === 7.6, `Expected practice 7.6, got ${resINExempt.blocks['practica_in']?.score}`);
assert(resINExempt.finalScore === 7.8, `Expected final 7.80, got ${resINExempt.finalScore}`);
assert(resINExempt.isPassed === true, 'IN should be passed with theory exemption');

// Scenario 2: Sin exención (Trabajos = 5.0 < 7.0) con Examen de Teoría = 7.0
// TEO = 0.70 * 5.0 + 0.30 * 7.0 = 3.5 + 2.1 = 5.60
// PRAC = 6.0 (continua 6.0, final 6.0)
// Final = 0.50 * 6.0 + 0.50 * 5.60 = 3.0 + 2.8 = 5.80
const stateINWithExam: UserSubjectState = {
  subjectId: 'inteligencia-negocio',
  activeConvocatoria: 'ordinaria',
  prerequisitesState: {},
  scores: {
    prac_continua: { score: 6.0 },
    prac_final: { score: 6.0 },
    trabajos_teoria: { score: 5.0 },
    examen_teoria: { score: 7.0 },
  },
  targetScore: 5.0,
};

const resINWithExam = calculateSubjectGrade(inSubject, stateINWithExam, 'ordinaria');
assert(resINWithExam.blocks['teoria_in']?.score === 5.6, `Expected theory 5.60, got ${resINWithExam.blocks['teoria_in']?.score}`);
assert(resINWithExam.finalScore === 5.8, `Expected final 5.80, got ${resINWithExam.finalScore}`);
assert(resINWithExam.isPassed === true, 'IN should be passed with theory exam');

// Scenario 3: Falla de mínimo por separado (Prácticas = 4.0 < 5.0, Teoría = 8.0)
// Media sin penalizar = 0.5*4 + 0.5*8 = 6.0.
// Pero como PRAC < 5.0, debe estar topada a 4.0
const stateINFailPrac: UserSubjectState = {
  subjectId: 'inteligencia-negocio',
  activeConvocatoria: 'ordinaria',
  prerequisitesState: {},
  scores: {
    prac_continua: { score: 4.0 },
    prac_final: { score: 4.0 }, // Media PRAC = 4.0 < 5.0
    trabajos_teoria: { score: 8.0 },
  },
  targetScore: 5.0,
};
const resINFail = calculateSubjectGrade(inSubject, stateINFailPrac, 'ordinaria');
assert(resINFail.unpenalizedScore === 6.0, `Expected unpenalized 6.0, got ${resINFail.unpenalizedScore}`);
assert(resINFail.finalScore === 4.0, `Expected capped 4.0, got ${resINFail.finalScore}`);
assert(resINFail.isCappedByPenalty === true, 'IN must be capped when practice fails minimum');

// Scenario 4: Carryover a extraordinaria de partes aprobadas (>= 5.0) por separado
const carriedIN = applyCarryOverFromOrdinaria(inSubject, stateINExempt);
assert(carriedIN['prac_ext']?.score === 7.6, `Expected carried prac_ext 7.6, got ${carriedIN['prac_ext']?.score}`);
assert(carriedIN['teo_ext']?.score === 8.0, `Expected carried teo_ext 8.0, got ${carriedIN['teo_ext']?.score}`);

console.log('All engine unit tests passed successfully.');
