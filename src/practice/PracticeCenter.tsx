import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ContentManifest, StudyClaim } from '../content/types';
import type { ExamSectionId, Phase45Question, QuestionChoice } from '../content/phase45-types';
import { buildRetrievalCards, novelDisplayNames, type RetrievalCard } from './retrieval';
import { ProgressProfileControls } from './ProgressProfileControls';
import {
  createPracticeAttempt,
  type ConfidenceLevel,
  type PracticeAttempt,
  type PracticeProgressState,
  type ReviewStatus,
} from './progress';

interface DisplayChoice extends QuestionChoice {
  answerKeyLabel: string;
}

type SessionEntry =
  | { type: 'question'; question: Phase45Question; displayChoices?: DisplayChoice[] }
  | { type: 'retrieval'; card: RetrievalCard };

interface Annotation {
  evidence: string;
  technique: string;
  function: string;
}

interface ResponseState {
  choices: string[];
  text: string;
  annotations: Annotation[];
  confidence?: ConfidenceLevel;
  revealed: boolean;
}

interface PracticeSession {
  id: string;
  entries: SessionEntry[];
  startedAt: number;
  expiresAt: number | null;
}

type PracticeCategory = ExamSectionId | 'all' | 'novel-recall' | 'themes-symbols' | 'review';

const categoryLabels: Record<PracticeCategory, string> = {
  all: 'Mixed practice',
  'novel-recall': 'Novel plot and character recall',
  'themes-symbols': 'Themes and symbols',
  review: 'Review items needing another look',
  'novel-comparison': 'Novel comparison',
  'argumentative-writing': 'Argumentative writing',
  'poem-analysis': 'Poem analysis',
  'passage-annotation': 'Passage annotation',
  'literary-terms': 'Literary terminology',
  'poetry-multiple-choice': 'Poetry multiple choice',
};

const objectiveFormats = new Set(['single_answer_multiple_choice', 'multiple_answer']);
const answerBasisLabels: Record<Phase45Question['answerKey']['basis'], string> = {
  teacher_material: 'Teacher material',
  student_work: 'Student work',
  phase4_analysis: 'Phase 4 analysis',
  literary_evidence: 'Literary evidence',
  original_material: 'Original practice material',
  mixed: 'Mixed source basis',
};

function entryId(entry: SessionEntry): string {
  return entry.type === 'question' ? entry.question.id : entry.card.id;
}

function entryLabel(entry: SessionEntry): string {
  return entry.type === 'question'
    ? entry.question.prompt
    : `${novelDisplayNames[entry.card.novel]} · ${entry.card.kind}`;
}

function entryCategory(entry: SessionEntry): string {
  return entry.type === 'question' ? entry.question.section : entry.card.category;
}

function entryTopics(entry: SessionEntry): string[] {
  return entry.type === 'question'
    ? entry.question.topics
    : [entry.card.kind, novelDisplayNames[entry.card.novel]];
}

function entryNovels(entry: SessionEntry): string[] {
  return entry.type === 'question' ? entry.question.novels : [entry.card.novel];
}

