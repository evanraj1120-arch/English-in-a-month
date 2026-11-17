import type {
  ClaimOrigin,
  ContentRecord,
  DefinitionStatus,
  ExamPreparationModule,
  Phase4Content,
  Phase4ContentFiles,
  SourceDocument,
} from './types';

const claimOrigins: ClaimOrigin[] = [
  'teacher_material',
  'student_work',
  'textual_evidence',
  'ai_analysis',
  'external_reference',
];

const novels = ['1984', 'catcher-in-the-rye', 'metamorphosis', 'glass-castle'];
const definitionStatuses: DefinitionStatus[] = ['teacher_provided', 'student_provided_only', 'missing_in_packet'];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function requireUnique(values: string[], label: string) {
  if (new Set(values).size !== values.length) throw new Error(`Phase 4 contains duplicate ${label}.`);
}

function validateClaims(
  value: unknown,
  recordIds: Set<string>,
  evidenceIds: Set<string>,
  documentPageCounts: Map<string, number>,
  recordById: Map<string, ContentRecord>,
) {
  if (Array.isArray(value)) {
    value.forEach((item) => validateClaims(item, recordIds, evidenceIds, documentPageCounts, recordById));
    return;
  }
  if (!isObject(value)) return;

  if ('origin' in value || 'sourceRecordIds' in value) {
    if (typeof value.id !== 'string' || typeof value.text !== 'string' || value.text.trim() === ''
      || !claimOrigins.includes(value.origin as ClaimOrigin) || !Array.isArray(value.sourceRecordIds)) {
      throw new Error('Phase 4 contains an invalid sourced claim.');
    }
    if (!value.sourceRecordIds.every((id) => typeof id === 'string' && recordIds.has(id))) {
      throw new Error(`Phase 4 claim ${value.id} references an unknown source record.`);
    }
    if (value.sourceDocuments !== undefined && (!Array.isArray(value.sourceDocuments) || !value.sourceDocuments.every((source) => {
      if (!isObject(source) || typeof source.documentId !== 'string' || !Array.isArray(source.pdfPages)) return false;
      const pageCount = documentPageCounts.get(source.documentId);
      return pageCount !== undefined && source.pdfPages.length > 0
        && source.pdfPages.every((page) => Number.isInteger(page) && Number(page) >= 1 && Number(page) <= pageCount);
    }))) {
      throw new Error(`Phase 4 claim ${value.id} has invalid source-document pages.`);
    }
    if (value.evidenceIds !== undefined && (!Array.isArray(value.evidenceIds)
      || !value.evidenceIds.every((id) => typeof id === 'string' && evidenceIds.has(id)))) {
      throw new Error(`Phase 4 claim ${value.id} references unknown evidence.`);
    }
    const hasSource = value.sourceRecordIds.length > 0
      || (Array.isArray(value.sourceDocuments) && value.sourceDocuments.length > 0)
      || (Array.isArray(value.evidenceIds) && value.evidenceIds.length > 0);
    if (!hasSource) throw new Error(`Phase 4 claim ${value.id} has no source or evidence reference.`);
    const linkedRecords = value.sourceRecordIds.map((id) => recordById.get(String(id)));
    if (value.origin === 'teacher_material' && !linkedRecords.some((record) => record && [
      'teacher_instruction_or_exam_requirement',
      'teacher_provided_explanation_or_example',
      'teacher_provided_practice_question',
    ].includes(record.classification))) {
      throw new Error(`Teacher-material claim ${value.id} is not linked to teacher-provided source content.`);
    }
    if (value.origin === 'student_work' && !linkedRecords.some((record) => record && [
      'student_assignment_or_completed_response',
      'student_interpretation_or_analytical_argument',
    ].includes(record.classification))) {
      throw new Error(`Student-work claim ${value.id} is not linked to a student source record.`);
    }
    if (value.origin === 'external_reference' && (!Array.isArray(value.sourceDocuments) || value.sourceDocuments.length === 0)) {
      throw new Error(`External-reference claim ${value.id} must cite its source document.`);
    }
  }

  Object.values(value).forEach((item) => validateClaims(item, recordIds, evidenceIds, documentPageCounts, recordById));
}

