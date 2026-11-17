# Source Extraction and Quality-Control Report

## Scope and method

- Primary source: [H-Eng 10_ MIDTERM.pdf](./H-Eng%2010_%20MIDTERM.pdf), 133 PDF pages. The original source file was not modified.
- All 133 pages were read in order from the PDF text layer. Image-only pages 69–86 were rendered and visually inspected individually. Embedded worksheet images on pages 18, 40, 68, 87, 89, and 91 were also visually checked where relevant.
- Source locations below are PDF page numbers, not printed book-page citations.
- The complete page-range-to-record index is [public/content/source-map.json](./public/content/source-map.json). The map partitions pages 1–133 and notes when content was summarized rather than transcribed.
- The structured database currently has 112 records across nine JSON files: exam requirements, literary-term inventory and references, four novel/reference collections, teacher practice, and class-assignment records. It contains 52 nested quotation/evidence entries, 24 practice questions, and 43 literary-term inventory entries (including the repeated point-of-view listing).

## Successfully represented

- Formal exam review and six listed components; separate 17-point close-reading notice; Two Minutes Hate annotation example; poem-analysis procedure; S-C-E-E-N and test-taking advice.
- Diane Glancy's complete practice-question set and the Allen/Brennan close-reading questions and printed criteria/keys. Printed answers remain identified as unreviewed; no answer key is silently corrected.
- 1984 class themes, Orwell/Oceania/Newspeak notes, assignments, student character/theme/symbol/archetype/detail analyses, and page-cited student evidence as supplied.
- The Glass Castle student archetype, setting, allegory, theme, and symbol work.
- Metamorphosis existentialism, symbol/character/development, annotation, absurdism and theme records; Assignment 11 directions and the completed student Venn comparison are distinguished.
- Catcher comedy-form directions and student group work, plus the filled-in class notes. Catcher remains explicitly incomplete for exam coverage pending the anticipated additional materials.
- Teacher/reference/student distinctions are retained in the record classifications. Student interpretations—including strong generalizations, uncertain claims, and errors—are not upgraded to teacher-approved facts.

## Image-based material

- Pages 69–86 contain Peter Kuper's image-only graphic adaptation. The sequence was visually reviewed; the source map records the selection, and a concise visual-content summary is stored as reference information. The graphic adaptation is not transcribed or reproduced in this database.
- Page 87's completed comparison diagram is recorded as student analysis. The later comparison questions and word-choice tasks on pp. 88–91 have blank response areas.
- The p. 89 semantic-map example and p. 40 landscape exercise are image-based; the map records the former as teacher-provided vocabulary instruction and the latter as student work.

## Known gaps and uncertainty

- This is a classified source database, not a fully transcribed corpus or completed study guide. The source map identifies records and ranges; it does not assert that every sentence on every page has an individual record.
- Several assignment answer areas are blank in the packet, including parts of the 1984 character evidence work, graphic-novel questions and word-choice tasks, and Winston-stage response. They remain missing; nothing has been filled in.
- The Catcher notes do not establish full plot, character, evidence, or exam coverage. A local full-text PDF has unverified edition/printing details; per the project owner's instruction it is not used to complete the guide before the later class-material update.
- The review lists 43 literary-term entries (including a duplicate) but says 20 definitions/examples will appear; which 20 is unknown. The packet supplies no definition for multiple listed terms, including satire, Bildungsroman, foreshadowing, foil, and others. No outside definitions were added.
- The packet provides no teacher-authored practice questions tied to the 43-term inventory. The 24 extracted questions belong to the supplied poetry and close-reading practice sets; no term quiz has been invented.
- The five named class poems are not reproduced here; only “Without Title” appears as a complete poem with questions.
- Quotations and book-page citations are preserved as supplied in the packet. `checked_pdf_text` means checked against the packet's extracted text, not independently verified against a novel edition. No edition is supplied for 1984; the packet itself warns that some 1984 page numbers are inaccurate.
- The student-provided historical research links and claims were not independently checked. No external research was used to fill source gaps.

## Phase 4 source addition

The 77-page Ian Johnston *Metamorphosis* PDF and 115-page local *Catcher in the Rye* PDF are registered in the content manifest with their limits. The Metamorphosis reference record contains seven brief, checked excerpts; seven additional repository entries link them to analytical use cases. The Catcher record documents file availability and unverified edition metadata only; it contributes no plot summary, quotation, or class-page citation.

## Quality-control checks

- JSON files parse; record IDs are unique; term-to-record and exam-map references resolve; all six exam cards have summaries and point values, with the separate notice record present; records identify source document, PDF pages, classification, and verification state.
- Nested quotations carry classification and verification status. Printed practice keys are retained as printed and are not represented as independently verified.
- The `Without Title` answer-key entries for questions 7 and 8 are recorded as D and D, matching the printed key on PDF p. 9; they remain unreviewed rather than being auto-scored as teacher-confirmed truth.
- Assignment statuses such as unknown grade, late/0%, and ungraded are retained as source metadata and are not interpreted as evidence of mastery.
- Runtime loading, the application build, and the content validator are reported separately after integration checks; a successful compile alone is not treated as proof that the database loads. The original Phase 3 check confirmed the Exam Map's six sourced cards and separate notice; the then-empty Novels route was subsequently replaced by Phase 4 study views.
- The current `npm run check:content` also validates Phase 4: it reports 112 source records, 24 questions, 133 mapped pages, four novel guides, four comparisons, six exam modules, 43 terms, and 35 evidence entries.
- The current `npm run build` passes. A browser smoke test confirmed the Novels, Compare, Practice, Literary Terms, and Poetry views render without an alert/error state. Phase 4 details and remaining source limitations are in [PHASE4_CONTENT_REPORT.md](./PHASE4_CONTENT_REPORT.md).

## Additional materials that would improve coverage

- The promised additional Catcher materials, teacher-confirmed exam component/point relationship, and the exact 20 literary terms selected for the multiple-choice exam.
- Identified editions for 1984 and The Glass Castle, or teacher-verified corrections for citations flagged in the packet.
- Any missing student assignment pages or teacher-approved answer keys/rubrics. These should be appended as new source records without replacing the original PDF or existing student responses.