function shuffle<T>(values: T[]): T[] {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isObjectiveQuestion(question: Phase45Question): boolean {
  return objectiveFormats.has(question.format);
}

function isCorrect(question: Phase45Question, selected: string[]): boolean {
  const correct = question.answerKey.correctChoices ?? [];
  return selected.length === correct.length && correct.every((choice) => selected.includes(choice));
}

function makeDefaultResponse(): ResponseState {
  return { choices: [], text: '', annotations: [{ evidence: '', technique: '', function: '' }], revealed: false };
}

function latestReviewIds(attempts: PracticeAttempt[]): Set<string> {
  const latest = new Map<string, PracticeAttempt>();
  for (const attempt of attempts) {
    const previous = latest.get(attempt.itemId);
    if (!previous || previous.answeredAt <= attempt.answeredAt) latest.set(attempt.itemId, attempt);
  }
  return new Set([...latest.values()]
    .filter((attempt) => attempt.result === 'incorrect' || attempt.reviewStatus === 'needs_review')
    .map((attempt) => attempt.itemId));
}

export function PracticeCenter({ manifest, progress }: {
  manifest: ContentManifest;
  progress: PracticeProgressState;
}) {
  const retrievalCards = useMemo(() => buildRetrievalCards(manifest.phase4Content.novelGuides), [manifest.phase4Content.novelGuides]);
  const [category, setCategory] = useState<PracticeCategory>('all');
  const [questionCount, setQuestionCount] = useState('10');
  const [timed, setTimed] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState('15');
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [mode, setMode] = useState<'setup' | 'active' | 'results'>('setup');
  const [reviewing, setReviewing] = useState(false);
  const [responses, setResponses] = useState<Record<string, ResponseState>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [finishedAttempts, setFinishedAttempts] = useState<PracticeAttempt[]>([]);
  const finishStarted = useRef(false);

  const reviewIds = useMemo(
    () => latestReviewIds(progress.profile?.attempts ?? []),
    [progress.profile?.attempts],
  );
  const allEntries: SessionEntry[] = [
    ...manifest.phase45Content.questions.map((question) => ({ type: 'question' as const, question })),
    ...retrievalCards.map((card) => ({ type: 'retrieval' as const, card })),
  ];
  const availableEntries = allEntries.filter((entry) => {
    if (category === 'all') return true;
    if (category === 'novel-recall' || category === 'themes-symbols') {
      return entry.type === 'retrieval' && entry.card.category === category;
    }
    if (category === 'review') return reviewIds.has(entryId(entry));
    return entry.type === 'question' && entry.question.section === category;
  });
  const currentEntry = session?.entries[activeIndex];
  const currentResponse = currentEntry ? responses[entryId(currentEntry)] ?? makeDefaultResponse() : null;

  useEffect(() => {
    if (mode !== 'active' || !session?.expiresAt) return undefined;
    const updateRemaining = () => {
      const seconds = Math.max(0, Math.ceil((session.expiresAt! - Date.now()) / 1000));
      setRemainingSeconds(seconds);
    };
    updateRemaining();
    const timerId = window.setInterval(updateRemaining, 250);
    return () => window.clearInterval(timerId);
  }, [mode, session]);

  const finishSession = useCallback(() => {
    if (!session || mode !== 'active' || finishStarted.current) return;
    finishStarted.current = true;
    const finishedAt = Date.now();
    const elapsedSeconds = Math.max(0, Math.round((finishedAt - session.startedAt) / 1000));
    const attempts = session.entries.map((entry) => {
      const id = entryId(entry);
      const response = responses[id] ?? makeDefaultResponse();
      const objective = entry.type === 'question' && isObjectiveQuestion(entry.question);
      const correct = objective && isCorrect(entry.question, response.choices);
      const selectedDisplayChoices = objective && entry.type === 'question'
        ? response.choices.map((label) => entry.displayChoices?.find((choice) => choice.answerKeyLabel === label)?.label ?? label)
        : undefined;
      return createPracticeAttempt({
        sessionId: session.id,
        itemId: id,
        itemTitle: entryLabel(entry),
        itemType: entry.type,
        category: entryCategory(entry),
        topics: entryTopics(entry),
        novels: entryNovels(entry),
        result: objective ? (correct ? 'correct' : 'incorrect') : 'open_response',
        reviewStatus: objective && correct ? 'not_needed' : 'needs_review',
        elapsedSeconds,
        confidence: response.confidence,
        selectedChoices: selectedDisplayChoices,
        modelRevealed: objective ? undefined : response.revealed,
      });
    });
    progress.recordAttempts(attempts);
    setFinishedAttempts(attempts);
    setRemainingSeconds(null);
    setMode('results');
  }, [mode, progress, responses, session]);

  useEffect(() => {
    if (mode === 'active' && remainingSeconds === 0) finishSession();
  }, [finishSession, mode, remainingSeconds]);

  const startSession = () => {
    if (!progress.profile) return;
    const count = questionCount === 'all' ? availableEntries.length : Number(questionCount);
    if (availableEntries.length === 0) {
      setStartError(category === 'review'
        ? 'There are no items currently marked for review. Try a practice category first.'
        : 'No verified practice items are available in this category.');
      return;
    }
    if (timed && (!Number.isInteger(Number(durationMinutes)) || Number(durationMinutes) < 1 || Number(durationMinutes) > 180)) {
      setStartError('Choose a practice duration from 1 to 180 minutes, or turn the timer off.');
      return;
    }
    const entries = shuffle(availableEntries).slice(0, Math.max(1, count)).map((entry) => {
      if (entry.type !== 'question' || !entry.question.choices) return entry;
      return {
        ...entry,
        displayChoices: shuffle(entry.question.choices).map((choice, index) => ({
          ...choice,
          answerKeyLabel: choice.label,
          label: String.fromCharCode(65 + index),
        })),
      };
    });
    const startedAt = Date.now();
    const durationSeconds = timed ? Number(durationMinutes) * 60 : null;
    setSession({
      id: createId(),
      entries,
      startedAt,
      expiresAt: durationSeconds === null ? null : startedAt + durationSeconds * 1000,
    });
    setResponses(Object.fromEntries(entries.map((entry) => [entryId(entry), makeDefaultResponse()])));
    setActiveIndex(0);
    setReviewing(false);
    setRemainingSeconds(durationSeconds);
    finishStarted.current = false;
    setStartError(null);
    setMode('active');
  };

  const updateResponse = (id: string, update: Partial<ResponseState>) => {
    setResponses((current) => ({ ...current, [id]: { ...(current[id] ?? makeDefaultResponse()), ...update } }));
  };

  const updateReview = (attempt: PracticeAttempt, reviewStatus: ReviewStatus) => {
    progress.updateAttempt(attempt.id, { reviewStatus });
    setFinishedAttempts((current) => current.map((item) => item.id === attempt.id ? { ...item, reviewStatus } : item));
  };

  const updateReveal = (attempt: PracticeAttempt) => {
    progress.updateAttempt(attempt.id, { modelRevealed: true });
    setFinishedAttempts((current) => current.map((item) => item.id === attempt.id ? { ...item, modelRevealed: true } : item));
  };

  if (!progress.ready) {
    return <p className="loading" role="status">Loading your local practice profile…</p>;
  }

  return (
    <>
      <header className="content-intro">
        <p className="eyebrow">Retrieval practice · feedback · timed application</p>
        <h1>Practice and review</h1>
        <p>Questions labeled original practice are AI-generated supplemental material, not teacher-authored or teacher-approved. Automated validation checks structure and source links, not every literary judgment. Recall cards are derived from source-linked study claims. Open responses are not graded: compare them with the prepared model and self-check the criteria.</p>
      </header>

      <ProgressProfileControls progress={progress} disabled={mode !== 'setup'} />

      {mode === 'setup' && (
        <section className="study-panel practice-setup" aria-labelledby="practice-setup-heading">
          <div className="study-title-row">
            <div><p className="eyebrow">Build a practice session</p><h2 id="practice-setup-heading">Choose what to work on</h2></div>
            <span className="status-chip">{availableEntries.length} available</span>
          </div>
          <div className="practice-controls">
            <label>
              Practice category
              <select value={category} onChange={(event) => setCategory(event.target.value as PracticeCategory)}>
                <option value="all">{categoryLabels.all}</option>
                <option value="novel-recall">{categoryLabels['novel-recall']}</option>
                <option value="themes-symbols">{categoryLabels['themes-symbols']}</option>
                {manifest.phase45Content.sections.map((item) => (
                  <option value={item.id} key={item.id}>{categoryLabels[item.id]}</option>
                ))}
                <option value="review">{categoryLabels.review}</option>
              </select>
            </label>
            <label>
              Questions per session
              <select value={questionCount} onChange={(event) => setQuestionCount(event.target.value)}>
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="all">All available</option>
              </select>
            </label>
            <label className="check-control">
              <input type="checkbox" checked={timed} onChange={(event) => setTimed(event.target.checked)} />
              Use a practice timer
            </label>
            {timed && (
              <label>
                Duration in minutes (1–180)
                <input type="number" min="1" max="180" step="1" value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} />
              </label>
            )}
          </div>
          {category === 'review' && (
            <p className="practice-note">The review queue uses the most recent attempt for each item. Incorrect objective answers and items you marked “needs review” are included; a previous mistake remains in history after a later attempt.</p>
          )}
          <div className="practice-actions">
            <button type="button" className="primary-button" onClick={startSession}>Start practice</button>
            <span>Timer settings are for practice only; no official exam duration is implied.</span>
          </div>
          {startError && <p className="inline-error" role="alert">{startError}</p>}
          <p className="coverage-warning">
            Catcher in the Rye recall and comparison questions are intentionally omitted until the promised class-material update. The local PDF is not used to fill that gap. Novel recall cards cover only source-supported claims; their guide coverage notes remain attached.
          </p>
        </section>
      )}

      {mode === 'active' && session && currentEntry && currentResponse && (
        <section className="study-panel active-practice" aria-labelledby="active-question-heading">
          <div className="practice-session-top">
            <div>
              <p className="eyebrow">{categoryLabels[entryCategory(currentEntry) as PracticeCategory] ?? entryCategory(currentEntry)} · Question {activeIndex + 1} of {session.entries.length}</p>
              <h2 id="active-question-heading">{currentEntry.type === 'question' ? currentEntry.question.material?.title ?? categoryLabels[currentEntry.question.section] : novelDisplayNames[currentEntry.card.novel]}</h2>
            </div>
            {remainingSeconds !== null && <div className="timer-readout" role="timer" aria-live="off">{formatTime(remainingSeconds)} remaining</div>}
          </div>

          {reviewing ? (
            <ReviewBeforeSubmit
              entries={session.entries}
              responses={responses}
              onEdit={(index) => { setActiveIndex(index); setReviewing(false); }}
              onContinue={() => setReviewing(false)}
              onSubmit={finishSession}
            />
          ) : (
            <>
              <nav className="question-navigator" aria-label="Session questions">
                {session.entries.map((entry, index) => {
                  const response = responses[entryId(entry)] ?? makeDefaultResponse();
                  const answered = response.choices.length > 0 || response.text.trim() !== ''
                    || response.revealed
                    || response.annotations.some((annotation) => annotation.evidence || annotation.technique || annotation.function);
                  return (
                    <button type="button" key={entryId(entry)} className={index === activeIndex ? 'current' : ''} aria-current={index === activeIndex ? 'step' : undefined}
                      aria-label={`Question ${index + 1}${answered ? ', response started' : ', not answered'}`} onClick={() => setActiveIndex(index)}>
                      {index + 1}{answered && <span aria-hidden="true">•</span>}
                    </button>
                  );
                })}
              </nav>

              {currentEntry.type === 'question' ? (
                <QuestionExercise
                  question={currentEntry.question}
                  displayChoices={currentEntry.displayChoices}
                  response={currentResponse}
                  update={(update) => updateResponse(currentEntry.question.id, update)}
                  records={manifest.records}
                />
              ) : (
                <RetrievalExercise
                  card={currentEntry.card}
                  response={currentResponse}
                  update={(update) => updateResponse(currentEntry.card.id, update)}
                  evidence={manifest.phase4Content.evidenceRepository}
                  records={manifest.records}
                />
              )}

              <div className="confidence-control">
                <label htmlFor="confidence-rating">Confidence (optional)</label>
                <select id="confidence-rating" value={currentResponse.confidence ?? ''} onChange={(event) => updateResponse(entryId(currentEntry), { confidence: event.target.value ? event.target.value as ConfidenceLevel : undefined })}>
                  <option value="">Not recorded</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                </select>
              </div>
              <div className="practice-actions session-actions">
                <button type="button" className="secondary-button" disabled={activeIndex === 0} onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}>Previous</button>
                {activeIndex < session.entries.length - 1
                  ? <button type="button" className="secondary-button" onClick={() => setActiveIndex((index) => Math.min(session.entries.length - 1, index + 1))}>Next</button>
                  : <span className="last-question-label">You are on the final question.</span>}
                <button type="button" className="primary-button" onClick={() => setReviewing(true)}>Review session</button>
              </div>
              <p className="practice-note">You can navigate between questions before submission. An unanswered objective question is recorded as incorrect; open responses are saved as ungraded self-check attempts.</p>
            </>
          )}
        </section>
      )}

      {mode === 'results' && session && (
        <SessionResults
          session={session}
          attempts={finishedAttempts}
          responses={responses}
          manifest={manifest}
          reveal={(attempt) => updateReveal(attempt)}
          setReview={(attempt, status) => updateReview(attempt, status)}
          returnToSetup={() => { setSession(null); setMode('setup'); setFinishedAttempts([]); }}
        />
      )}
    </>
  );
}

