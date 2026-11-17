# Approved Project Plan

## Goals

Create a detailed, shareable study platform that improves exam performance through accurate recall, evidence-based interpretation, novel comparison, timed practice, and feedback. Make important information easy to find while preserving the distinction between teacher materials and student work.

## Non-goals for v1

- No accounts, backend, synced progress, social features, or AI-generated answer grading.
- No outside literary research presented as class content.
- No rewriting of student interpretations or silent correction of source material.
- The source database stage does not itself produce the finished study-guide views or invent content missing from the packet.

## Source inventory and exam components

See [SOURCE_INVENTORY.md](SOURCE_INVENTORY.md) for the full packet classification. The teacher review lists novel comparison (20 points), argumentative paragraph (10), poem analysis (15), passage annotation (20), literary terms multiple choice (20), and poetry multiple choice (10). A separate close-reading exercise uses a persuasive essay, poem, and fiction passage and is marked 17 points. The packet does not reconcile that 17-point exercise with the listed 95 points; the app must not assert a final total or weighting.

The principal skills are plot/character/theme recall, specific evidence, comparative argument, thesis construction, quote integration, poetic form and device analysis, passage annotation, literary-term application, and efficient responses that answer every part of a prompt.

## Architecture and navigation

- React + TypeScript + Vite, delivered as a static web application.
- Default public-link deployment target: GitHub Pages, after a repository and base path are configured.
- Browser-local progress storage; no user account or remote database.
- Main sections: Exam Map, Novels, Compare, Practice, Literary Terms, Poetry, and Progress.
- Consistent novel pages for plot, characters, settings, themes, symbols/motifs, literary elements, and sourced evidence.
- Practice modes: source-derived retrieval, multiple choice, and open response with a prepared model-answer reveal; do not algorithmically grade short answers. User-configurable timers and browser-local progress profiles are implemented without accounts or sync.

## Content model

Store educational content in structured JSON separate from components. Each record will include a stable ID, content kind, topic, related novel(s), authority/source category, PDF page provenance, any book-page citation exactly as recorded, content/evidence, review status, and uncertainty notes. Phase 4.5 practice questions include reasoned answer keys or model responses, response criteria, and source-basis labels. Keep progress data separate and local; short-answer grading is not part of v1.

## Roadmap and current status

1. **Complete:** Establish the source ledger, record authority classifications, read all 133 packet pages in order, and visually inspect image-only pages 69–86.
2. **Complete:** Build the React/TypeScript/Vite shell, content schema, JSON loader, source-range map, provenance requirements, and seven-section study/practice navigation.
3. **Complete for the available source scope:** Populate and quality-check source records and the Phase 4 study guides. Missing source material and blank assignments remain explicit gaps; Catcher remains intentionally incomplete until the promised class-material update.
4. **Future:** Add new uploads and corrections as separate source records; review affected material without discarding earlier student claims. The expected Catcher materials have not arrived.
5. **Before public release:** Verify all provenance, quotations and citations against authoritative materials, clarify unresolved exam requirements, and test responsive behavior/accessibility and production deployment.

## Phase 4 content-development rules

- Study content is stored separately from the source inventory and existing practice-question records. Each substantial claim names its source-record IDs or source-document pages and identifies whether it comes from teacher material, student work, the literary text, AI analysis, or an external reference.
- The class packet remains authoritative for exam expectations and class terminology. A local book copy can support plot and textual analysis, but its edition is not assumed to be the class edition; its page numbers must not replace citations supplied in class work.
- Student-generated claims remain attributed to the student. New analysis is labeled as analysis, includes supporting evidence, and does not silently rewrite or endorse student work.
- A novel guide is marked complete only when its required plot, character, setting, theme, symbol/motif, literary-element, and evidence coverage is supported. Missing sources remain visible as gaps.
- Phase 4 adds static study material only. Retrieval, quiz interaction, answer reveal, user progress, and automatic scoring remain future work.

Phase 4 static content and views are implemented for the current authorized scope. Catcher remains intentionally incomplete until the user's later class-material update; the other documented source and edition limitations remain visible. Checkpoint status, coverage, validation results, and follow-up priorities are tracked in [PHASE4_CONTENT_REPORT.md](PHASE4_CONTENT_REPORT.md).

Phase 4.5 is complete for the available class sources: a 68-question, six-section bank, typed schema and loader, and source/reference validator are in place. The bank includes seven AI-generated supplemental poetry-MC questions, clearly distinguished from teacher-provided materials. Phase 5 added the interactive quiz UI, progress, timers, and answer reveal; short answers remain ungraded. The user prefers a prepared “reveal perfect answer” control and has explicitly ruled out AI/algorithmic short-answer grading. Audit findings and validation results are recorded in [PHASE45_AUDIT_REPORT.md](PHASE45_AUDIT_REPORT.md) and [PHASE45_VALIDATION_REPORT.md](PHASE45_VALIDATION_REPORT.md).

Phase 5 is implemented for the available verified content: objective quizzes, source-derived retrieval cards, ungraded open-response self-checks, passage annotation, optional timers, local named profiles, and a progress/review dashboard. Catcher remains intentionally excluded from plot recall and novel comparisons until the promised class-material update. See [PHASE5_COMPLETION_REPORT.md](PHASE5_COMPLETION_REPORT.md) for verification and limitations.

## Quality control

Require provenance and authority labels for each content record. `npm run check:content` validates record/question IDs, source pages, nested quotations, term links, manifest files, exact page-map coverage, and Phase 4.5 answer-key structure, source links, section coverage, and term coverage. Human-review quotations, citations, and scoring against the original page; current PDF-text verification does not mean novel-edition verification. Preserve questionable content with a review flag; do not automatically score short responses. See [CONTENT_STANDARDS.md](CONTENT_STANDARDS.md), [SOURCE_INVENTORY.md](SOURCE_INVENTORY.md), and [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md).
