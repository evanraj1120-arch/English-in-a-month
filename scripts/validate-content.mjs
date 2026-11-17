import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentRoot = path.join(root, 'public', 'content');
const manifest = JSON.parse(await readFile(path.join(contentRoot, 'manifest.json'), 'utf8'));
const sourceMap = JSON.parse(await readFile(path.join(contentRoot, manifest.sourceMapFile), 'utf8'));
const records = [];
const fail = (message) => {
  throw new Error(message);
};

if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.recordFiles) || !Array.isArray(manifest.sourceDocuments)) {
  fail('Unsupported or invalid content manifest.');
}
if (!Array.isArray(manifest.examMap?.componentRecordIds) || manifest.examMap.componentRecordIds.length !== 6
  || typeof manifest.examMap.separateNoticeRecordId !== 'string') {
  fail('Exam map must identify its six component records and separate close-reading notice.');
}

for (const file of manifest.recordFiles) {
  if (typeof file !== 'string' || file.startsWith('/') || file.includes('..')) fail(`Invalid record path: ${file}`);
  const entries = JSON.parse(await readFile(path.join(contentRoot, file), 'utf8'));
  if (!Array.isArray(entries)) fail(`Content file ${file} must contain an array.`);
  records.push(...entries);
}

const recordIds = new Set();
const questionIds = new Set();
const sourceDocuments = new Map(manifest.sourceDocuments.map(({ id, pageCount }) => [id, pageCount]));
const allowedClassifications = new Set([
  'teacher_instruction_or_exam_requirement',
  'teacher_provided_explanation_or_example',
  'teacher_provided_practice_question',
  'student_assignment_or_completed_response',
  'student_interpretation_or_analytical_argument',
  'literary_evidence_or_quotation',
  'reference_information',
  'unverified_or_ambiguous_information',
]);
const allowedVerifications = new Set(['checked_pdf_text', 'checked_page_image', 'not_independently_verified', 'needs_review']);

for (const record of records) {
  if (typeof record.id !== 'string' || recordIds.has(record.id)) fail(`Missing or duplicate record ID: ${record.id}`);
  recordIds.add(record.id);
  if (!allowedClassifications.has(record.classification)) fail(`Invalid classification on ${record.id}.`);
  if (!allowedVerifications.has(record.verificationStatus)) fail(`Invalid verification status on ${record.id}.`);
  const pageCount = sourceDocuments.get(record.source?.documentId);
  if (!pageCount || !Array.isArray(record.source.pdfPages) || !record.source.pdfPages.length
    || !record.source.pdfPages.every((page) => Number.isInteger(page) && page >= 1 && page <= pageCount)) {
    fail(`Invalid source provenance on ${record.id}.`);
  }
  for (const quote of record.quotations ?? []) {
    if (quote.classification !== 'literary_evidence_or_quotation' || typeof quote.exactWording !== 'string'
      || !allowedVerifications.has(quote.verificationStatus)) fail(`Invalid quotation on ${record.id}.`);
  }
  for (const question of record.practiceQuestions ?? []) {
    if (typeof question.id !== 'string' || questionIds.has(question.id)) fail(`Missing or duplicate practice question ID: ${question.id}`);
    questionIds.add(question.id);
    if (question.printedAnswer !== undefined && !['printed_unreviewed', 'source_checked', 'withheld_pending_review'].includes(question.answerStatus)) {
      fail(`Printed answer ${question.id} lacks a valid review status.`);
    }
  }
}

for (const record of records) {
  for (const relatedId of record.relatedRecordIds ?? []) {
    if (!recordIds.has(relatedId)) fail(`${record.id} references unknown record ${relatedId}.`);
  }
  for (const term of record.termEntries ?? []) {
    for (const reference of [
      ...(term.teacherDefinitionRecordIds ?? []),
      ...(term.studentDefinitionRecordIds ?? []),
      ...(term.classExampleRecordIds ?? []),
      ...(term.commonConfusionRecordIds ?? []),
    ]) {
      if (!recordIds.has(reference)) fail(`Term ${term.id} references unknown record ${reference}.`);
    }
    for (const questionId of term.practiceQuestionIds ?? []) {
      if (!questionIds.has(questionId)) fail(`Term ${term.id} references unknown question ${questionId}.`);
    }
  }
}

