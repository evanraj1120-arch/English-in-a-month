import { useEffect, useState } from 'react';
import { loadContentManifest } from './content/loader';
import { PracticeCenter } from './practice/PracticeCenter';
import { ProgressDashboard } from './practice/ProgressDashboard';
import { usePracticeProgress } from './practice/progress';
import type {
  ContentManifest,
  ContentRecord,
  CrossNovelComparison,
  ExamPreparationModule,
  EvidenceRepositoryEntry,
  LiteraryTermStudy,
  NovelStudyGuide,
  StudyClaim,
  StudySection,
} from './content/types';

type ExamMapCardRecord = ContentRecord & { summary: string; examPoints: number };

const novelNames = [
  '1984',
  'The Catcher in the Rye',
  'The Metamorphosis',
  'The Glass Castle',
];

function sectionFromHash(sections: StudySection[]): string {
  const id = window.location.hash.replace(/^#\/?/, '');
  return sections.some((section) => section.id === id) ? id : 'exam-map';
}

function isExamMapCardRecord(record: ContentRecord | undefined): record is ExamMapCardRecord {
  return record !== undefined && typeof record.summary === 'string' && typeof record.examPoints === 'number';
}

function App() {
  const [manifest, setManifest] = useState<ContentManifest | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('exam-map');
  const practiceProgress = usePracticeProgress();

  useEffect(() => {
    let active = true;
    loadContentManifest()
      .then((loaded) => {
        if (!active) return;
        setManifest(loaded);
        setActiveSection(sectionFromHash(loaded.sections));
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : 'Unable to load study sections.');
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!manifest) return;
    const updateFromHash = () => setActiveSection(sectionFromHash(manifest.sections));
    window.addEventListener('hashchange', updateFromHash);
    return () => window.removeEventListener('hashchange', updateFromHash);
  }, [manifest]);

  const sections = manifest?.sections ?? [];
  const section = sections.find((item) => item.id === activeSection);
  const examCards = manifest
    ? manifest.examMap.componentRecordIds
      .map((id) => manifest.records.find((record) => record.id === id))
      .filter(isExamMapCardRecord)
    : [];
  const closeReading = manifest?.records.find((record) => record.id === manifest.examMap.separateNoticeRecordId);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <a className="brand" href="#/exam-map" aria-label="Honors English 10 Exam Map">
          <span className="brand-mark" aria-hidden="true">E10</span>
          <span><strong>Honors English 10</strong><small>Semester One Examination</small></span>
        </a>
        <span className="stage-tag">Interactive practice</span>
      </header>

      <div className="layout">
        <nav className="side-nav" aria-label="Study sections">
          <p className="nav-label">Study sections</p>
          {sections.map((item) => (
            <a
              key={item.id}
              className={`nav-link ${activeSection === item.id ? 'active' : ''}`}
              href={`#/${item.id}`}
              aria-current={activeSection === item.id ? 'page' : undefined}
            >
              <span>{item.label}</span>
              {item.state === 'pending_content' && <span className="nav-dot" aria-label="Content pending" />}
            </a>
          ))}
          <div className="source-note">
            <span className="source-note-label">Primary source</span>
            <p>H-Eng 10: MIDTERM</p>
            <small>133-page class packet</small>
          </div>
        </nav>

        <main id="main-content" className="main-content" tabIndex={-1}>
          {loadError ? (
            <section className="panel error-panel" role="alert">
              <p className="eyebrow">Content setup</p>
              <h1>Study sections could not load</h1>
              <p>{loadError}</p>
            </section>
          ) : !manifest || !section ? (
            <p role="status" className="loading">Loading study sections…</p>
          ) : section.id === 'exam-map' && closeReading ? (
            <ExamMap examCards={examCards} closeReading={closeReading} />
          ) : section.id === 'exam-map' ? (
            <section className="panel error-panel" role="alert">
              <p className="eyebrow">Content setup</p>
              <h1>Exam map records are incomplete</h1>
              <p>The source database does not contain the exam map content this view requires.</p>
            </section>
          ) : section.id === 'novels' ? (
            <NovelStudies manifest={manifest} />
          ) : section.id === 'compare' ? (
            <ComparisonStudies manifest={manifest} />
          ) : section.id === 'practice' ? (
            <>
              <PracticeCenter manifest={manifest} progress={practiceProgress} />
              <section className="study-panel exam-methods-accordion">
                <details>
                  <summary>Review teacher requirements, exam methods, and examples</summary>
                  <ExamPreparation studies={manifest.phase4Content.examPreparation} records={manifest.records} />
                </details>
              </section>
            </>
          ) : section.id === 'progress' ? (
            <ProgressDashboard progress={practiceProgress} />
          ) : section.id === 'literary-terms' ? (
            <LiteraryTerms studies={manifest.phase4Content.literaryTerms} records={manifest.records} />
          ) : section.id === 'poetry' ? (
            <PoetryStudies manifest={manifest} />
          ) : (
            <Placeholder section={section} />
          )}
        </main>
      </div>
      <footer className="site-footer">
        <span>Source-aware study materials</span>
        <span>Progress stays in local browser profiles</span>
      </footer>
    </div>
  );
}

