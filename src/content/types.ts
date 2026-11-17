export type Classification =
  | 'teacher_instruction_or_exam_requirement'
  | 'teacher_provided_explanation_or_example'
  | 'teacher_provided_practice_question'
  | 'student_assignment_or_completed_response'
  | 'student_interpretation_or_analytical_argument'
  | 'literary_evidence_or_quotation'
  | 'reference_information'
  | 'unverified_or_ambiguous_information';

export type VerificationStatus =
  | 'checked_pdf_text'
  | 'checked_page_image'
  | 'not_independently_verified'
  | 'needs_review';

export type DefinitionStatus = 'teacher_provided' | 'student_provided_only' | 'missing_in_packet';

export type NovelId =
  | '1984'
  | 'catcher-in-the-rye'
  | 'metamorphosis'
  | 'glass-castle';

export interface SourceLocator {
  documentId: string;
  pdfPages: number[];
  assignmentName?: string;
  section?: string;
  bookCitation?: string;
  editionNote?: string;
}

export interface LiteraryQuotation {
  classification: 'literary_evidence_or_quotation';
  exactWording: string;
  workOrSource: string;
  speakerOrContext: string;
  bookCitationAsSupplied?: string;
  associatedInterpretationId?: string;
  verificationStatus: VerificationStatus;
  uncertainty?: string;
}

export interface PracticeQuestion {
  id: string;
  prompt: string;
  options?: Array<{ label: string; text: string }>;
  printedAnswer?: string;
  answerStatus?: 'printed_unreviewed' | 'source_checked' | 'withheld_pending_review';
  teacherCriteria?: string[];
}

export interface TermEntry {
  id: string;
  term: string;
  classification: Classification;
  definitionStatus: DefinitionStatus;
  teacherDefinition?: string;
  teacherDefinitionRecordIds?: string[];
  studentDefinitionRecordIds: string[];
  classExampleRecordIds: string[];
  commonConfusionsStatus: 'not_stated_in_packet' | 'recorded_from_packet';
  commonConfusionRecordIds: string[];
  practiceQuestionIds: string[];
  note?: string;
}

export interface ContentRecord {
  id: string;
  classification: Classification;
  itemType: string;
  topic: string;
  summary?: string;
  examPoints?: number;
  novels: NovelId[];
  source: SourceLocator;
  content: string;
  definitionStatus?: DefinitionStatus;
  teacherDefinition?: string;
  studentDefinition?: string;
  practiceQuestions?: PracticeQuestion[];
  termEntries?: TermEntry[];
  quotations?: LiteraryQuotation[];
  relatedRecordIds?: string[];
  verificationStatus: VerificationStatus;
  uncertainty?: string;
}

export interface StudySection {
  id: string;
  label: string;
  description: string;
  state: 'foundation' | 'pending_content';
}

export interface SourceDocument {
  id: string;
  title: string;
  pageCount: number;
  role: string;
}

export interface SourceMapGroup {
  pages: [number, number];
  content: string;
  recordIds: string[];
}

export interface ContentSourceMap {
  schemaVersion: 1;
  sourceDocumentId: string;
  coverage: {
    pageCount: number;
    firstPage: number;
    lastPage: number;
    pageRangesAreInclusive: boolean;
    allPagesReadInOrder: boolean;
    imageOnlyPagesVisuallyReviewed: number[];
    additionalEmbeddedImagePagesVisuallyReviewed: number[];
  };
  mappingNote: string;
  groups: SourceMapGroup[];
}

export interface ContentManifest {
  schemaVersion: 1;
  sourceDocuments: SourceDocument[];
  sections: StudySection[];
  recordFiles: string[];
  phase4Files: Phase4ContentFiles;
  phase45Files: { questionBank: string };
  sourceMapFile: string;
  examMap: {
    componentRecordIds: string[];
    separateNoticeRecordId: string;
  };
  sourceMap: ContentSourceMap;
  records: ContentRecord[];
  phase4Content: Phase4Content;
  phase45Content: import('./phase45-types').Phase45QuestionBank;
}