export async function loadPhase4Content(
  files: Phase4ContentFiles,
  records: ContentRecord[],
  sourceDocuments: SourceDocument[],
  examComponentRecordIds: string[],
): Promise<Phase4Content> {
  const fileEntries = Object.entries(files) as Array<[keyof Phase4ContentFiles, string]>;
  if (fileEntries.length !== 5 || fileEntries.some(([, file]) => (
    typeof file !== 'string' || file.trim() === '' || file.startsWith('/') || file.includes('..')
  ))) {
    throw new Error('Content manifest contains invalid Phase 4 content paths.');
  }

  const loaded = await Promise.all(fileEntries.map(async ([key, file]) => {
    const response = await fetch(`${import.meta.env.BASE_URL}content/${file}`);
    if (!response.ok) throw new Error(`Could not load Phase 4 content file ${file} (${response.status}).`);
    const value: unknown = await response.json();
    if (!Array.isArray(value)) throw new Error(`Phase 4 content file ${file} must contain an array.`);
    return [key, value] as const;
  }));
  const content = Object.fromEntries(loaded) as unknown as Phase4Content;

  const recordById = new Map(records.map((record) => [record.id, record]));
  const recordIds = new Set(recordById.keys());
  const documentPageCounts = new Map(sourceDocuments.map((source) => [source.id, source.pageCount]));

  requireUnique(content.novelGuides.map((guide) => guide.id), 'novel guide IDs');
  requireUnique(content.novelGuides.map((guide) => guide.novel), 'novel guide works');
  if (content.novelGuides.length !== novels.length || !novels.every((novel) => (
    content.novelGuides.some((guide) => guide.novel === novel)
  ))) {
    throw new Error('Phase 4 must include one study guide for each required novel.');
  }
  for (const guide of content.novelGuides) {
    if (!['source_limited', 'ready_for_review', 'complete'].includes(guide.status)
      || !Array.isArray(guide.coverageNotes) || guide.coverageNotes.length === 0) {
      throw new Error(`Novel guide ${guide.id} must state its review status and coverage notes.`);
    }
    requireUnique(guide.plotChronology.map(({ order }) => String(order)), `plot orders in ${guide.id}`);
    requireUnique(guide.plotChronology.map(({ event }) => event.id), `plot event IDs in ${guide.id}`);
    if (!guide.studentInterpretationRecordIds.every((id) => recordIds.has(id))) {
      throw new Error(`Novel guide ${guide.id} references an unknown student interpretation.`);
    }
    if (guide.status === 'complete' && Object.values(guide.coverage).some((status) => status === 'partial' || status === 'missing')) {
      throw new Error(`Novel guide ${guide.id} cannot be complete with unsupported required coverage.`);
    }
  }

  requireUnique(content.evidenceRepository.map((entry) => entry.id), 'evidence IDs');
  const evidenceIds = new Set(content.evidenceRepository.map((entry) => entry.id));
  for (const entry of content.evidenceRepository) {
    const record = recordById.get(entry.sourceRecordId);
    if (!novels.includes(entry.novel) || !record || !Number.isInteger(entry.quotationIndex)
      || !record.quotations || !record.quotations[entry.quotationIndex]
      || !Array.isArray(entry.tags) || !Array.isArray(entry.useCases)) {
      throw new Error(`Evidence entry ${entry.id} does not resolve to a source quotation.`);
    }
  }

  requireUnique(content.examPreparation.map((module) => module.componentRecordId), 'exam-preparation components');
  if (content.examPreparation.length !== examComponentRecordIds.length
    || !examComponentRecordIds.every((id) => content.examPreparation.some((module) => module.componentRecordId === id))) {
    throw new Error('Phase 4 must include one preparation module for each listed exam component.');
  }
  for (const module of content.examPreparation as ExamPreparationModule[]) {
    if (!recordIds.has(module.componentRecordId) || typeof module.title !== 'string' || module.sourceLimitations.length === 0) {
      throw new Error(`Exam preparation module ${module.id} is missing its requirement or source limits.`);
    }
  }

  const termRecords = records.flatMap((record) => record.termEntries ?? []);
  const termById = new Map(termRecords.map((term) => [term.id, term]));
  const termIds = termRecords.map((term) => term.id);
  requireUnique(content.literaryTerms.map((term) => term.termId), 'literary term guides');
  if (content.literaryTerms.length !== termIds.length || !termIds.every((id) => (
    content.literaryTerms.some((term) => term.termId === id)
  ))) {
    throw new Error('Phase 4 must cover every teacher-listed literary-term entry, preserving duplicates.');
  }
  if (!content.literaryTerms.every((term) => definitionStatuses.includes(term.sourceDefinitionStatus))) {
    throw new Error('Phase 4 contains an invalid literary-term source-definition status.');
  }
  for (const guide of content.literaryTerms) {
    const sourceTerm = termById.get(guide.termId);
    if (!sourceTerm
      || sourceTerm.definitionStatus !== guide.sourceDefinitionStatus
      || (sourceTerm.teacherDefinitionRecordIds ?? []).length !== guide.classDefinitionRecordIds.length
      || !(sourceTerm.teacherDefinitionRecordIds ?? []).every((id) => guide.classDefinitionRecordIds.includes(id))
      || sourceTerm.studentDefinitionRecordIds.length !== guide.studentDefinitionRecordIds.length
      || !sourceTerm.studentDefinitionRecordIds.every((id) => guide.studentDefinitionRecordIds.includes(id))
      || sourceTerm.classExampleRecordIds.length !== guide.classExampleRecordIds.length
      || !sourceTerm.classExampleRecordIds.every((id) => guide.classExampleRecordIds.includes(id))) {
      throw new Error(`Literary term ${guide.termId} does not preserve its class-definition/example links.`);
    }
  }

  for (const comparison of content.comparisons) {
    if (!Array.isArray(comparison.novels) || comparison.novels.length < 2
      || !comparison.novels.every((novel) => novels.includes(novel))
      || !comparison.evidenceIds.every((id) => evidenceIds.has(id))) {
      throw new Error(`Cross-novel comparison ${comparison.id} has invalid works or evidence.`);
    }
    for (const novel of comparison.novels) {
      if (!comparison.evidenceIds.some((id) => content.evidenceRepository.find((item) => item.id === id)?.novel === novel)) {
        throw new Error(`Cross-novel comparison ${comparison.id} lacks evidence from ${novel}.`);
      }
    }
  }

  validateClaims(content, recordIds, evidenceIds, documentPageCounts, recordById);
  return content;
}