function QuestionExercise({ question, displayChoices, response, update, records }: {
  question: Phase45Question;
  displayChoices?: DisplayChoice[];
  response: ResponseState;
  update: (update: Partial<ResponseState>) => void;
  records: ContentManifest['records'];
}) {
  const choices = displayChoices ?? (question.choices ?? []).map((choice) => ({ ...choice, answerKeyLabel: choice.label }));
  return (
    <div className="exercise-body">
      <p className="question-prompt">{question.prompt}</p>
      {question.material && (
        <figure className="practice-material">
          <figcaption>{question.material.title} · {question.material.attribution}</figcaption>
          <blockquote>{question.material.text}</blockquote>
        </figure>
      )}
      {isObjectiveQuestion(question) && question.choices && (
        <fieldset className="choice-list">
          <legend>{question.format === 'multiple_answer' ? 'Select all that apply.' : 'Choose one answer.'}</legend>
          {choices.map((choice) => {
            const checked = response.choices.includes(choice.answerKeyLabel);
            return (
              <label className="choice-option" key={choice.answerKeyLabel}>
                <input
                  type={question.format === 'multiple_answer' ? 'checkbox' : 'radio'}
                  name={`choice-${question.id}`}
                  checked={checked}
                  onChange={() => {
                    if (question.format === 'multiple_answer') {
                      update({ choices: checked ? response.choices.filter((label) => label !== choice.answerKeyLabel) : [...response.choices, choice.answerKeyLabel] });
                    } else update({ choices: [choice.answerKeyLabel] });
                  }}
                />
                <span><strong>{choice.label}.</strong> {choice.text}</span>
              </label>
            );
          })}
        </fieldset>
      )}
      {!isObjectiveQuestion(question) && question.format === 'passage_annotation' && (
        <AnnotationEditor response={response} update={update} />
      )}
      {!isObjectiveQuestion(question) && question.format !== 'passage_annotation' && (
        <label className="response-field">
          Your response (not automatically graded)
          <textarea value={response.text} onChange={(event) => update({ text: event.target.value })} rows={6} placeholder="Write your response, then compare it with the prepared model after submission." />
        </label>
      )}
      {question.validation.reviewSummary && <p className="validation-note"><strong>Practice provenance:</strong> {question.origin.replaceAll('_', ' ')} · {question.validation.reviewSummary}</p>}
      <details className="source-details">
        <summary>Source basis (without answer details)</summary>
        <p>{question.answerKey.sourceNote}</p>
        <SourceCitationList sourceRecordIds={question.sourceRecordIds} documents={question.sourceDocuments} records={records} />
      </details>
    </div>
  );
}

