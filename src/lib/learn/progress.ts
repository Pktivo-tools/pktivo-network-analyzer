import { curriculum } from './curriculum';

const STORAGE_KEY = 'pktivo.learn.progress.v1';
const moduleIds = new Set(curriculum.flatMap(level => level.modules.map(module => module.id)));
type ProgressStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function readLearnProgress(storage: ProgressStorage): Set<string> {
  try {
    const saved: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');
    if (!Array.isArray(saved)) return new Set();
    return new Set(saved.filter((id): id is string => typeof id === 'string' && moduleIds.has(id)));
  } catch {
    return new Set();
  }
}

export function saveLearnProgress(storage: ProgressStorage, completed: Set<string>): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify([...completed].filter(id => moduleIds.has(id))));
    return true;
  } catch {
    return false;
  }
}