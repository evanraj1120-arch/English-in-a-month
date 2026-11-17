import type { NovelId, Phase4SourceReference } from './types';

export type ExamSectionId =
  | 'novel-comparison'
  | 'argumentative-writing'
  | 'poem-analysis'
  | 'passage-annotation'
  | 'literary-terms'
  | 'poetry-multiple-choice';

export type QuestionDifficulty = 'foundational' | 'intermediate' | 'advanced';

export type QuestionFormat =
  | 'single_answer_multiple_choice'
  | 'multiple_answer'
  | 'short_answer'
  | 'comparative_analysis'
  | 'thesis_evaluation'
  | 'poem_analysis'
  | 'passage_annotation';

export interface QuestionChoice {
  label: string;
  text: string;
  rationale: string;
}

export interface QuestionAnswerKey {
  explanation: string;
  basis: 'teacher_material' | 'student_work' | 'phase4_analysis' | 'literary_evidence' | 'original_material' | 'mixed';
  sourceNote: string;
  correctChoices?: string[];
  modelAnswer?: string;
  essentialElements?: string[];
  acceptableAlternatives?: string[];
  commonWeaknesses?: string[];
}

export interface QuestionMaterial {
  kind: 'original_poem' | 'original_passage' | 'source_evidence';
  title: string;
  text: string;
  attribution: string;
}

export interface Phase45Question {
  id: string;
  section: ExamSectionId;
  novels: NovelId[];
  topics: string[];
  difficulty: QuestionDifficulty;
  format: QuestionFormat;
  prompt: string;
  material?: QuestionMaterial;
  choices?: QuestionChoice[];
  answerKey: QuestionAnswerKey;
  termEntryIds?: string[];
  sourceRecordIds: string[];
  evidenceIds: string[];
  sourceDocuments: Phase4SourceReference[];
  origin: 'original_practice' | 'source_based_practice' | 'student_interpretation_prompt';
  validation: {
    status: 'validated' | 'needs_review';
    reviewSummary: string;
  };
}

export interface QuestionBankSection {
  id: ExamSectionId;
  label: string;
  teacherRequirementRecordId: string;
  pointValue: number;
  questionCount: number;
  scopeNote?: string;
}

export interface Phase45QuestionBank {
  schemaVersion: 1;
  shortAnswerScoring: 'none';
  sections: QuestionBankSection[];
  questions: Phase45Question[];
}

export interface Phase45ContentFiles {
  questionBank: string;
}
