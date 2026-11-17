# Phase 6 — Independent Educational and Technical Audit

## Audit status

**Pre-correction findings recorded; high-priority corrections applied and retested.** Findings below preserve the original audit state. Correction outcomes and remaining limitations are recorded at the end of this report.

**Overall readiness: Suitable only as a clearly labeled supplemental aid, not as a teacher-approved or complete high-stakes resource.** The three identified high-priority issues have been corrected and retested. Catcher remains intentionally incomplete until the promised class-material update, and source-edition verification, broader technical regression coverage, cross-tab progress behavior, and public deployment remain unresolved.

**Critical findings: None identified.**

## Scope and method

- Reviewed project instructions, approved plan, source inventory/map, extraction report, Phase 4/4.5/5 reports, decisions, open questions, manifest, source records, study guides, comparisons, exam modules, literary-term guides, evidence records, question bank, content loaders, practice/progress UI, and validator.
- Confirmed the primary packet is 133 pages and its source map covers every page exactly once. Rechecked the actual PDF's formal requirements and poem/annotation instructions on pp. 1–2, 65, and 132–133. Earlier project records report a full sequential read and visual review of image-only pp. 69–86; this audit relied on those records and did not visually re-render all 133 pages.
- Checked all 61 Phase 4.5 question prompts, objective keys/options, all four comparisons, coverage statuses and review notes for all four novel guides, and the six exam-preparation modules. Confirmed Catcher remains source-limited and no Catcher plot/comparison practice was added from the unverified local PDF.
- Ran `npm run check:content` and `npm run build`; both passed.
- Used the browser at 375px width to visit all seven app sections; no horizontal overflow, page errors, or console errors were observed. Tested one correct objective answer and its feedback, timed expiry, passage-annotation model reveal, and saved progress after reload.
- The project folder currently contains only the primary packet PDF. The other reference works listed in the manifest are not present in this workspace, so this audit could not independently rerun their text checks or verify reference-copy page locators.

## Findings before correction

### High priority

#### H1 — Multiple-choice answer positions reveal a strong pattern

- **Issue:** 49 of the 50 objective questions have answer key A; the remaining question has answer key B. All 43 literary-term questions use A except the final theme-statement question, and all six poetry MC questions use A. Practice sessions shuffle question order, but the displayed choices are not shuffled or relabeled.
- **Why it matters:** Students can exploit the pattern instead of demonstrating the targeted knowledge. It also conflicts with the question-design requirement to avoid obvious answer patterns.
- **Affected area:** Literary-term and poetry-MC practice, plus the single objective argumentative-writing item.
- **Evidence:** `public/content/phase45/question-bank.json`; `src/practice/PracticeCenter.tsx` shuffles session entries but renders each question's choices in stored order.
- **Recommended correction:** Randomize displayed option order per session while mapping displayed labels back to the original answer key for scoring, feedback, and attempt history. Verify that correct displayed positions vary across a complete practice set.

#### H2 — Poetry MC practice omits most teacher-listed poetic devices

- **Issue:** The six existing poetry MC questions exercise stanza counts/forms, one ABAB rhyme scheme, alliteration, personification, repetition, and open form. They do not give focused MC practice for most poetic terms listed by the teacher, including irony, simile, imagery, metaphor, assonance, theme, onomatopoeia, allusion, and symbol.
- **Why it matters:** The teacher's review identifies poetic devices and implications as exam targets, and the exam component is worth 10 points. The existing set is a useful starter but does not support the stated breadth of the component.
- **Affected area:** Poetry multiple-choice practice.
- **Evidence:** The teacher's poetic-term inventory is on packet p. 2; the poem procedure and device expectations are on pp. 132–133. The bank's `poetry-multiple-choice` section contains six questions and its listed device coverage is limited to the examples above.
- **Recommended correction:** Add a small, focused set of original, clearly labeled practice items covering underrepresented teacher-listed terms and supported theme/implication reasoning. Do not present them as class poems or teacher-authored questions.

#### H3 — “Validated practice bank” can be mistaken for teacher approval

- **Issue:** The Practice introduction and README call the bank “validated.” Fifty-seven of 61 questions are labeled `original_practice`; the validator checks structure, keys, provenance links, and section coverage, but cannot establish teacher authorship, teacher approval, or the correctness of every literary judgment. The distinction is explained in reports, but not clearly enough at the point where students begin practice.
- **Why it matters:** Students may over-trust generated supplemental questions or answer keys as official class material, contrary to the project's source-attribution rules.
- **Affected area:** Practice entry point, question provenance, README, and Phase 4.5 explanation.
- **Evidence:** `src/practice/PracticeCenter.tsx` says “validated practice bank”; `public/content/phase45/question-bank.json` records 57 `original_practice` questions; `scripts/validate-content.mjs` performs structural and reference checks; `PHASE45_VALIDATION_REPORT.md` says those checks cannot prove literary judgment.
- **Recommended correction:** State beside the practice controls that original questions and models are supplemental, not teacher-authored or teacher-approved, and that automated validation is structural/source-link validation rather than teacher review.

