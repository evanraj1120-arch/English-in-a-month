import type {
  ExamSectionId,
  Phase45ContentFiles,
  Phase45Question,
  QuestionBankSection,
  QuestionChoice,
  Phase45QuestionBank,
} from './phase45-types';

const sectionIds: ExamSectionId[] = [
  'novel-comparison',
  'argumentative-writing',
  'poem-analysis',
  'passage-annotation',
  'literary-terms',
  'poetry-multiple-choice',
];
const formats = [
  'single_answer_multiple_choice',
  'multiple_answer',
  'short_answer',
  'comparative_analysis',
  'thesis_evaluation',
  'poem_analysis',
  'passage_annotation',
];
const origins = ['teacher_material', 'student_work', 'phase4_analysis', 'literary_evidence', 'original_material', 'mixed'];
const questionOrigins = ['original_practice', 'source_based_practice', 'student_interpretation_prompt'];
const novels = ['1984', 'catcher-in-the-rye', 'metamorphosis', 'glass-castle'];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isQuestionChoice(value: unknown): value is QuestionChoice {
  return isObject(value) && isNonEmptyString(value.label)
    && isNonEmptyString(value.text) && isNonEmptyString(value.rationale);
}

function isQuestion(value: unknown): value is Phase45Question {
  if (!isObject(value) || !isNonEmptyString(value.id) || !sectionIds.includes(value.section as ExamSectionId)
    || !Array.isArray(value.novels) || !value.novels.every((novel) => novels.includes(String(novel)))
    || !isStringArray(value.topics) || value.topics.length === 0
    || !['foundational', 'intermediate', 'advanced'].includes(String(value.difficulty))
    || !formats.includes(String(value.format)) || !isNonEmptyString(value.prompt)
    || !isStringArray(value.sourceRecordIds) || value.sourceRecordIds.length === 0
    || !isStringArray(value.evidenceIds)
    || !Array.isArray(value.sourceDocuments) || !isObject(value.answerKey)
    || !isNonEmptyString(value.answerKey.explanation)
    || !origins.includes(String(value.answerKey.basis)) || !isNonEmptyString(value.answerKey.sourceNote)
    || !isObject(value.validation) || value.validation.status !== 'validated'
    || !isNonEmptyString(value.validation.reviewSummary)
    || !questionOrigins.includes(String(value.origin))) return false;

  if (value.material !== undefined && (!isObject(value.material)
    || !['original_poem', 'original_passage', 'source_evidence'].includes(String(value.material.kind))
    || !isNonEmptyString(value.material.title) || !isNonEmptyString(value.material.text)
    || !isNonEmptyString(value.material.attribution))) return false;
  if (value.choices !== undefined && (!Array.isArray(value.choices) || !value.choices.every(isQuestionChoice)
    || new Set(value.choices.map(({ label }) => label)).size !== value.choices.length)) return false;
  if (value.termEntryIds !== undefined && !isStringArray(value.termEntryIds)) return false;
  for (const key of ['correctChoices', 'essentialElements', 'acceptableAlternatives', 'commonWeaknesses'] as const) {
    if (value.answerKey[key] !== undefined && !isStringArray(value.answerKey[key])) return false;
  }
  if (value.answerKey.modelAnswer !== undefined && !isNonEmptyString(value.answerKey.modelAnswer)) return false;
  if (!value.sourceDocuments.every((source) => isObject(source) && isNonEmptyString(source.documentId)
    && Array.isArray(source.pdfPages) && source.pdfPages.length > 0
    && source.pdfPages.every((page) => Number.isInteger(page) && Number(page) > 0)
    && (source.note === undefined || typeof source.note === 'string'))) return false;
  const isMultipleChoice = ['single_answer_multiple_choice', 'multiple_answer'].includes(String(value.format));
  if (isMultipleChoice) {
    const choices = value.choices;
    const correctChoices = value.answerKey.correctChoices;
    if (!Array.isArray(choices) || !choices.every(isQuestionChoice) || !Array.isArray(correctChoices)
      || correctChoices.length === 0
      || !correctChoices.every((label) => choices.some((choice) => choice.label === label))
      || (value.format === 'single_answer_multiple_choice' && correctChoices.length !== 1)) return false;
  } else if (value.choices !== undefined || !isNonEmptyString(value.answerKey.modelAnswer)
    || !isStringArray(value.answerKey.essentialElements) || value.answerKey.essentialElements.length === 0) return false;

  return true;
}

function isQuestionBankSection(value: unknown): value is QuestionBankSection {
  return isObject(value) && sectionIds.includes(value.id as ExamSectionId)
    && typeof value.label === 'string' && typeof value.teacherRequirementRecordId === 'string'
    && typeof value.pointValue === 'number' && Number.isInteger(value.pointValue)
    && typeof value.questionCount === 'number' && Number.isInteger(value.questionCount)
    && value.questionCount > 0
    && (value.scopeNote === undefined || typeof value.scopeNote === 'string');
}

function isQuestionBank(value: unknown): value is Phase45QuestionBank {
  if (!isObject(value) || value.schemaVersion !== 1 || value.shortAnswerScoring !== 'none'
    || !Array.isArray(value.sections) || !Array.isArray(value.questions)) return false;
  const sections = value.sections;
  const questions = value.questions;
  if (sections.length !== sectionIds.length || !sections.every(isQuestionBankSection)
    || !sectionIds.every((id) => sections.some((section) => section.id === id))
    || !questions.every(isQuestion)) return false;

  return sections.every((section) => (
    questions.filter((question) => isQuestion(question) && question.section === section.id).length === section.questionCount
  ));
}

export async function loadPhase45QuestionBank(files: Phase45ContentFiles): Promise<Phase45QuestionBank> {
  const file = files.questionBank;
  if (typeof file !== 'string' || file.trim() === '' || file.startsWith('/') || file.includes('..')) {
    throw new Error('Content manifest contains an invalid Phase 4.5 question-bank path.');
  }
  const response = await fetch(`${import.meta.env.BASE_URL}content/${file}`);
  if (!response.ok) throw new Error(`Could not load Phase 4.5 question bank ${file} (${response.status}).`);
  const value: unknown = await response.json();
  if (!isQuestionBank(value)) throw new Error('Phase 4.5 question bank has an invalid or unsupported structure.');
  return value;
}