function ReviewBeforeSubmit({ entries, responses, onEdit, onContinue, onSubmit }: {
  entries: SessionEntry[];
  responses: Record<string, ResponseState>;
  onEdit: (index: number) => void;
  onContinue: () => void;
  onSubmit: () => void;
}) {
  return (
    <section className="pre-submit-review" aria-labelledby="pre-submit-heading">
      <p className="eyebrow">Review before submission</p>
      <h3 id="pre-submit-heading">Check your session</h3>
      <ul>
        {entries.map((entry, index) => {
          const response = responses[entryId(entry)] ?? makeDefaultResponse();
          const started = response.choices.length > 0 || response.text.trim() !== ''
            || response.revealed
            || response.annotations.some((annotation) => annotation.evidence || annotation.technique || annotation.function);
          return (
            <li key={entryId(entry)}>
              <span><strong>Question {index + 1}:</strong> {entryLabel(entry)}</span>
              <span className={started ? 'review-started' : 'review-empty'}>{started ? 'Response started' : 'Not answered'}</span>
              <button type="button" className="text-button" onClick={() => onEdit(index)}>Edit</button>
            </li>
          );
        })}
      </ul>
      <div className="practice-actions">
        <button type="button" className="secondary-button" onClick={onContinue}>Continue editing</button>
        <button type="button" className="primary-button" onClick={onSubmit}>Submit practice</button>
      </div>
      <p className="practice-note">Submitting records unanswered objective questions as incorrect and open responses as ungraded. The timer continues during review.</p>
    </section>
  );
}