### Medium priority

#### M1 — Most quotation entries are not independently verified against an assigned edition

- **Issue:** The source database contains 52 nested quotation entries; 41 are marked `not_independently_verified`. Multiple novel editions/translations are unconfirmed, and the reference PDFs listed in the manifest are absent from this workspace.
- **Why it matters:** Students may rely on wording or page citations that have not been checked against the edition used in class. This audit found no basis to silently correct or replace any supplied wording.
- **Affected area:** Evidence repository, novel comparisons, quotation practice, and citation use.
- **Evidence:** Quote verification-status counts in `public/content/database/`; edition caveats in `OPEN_QUESTIONS.md` and `PHASE4_CONTENT_REPORT.md`; only `H-Eng 10_ MIDTERM.pdf` is available in the project folder.
- **Recommended correction:** Keep the existing uncertainty visible. Before claiming that quotations are verified for exam use, check them against the assigned editions or obtain teacher confirmation. Do not normalize the student-supplied quotations or citations.

#### M2 — No in-app search

- **Issue:** The application has seven hash-navigation sections but no search field or search action.
- **Why it matters:** Novel guides and terminology content are long; students cannot quickly locate a character, concept, or piece of evidence.
- **Affected area:** Navigation and study-content discovery.
- **Evidence:** Browser inspection found zero search controls; `src/App.tsx` provides section navigation only.
- **Recommended correction:** Consider a small accessible search over loaded study content and evidence, or explicitly keep search out of v1 and provide stronger in-page navigation.

#### M3 — Progress writes are not synchronized across open tabs

- **Issue:** Progress is read into each tab's in-memory database and whole-database snapshots are written to `localStorage`; there is no `storage` event handling or merge strategy.
- **Why it matters:** Two tabs opened before either writes can persist stale snapshots, potentially losing a newly created profile or another tab's attempts. Named profiles separate histories in ordinary single-tab use, but do not prevent this concurrent-tab case.
- **Affected area:** Browser-local progress persistence and profile isolation.
- **Evidence:** `src/practice/progress.ts` reads once on mount and `persist` writes the full in-memory database.
- **Recommended correction:** If concurrent use on a shared browser is in scope, synchronize or merge updates across tabs, or clearly limit the guarantee to one active tab/browser profile.

#### M4 — Contributor documentation does not match the content schema

- **Issue:** `CONTENT_STANDARDS.md` lists `teacher_requirement`, while the implemented schema uses `teacher_instruction_or_exam_requirement`.
- **Why it matters:** Future source updates could follow the wrong label and fail validation or be attributed inconsistently.
- **Affected area:** Source-record documentation and future content maintenance.
- **Evidence:** `CONTENT_STANDARDS.md` compared with the allowed classifications in `src/content/loader.ts` and `scripts/validate-content.mjs`.
- **Recommended correction:** Use the exact schema classification names in the documentation.

#### M5 — Project roadmap retains stale completion statuses

- **Issue:** `PROJECT_PLAN.md` still says study navigation is placeholder UI and source population is in progress, while later sections and the Phase 4/5 reports say those stages are implemented.
- **Why it matters:** The approved plan does not give contributors a reliable current-status summary.
- **Affected area:** Project continuity and release planning.
- **Evidence:** `PROJECT_PLAN.md` roadmap items 2–3 conflict with its later Phase 4/5 completion notes and `PHASE5_COMPLETION_REPORT.md`.
- **Recommended correction:** Reconcile the roadmap summary with the completed checkpoints while retaining the documented Catcher and deployment limitations.

#### M6 — Public deployment is not configured

- **Issue:** GitHub Pages is the intended target, but no repository/public URL is configured. The Vite `BASE_PATH` setting exists; deployment at a project subpath has not been independently smoke-tested.
- **Why it matters:** A successful local build does not prove that classmates can access a working public app.
- **Affected area:** Sharing and production deployment.
- **Evidence:** `OPEN_QUESTIONS.md`, `README.md`, and `vite.config.ts`.
- **Recommended correction:** Configure the public repository and base path, then verify the deployed app loads all content and progress behavior from the published URL.

#### M7 — No dedicated automated UI regression suite

