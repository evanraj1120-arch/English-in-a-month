import type { Classification, ContentManifest, ContentRecord, ContentSourceMap, NovelId, VerificationStatus } from './types';
import { loadPhase4Content } from './phase4-loader';
import { loadPhase45QuestionBank } from './phase45-loader';

const classifications: Classification[] = [
  'teacher_instruction_or_exam_requirement',
  'teacher_provided_explanation_or_example',
  'teacher_provided_practice_question',
  'student_assignment_or_completed_response',
  'student_interpretation_or_analytical_argument',
  'literary_evidence_or_quotation',
  'reference_information',
  'unverified_or_ambiguous_information',
];

const verificationStatuses: VerificationStatus[] = [
  'checked_pdf_text',
  'checked_page_image',
  'not_independently_verified',
  'needs_review',
];

const definitionStatuses = ['teacher_provided', 'student_provided_only', 'missing_in_packet'];
const novelIds: NovelId[] = ['1984', 'catcher-in-the-rye', 'metamorphosis', 'glass-castle'];
const answerStatuses = ['printed_unreviewed', 'source_checked', 'withheld_pending_review'];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function assertRecord(value: unknown, index: number, sourcePageCounts: Map<string, number>): asserts value is ContentRecord {
  if (!isObject(value)) throw new Error(`Content record ${index} must be an object.`);
  for (const key of ['id', 'itemType', 'topic', 'content'] as const) {
    if (typeof value[key] !== 'string' || value[key].trim() === '') {
      throw new Error(`Content record ${index} is missing ${key}.`);
    }
  }
  if (!classifications.includes(value.classification as Classification)) {
    throw new Error(`Content record ${value.id} has an unknown classification.`);
  }
  if (!Array.isArray(value.novels) || !value.novels.every((id) => novelIds.includes(id as NovelId))) {
    throw new Error(`Content record ${value.id} has an invalid novels list.`);
  }
  if (!isObject(value.source) || typeof value.source.documentId !== 'string' || !Array.isArray(value.source.pdfPages)) {
    throw new Error(`Content record ${value.id} must include source document and page provenance.`);
  }
  const pageCount = sourcePageCounts.get(value.source.documentId);
  if (!pageCount) throw new Error(`Content record ${value.id} references an unknown source document.`);
  if (!value.source.pdfPages.every((page) => Number.isInteger(page) && Number(page) > 0 && Number(page) <= pageCount)) {
    throw new Error(`Content record ${value.id} has an invalid PDF page locator.`);
  }
  if (!verificationStatuses.includes(value.verificationStatus as VerificationStatus)) {
    throw new Error(`Content record ${value.id} has an invalid verification status.`);
  }
  if (value.definitionStatus !== undefined && !definitionStatuses.includes(String(value.definitionStatus))) {
    throw new Error(`Content record ${value.id} has an invalid definition status.`);
  }
  if (value.summary !== undefined && (typeof value.summary !== 'string' || value.summary.trim() === '')) {
    throw new Error(`Content record ${value.id} has an invalid summary.`);
  }
  if (value.examPoints !== undefined && (!Number.isInteger(value.examPoints) || Number(value.examPoints) < 0)) {
    throw new Error(`Content record ${value.id} has invalid exam points.`);
  }
  if (value.practiceQuestions !== undefined) {
    if (!Array.isArray(value.practiceQuestions)) throw new Error(`Content record ${value.id} has invalid practice questions.`);
    value.practiceQuestions.forEach((question, questionIndex) => {
      if (!isObject(question) || ['id', 'prompt'].some((key) => typeof question[key] !== 'string' || String(question[key]).trim() === '')) {
        throw new Error(`Content record ${value.id} has an invalid practice question at index ${questionIndex}.`);
      }
      if (question.options !== undefined && (!Array.isArray(question.options) || !question.options.every((option) => (
        isObject(option) && typeof option.label === 'string' && typeof option.text === 'string'
      )))) {
        throw new Error(`Practice question ${question.id} has invalid answer options.`);
      }
      if (question.answerStatus !== undefined && !answerStatuses.includes(String(question.answerStatus))) {
        throw new Error(`Practice question ${question.id} has an invalid answer status.`);
      }
      if (question.printedAnswer !== undefined && question.answerStatus === undefined) {
        throw new Error(`Practice question ${question.id} has a printed answer without a review status.`);
      }
    });
  }
  if (value.quotations !== undefined) {
    if (!Array.isArray(value.quotations)) throw new Error(`Content record ${value.id} has invalid quotation records.`);
    value.quotations.forEach((quotation, quotationIndex) => {
      if (!isObject(quotation) || quotation.classification !== 'literary_evidence_or_quotation'
        || typeof quotation.exactWording !== 'string' || typeof quotation.workOrSource !== 'string'
        || typeof quotation.speakerOrContext !== 'string'
        || !verificationStatuses.includes(quotation.verificationStatus as VerificationStatus)) {
        throw new Error(`Content record ${value.id} has an invalid quotation at index ${quotationIndex}.`);
      }
    });
  }
}