const recordById = new Map(records.map((record) => [record.id, record]));
for (const id of manifest.examMap.componentRecordIds) {
  const record = recordById.get(id);
  if (!record || typeof record.summary !== 'string' || !Number.isInteger(record.examPoints)) {
    fail(`Exam map component ${id} is missing its source record, summary, or point value.`);
  }
}
if (!recordById.has(manifest.examMap.separateNoticeRecordId)) {
  fail('Exam map references an unknown separate close-reading notice.');
}

const mappedPages = sourceMap.groups.flatMap(({ pages, recordIds: groupRecordIds }) => {
  if (!Array.isArray(pages) || pages.length !== 2 || !pages.every(Number.isInteger) || pages[0] < 1 || pages[1] < pages[0]) {
    fail('Source map contains an invalid page range.');
  }
  for (const id of groupRecordIds) {
    if (!recordIds.has(id)) fail(`Source map references unknown record ${id}.`);
  }
  return Array.from({ length: pages[1] - pages[0] + 1 }, (_, index) => pages[0] + index);
});
const sourcePageCount = sourceDocuments.get(sourceMap.sourceDocumentId);
if (sourceMap.coverage?.pageCount !== sourcePageCount || mappedPages.length !== sourcePageCount
  || new Set(mappedPages).size !== sourcePageCount
  || Array.from({ length: sourcePageCount }, (_, index) => index + 1).some((page) => !mappedPages.includes(page))) {
  fail('Source map does not cover every page exactly once.');
}

if (!manifest.phase4Files || typeof manifest.phase4Files !== 'object') fail('Manifest is missing Phase 4 content paths.');
const phase4Data = Object.fromEntries(await Promise.all(Object.entries(manifest.phase4Files).map(async ([key, file]) => {
  if (typeof file !== 'string' || file.startsWith('/') || file.includes('..')) fail(`Invalid Phase 4 path: ${file}`);
  const value = JSON.parse(await readFile(path.join(contentRoot, file), 'utf8'));
  if (!Array.isArray(value)) fail(`Phase 4 file ${file} must contain an array.`);
  return [key, value];
})));
if (Object.keys(phase4Data).length !== 5) fail('Manifest must identify five Phase 4 content files.');

const novels = ['1984', 'catcher-in-the-rye', 'metamorphosis', 'glass-castle'];
const unique = (values, label) => {
  if (new Set(values).size !== values.length) fail(`Duplicate ${label}.`);
};
const guides = phase4Data.novelGuides;
unique(guides.map(({ id }) => id), 'novel guide ID');
unique(guides.map(({ novel }) => novel), 'novel guide work');
if (guides.length !== novels.length || !novels.every((novel) => guides.some((guide) => guide.novel === novel))) {
  fail('Phase 4 must contain one guide for each required novel.');
}
for (const guide of guides) {
  if (!['source_limited', 'ready_for_review', 'complete'].includes(guide.status)
    || !Array.isArray(guide.coverageNotes) || guide.coverageNotes.length === 0
    || !guide.studentInterpretationRecordIds.every((id) => recordIds.has(id))) {
    fail(`Novel guide ${guide.id} is missing review status, coverage notes, or student records.`);
  }
  unique(guide.plotChronology.map(({ order }) => String(order)), `plot order in ${guide.id}`);
  unique(guide.plotChronology.map(({ event }) => event.id), `plot event ID in ${guide.id}`);
  if (guide.status === 'complete' && Object.values(guide.coverage).some((status) => ['partial', 'missing'].includes(status))) {
    fail(`Novel guide ${guide.id} cannot be complete with partial or missing coverage.`);
  }
}

const evidence = phase4Data.evidenceRepository;
unique(evidence.map(({ id }) => id), 'evidence ID');
const evidenceById = new Map(evidence.map((entry) => [entry.id, entry]));
for (const entry of evidence) {
  const record = recordById.get(entry.sourceRecordId);
  if (!novels.includes(entry.novel) || !record || !Number.isInteger(entry.quotationIndex)
    || !record.quotations?.[entry.quotationIndex] || !Array.isArray(entry.tags) || !Array.isArray(entry.useCases)) {
    fail(`Evidence entry ${entry.id} does not resolve to a source quotation.`);
  }
}