function AnnotationEditor({ response, update }: { response: ResponseState; update: (update: Partial<ResponseState>) => void }) {
  const annotations = response.annotations.length ? response.annotations : [{ evidence: '', technique: '', function: '' }];
  const edit = (index: number, patch: Partial<Annotation>) => {
    update({ annotations: annotations.map((annotation, currentIndex) => currentIndex === index ? { ...annotation, ...patch } : annotation) });
  };
  return (
    <section className="annotation-workspace" aria-label="Passage annotation workspace">
      <p className="practice-note">For each observation, identify a specific detail, name a relevant technique, and explain how and why that choice contributes to meaning, conflict, theme, or purpose.</p>
      {annotations.map((annotation, index) => (
        <fieldset className="annotation-entry" key={index}>
          <legend>Observation {index + 1}</legend>
          <label>Evidence or detail<textarea value={annotation.evidence} rows={2} onChange={(event) => edit(index, { evidence: event.target.value })} /></label>
          <label>Technique or choice<input value={annotation.technique} onChange={(event) => edit(index, { technique: event.target.value })} placeholder="e.g. syntax, imagery, point of view" /></label>
          <label>How and why it matters<textarea value={annotation.function} rows={3} onChange={(event) => edit(index, { function: event.target.value })} placeholder="Explain the effect in this passage, not only the technique's definition." /></label>
          {annotations.length > 1 && <button type="button" className="text-button" onClick={() => update({ annotations: annotations.filter((_, currentIndex) => currentIndex !== index) })}>Remove observation</button>}
        </fieldset>
      ))}
      <button type="button" className="secondary-button" onClick={() => update({ annotations: [...annotations, { evidence: '', technique: '', function: '' }] })}>Add an annotation</button>
    </section>
  );
}

