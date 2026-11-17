import { ProgressProfileControls } from './ProgressProfileControls';
import type { PracticeAttempt, PracticeProgressState } from './progress';

const categoryNames: Record<string, string> = {
  'novel-recall': 'Novel plot and character recall',
  'themes-symbols': 'Themes and symbols',
  'novel-comparison': 'Novel comparison',
  'argumentative-writing': 'Argumentative writing',
  'poem-analysis': 'Poem analysis',
  'passage-annotation': 'Passage annotation',
  'literary-terms': 'Literary terminology',
  'poetry-multiple-choice': 'Poetry multiple choice',
};

function latestByItem(attempts: PracticeAttempt[]): PracticeAttempt[] {
  const latest = new Map<string, PracticeAttempt>();
  for (const attempt of attempts) {
    const previous = latest.get(attempt.itemId);
    if (!previous || Date.parse(previous.answeredAt) <= Date.parse(attempt.answeredAt)) latest.set(attempt.itemId, attempt);
  }
  return [...latest.values()];
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleString();
}

export function ProgressDashboard({ progress }: { progress: PracticeProgressState }) {
  if (!progress.ready) return <p className="loading" role="status">Loading your local practice profile…</p>;
  const profile = progress.profile;
  if (!profile) return <p className="inline-error" role="alert">The local practice profile is unavailable.</p>;

  const attempts = profile.attempts;
  const objective = attempts.filter((attempt) => attempt.result !== 'open_response');
  const correct = objective.filter((attempt) => attempt.result === 'correct').length;
  const topics = new Set(attempts.flatMap((attempt) => attempt.topics));
  const sessions = new Map<string, PracticeAttempt[]>();
  attempts.forEach((attempt) => {
    sessions.set(attempt.sessionId, [...(sessions.get(attempt.sessionId) ?? []), attempt]);
  });
  const latest = latestByItem(attempts);
  const review = latest.filter((attempt) => attempt.result === 'incorrect' || attempt.reviewStatus === 'needs_review')
    .sort((a, b) => Date.parse(b.answeredAt) - Date.parse(a.answeredAt));
  const topicSummary = new Map<string, { attempts: number; incorrect: number; review: number }>();
  attempts.forEach((attempt) => attempt.topics.forEach((topic) => {
    const current = topicSummary.get(topic) ?? { attempts: 0, incorrect: 0, review: 0 };
    current.attempts += 1;
    if (attempt.result === 'incorrect') current.incorrect += 1;
    if (attempt.result === 'open_response' && attempt.reviewStatus === 'needs_review') current.review += 1;
    topicSummary.set(topic, current);
  }));
  const weakTopics = [...topicSummary.entries()]
    .filter(([, stats]) => stats.incorrect > 0 || stats.review > 0)
    .sort((a, b) => (b[1].incorrect + b[1].review) - (a[1].incorrect + a[1].review))
    .slice(0, 8);
  const repeatedMisunderstandings = [...topicSummary.entries()]
    .filter(([, stats]) => stats.incorrect >= 2)
    .sort((a, b) => b[1].incorrect - a[1].incorrect);
  const confidenceCounts = attempts.reduce<Record<string, number>>((counts, attempt) => {
    if (attempt.confidence) counts[attempt.confidence] = (counts[attempt.confidence] ?? 0) + 1;
    return counts;
  }, {});
  const recentSessions = [...sessions.entries()]
    .sort((a, b) => Date.parse(b[1][0].answeredAt) - Date.parse(a[1][0].answeredAt))
    .slice(0, 6);
  const recentAttempts = [...attempts].sort((a, b) => Date.parse(b.answeredAt) - Date.parse(a.answeredAt)).slice(0, 12);

  return (
    <>
      <header className="content-intro">
        <p className="eyebrow">Saved in this browser · student-controlled practice record</p>
        <h1>Progress and review</h1>
        <p>See what you have practiced, which objective items need another look, and your self-review history. Repeated exposure is not treated as mastery, and open answers are never graded.</p>
      </header>
      <ProgressProfileControls progress={progress} />

      <section className="progress-summary-grid" aria-label="Practice summary">
        <article className="progress-stat"><span>Practice attempts</span><strong>{attempts.length}</strong><small>Across {sessions.size} completed sessions</small></article>
        <article className="progress-stat"><span>Topics studied</span><strong>{topics.size}</strong><small>From attempted questions and recall cards</small></article>
        <article className="progress-stat"><span>Objective answers</span><strong>{objective.length ? `${correct} / ${objective.length}` : '—'}</strong><small>Correct answers / attempted objective questions</small></article>
        <article className="progress-stat"><span>Items to review</span><strong>{review.length}</strong><small>Based on each item's latest attempt</small></article>
      </section>

      <section className="study-panel dashboard-section">
        <div className="study-title-row">
          <div><p className="eyebrow">Actionable review</p><h2>Topics to revisit</h2></div>
          <a className="primary-link" href="#/practice">Practice now</a>
        </div>
        {weakTopics.length > 0 ? (
          <ul className="topic-review-list">
            {weakTopics.map(([topic, stats]) => (
              <li key={topic}><strong>{topic}</strong><span>{stats.incorrect} incorrect objective attempts · {stats.review} open-response items marked for review · {stats.attempts} total exposures</span></li>
            ))}
          </ul>
        ) : <p className="empty-state">{attempts.length === 0 ? 'No attempts recorded yet. Start with a short session to create a review history.' : 'No topics are currently marked for review. This is not a mastery claim; keep practicing with varied questions.'}</p>}
      </section>

      <section className="study-panel dashboard-section">
        <p className="eyebrow">Repeated errors</p>
        <h2>Patterns to examine</h2>
        {repeatedMisunderstandings.length > 0 ? (
          <ul className="topic-review-list">
            {repeatedMisunderstandings.map(([topic, stats]) => <li key={topic}><strong>{topic}</strong><span>{stats.incorrect} incorrect objective attempts recorded. Review explanations and try new examples.</span></li>)}
          </ul>
        ) : <p className="empty-state">No topic has two or more incorrect objective attempts in this profile yet. Open responses are excluded because they are not graded.</p>}
        <div className="confidence-summary">
          <strong>Optional confidence recorded:</strong>
          {Object.keys(confidenceCounts).length
            ? <span> {confidenceCounts.low ?? 0} low · {confidenceCounts.medium ?? 0} medium · {confidenceCounts.high ?? 0} high</span>
            : <span> none yet</span>}
        </div>
      </section>

      <section className="study-panel dashboard-section">
        <p className="eyebrow">Recent errors and self-review</p>
        <h2>Review queue</h2>
        {review.length > 0 ? (
          <div className="review-queue">
            {review.slice(0, 8).map((attempt) => (
              <article key={attempt.id}>
                <h3>{attempt.itemTitle}</h3>
                <p>{categoryNames[attempt.category] ?? attempt.category} · {attempt.topics.join(', ')}</p>
                <small>{attempt.result === 'incorrect' ? 'Incorrect objective answer' : 'Marked for another review'} · {formatDate(attempt.answeredAt)}</small>
              </article>
            ))}
          </div>
        ) : <p className="empty-state">Nothing is currently queued. Incorrect answers remain in your attempt history even after a later correct response.</p>}
      </section>

      <section className="study-panel dashboard-section">
        <p className="eyebrow">Saved attempt history</p>
        <h2>Recent attempts</h2>
        {recentAttempts.length > 0 ? (
          <div className="review-queue">
            {recentAttempts.map((attempt) => (
              <article key={attempt.id}>
                <h3>{attempt.itemTitle}</h3>
                <p>{categoryNames[attempt.category] ?? attempt.category} · {attempt.topics.join(', ')}</p>
                <small>
                  {attempt.result === 'correct' ? 'Correct objective answer' : attempt.result === 'incorrect' ? 'Incorrect objective answer' : `Ungraded self-check · ${attempt.reviewStatus.replaceAll('_', ' ')}`}
                  {attempt.selectedChoices && attempt.selectedChoices.length > 0 ? ` · Selected: ${attempt.selectedChoices.join(', ')}` : ''}
                  {attempt.confidence ? ` · Confidence: ${attempt.confidence}` : ''}
                  {' · '}{formatDate(attempt.answeredAt)}
                </small>
              </article>
            ))}
          </div>
        ) : <p className="empty-state">Your recent attempts will appear here. Typed responses are not retained in the persistent history.</p>}
      </section>

      <section className="study-panel dashboard-section">
        <p className="eyebrow">Practice history</p>
        <h2>Recent sessions</h2>
        {recentSessions.length > 0 ? (
          <div className="session-history">
            {recentSessions.map(([sessionId, entries]) => {
              const sessionObjective = entries.filter((attempt) => attempt.result !== 'open_response');
              const sessionCorrect = sessionObjective.filter((attempt) => attempt.result === 'correct').length;
              return (
                <article key={sessionId}>
                  <h3>{formatDate(entries[0].answeredAt)}</h3>
                  <p>{entries.length} attempts · {sessionObjective.length ? `${sessionCorrect} of ${sessionObjective.length} objective answers correct` : 'open-response self-check only'}</p>
                  <small>{[...new Set(entries.map((attempt) => categoryNames[attempt.category] ?? attempt.category))].join(' · ')}</small>
                </article>
              );
            })}
          </div>
        ) : <p className="empty-state">Completed sessions will appear here. Your written responses are not stored; only attempt details, choices, confidence, and review status are saved.</p>}
        <button type="button" className="text-button clear-profile-button" onClick={() => {
          if (window.confirm(`Clear practice history for ${profile.name}? This cannot be undone.`)) progress.clearCurrentProfile();
        }} disabled={attempts.length === 0}>Clear this profile’s history</button>
      </section>
    </>
  );
}