- **Issue:** The project has a content validator and production build but no dedicated UI test runner. The browser checks in this audit are targeted smoke tests, not exhaustive coverage of every interaction/question.
- **Why it matters:** Future changes to selection, progress, timers, or responsive behavior could regress without an automated signal.
- **Affected area:** Technical quality assurance.
- **Evidence:** `package.json` defines `build` and `check:content`, and no UI test suite is configured.
- **Recommended correction:** Add focused tests for answer-key selection/display mapping, timer expiry, and progress-profile persistence if the project adopts a UI test harness; avoid adding tooling solely for its own sake.

### Low priority

#### L1 — A poetry question's topic metadata overstates its tested scope

- **Issue:** `poetry-mc-aabb-rhyme` lists `closed form` as a topic, but the question asks students to identify the four-line stanza and AABB end-rhyme scheme; its key does not test whether the poem is closed form.
- **Why it matters:** Topic metadata is used to describe coverage and weak areas; an unsupported tag can make that coverage appear broader than the item supports.
- **Affected area:** Poetry multiple-choice topic metadata.
- **Evidence:** `public/content/phase45/question-bank.json`, question `poetry-mc-aabb-rhyme`.
- **Recommended correction:** Remove the `closed form` topic unless the question explicitly tests that distinction.

## Source and educational quality summary

- The six exam sections and their point values match the teacher's review. The separate 17-point close-reading notice and unresolved total remain visible rather than being combined into a guessed score.
- The exam modules preserve the teacher's actual poem procedure, passage-annotation expectation, S-C-E-E-N guidance, and three-part-thesis requirement without claiming the packet defines an exact thesis formula.
- The novel guides report partial/source-limited coverage honestly. *The Catcher in the Rye* remains deliberately incomplete; current Catcher prompts are attributed to student notes and no plot/comparison quiz was added from the local unverified PDF.
- The four comparisons reviewed are specific, evidence-linked, and qualified; none includes Catcher. Student interpretations remain attributed and review notes are visible.
- The 43 literary-term entries preserve the repeated point-of-view listing and distinguish teacher, student, and supplemental definitions. The packet does not identify which 20 entries will be tested.
- The project documentation and UI consistently disclose local-only progress and lack of account/privacy controls. No short-answer grading was found.

## Corrections made after recording findings

- **H1 — Answer-position pattern:** Added per-session option shuffling while retaining the original answer-key labels internally for scoring. Feedback and saved attempt history use the displayed labels. The complete 13-question poetry-MC session scored **13/13**; the complete 43-question literary-terms session scored **43/43**. The displayed correct positions varied across all four labels (A–D) in literary terms and three labels (A, B, D) in the poetry session. The first poetry result's selected and correct labels matched, and saved attempts were confirmed to contain displayed labels.
- **H2 — Poetry coverage:** Added seven original AI-generated supplemental poetry-MC questions. The section now has 13 items and explicitly practices underrepresented poetic terms and interpretation, including assonance, onomatopoeia, allusion, verbal irony, symbol/theme, tactile imagery, simile/metaphor, and rhyme. The additions are labeled as original practice, not class poems or teacher-authored questions.
- **H3 — Provenance clarity:** Added a student-facing disclosure on the Practice page explaining that original questions/models are not teacher-authored or teacher-approved and that automated validation checks structure/source links rather than every literary judgment. Clarified the same distinction in the README and Phase 4.5 report.
- **Documentation consistency:** Updated the bank totals to 68 (57 multiple choice, 11 open response), the poetry-MC count to 13, corrected the content classification name in `CONTENT_STANDARDS.md`, and reconciled project roadmap statuses.
- **L1 — Topic metadata:** Removed the unsupported `closed form` tag from the AABB rhyme question; its tested topics now match its prompt and key.
- **Verification after correction:** `npm run check:content` and `npm run build` passed. Browser checks completed every poetry-MC and literary-term MC item with correct scoring and feedback mapping. Audit-generated localhost progress was removed, and a reload showed a new empty local profile. Earlier smoke checks cover responsive width, navigation, timer expiry, answer reveal, and persistence; they are not a full automated UI suite.

## Remaining limitations and release recommendation

- Catcher coverage must remain incomplete until the promised class materials arrive.
- Assigned editions for the supplemental *1984*, *The Glass Castle*, and *The Metamorphosis* copies remain unconfirmed; quotation/page verification cannot be completed without the appropriate editions or teacher confirmation.
- Poetry practice must remain labeled as original supplemental practice; the five named class poems are not reproduced in the packet, except “Without Title.”
- The public deployment target and repository are not configured.
- **Recommendation:** The corrected app may be shared as a clearly labeled supplemental study aid. Do not present it as teacher-approved or as a complete four-novel guide, and do not treat unverified citations or generated keys as official. Public deployment has not been configured or verified.