function RetrievalExercise({ card, response, update, evidence, records }: {
  card: RetrievalCard;
  response: ResponseState;
  update: (update: Partial<ResponseState>) => void;
  evidence: ContentManifest['phase4Content']['evidenceRepository'];
  records: ContentManifest['records'];
}) {
  return (
    <div className="exercise-body">
      <p className="eyebrow">{card.kind.replaceAll('_', ' ')} · source-derived recall</p>
      <p className="question-prompt">{card.prompt}</p>
      {card.coverageNote && <p className="coverage-warning">{card.coverageNote}</p>}
      <label className="response-field">
        Record what you remember (optional)
        <textarea value={response.text} onChange={(event) => update({ text: event.target.value })} rows={5} placeholder="Use this space to retrieve the information before revealing the source-linked claims." />
      </label>
      {!response.revealed ? (
        <button type="button" className="secondary-button" onClick={() => update({ revealed: true })}>Reveal source-linked answer</button>
      ) : (
        <div className="revealed-claims" aria-live="polite">
          <h3>Source-linked claims to compare with your recall</h3>
          {card.claims.map((claim) => <ClaimDisclosure key={claim.id} claim={claim} />)}
          <EvidenceReferences ids={card.evidenceIds} evidence={evidence} records={records} />
        </div>
      )}
    </div>
  );
}

function ClaimDisclosure({ claim }: { claim: StudyClaim }) {
  return (
    <article className="claim-card">
      <p>{claim.text}</p>
      <small className="provenance">
        {claim.origin.replaceAll('_', ' ')}
        {claim.sourceRecordIds.length > 0 && <> · Records: {claim.sourceRecordIds.join(', ')}</>}
        {claim.sourceDocuments?.map((source) => <span key={`${claim.id}-${source.documentId}-${source.pdfPages.join('-')}`}> · {source.documentId}, PDF p. {source.pdfPages.join(', ')}{source.note && ` (${source.note})`}</span>)}
        {claim.evidenceIds && claim.evidenceIds.length > 0 && <> · Evidence: {claim.evidenceIds.join(', ')}</>}
      </small>
      {claim.uncertainty && <p className="uncertainty"><strong>Review note:</strong> {claim.uncertainty}</p>}
    </article>
  );
}

function SessionResults({ session, attempts, responses, manifest, reveal, setReview, returnToSetup }: {
  session: PracticeSession;
  attempts: PracticeAttempt[];
  responses: Record<string, ResponseState>;
  manifest: ContentManifest;
  reveal: (attempt: PracticeAttempt) => void;
  setReview: (attempt: PracticeAttempt, status: ReviewStatus) => void;
  returnToSetup: () => void;
}) {
  const objectiveAttempts = attempts.filter((attempt) => attempt.result !== 'open_response');
  const correctCount = objectiveAttempts.filter((attempt) => attempt.result === 'correct').length;
  return (
    <section className="study-panel session-results" aria-labelledby="results-heading">
      <p className="eyebrow">Session complete</p>
      <h2 id="results-heading">Review your practice</h2>
      <p className="result-summary">
        {objectiveAttempts.length > 0
          ? `Objective answers correct: ${correctCount} of ${objectiveAttempts.length}. Open responses are not scored.`
          : 'This session had no objectively scored questions. Use the prepared answers and self-checks below.'}
      </p>
      <p className="practice-note">This count describes this session only; it is not a mastery score. Explanations and source references are included with each item.</p>
      <div className="result-list">
        {session.entries.map((entry, index) => {
          const attempt = attempts.find((item) => item.itemId === entryId(entry));
          if (!attempt) return null;
          const response = responses[attempt.itemId] ?? makeDefaultResponse();
          return (
            <article className="result-card" key={attempt.id}>
              <div className="result-card-heading">
                <h3>{index + 1}. {entryLabel(entry)}</h3>
                {attempt.result === 'correct' && <span className="result-badge result-correct">Correct</span>}
                {attempt.result === 'incorrect' && <span className="result-badge result-incorrect">Needs review</span>}
                {attempt.result === 'open_response' && <span className="result-badge result-open">Self-check</span>}
              </div>
              {entry.type === 'question'
                ? <QuestionFeedback question={entry.question} displayChoices={entry.displayChoices} attempt={attempt} selected={response.choices} records={manifest.records} evidence={manifest.phase4Content.evidenceRepository} reveal={reveal} />
                : <RetrievalFeedback
                  card={entry.card}
                  response={response}
                  attempt={attempt}
                  reveal={reveal}
                  setReview={setReview}
                  evidence={manifest.phase4Content.evidenceRepository}
                  records={manifest.records}
                />}
              {attempt.result === 'open_response' && entry.type === 'question' && (
                <OpenAnswerFeedback question={entry.question} response={response} attempt={attempt} setReview={setReview} />
              )}
              {attempt.result === 'incorrect' && <button type="button" className="text-button" onClick={() => setReview(attempt, 'needs_review')}>Keep in review queue</button>}
            </article>
          );
        })}
      </div>
      <button type="button" className="primary-button" onClick={returnToSetup}>Build another session</button>
    </section>
  );
}

