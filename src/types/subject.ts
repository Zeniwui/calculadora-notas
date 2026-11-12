export type PrerequisiteType = 'boolean' | 'percentage';

export interface Prerequisite {
  id: string;
  name: string;
  description: string;
  type: PrerequisiteType;
  requiredPercentage?: number;
  failureMessage: string;
}

export interface AssessmentItem {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  weight: number; // e.g., 0.3333 or 1 (relative weight in parent block)
  minScore?: number; // e.g., 5.0 (if required)
  maxScore?: number; // default 10.0
  isGroup?: boolean;
  canCarryOver?: boolean; // if true, can be carried over to extraordinary call when >= 5.0
  contingentOnPrerequisite?: string; // prerequisite ID
}

export interface SubBlock {
  id: string;
  name: string;
  shortName: string;
  weight: number;
  minScore?: number;
  formulaText: string;
  items: AssessmentItem[];
}

export interface EvaluationBlock {
  id: string;
  name: string;
  shortName: string;
  weight: number; // e.g. 0.60 (Teoría 60%), 0.40 (Práctica 40%)
  minScore?: number; // e.g. 5.0 required in block
  formulaText: string;
  items: AssessmentItem[];
  subBlocks?: SubBlock[];
}

export interface ConvocatoriaRule {
  id: 'ordinaria' | 'extraordinaria';
  name: string;
  description: string;
  prerequisites: Prerequisite[];
  blocks: EvaluationBlock[];
  finalFormulaText: string;
  failPenaltyCap: number; // typically 4.0
  passingScore: number; // 5.0
  canCarryOverFromOrdinaria?: boolean;
  carryOverRulesExplanation?: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  degree?: string;
  academicYear: string;
  sourcePdf: string;
  description: string;
  convocatorias: {
    ordinaria: ConvocatoriaRule;
    extraordinaria: ConvocatoriaRule;
  };
}

export interface ItemSimulationState {
  score: number | null; // null means not yet taken/graded
  isLocked?: boolean; // locked for inverse simulation
  isCarriedOver?: boolean; // carried over from previous call
}

export interface UserSubjectState {
  subjectId: string;
  activeConvocatoria: 'ordinaria' | 'extraordinaria';
  prerequisitesState: Record<string, boolean | number>;
  scores: Record<string, ItemSimulationState>; // key is item id
  targetScore: number; // default 5.0
}

export interface MinimumCheckResult {
  targetId: string;
  targetName: string;
  requiredMin: number;
  currentScore: number | null;
  status: 'passed' | 'failed' | 'pending';
  message: string;
}

export interface PenaltyDiagnosis {
  targetId: string;
  targetName: string;
  currentScore: number | null;
  requiredMin: number | null;
  deficit: number | null;
  unpenalizedScore: number;
  formattedMessage: string;
}

export interface BlockCalculationResult {
  id: string;
  name: string;
  score: number | null;
  rawScore: number | null;
  isComplete: boolean;
  subBlocks?: Record<string, { id: string; name: string; score: number | null }>;
  minimums: MinimumCheckResult[];
}

export interface CalculationResult {
  subjectId: string;
  convocatoria: 'ordinaria' | 'extraordinaria';
  finalScore: number | null; // calculated final grade (capped if penalties apply)
  unpenalizedScore: number | null; // formula result before penalty
  isCappedByPenalty: boolean;
  penaltyCapValue: number;
  penaltyReasons: string[];
  penaltyDiagnostics: PenaltyDiagnosis[];
  isPassed: boolean;
  isComplete: boolean; // all items have grades
  blocks: Record<string, BlockCalculationResult>;
  allMinimums: MinimumCheckResult[];
  prerequisitesMet: boolean;
  prerequisiteFailures: string[];
  maxAchievableScore: number; // if user scores 10 in all pending
}

export interface InverseSimulationResult {
  targetScore: number;
  isAchievable: boolean;
  impossibleReason?: string;
  maxAchievableScore: number;
  requiredAverageOnPending: number;
  pendingItemCount: number;
  suggestedScores: Record<string, number>; // item id -> suggested score
}

export interface ExplanationStep {
  title: string;
  formula: string;
  substituted: string;
  resultText: string;
  note?: string;
  type: 'formula' | 'condition' | 'warning' | 'success';
}
