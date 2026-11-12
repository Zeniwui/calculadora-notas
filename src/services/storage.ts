import { UserSubjectState } from '../types/subject';
import { subjectsCatalog } from '../data/index';

const STORAGE_PREFIX = 'calc_notas_univ_v1_';

export function getDefaultSubjectState(subjectId: string): UserSubjectState {
  const subject = subjectsCatalog.find((s) => s.id === subjectId);
  const prereqsState: Record<string, boolean | number> = {};

  if (subject) {
    for (const p of subject.convocatorias.ordinaria.prerequisites) {
      prereqsState[p.id] = p.type === 'percentage' ? (p.requiredPercentage ?? 80) : true;
    }
  }

  return {
    subjectId,
    activeConvocatoria: 'ordinaria',
    prerequisitesState: prereqsState,
    scores: {},
    targetScore: 5.0,
  };
}

export function loadSubjectState(subjectId: string): UserSubjectState {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${subjectId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...getDefaultSubjectState(subjectId),
        ...parsed,
      };
    }
  } catch (e) {
    console.warn(`Error loading state for ${subjectId}:`, e);
  }
  return getDefaultSubjectState(subjectId);
}

export function saveSubjectState(subjectId: string, state: UserSubjectState): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${subjectId}`, JSON.stringify(state));
  } catch (e) {
    console.warn(`Error saving state for ${subjectId}:`, e);
  }
}

export function resetSubjectState(subjectId: string): UserSubjectState {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${subjectId}`);
  } catch (e) {
    console.warn(`Error resetting state for ${subjectId}:`, e);
  }
  return getDefaultSubjectState(subjectId);
}

export function exportAllData(): string {
  const allData: Record<string, UserSubjectState> = {};
  for (const s of subjectsCatalog) {
    allData[s.id] = loadSubjectState(s.id);
  }
  return JSON.stringify(allData, null, 2);
}

export function importAllData(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed !== 'object' || parsed === null) return false;

    for (const [subjectId, state] of Object.entries(parsed)) {
      if (typeof subjectId === 'string' && typeof state === 'object') {
        localStorage.setItem(`${STORAGE_PREFIX}${subjectId}`, JSON.stringify(state));
      }
    }
    return true;
  } catch (e) {
    console.error('Failed to import JSON data:', e);
    return false;
  }
}