export type ClaimOrigin =
  | 'teacher_material'
  | 'student_work'
  | 'textual_evidence'
  | 'ai_analysis'
  | 'external_reference';

export type CoverageStatus = 'supported' | 'partial' | 'missing' | 'not_applicable';

export interface Phase4SourceReference {
  documentId: string;
  pdfPages: number[];
  note?: string;
}

export interface StudyClaim {
  id: string;
  text: string;
  origin: ClaimOrigin;
  sourceRecordIds: string[];
  sourceDocuments?: Phase4SourceReference[];
  evidenceIds?: string[];
  uncertainty?: string;
}

export interface PlotPoint {
  order: number;
  event: StudyClaim;
  significance?: StudyClaim;
}

export interface CharacterStudy {
  name: string;
  profile: StudyClaim;
  traits: StudyClaim[];
  motivations: StudyClaim[];
  conflicts: StudyClaim[];
  relationships: StudyClaim[];
  development: StudyClaim[];
  themeConnections: StudyClaim[];
  evidenceIds: string[];
  studentInterpretationRecordIds: string[];
}

export interface ThemeStudy {
  name: string;
  centralIdea: StudyClaim;
  development: StudyClaim[];
  evidenceIds: string[];
  nuance: StudyClaim[];
}

export interface SymbolStudy {
  objectOrMotif: string;
  literalPresence: StudyClaim;
  developingMeanings: StudyClaim[];
  characterAndThemeLinks: StudyClaim[];
  evidenceIds: string[];
}

export interface LiteraryElementStudy {
  element: string;
  function: StudyClaim;
  evidenceIds: string[];
}

export interface NovelStudyGuide {
  id: string;
  novel: NovelId;
  status: 'source_limited' | 'ready_for_review' | 'complete';
  overview: StudyClaim[];
  plotChronology: PlotPoint[];
  settings: StudyClaim[];
  characters: CharacterStudy[];
  themes: ThemeStudy[];
  symbolsAndMotifs: SymbolStudy[];
  literaryElements: LiteraryElementStudy[];
  studentInterpretationRecordIds: string[];
  coverage: {
    plot: CoverageStatus;
    characters: CoverageStatus;
    settings: CoverageStatus;
    themes: CoverageStatus;
    symbolsAndMotifs: CoverageStatus;
    literaryElements: CoverageStatus;
    evidence: CoverageStatus;
  };
  coverageNotes: string[];
}

export interface EvidenceRepositoryEntry {
  id: string;
  novel: NovelId;
  sourceRecordId: string;
  quotationIndex: number;
  tags: string[];
  useCases: StudyClaim[];
}

export interface CrossNovelComparison {
  id: string;
  novels: NovelId[];
  claim: StudyClaim;
  explanation: StudyClaim[];
  evidenceIds: string[];
  counterargument: StudyClaim;
  limitation: string;
  adaptableThesis: StudyClaim;
}

export interface ExamPreparationModule {
  id: string;
  componentRecordId: string;
  title: string;
  teacherRequirements: StudyClaim[];
  method: StudyClaim[];
  modelAnalysis: StudyClaim[];
  commonErrors: StudyClaim[];
  sourceLimitations: string[];
}

export interface LiteraryTermStudy {
  termId: string;
  classDefinitionRecordIds: string[];
  studentDefinitionRecordIds: string[];
  classExampleRecordIds: string[];
  workingDefinition: StudyClaim;
  distinguishingFeatures: StudyClaim[];
  example: StudyClaim;
  literaryFunction: StudyClaim;
  commonConfusions: StudyClaim[];
  sourceDefinitionStatus: DefinitionStatus;
}

export interface Phase4Content {
  novelGuides: NovelStudyGuide[];
  comparisons: CrossNovelComparison[];
  examPreparation: ExamPreparationModule[];
  literaryTerms: LiteraryTermStudy[];
  evidenceRepository: EvidenceRepositoryEntry[];
}

export interface Phase4ContentFiles {
  novelGuides: string;
  comparisons: string;
  examPreparation: string;
  literaryTerms: string;
  evidenceRepository: string;
}
