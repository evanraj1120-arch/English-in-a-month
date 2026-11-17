import { useEffect, useState } from 'react';

const STORAGE_KEY = 'honors-english-practice-progress-v1';

export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type ReviewStatus = 'not_needed' | 'needs_review' | 'self_checked' | 'recalled';
export type AttemptResult = 'correct' | 'incorrect' | 'open_response';

export interface PracticeAttempt {
  id: string;
  sessionId: string;
  itemId: string;
  itemTitle: string;
  itemType: 'question' | 'retrieval';
  category: string;
  topics: string[];
  novels: string[];
  result: AttemptResult;
  reviewStatus: ReviewStatus;
  answeredAt: string;
  elapsedSeconds: number;
  confidence?: ConfidenceLevel;
  selectedChoices?: string[];
  modelRevealed?: boolean;
}

export interface ProgressProfile {
  name: string;
  attempts: PracticeAttempt[];
}

interface ProgressDatabase {
  version: 1;
  activeProfileKey: string;
  profiles: Record<string, ProgressProfile>;
}

export interface PracticeProgressState {
  ready: boolean;
  profile: ProgressProfile | null;
  profileNames: string[];
  storageError: string | null;
  canResetStorage: boolean;
  switchProfile: (name: string) => void;
  recordAttempts: (attempts: PracticeAttempt[]) => void;
  updateAttempt: (id: string, update: Partial<PracticeAttempt>) => void;
  clearCurrentProfile: () => void;
  resetUnreadableProgress: () => void;
}

function profileKey(name: string): string {
  return `profile:${encodeURIComponent(name.trim().normalize('NFKC').toLowerCase())}`;
}

function isAttempt(value: unknown): value is PracticeAttempt {
  if (typeof value !== 'object' || value === null) return false;
  const attempt = value as Record<string, unknown>;
  const confidenceValid = attempt.confidence === undefined || ['low', 'medium', 'high'].includes(String(attempt.confidence));
  const selectedChoicesValid = attempt.selectedChoices === undefined
    || (Array.isArray(attempt.selectedChoices) && attempt.selectedChoices.every((choice) => typeof choice === 'string'));
  return typeof attempt.id === 'string'
    && typeof attempt.sessionId === 'string'
    && typeof attempt.itemId === 'string'
    && typeof attempt.itemTitle === 'string'
    && ['question', 'retrieval'].includes(String(attempt.itemType))
    && typeof attempt.category === 'string'
    && Array.isArray(attempt.topics) && attempt.topics.every((item) => typeof item === 'string')
    && Array.isArray(attempt.novels) && attempt.novels.every((item) => typeof item === 'string')
    && ['correct', 'incorrect', 'open_response'].includes(String(attempt.result))
    && ['not_needed', 'needs_review', 'self_checked', 'recalled'].includes(String(attempt.reviewStatus))
    && typeof attempt.answeredAt === 'string' && !Number.isNaN(Date.parse(attempt.answeredAt))
    && Number.isFinite(attempt.elapsedSeconds) && Number(attempt.elapsedSeconds) >= 0
    && confidenceValid && selectedChoicesValid
    && (attempt.modelRevealed === undefined || typeof attempt.modelRevealed === 'boolean');
}

function parseDatabase(value: unknown): ProgressDatabase {
  if (typeof value !== 'object' || value === null) throw new Error('Saved progress is not a valid data object.');
  const database = value as Record<string, unknown>;
  if (database.version !== 1 || typeof database.activeProfileKey !== 'string'
    || typeof database.profiles !== 'object' || database.profiles === null || Array.isArray(database.profiles)) {
    throw new Error('Saved progress uses an unsupported or invalid format.');
  }
  const profiles: Record<string, ProgressProfile> = {};
  for (const [key, rawProfile] of Object.entries(database.profiles)) {
    if (typeof rawProfile !== 'object' || rawProfile === null) throw new Error('A saved student profile is invalid.');
    const profile = rawProfile as Record<string, unknown>;
    if (typeof profile.name !== 'string' || profile.name.trim() === '' || profile.name.length > 32
      || key !== profileKey(profile.name) || !Array.isArray(profile.attempts) || !profile.attempts.every(isAttempt)) {
      throw new Error('A saved student profile contains invalid practice history.');
    }
    profiles[key] = { name: profile.name, attempts: profile.attempts };
  }
  if (!profiles[database.activeProfileKey]) throw new Error('The saved active student profile is missing.');
  return { version: 1, activeProfileKey: database.activeProfileKey, profiles };
}

