# Decisions

| Date | Decision | Rationale / consequence |
|---|---|---|
| 2026-11-15 | The uploaded class packet is the primary educational source. | Prevents outside interpretations from becoming class expectations. |
| 2026-11-15 | Keep teacher requirements, teacher practice/notes, student responses, and external references as distinct content categories. | The packet interleaves these and student work is not teacher-authoritative. |
| 2026-11-15 | Use React + TypeScript + Vite for a static app. | Reusable UI with structured types and simple static hosting. |
| 2026-11-15 | Target a public GitHub Pages link; store practice progress in the current browser. | Shareability without account/backend infrastructure; progress will not sync across devices. |
| 2026-11-15 | Keep a fixed four-novel structure and accept future Catcher additions through the existing content model. | New uploads should extend existing sections rather than trigger redesign. |
| 2026-11-15 | Do not auto-score open responses or unresolved answer keys. | Avoid presenting uncertain or subjective judgments as official grading. |
| 2026-11-15 | Stage 2 creates project rules, documentation, and a working app shell only. | Full study content is reserved for later implementation stages. |
| 2026-11-15 | Read the entire 133-page PDF in order and visually inspect its image-only graphic-novel pages before continuing extraction. | The packet, including its non-OCR content, is the source of exam expectations. |
| 2026-11-15 | Keep the source database distinct from the final study guide and expose coverage gaps instead of filling them by inference. | The packet includes incomplete assignments, student claims, and missing Catcher material. |
| 2026-11-15 | Load source record files and the page-range source map through the content manifest; validate IDs, references, provenance, and page coverage. | A structured database should be traceable and fail visibly on broken or missing records. |
| 2026-11-16 | Keep Phase 4 study claims separate from source records and tag each as teacher material, student work, textual evidence, AI analysis, or external reference. | A claim-level trail makes it possible to preserve the student's work without presenting AI inference as a class answer. |
| 2026-11-16 | Use local book copies only as supplementary textual references unless their class-edition status is confirmed. | Their text can support factual recall, but their pagination cannot silently replace the packet's citations. |
| 2026-11-16 | Treat the related Metamorphosis app's generated answers as supplemental analysis; its linked teacher-handout attribution remains unconfirmed. | The app may inform organization and possible analyses but is not itself proof of a teacher requirement. |
| 2026-11-16 | Mark novel-guide completeness by evidence coverage, not by whether a page or file exists. | The current Catcher material and the absence of complete Metamorphosis source text require visible limits rather than inferred completion. |
| 2026-11-16 | Integrate Phase 4 as static, source-labeled study views and keep all incomplete guide coverage visible. | Exam preparation can be explored without treating AI analysis as class instruction or adding unapproved quiz/scoring behavior. |
| 2026-11-16 | Do not force Catcher into the current comparison set; defer four-novel comparison coverage until verifiable Catcher plot/evidence material is supplied. | Superficial or unsupported comparisons would weaken the major exam-preparation resource. |
| 2026-11-16 | Keep the Catcher guide intentionally incomplete, despite a locally supplied full-text PDF, until the promised class-material update. | The unit is in progress and an unverified PDF is not a substitute for forthcoming class/teacher materials. |
| 2026-11-16 | Use the full Ian Johnston *Metamorphosis* PDF to supplement plot and selected evidence, while retaining class-edition and translation caveats. | It supplies full-text support for previously partial coverage without overwriting packet-supplied quotations or treating reference pagination as class citations. |
| 2026-11-16 | Do not implement AI or algorithmic grading for short-answer practice; Phase 5 may provide a “reveal perfect answer” control that displays a prepared model response. | The user prefers answer comparison over automated judgment; reveal behavior is future UI work, not Phase 4.5 scope. |
| 2026-11-16 | Keep Phase 4.5 question data static, source-traceable, and separate from the practice UI. | Phase 4.5 prepares validated questions and answer keys for Phase 5 without adding scoring, progress, timers, or reveal controls. |
| 2026-11-16 | Integrate the validated Phase 4.5 bank into practice and derive recall cards only from sourced Phase 4 claims. | Keeps study content in `public/content/`, preserves claim provenance, and prevents unsupported Catcher content from entering practice. |
| 2026-11-16 | Automatically check only objective question keys; present open responses with prepared models, criteria, and student self-review rather than grading. | Preserves the user's explicit preference against AI or algorithmic short-answer grading. |
| 2026-11-16 | Persist attempts in named browser-local profiles; do not persist written response text, add accounts, or sync progress. | Enables per-profile review history without a backend; profiles are not private from other people using the same browser. |
| 2026-11-16 | Let students choose practice timer durations and require a review step before submission. | The class packet supplies no official duration for these practice sessions. |
| 2026-11-16 | Prepare GitHub Pages deployment as a static GitHub Actions build that publishes only `dist/`; keep the original class PDF local and ignored by Git. | The app needs no backend, and excluding the source PDF reduces accidental publication. Deployment remains unverified until a repository and Pages site are configured. |

## Decisions still open

The GitHub repository and final public URL have not been configured. Educational uncertainties are tracked in [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md); they are source gaps, not permission to guess.