const modules = phase4Data.examPreparation;
unique(modules.map(({ componentRecordId }) => componentRecordId), 'exam-preparation component');
if (modules.length !== manifest.examMap.componentRecordIds.length
  || !manifest.examMap.componentRecordIds.every((id) => modules.some((module) => module.componentRecordId === id))) {
  fail('Phase 4 must include one preparation module per exam component.');
}
for (const module of modules) {
  if (!recordIds.has(module.componentRecordId) || typeof module.title !== 'string' || !module.sourceLimitations?.length) {
    fail(`Exam preparation module ${module.id} is missing its component or source limits.`);
  }
}

const termEntries = records.flatMap((record) => record.termEntries ?? []);
const terms = phase4Data.literaryTerms;
unique(terms.map(({ termId }) => termId), 'literary term guide');
if (terms.length !== termEntries.length || !termEntries.every((sourceTerm) => terms.some((guide) => guide.termId === sourceTerm.id))) {
  fail('Phase 4 must cover all listed literary-term entries, including duplicates.');
}
for (const guide of terms) {
  const sourceTerm = termEntries.find((term) => term.id === guide.termId);
  if (!sourceTerm || sourceTerm.definitionStatus !== guide.sourceDefinitionStatus
    || !(sourceTerm.teacherDefinitionRecordIds ?? []).every((id) => guide.classDefinitionRecordIds.includes(id))
    || (sourceTerm.teacherDefinitionRecordIds ?? []).length !== guide.classDefinitionRecordIds.length
    || !(sourceTerm.studentDefinitionRecordIds ?? []).every((id) => guide.studentDefinitionRecordIds.includes(id))
    || (sourceTerm.studentDefinitionRecordIds ?? []).length !== guide.studentDefinitionRecordIds.length
    || !(sourceTerm.classExampleRecordIds ?? []).every((id) => guide.classExampleRecordIds.includes(id))
    || (sourceTerm.classExampleRecordIds ?? []).length !== guide.classExampleRecordIds.length) {
    fail(`Literary term ${guide.termId} does not preserve its source definition/example links.`);
  }
}

for (const comparison of phase4Data.comparisons) {
  if (!Array.isArray(comparison.novels) || comparison.novels.length < 2
    || !comparison.novels.every((novel) => novels.includes(novel))
    || !comparison.evidenceIds.every((id) => evidenceById.has(id))) {
    fail(`Comparison ${comparison.id} has invalid novels or evidence references.`);
  }
  for (const novel of comparison.novels) {
    if (!comparison.evidenceIds.some((id) => evidenceById.get(id)?.novel === novel)) {
      fail(`Comparison ${comparison.id} lacks evidence from ${novel}.`);
    }
  }
}

const claimOrigins = new Set(['teacher_material', 'student_work', 'textual_evidence', 'ai_analysis', 'external_reference']);
const sourcePageCounts = new Map(manifest.sourceDocuments.map(({ id, pageCount }) => [id, pageCount]));
function validateClaims(value) {
  if (Array.isArray(value)) {
    value.forEach(validateClaims);
    return;
  }
  if (!value || typeof value !== 'object') return;
  if ('origin' in value || 'sourceRecordIds' in value) {
    if (typeof value.id !== 'string' || typeof value.text !== 'string' || !value.text.trim()
      || !claimOrigins.has(value.origin) || !Array.isArray(value.sourceRecordIds)
      || !value.sourceRecordIds.every((id) => recordIds.has(id))) {
      fail(`Invalid or unsourced Phase 4 claim: ${value.id ?? '(missing ID)'}.`);
    }
    if (value.sourceDocuments !== undefined && (!Array.isArray(value.sourceDocuments) || !value.sourceDocuments.every((source) => {
      const count = sourcePageCounts.get(source.documentId);
      return count && Array.isArray(source.pdfPages) && source.pdfPages.length > 0
        && source.pdfPages.every((page) => Number.isInteger(page) && page >= 1 && page <= count);
    }))) fail(`Claim ${value.id} has invalid document/page provenance.`);
    if (value.evidenceIds !== undefined && (!Array.isArray(value.evidenceIds) || !value.evidenceIds.every((id) => evidenceById.has(id)))) {
      fail(`Claim ${value.id} references unknown evidence.`);
    }
    if (value.sourceRecordIds.length === 0 && !value.sourceDocuments?.length && !value.evidenceIds?.length) {
      fail(`Claim ${value.id} has no source.`);
    }
    const linked = value.sourceRecordIds.map((id) => recordById.get(id));
    if (value.origin === 'teacher_material' && !linked.some((record) => record && [
      'teacher_instruction_or_exam_requirement', 'teacher_provided_explanation_or_example', 'teacher_provided_practice_question',
    ].includes(record.classification))) fail(`Teacher claim ${value.id} is not linked to teacher-provided material.`);
    if (value.origin === 'student_work' && !linked.some((record) => record && [
      'student_assignment_or_completed_response', 'student_interpretation_or_analytical_argument',
    ].includes(record.classification))) fail(`Student claim ${value.id} is not linked to student work.`);
    if (value.origin === 'external_reference' && !value.sourceDocuments?.length) fail(`External claim ${value.id} needs a document citation.`);
  }
  Object.values(value).forEach(validateClaims);
}
validateClaims(phase4Data);