function ExamMap({ examCards, closeReading }: {
  examCards: ExamMapCardRecord[];
  closeReading: ContentRecord;
}) {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Study platform · source-aware guides and practice</p>
        <h1>Prepare with evidence.<br /><em>Write with purpose.</em></h1>
        <p className="hero-copy">Source-linked guides for the novels, close reading, poetry, and writing skills in your semester exam.</p>
        <div className="hero-meta"><span className="status-chip">Interactive practice available</span><span>Class materials remain the primary source</span></div>
      </section>

      <section className="section-block" aria-labelledby="exam-components-heading">
        <div className="section-heading">
          <div><p className="eyebrow">The review describes</p><h2 id="exam-components-heading">Exam components</h2></div>
          <p>Use this map to choose what to study next.</p>
        </div>
        <div className="exam-grid">
          {examCards.map((record, index) => (
            <ExamCard key={record.id} number={String(index + 1).padStart(2, '0')} record={record} />
          ))}
        </div>
        <div className="notice-row">
          <span className="notice-icon" aria-hidden="true">i</span>
          <p><strong>Separate close-reading exercise:</strong> {closeReading.content} <span className="card-source">Teacher-provided · PDF p. {closeReading.source.pdfPages.join(', ')}</span></p>
        </div>
      </section>

      <section className="section-block novels-block" aria-labelledby="novels-heading">
        <div className="section-heading">
          <div><p className="eyebrow">Four novels · shared structure</p><h2 id="novels-heading">Choose a novel</h2></div>
          <a className="text-link" href="#/novels">Open novels <span aria-hidden="true">→</span></a>
        </div>
        <div className="novel-list">
          {novelNames.map((name, index) => (
            <a className="novel-card" href="#/novels" key={name}>
              <span className="novel-index">0{index + 1}</span>
              <span className="novel-name"><em>{name}</em></span>
              <span className="novel-arrow" aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
        <p className="pending-caption">Catcher remains source-limited until the additional class material arrives.</p>
      </section>

      <section className="source-strip" aria-label="Content status">
        <div><span className="strip-kicker">Source distinctions</span><p>Teacher requirements, teacher practice, student work, and supplemental analysis are labeled separately.</p></div>
        <div><span className="strip-kicker">Study and practice</span><p>Use source-linked novel guides, poetry and terminology reviews, retrieval practice, objective quizzes, and optional timed sessions.</p></div>
      </section>
    </>
  );
}

function ExamCard({ number, record }: { number: string; record: ExamMapCardRecord }) {
  return (
    <article className="exam-card">
      <div className="card-top"><span>{number}</span><span className="points">{record.examPoints} points</span></div>
      <h3>{record.topic}</h3>
      <p>{record.summary}</p>
      <small className="card-source">Teacher-provided · PDF p. {record.source.pdfPages.join(', ')}</small>
      <span className="card-line" aria-hidden="true" />
    </article>
  );
}

function Placeholder({ section }: { section: StudySection }) {
  return (
    <section className="panel placeholder-panel">
      <p className="eyebrow">Study section</p>
      <h1>{section.label}</h1>
      <p className="placeholder-copy">{section.description}</p>
      <div className="placeholder-state"><span className="status-dot" />This study view is not populated yet; extracted source records are not a finished study guide.</div>
      <p className="placeholder-note">Source records are being classified separately from the finished study views. When material is presented here, its teacher, student, or reference provenance will remain visible.</p>
      <a className="back-link" href="#/exam-map">← Back to exam map</a>
    </section>
  );
}

const novelLabels: Record<NovelStudyGuide['novel'], string> = {
  '1984': '1984',
  'catcher-in-the-rye': 'The Catcher in the Rye',
  metamorphosis: 'The Metamorphosis',
  'glass-castle': 'The Glass Castle',
};

const originLabels: Record<StudyClaim['origin'], string> = {
  teacher_material: 'Teacher material',
  student_work: 'Student work / interpretation',
  textual_evidence: 'Textual evidence',
  ai_analysis: 'AI analysis',
  external_reference: 'External reference',
};

function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <header className="content-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

function ClaimCard({ claim }: { claim: StudyClaim }) {
  return (
    <div className="claim-card">
      <p>{claim.text}</p>
      {claim.uncertainty && <p className="uncertainty"><strong>Review note:</strong> {claim.uncertainty}</p>}
      <small className="provenance">
        {originLabels[claim.origin]}
        {claim.sourceRecordIds.length > 0 && <> · Records: {claim.sourceRecordIds.join(', ')}</>}
        {claim.sourceDocuments?.map((source) => (
          <span key={`${claim.id}-${source.documentId}-${source.pdfPages.join('-')}`}>
            {' · '}{source.documentId}, PDF p. {source.pdfPages.join(', ')}
            {source.note && ` (${source.note})`}
          </span>
        ))}
        {claim.evidenceIds && claim.evidenceIds.length > 0 && <> · Evidence: {claim.evidenceIds.join(', ')}</>}
      </small>
    </div>
  );
}

function ClaimGroup({ title, claims }: { title: string; claims: StudyClaim[] }) {
  if (claims.length === 0) return null;
  return (
    <section className="claim-group">
      <h4>{title}</h4>
      <div className="claim-list">{claims.map((claim) => <ClaimCard claim={claim} key={claim.id} />)}</div>
    </section>
  );
}

function SourceRecords({ ids, records }: { ids: string[]; records: Map<string, ContentRecord> }) {
  const resolved = ids.map((id) => records.get(id)).filter((record): record is ContentRecord => record !== undefined);
  if (resolved.length === 0) return null;
  return (
    <section className="source-records">
      <h3>Linked class work and interpretation records</h3>
      {resolved.map((record) => (
        <article className="source-record-card" key={record.id}>
          <h4>{record.topic}</h4>
          <p>{record.content}</p>
          <small className="provenance">{record.id} · {record.classification.replaceAll('_', ' ')} · PDF p. {record.source.pdfPages.join(', ')}</small>
          {record.uncertainty && <p className="uncertainty"><strong>Source note:</strong> {record.uncertainty}</p>}
        </article>
      ))}
    </section>
  );
}

function EvidenceCard({ entry, records }: { entry: EvidenceRepositoryEntry; records: Map<string, ContentRecord> }) {
  const source = records.get(entry.sourceRecordId);
  const quote = source?.quotations?.[entry.quotationIndex];
  if (!source || !quote) return null;
  return (
    <article className="evidence-card">
      <div className="evidence-tags">{entry.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      <blockquote>{quote.exactWording}</blockquote>
      <p className="evidence-context">{quote.workOrSource} · {quote.speakerOrContext}</p>
      {quote.bookCitationAsSupplied && <p className="evidence-context">Citation as supplied: {quote.bookCitationAsSupplied}</p>}
      <small className="provenance">
        {entry.sourceRecordId}, quotation {entry.quotationIndex + 1} · {quote.verificationStatus.replaceAll('_', ' ')}
      </small>
      {quote.uncertainty && <p className="uncertainty"><strong>Review note:</strong> {quote.uncertainty}</p>}
      {entry.useCases.map((useCase) => <ClaimCard claim={useCase} key={useCase.id} />)}
    </article>
  );
}

function CoverageSummary({ guide }: { guide: NovelStudyGuide }) {
  return (
    <div className="coverage-summary" aria-label="Guide coverage">
      {Object.entries(guide.coverage).map(([key, status]) => (
        <span className={`coverage-tag coverage-${status}`} key={key}>{key.replaceAll(/([A-Z])/g, ' $1')}: {status.replaceAll('_', ' ')}</span>
      ))}
    </div>
  );
}

function NovelStudies({ manifest }: { manifest: ContentManifest }) {
  const records = new Map(manifest.records.map((record) => [record.id, record]));
  return (
    <>
      <PageIntro eyebrow="Four novel guides · source-aware" title="Novel studies" description="Each guide separates class instructions, student interpretations, textual evidence, and supplemental analysis. Coverage labels show where the source packet remains incomplete." />
      {manifest.phase4Content.novelGuides.map((guide) => {
        const evidence = manifest.phase4Content.evidenceRepository.filter((entry) => entry.novel === guide.novel);
        return (
          <article className="study-panel" key={guide.id}>
            <div className="study-title-row">
              <div><p className="eyebrow">{guide.status.replaceAll('_', ' ')}</p><h2><em>{novelLabels[guide.novel]}</em></h2></div>
              <span className="status-chip">{evidence.length} linked evidence entries</span>
            </div>
            <CoverageSummary guide={guide} />
            <ClaimGroup title="Overview" claims={guide.overview} />
            {guide.plotChronology.length > 0 && (
              <section className="study-subsection">
                <h3>Chronological plot and turning points</h3>
                <ol className="timeline">
                  {guide.plotChronology.map((point) => (
                    <li key={point.event.id}>
                      <ClaimCard claim={point.event} />
                      {point.significance && <ClaimGroup title="Why this event matters" claims={[point.significance]} />}
                    </li>
                  ))}
                </ol>
              </section>
            )}
            {guide.plotChronology.length === 0 && <p className="coverage-warning">No plot chronology is supplied because the available class sources do not support one.</p>}
            <ClaimGroup title="Settings and their significance" claims={guide.settings} />
            <section className="study-subsection">
              <h3>Character studies</h3>
              <div className="study-grid">
                {guide.characters.map((character) => (
                  <article className="nested-card" key={character.name}>
                    <h4>{character.name}</h4>
                    <ClaimCard claim={character.profile} />
                    <ClaimGroup title="Traits" claims={character.traits} />
                    <ClaimGroup title="Motivations" claims={character.motivations} />
                    <ClaimGroup title="Conflicts" claims={character.conflicts} />
                    <ClaimGroup title="Relationships" claims={character.relationships} />
                    <ClaimGroup title="Development" claims={character.development} />
                    <ClaimGroup title="Theme connections" claims={character.themeConnections} />
                  </article>
                ))}
              </div>
            </section>
            <section className="study-subsection">
              <h3>Themes and central ideas</h3>
              <div className="study-grid">
                {guide.themes.map((theme) => (
                  <article className="nested-card" key={theme.name}>
                    <h4>{theme.name}</h4>
                    <ClaimCard claim={theme.centralIdea} />
                    <ClaimGroup title="Development" claims={theme.development} />
                    <ClaimGroup title="Nuance and limitations" claims={theme.nuance} />
                  </article>
                ))}
              </div>
            </section>
            <section className="study-subsection">
              <h3>Symbols and motifs</h3>
              <div className="study-grid">
                {guide.symbolsAndMotifs.map((symbol) => (
                  <article className="nested-card" key={symbol.objectOrMotif}>
                    <h4>{symbol.objectOrMotif}</h4>
                    <ClaimCard claim={symbol.literalPresence} />
                    <ClaimGroup title="Developing meanings" claims={symbol.developingMeanings} />
                    <ClaimGroup title="Character and theme links" claims={symbol.characterAndThemeLinks} />
                  </article>
                ))}
              </div>
            </section>
            <section className="study-subsection">
              <h3>Literary elements in context</h3>
              <div className="study-grid">
                {guide.literaryElements.map((element) => (
                  <article className="nested-card" key={element.element}>
                    <h4>{element.element}</h4>
                    <ClaimCard claim={element.function} />
                  </article>
                ))}
              </div>
            </section>
            <section className="study-subsection">
              <h3>Evidence repository</h3>
              <div className="study-grid">
                {evidence.map((entry) => <EvidenceCard entry={entry} records={records} key={entry.id} />)}
              </div>
            </section>
            <SourceRecords ids={guide.studentInterpretationRecordIds} records={records} />
            <section className="coverage-notes">
              <h3>Coverage and review notes</h3>
              <ul>{guide.coverageNotes.map((note) => <li key={note}>{note}</li>)}</ul>
            </section>
          </article>
        );
      })}
    </>
  );
}

function ComparisonStudies({ manifest }: { manifest: ContentManifest }) {
  const records = new Map(manifest.records.map((record) => [record.id, record]));
  const evidenceById = new Map(manifest.phase4Content.evidenceRepository.map((entry) => [entry.id, entry]));
  return (
    <>
      <PageIntro eyebrow="Evidence-based comparisons" title="Compare across novels" description="Build an argument around a specific relationship, then explain both evidence and limits. Comparisons are included only when the repository contains retrievable evidence for every work named." />
      {manifest.phase4Content.comparisons.map((comparison: CrossNovelComparison) => (
        <article className="study-panel" key={comparison.id}>
          <p className="eyebrow">{comparison.novels.map((novel) => novelLabels[novel]).join(' · ')}</p>
          <ClaimCard claim={comparison.claim} />
          <ClaimGroup title="Explanation and evidence" claims={comparison.explanation} />
          <section className="study-subsection">
            <h3>Evidence cards</h3>
            <div className="study-grid">
              {comparison.evidenceIds.map((id) => {
                const entry = evidenceById.get(id);
                return entry ? <EvidenceCard entry={entry} records={records} key={id} /> : null;
              })}
            </div>
          </section>
          <ClaimGroup title="Counterargument / qualification" claims={[comparison.counterargument]} />
          <p className="limitation"><strong>Comparison limit:</strong> {comparison.limitation}</p>
          <section className="study-subsection">
            <h3>Adaptable thesis model</h3>
            <ClaimCard claim={comparison.adaptableThesis} />
          </section>
        </article>
      ))}
      <p className="coverage-warning">Catcher comparisons are not yet available because the current packet does not contain retrievable Catcher quotations or complete plot/evidence notes.</p>
    </>
  );
}

function ExamPreparation({ studies, records }: { studies: ExamPreparationModule[]; records: ContentRecord[] }) {
  const modules = new Map(studies.map((study) => [study.componentRecordId, study]));
  const ordered = [
    'req-novel-comparison-essay',
    'req-argument-paragraph',
    'req-poem-analysis',
    'req-passage-annotation',
    'req-literary-terms-multiple-choice',
    'req-poetry-multiple-choice',
  ].map((id) => modules.get(id)).filter((module): module is ExamPreparationModule => module !== undefined);
  const pointsById = new Map(records.map((record) => [record.id, record.examPoints]));
  return (
    <>
      <PageIntro eyebrow="Exam-specific preparation" title="Prepare by task" description="Teacher-stated requirements are separated from study methods and AI-generated models. The source packet's unresolved limits are kept visible." />
      {ordered.map((module) => (
        <article className="study-panel" key={module.id}>
          <div className="study-title-row">
            <div><p className="eyebrow">Exam component</p><h2>{module.title}</h2></div>
            {pointsById.get(module.componentRecordId) !== undefined && <span className="points">{pointsById.get(module.componentRecordId)} points</span>}
          </div>
          <ClaimGroup title="Teacher's stated expectations" claims={module.teacherRequirements} />
          <ClaimGroup title="Method" claims={module.method} />
          <ClaimGroup title="Worked analysis / planning model" claims={module.modelAnalysis} />
          <ClaimGroup title="Common errors to avoid" claims={module.commonErrors} />
          <section className="coverage-notes">
            <h3>Source limitations</h3>
            <ul>{module.sourceLimitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul>
          </section>
        </article>
      ))}
    </>
  );
}

function LiteraryTerms({ studies, records }: { studies: LiteraryTermStudy[]; records: ContentRecord[] }) {
  const recordById = new Map(records.map((record) => [record.id, record]));
  const termLabels = new Map(records.flatMap((record) => (record.termEntries ?? []).map((term) => [term.id, term.term] as const)));
  return (
    <>
      <PageIntro eyebrow="43 printed entries · point of view retained twice" title="Literary terms" description="Working definitions are labeled by source status. Terms missing from the packet receive clearly marked supplemental study definitions, not teacher definitions." />
      <p className="coverage-warning">The review says 20 definitions/examples will appear but does not identify which 20 of the 43 listed entries. Student definitions and examples are not presented as teacher-approved.</p>
      <div className="term-list">
        {studies.map((study) => (
          <article className="study-panel term-card" key={study.termId}>
            <div className="study-title-row">
              <h2>{termLabels.get(study.termId) ?? study.termId}</h2>
              <span className={`coverage-tag coverage-${study.sourceDefinitionStatus === 'teacher_provided' ? 'supported' : 'partial'}`}>
                {study.sourceDefinitionStatus.replaceAll('_', ' ')}
              </span>
            </div>
            <ClaimCard claim={study.workingDefinition} />
            <ClaimGroup title="Distinguishing features" claims={study.distinguishingFeatures} />
            <ClaimGroup title="Example" claims={[study.example]} />
            <ClaimGroup title="Literary function" claims={[study.literaryFunction]} />
            <ClaimGroup title="Common confusions" claims={study.commonConfusions} />
            {study.classDefinitionRecordIds.length > 0 && (
              <SourceRecordDefinitions title="Teacher-provided definition records" ids={study.classDefinitionRecordIds} records={recordById} />
            )}
            {study.studentDefinitionRecordIds.length > 0 && (
              <SourceRecordDefinitions title="Student-provided definition records" ids={study.studentDefinitionRecordIds} records={recordById} />
            )}
            {study.classExampleRecordIds.length > 0 && (
              <p className="provenance">Class example records: {study.classExampleRecordIds.join(', ')}</p>
            )}
          </article>
        ))}
      </div>
    </>
  );
}

function SourceRecordDefinitions({ title, ids, records }: { title: string; ids: string[]; records: Map<string, ContentRecord> }) {
  return (
    <section className="source-definitions">
      <h3>{title}</h3>
      {ids.map((id) => {
        const record = records.get(id);
        return record ? (
          <article key={id}>
            <small className="provenance">{record.id} · {record.classification.replaceAll('_', ' ')}</small>
            <p>{record.content}</p>
          </article>
        ) : null;
      })}
    </section>
  );
}

function PoetryStudies({ manifest }: { manifest: ContentManifest }) {
  const poetryIds = new Set(['req-poem-analysis', 'req-poetry-multiple-choice']);
  const studies = manifest.phase4Content.examPreparation.filter((study) => poetryIds.has(study.componentRecordId));
  const poemPractice = manifest.records.find((record) => record.id === 'practice-without-title-poem');
  return (
    <>
      <PageIntro eyebrow="Poetry · four-part analysis and multiple choice" title="Poetry preparation" description="Use the teacher's four-part analysis sequence, then practice form, rhyme, device, and inference questions without treating unreviewed printed answers as verified." />
      {studies.map((study) => (
        <article className="study-panel" key={study.id}>
          <h2>{study.title}</h2>
          <ClaimGroup title="Teacher's stated expectations" claims={study.teacherRequirements} />
          <ClaimGroup title="Method" claims={study.method} />
          <ClaimGroup title="Model and practice guidance" claims={study.modelAnalysis} />
          <ClaimGroup title="Common errors" claims={study.commonErrors} />
          <section className="coverage-notes">
            <h3>Source limitations</h3>
            <ul>{study.sourceLimitations.map((note) => <li key={note}>{note}</li>)}</ul>
          </section>
        </article>
      ))}
      {poemPractice?.practiceQuestions && (
        <section className="study-panel">
          <p className="eyebrow">Class practice · Diane Glancy</p>
          <h2><em>Without Title</em></h2>
          <p>The packet contains the poem and 12 practice questions. The source PDF is the location for the full poem; printed answers to Questions 7 and 8 remain unreviewed.</p>
          <div className="question-list">
            {poemPractice.practiceQuestions.map((question) => (
              <article className="question-card" key={question.id}>
                <h3>{question.prompt}</h3>
                {question.options && <ul>{question.options.map((option) => <li key={option.label}><strong>{option.label}.</strong> {option.text}</li>)}</ul>}
                {question.teacherCriteria && <ul>{question.teacherCriteria.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul>}
                {question.printedAnswer && (
                  <p className={question.answerStatus === 'printed_unreviewed' ? 'uncertainty' : 'answer-note'}>
                    Printed key: {question.printedAnswer}
                    {question.answerStatus === 'printed_unreviewed' && ' (unreviewed; not an answer guarantee)'}
                  </p>
                )}
              </article>
            ))}
          </div>
          <p className="provenance">{poemPractice.id} · teacher-provided practice · PDF p. {poemPractice.source.pdfPages.join(', ')}</p>
        </section>
      )}
      <section className="study-panel">
        <h2>Other poems named for class practice</h2>
        <ul className="poem-list">
          <li>“Nothing Gold Can Stay”</li>
          <li>“Out, Out”</li>
          <li>“The Tyger”</li>
          <li>“Comin Thro the Rye”</li>
          <li>“War is Kind”</li>
        </ul>
        <p className="provenance">The packet names these poems but does not reproduce their full texts here.</p>
      </section>
    </>
  );
}

export default App;