function QuestionFeedback({ question, displayChoices, attempt, selected, records, evidence, reveal }: {
  question: Phase45Question;
  displayChoices?: DisplayChoice[];
  attempt: PracticeAttempt;
  selected: string[];
  records: ContentManifest['records'];
  evidence: ContentManifest['phase4Content']['evidenceRepository'];
  reveal: (attempt: PracticeAttempt) => void;
}) {
  const correct = isObjectiveQuestion(question) ? isCorrect(question, selected) : null;
  const choices = displayChoices ?? (question.choices ?? []).map((choice) => ({ ...choice, answerKeyLabel: choice.label }));
  const displayLabel = (answerKeyLabel: string) => choices.find((choice) => choice.answerKeyLabel === answerKeyLabel)?.label ?? answerKeyLabel;
  return (
    <div className="answer-feedback">
      {isObjectiveQuestion(question) ? (
        <>
          <p><strong>Your selection:</strong> {selected.length ? selected.map(displayLabel).join(', ') : 'No answer selected'}</p>
          <p><strong>Correct answer:</strong> {(question.answerKey.correctChoices ?? []).map(displayLabel).join(', ')}</p>
          <p>{question.answerKey.explanation}</p>
          <ul className="choice-rationales">
            {choices.map((choice) => (
              <li key={choice.answerKeyLabel}><strong>{choice.label} {question.answerKey.correctChoices?.includes(choice.answerKeyLabel) ? '(correct)' : '(not the best answer)'}:</strong> {choice.rationale}</li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p>{question.answerKey.explanation}</p>
          {question.answerKey.modelAnswer && <ModelAnswer question={question} onReveal={() => reveal(attempt)} />}
          {question.answerKey.essentialElements && <SelfCheckList title="Check whether your response addressed these elements" items={question.answerKey.essentialElements} />}
          {question.answerKey.acceptableAlternatives && question.answerKey.acceptableAlternatives.length > 0 && (
            <SelfCheckList title="Other defensible approaches recorded in the key" items={question.answerKey.acceptableAlternatives} />
          )}
          {question.answerKey.commonWeaknesses && question.answerKey.commonWeaknesses.length > 0 && (
            <SelfCheckList title="Common weaknesses to watch for" items={question.answerKey.commonWeaknesses} />
          )}
        </>
      )}
      {correct !== null && <p className="provenance">Correctness is checked only for this answer key; open responses are never algorithmically graded.</p>}
      <p className="provenance"><strong>{answerBasisLabels[question.answerKey.basis]}:</strong> {question.answerKey.sourceNote}</p>
      <SourceCitationList sourceRecordIds={question.sourceRecordIds} documents={question.sourceDocuments} records={records} />
      <EvidenceReferences ids={question.evidenceIds} evidence={evidence} records={records} />
    </div>
  );
}

function ModelAnswer({ question, onReveal }: { question: Phase45Question; onReveal: () => void }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="model-answer">
      {!shown
        ? <button type="button" className="secondary-button" onClick={() => { setShown(true); onReveal(); }}>Reveal model answer</button>
        : <div className="revealed-answer"><h4>Prepared model answer</h4><p>{question.answerKey.modelAnswer}</p><p className="provenance">A model for comparison, not the only valid interpretation. The answer key is not a teacher-authored response.</p></div>}
    </div>
  );
}

function SelfCheckList({ title, items }: { title: string; items: string[] }) {
  return (
    <fieldset className="self-check-list">
      <legend>{title}</legend>
      {items.map((item) => <label key={item}><input type="checkbox" />{item}</label>)}
    </fieldset>
  );
}

function OpenAnswerFeedback({ question, response, attempt, setReview }: {
  question: Phase45Question;
  response: ResponseState;
  attempt: PracticeAttempt;
  setReview: (attempt: PracticeAttempt, status: ReviewStatus) => void;
}) {
  return (
    <div className="self-assessment-controls">
      {response.text.trim() && <details><summary>Review the response you wrote in this session</summary><p className="student-response">{response.text}</p></details>}
      {question.format === 'passage_annotation' && response.annotations.some((item) => item.evidence || item.technique || item.function) && (
        <details><summary>Review your passage annotations</summary>
          <ul>{response.annotations.map((item, index) => (
            <li key={index}><strong>{item.technique || 'Unlabeled technique'}:</strong> {item.evidence || 'No evidence entered'} — {item.function || 'No function explanation entered'}</li>
          ))}</ul>
        </details>
      )}
      {attempt.modelRevealed ? (
        <div className="self-check-buttons">
          <button type="button" className="secondary-button" onClick={() => setReview(attempt, 'self_checked')}>I compared my answer with the criteria</button>
          <button type="button" className="text-button" onClick={() => setReview(attempt, 'needs_review')}>I need to review this again</button>
        </div>
      ) : <p className="practice-note">Reveal the model answer above before marking your response self-checked.</p>}
    </div>
  );
}

function RetrievalFeedback({ card, response, attempt, reveal, setReview, evidence, records }: {
  card: RetrievalCard;
  response: ResponseState;
  attempt: PracticeAttempt;
  reveal: (attempt: PracticeAttempt) => void;
  setReview: (attempt: PracticeAttempt, status: ReviewStatus) => void;
  evidence: ContentManifest['phase4Content']['evidenceRepository'];
  records: ContentManifest['records'];
}) {
  return (
    <div className="answer-feedback">
      {response.text.trim() && <details><summary>Review your recall notes</summary><p className="student-response">{response.text}</p></details>}
      {!attempt.modelRevealed ? (
        <button type="button" className="secondary-button" onClick={() => reveal(attempt)}>Reveal source-linked answer</button>
      ) : (
        <>
          {card.claims.map((claim) => <ClaimDisclosure key={claim.id} claim={claim} />)}
          <EvidenceReferences ids={card.evidenceIds} evidence={evidence} records={records} />
          {card.coverageNote && <p className="coverage-warning">{card.coverageNote}</p>}
          <p className="practice-note">This is recall practice, not a mastery score. Record whether you recalled it or want another review.</p>
          <div className="self-check-buttons">
            <button type="button" className="secondary-button" onClick={() => setReview(attempt, 'recalled')}>I recalled the main points</button>
            <button type="button" className="text-button" onClick={() => setReview(attempt, 'needs_review')}>I want to review this again</button>
          </div>
        </>
      )}
    </div>
  );
}

function SourceCitationList({ sourceRecordIds, documents, records }: {
  sourceRecordIds: string[];
  documents: Phase45Question['sourceDocuments'];
  records: ContentManifest['records'];
}) {
  const resolvedRecords = sourceRecordIds.map((id) => records.find((record) => record.id === id)).filter((record) => record !== undefined);
  return (
    <div className="source-citations">
      {resolvedRecords.map((record) => (
        <p key={record.id}><strong>{record.topic}</strong> · {record.classification.replaceAll('_', ' ')} · {record.id} · PDF p. {record.source.pdfPages.join(', ')}</p>
      ))}
      {documents.map((source) => (
        <p key={`${source.documentId}-${source.pdfPages.join('-')}`}><strong>{source.documentId}</strong> · PDF p. {source.pdfPages.join(', ')}{source.note && ` · ${source.note}`}</p>
      ))}
    </div>
  );
}

function EvidenceReferences({ ids, evidence, records }: {
  ids: string[];
  evidence: ContentManifest['phase4Content']['evidenceRepository'];
  records: ContentManifest['records'];
}) {
  const resolved = ids.map((id) => {
    const entry = evidence.find((item) => item.id === id);
    const record = entry ? records.find((item) => item.id === entry.sourceRecordId) : undefined;
    const quotation = entry ? record?.quotations?.[entry.quotationIndex] : undefined;
    return { id, entry, record, quotation };
  });
  if (resolved.length === 0) return null;
  return (
    <section className="linked-evidence">
      <h4>Linked evidence</h4>
      {resolved.map(({ id, entry, record, quotation }) => entry && record && quotation ? (
        <article className="linked-evidence-item" key={id}>
          <div className="evidence-tags">{entry.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          <blockquote>{quotation.exactWording}</blockquote>
          <p>{quotation.workOrSource} · {quotation.speakerOrContext}</p>
          {quotation.bookCitationAsSupplied && <p>Citation as supplied: {quotation.bookCitationAsSupplied}</p>}
          <small className="provenance">
            {entry.sourceRecordId}, quotation {entry.quotationIndex + 1} · PDF p. {record.source.pdfPages.join(', ')} · {quotation.verificationStatus.replaceAll('_', ' ')}
          </small>
          {quotation.uncertainty && <p className="uncertainty"><strong>Review note:</strong> {quotation.uncertainty}</p>}
          {entry.useCases.map((useCase) => <p className="evidence-use-case" key={useCase.id}>{useCase.origin.replaceAll('_', ' ')}: {useCase.text}</p>)}
        </article>
      ) : <p className="uncertainty" key={id}>Linked evidence entry {id} could not be resolved.</p>)}
    </section>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}