if (!manifest.phase45Files || typeof manifest.phase45Files.questionBank !== 'string'
  || manifest.phase45Files.questionBank.startsWith('/') || manifest.phase45Files.questionBank.includes('..')) {
  fail('Manifest is missing a valid Phase 4.5 question-bank path.');
}
const bankPath = path.join(contentRoot, manifest.phase45Files.questionBank);
const bank = JSON.parse(await readFile(bankPath, 'utf8'));
const examSections = [
  'novel-comparison',
  'argumentative-writing',
  'poem-analysis',
  'passage-annotation',
  'literary-terms',
  'poetry-multiple-choice',
];
const difficulties = new Set(['foundational', 'intermediate', 'advanced']);
const formats = new Set([
  'single_answer_multiple_choice',
  'multiple_answer',
  'short_answer',
  'comparative_analysis',
  'thesis_evaluation',
  'poem_analysis',
  'passage_annotation',
]);
const questionOrigins = new Set(['original_practice', 'source_based_practice', 'student_interpretation_prompt']);
if (bank.schemaVersion !== 1 || bank.shortAnswerScoring !== 'none'
  || !Array.isArray(bank.sections) || !Array.isArray(bank.questions)) {
  fail('Phase 4.5 bank has an unsupported schema or enables short-answer scoring.');
}
if (bank.sections.length !== examSections.length || !examSections.every((id) => bank.sections.some((section) => section.id === id))) {
  fail('Phase 4.5 bank must define exactly the six listed exam sections.');
}
const expectedSectionRecords = new Map(examSections.map((id, index) => [
  id,
  { recordId: manifest.examMap.componentRecordIds[index], points: recordById.get(manifest.examMap.componentRecordIds[index])?.examPoints },
]));
for (const section of bank.sections) {
  const expected = expectedSectionRecords.get(section.id);
  if (!expected || section.teacherRequirementRecordId !== expected.recordId || section.pointValue !== expected.points
    || !Number.isInteger(section.questionCount) || section.questionCount < 1 || typeof section.label !== 'string') {
    fail(`Phase 4.5 section ${section.id} does not match the teacher's exam requirement.`);
  }
}
const bankQuestionIds = new Set();
const questionCounts = new Map(examSections.map((id) => [id, 0]));
const coveredTermIds = new Set();
const allowedNovels = new Set(novels);
for (const question of bank.questions) {
  if (typeof question.id !== 'string' || !question.id.trim() || bankQuestionIds.has(question.id)) {
    fail(`Missing or duplicate Phase 4.5 question ID: ${question.id}`);
  }
  bankQuestionIds.add(question.id);
  if (!questionCounts.has(question.section) || !difficulties.has(question.difficulty) || !formats.has(question.format)
    || !questionOrigins.has(question.origin) || typeof question.prompt !== 'string' || !question.prompt.trim()
    || !Array.isArray(question.topics) || question.topics.length === 0
    || !Array.isArray(question.novels) || !question.novels.every((novel) => allowedNovels.has(novel))
    || !Array.isArray(question.sourceRecordIds) || question.sourceRecordIds.length === 0
    || !question.sourceRecordIds.every((id) => recordIds.has(id))
    || !Array.isArray(question.evidenceIds) || !question.evidenceIds.every((id) => evidenceById.has(id))
    || !Array.isArray(question.sourceDocuments) || !question.sourceDocuments.every((source) => {
      const count = sourcePageCounts.get(source.documentId);
      return count && Array.isArray(source.pdfPages) && source.pdfPages.length > 0
        && source.pdfPages.every((page) => Number.isInteger(page) && page >= 1 && page <= count);
    })) {
    fail(`Phase 4.5 question ${question.id} is missing required content or valid provenance.`);
  }
  if (!question.validation || question.validation.status !== 'validated'
    || typeof question.validation.reviewSummary !== 'string' || !question.validation.reviewSummary.trim()) {
    fail(`Phase 4.5 question ${question.id} has not passed documented review.`);
  }
  const key = question.answerKey;
  if (!key || typeof key.explanation !== 'string' || !key.explanation.trim()
    || !['teacher_material', 'student_work', 'phase4_analysis', 'literary_evidence', 'original_material', 'mixed'].includes(key.basis)
    || typeof key.sourceNote !== 'string' || !key.sourceNote.trim()) {
    fail(`Phase 4.5 question ${question.id} needs a reasoned, source-labeled answer key.`);
  }
  const needsMaterial = ['poem_analysis', 'passage_annotation'].includes(question.format)
    || (question.section === 'poetry-multiple-choice' && question.format !== 'short_answer');
  if (needsMaterial && (!question.material || !['original_poem', 'original_passage', 'source_evidence'].includes(question.material.kind)
    || typeof question.material.title !== 'string' || !question.material.title.trim()
    || typeof question.material.text !== 'string' || !question.material.text.trim()
    || typeof question.material.attribution !== 'string' || !question.material.attribution.trim())) {
    fail(`Passage-based question ${question.id} must include its complete material and attribution.`);
  }
  if (question.material?.kind?.startsWith('original_') && question.origin !== 'original_practice') {
    fail(`Original material on ${question.id} must be labeled as original practice.`);
  }
  if (['single_answer_multiple_choice', 'multiple_answer'].includes(question.format)) {
    if (!Array.isArray(question.choices) || question.choices.length < 3
      || !question.choices.every((choice) => typeof choice.label === 'string' && choice.label.trim()
        && typeof choice.text === 'string' && choice.text.trim()
        && typeof choice.rationale === 'string' && choice.rationale.trim())
      || new Set(question.choices.map(({ label }) => label)).size !== question.choices.length) {
      fail(`Multiple-choice question ${question.id} has invalid choices.`);
    }
    const labels = new Set(question.choices.map(({ label }) => label));
    if (!Array.isArray(key.correctChoices) || key.correctChoices.length === 0
      || !key.correctChoices.every((label) => labels.has(label))
      || (question.format === 'single_answer_multiple_choice' && key.correctChoices.length !== 1)
      || question.choices.some((choice) => !choice.rationale.trim())) {
      fail(`Multiple-choice question ${question.id} needs a unique key and rationale for every option.`);
    }
  } else if (question.choices !== undefined || typeof key.modelAnswer !== 'string' || !key.modelAnswer.trim()
    || !Array.isArray(key.essentialElements) || key.essentialElements.length === 0
    || !key.essentialElements.every((element) => typeof element === 'string' && element.trim())) {
    fail(`Open-response question ${question.id} needs a model answer and explicit response criteria.`);
  }
  for (const termId of question.termEntryIds ?? []) {
    if (!terms.some((term) => term.termId === termId)) fail(`Question ${question.id} references unknown term entry ${termId}.`);
    coveredTermIds.add(termId);
  }
  questionCounts.set(question.section, questionCounts.get(question.section) + 1);
}
for (const section of bank.sections) {
  if (questionCounts.get(section.id) !== section.questionCount) {
    fail(`Phase 4.5 question count for ${section.id} does not match its section metadata.`);
  }
}
if (coveredTermIds.size !== termEntries.length || !termEntries.every((entry) => coveredTermIds.has(entry.id))) {
  fail('Phase 4.5 bank must cover all 43 printed literary-term entries, including the duplicate point-of-view listing.');
}

console.log(`Validated ${records.length} source records, ${questionIds.size} existing practice questions, ${sourcePageCount} mapped pages, Phase 4 guides (${guides.length}), comparisons (${phase4Data.comparisons.length}), exam modules (${modules.length}), terms (${terms.length}), evidence entries (${evidence.length}), and Phase 4.5 questions (${bank.questions.length}) across six sections.`);