function createInitialDatabase(): ProgressDatabase {
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  const name = `Student ${suffix}`;
  const key = profileKey(name);
  return { version: 1, activeProfileKey: key, profiles: { [key]: { name, attempts: [] } } };
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'Browser storage reported an unknown error.';
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function usePracticeProgress(): PracticeProgressState {
  const [database, setDatabase] = useState<ProgressDatabase | null>(null);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [storageUnreadable, setStorageUnreadable] = useState(false);

  useEffect(() => {
    let initial: ProgressDatabase;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      initial = saved === null ? createInitialDatabase() : parseDatabase(JSON.parse(saved) as unknown);
      setDatabase(initial);
      if (saved === null) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch (error) {
      initial = createInitialDatabase();
      setDatabase(initial);
      setStorageError(`Saved progress could not be loaded or stored: ${errorText(error)} Your current practice will remain in memory until storage is successfully reset.`);
      setStorageUnreadable(true);
    } finally {
      setReady(true);
    }
  }, []);

  const persist = (next: ProgressDatabase) => {
    setDatabase(next);
    if (storageUnreadable) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStorageError(null);
    } catch (error) {
      setStorageError(`Progress could not be saved to this browser: ${errorText(error)} Changes remain only in memory for this page.`);
    }
  };

  const switchProfile = (name: string) => {
    if (!database) return;
    const trimmed = name.trim().slice(0, 32);
    if (!trimmed) return;
    const key = profileKey(trimmed);
    const next: ProgressDatabase = {
      ...database,
      activeProfileKey: key,
      profiles: database.profiles[key]
        ? database.profiles
        : { ...database.profiles, [key]: { name: trimmed, attempts: [] } },
    };
    persist(next);
  };

  const recordAttempts = (attempts: PracticeAttempt[]) => {
    if (!database || attempts.length === 0) return;
    const current = database.profiles[database.activeProfileKey];
    persist({
      ...database,
      profiles: {
        ...database.profiles,
        [database.activeProfileKey]: { ...current, attempts: [...current.attempts, ...attempts] },
      },
    });
  };

  const updateAttempt = (id: string, update: Partial<PracticeAttempt>) => {
    if (!database) return;
    const current = database.profiles[database.activeProfileKey];
    const attempts = current.attempts.map((attempt) => attempt.id === id ? { ...attempt, ...update } : attempt);
    persist({
      ...database,
      profiles: {
        ...database.profiles,
        [database.activeProfileKey]: { ...current, attempts },
      },
    });
  };

  const clearCurrentProfile = () => {
    if (!database) return;
    const current = database.profiles[database.activeProfileKey];
    persist({
      ...database,
      profiles: {
        ...database.profiles,
        [database.activeProfileKey]: { ...current, attempts: [] },
      },
    });
  };

  const resetUnreadableProgress = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      const initial = createInitialDatabase();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      setDatabase(initial);
      setStorageError(null);
      setStorageUnreadable(false);
    } catch (error) {
      setStorageError(`Progress storage could not be reset: ${errorText(error)}.`);
    }
  };

  const profile = database?.profiles[database.activeProfileKey] ?? null;
  return {
    ready,
    profile,
    profileNames: Object.values(database?.profiles ?? {}).map(({ name }) => name).sort(),
    storageError,
    canResetStorage: storageUnreadable,
    switchProfile,
    recordAttempts,
    updateAttempt,
    clearCurrentProfile,
    resetUnreadableProgress,
  };
}

export function createPracticeAttempt(
  attempt: Omit<PracticeAttempt, 'id' | 'answeredAt'>,
  answeredAt = new Date().toISOString(),
): PracticeAttempt {
  return { ...attempt, id: newId(), answeredAt };
}