function requireUnique(values: string[], label: string) {
  if (new Set(values).size !== values.length) throw new Error(`Content manifest contains duplicate ${label}.`);
}

export async function loadContentManifest(): Promise<ContentManifest> {
  const response = await fetch(`${import.meta.env.BASE_URL}content/manifest.json`);
  if (!response.ok) throw new Error(`Could not load content manifest (${response.status}).`);
  const manifest: unknown = await response.json();
  if (!isObject(manifest) || manifest.schemaVersion !== 1) throw new Error('Unsupported or invalid content manifest.');
  if (!Array.isArray(manifest.sections) || !Array.isArray(manifest.recordFiles) || !Array.isArray(manifest.sourceDocuments)
    || typeof manifest.sourceMapFile !== 'string' || manifest.sourceMapFile.trim() === ''
    || !isObject(manifest.examMap) || !Array.isArray(manifest.examMap.componentRecordIds)
    || typeof manifest.examMap.separateNoticeRecordId !== 'string' || !isObject(manifest.phase4Files)
    || !isObject(manifest.phase45Files) || typeof manifest.phase45Files.questionBank !== 'string'
    || manifest.phase45Files.questionBank.trim() === '') {
    throw new Error('Content manifest must include sections, recordFiles, sourceDocuments, sourceMapFile, examMap, phase4Files, and phase45Files.');
  }
  if (manifest.phase45Files.questionBank.startsWith('/') || manifest.phase45Files.questionBank.includes('..')) {
    throw new Error('Content manifest contains an invalid Phase 4.5 question-bank path.');
  }

  manifest.sections.forEach((section, index) => {
    if (!isObject(section) || ['id', 'label', 'description'].some((key) => typeof section[key] !== 'string')) {
      throw new Error(`Study section ${index} is missing required labels.`);
    }
    if (!['foundation', 'pending_content'].includes(String(section.state))) {
      throw new Error(`Study section ${section.id} has an invalid state.`);
    }
  });
  manifest.sourceDocuments.forEach((source, index) => {
    if (!isObject(source) || ['id', 'title', 'role'].some((key) => typeof source[key] !== 'string')) {
      throw new Error(`Source document ${index} is missing required labels.`);
    }
    if (!Number.isInteger(source.pageCount) || Number(source.pageCount) < 1) {
      throw new Error(`Source document ${source.id} has an invalid page count.`);
    }
  });

  const sourcePageCounts = new Map(
    manifest.sourceDocuments.map((source) => [String((source as Record<string, unknown>).id), Number((source as Record<string, unknown>).pageCount)]),
  );
  const mapPath = manifest.sourceMapFile;
  if (mapPath.startsWith('/') || mapPath.includes('..')) throw new Error('Content manifest contains an invalid source map path.');
  const mapResponse = await fetch(`${import.meta.env.BASE_URL}content/${mapPath}`);
  if (!mapResponse.ok) throw new Error(`Could not load source map ${mapPath} (${mapResponse.status}).`);
  const rawSourceMap: unknown = await mapResponse.json();
  if (!isObject(rawSourceMap) || rawSourceMap.schemaVersion !== 1 || typeof rawSourceMap.sourceDocumentId !== 'string'
    || !isObject(rawSourceMap.coverage) || !Array.isArray(rawSourceMap.groups) || typeof rawSourceMap.mappingNote !== 'string') {
    throw new Error('Source map has an unsupported or invalid structure.');
  }
  const sourceMap = rawSourceMap as unknown as ContentSourceMap;
  const mappedDocumentPages = sourcePageCounts.get(sourceMap.sourceDocumentId);
  if (!mappedDocumentPages || sourceMap.coverage.pageCount !== mappedDocumentPages
    || sourceMap.coverage.firstPage !== 1 || sourceMap.coverage.lastPage !== mappedDocumentPages
    || sourceMap.coverage.pageRangesAreInclusive !== true || sourceMap.coverage.allPagesReadInOrder !== true) {
    throw new Error('Source map coverage does not match the source document.');
  }

  const files = manifest.recordFiles as unknown[];
  const recordGroups = await Promise.all(files.map(async (file) => {
    if (typeof file !== 'string' || file.startsWith('/') || file.includes('..')) {
      throw new Error('Content manifest contains an invalid record file path.');
    }
    const fileResponse = await fetch(`${import.meta.env.BASE_URL}content/${file}`);
    if (!fileResponse.ok) throw new Error(`Could not load content file ${file} (${fileResponse.status}).`);
    const records: unknown = await fileResponse.json();
    if (!Array.isArray(records)) throw new Error(`Content file ${file} must contain a record array.`);
    return records;
  }));
  const rawRecords: unknown[] = recordGroups.flatMap((group) => group as unknown[]);
  const records: ContentRecord[] = [];
  rawRecords.forEach((record, index) => {
    assertRecord(record, index, sourcePageCounts);
    records.push(record);
  });
  requireUnique(records.map((record) => record.id), 'record IDs');
  requireUnique(manifest.sections.map((section) => (section as Record<string, string>).id), 'section IDs');
  requireUnique(manifest.sourceDocuments.map((source) => (source as Record<string, string>).id), 'source document IDs');

  const recordIds = new Set(records.map((record) => record.id));
  const componentRecordIds = manifest.examMap.componentRecordIds as unknown[];
  if (componentRecordIds.length !== 6 || !componentRecordIds.every((id) => typeof id === 'string')) {
    throw new Error('Exam map must identify the six listed component records.');
  }
  requireUnique(componentRecordIds as string[], 'exam component record IDs');
  for (const id of componentRecordIds as string[]) {
    const record = records.find((item) => item.id === id);
    if (!record || typeof record.summary !== 'string' || typeof record.examPoints !== 'number') {
      throw new Error(`Exam component ${id} is missing its source record, summary, or point value.`);
    }
  }
  if (!recordIds.has(String(manifest.examMap.separateNoticeRecordId))) {
    throw new Error('Exam map references an unknown separate close-reading record.');
  }
  const questionIds: string[] = records.flatMap((record) => record.practiceQuestions?.map((question) => question.id) ?? []);
  requireUnique(questionIds, 'practice question IDs');
  const questionIdSet = new Set(questionIds);
  const mappedPages: number[] = [];
  sourceMap.groups.forEach((group, index) => {
    if (!Array.isArray(group.pages) || group.pages.length !== 2 || !group.pages.every(Number.isInteger)
      || typeof group.content !== 'string' || !Array.isArray(group.recordIds)) {
      throw new Error(`Source map group ${index} is invalid.`);
    }
    const [start, end] = group.pages;
    if (start < 1 || end < start || end > mappedDocumentPages) throw new Error(`Source map group ${index} has an invalid page range.`);
    mappedPages.push(...Array.from({ length: end - start + 1 }, (_, offset) => start + offset));
    if (!group.recordIds.every((id) => recordIds.has(id))) {
      throw new Error(`Source map group ${index} references an unknown content record.`);
    }
  });
  if (mappedPages.length !== mappedDocumentPages || new Set(mappedPages).size !== mappedDocumentPages
    || Array.from({ length: mappedDocumentPages }, (_, index) => index + 1).some((page) => !mappedPages.includes(page))) {
    throw new Error('Source map page ranges must cover each source page exactly once.');
  }
  records.forEach((record) => {
    for (const relatedId of record.relatedRecordIds ?? []) {
      if (!recordIds.has(relatedId)) throw new Error(`Content record ${record.id} references unknown record ${relatedId}.`);
    }
    for (const term of record.termEntries ?? []) {
      const references = [
        ...(term.teacherDefinitionRecordIds ?? []),
        ...(term.studentDefinitionRecordIds ?? []),
        ...(term.classExampleRecordIds ?? []),
        ...(term.commonConfusionRecordIds ?? []),
      ];
      if (!references.every((id) => recordIds.has(id))) throw new Error(`Term ${term.id} references an unknown content record.`);
      if (!(term.practiceQuestionIds ?? []).every((id) => questionIdSet.has(id))) throw new Error(`Term ${term.id} references an unknown practice question.`);
    }
  });

  const [phase4Content, phase45Content] = await Promise.all([
    loadPhase4Content(
      manifest.phase4Files as unknown as ContentManifest['phase4Files'],
      records,
      manifest.sourceDocuments as unknown as ContentManifest['sourceDocuments'],
      componentRecordIds as string[],
    ),
    loadPhase45QuestionBank(manifest.phase45Files as unknown as import('./phase45-types').Phase45ContentFiles),
  ]);
  const evidenceIds = new Set(phase4Content.evidenceRepository.map((entry) => entry.id));
  const sourceDocumentMap = new Map(
    (manifest.sourceDocuments as Array<{ id: string; pageCount: number }>).map((source) => [source.id, source.pageCount]),
  );
  phase45Content.questions.forEach((question) => {
    if (!question.sourceRecordIds.every((id) => recordIds.has(id))) {
      throw new Error(`Practice question ${question.id} references an unknown source record.`);
    }
    if (!question.evidenceIds.every((id) => evidenceIds.has(id))) {
      throw new Error(`Practice question ${question.id} references an unknown evidence entry.`);
    }
    question.sourceDocuments.forEach((source) => {
      const pageCount = sourceDocumentMap.get(source.documentId);
      if (!pageCount || !source.pdfPages.every((page) => page <= pageCount)) {
        throw new Error(`Practice question ${question.id} has an invalid source document or page locator.`);
      }
    });
  });
  return { ...manifest, sourceMap, records, phase4Content, phase45Content } as unknown as ContentManifest;
}
