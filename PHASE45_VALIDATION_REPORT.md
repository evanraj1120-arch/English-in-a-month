# Phase 4.5 — Question Bank and Validation Report

## Status

**Complete for the available class sources, with supplemental poetry practice added during Phase 6.** The bank contains source-traceable practice questions and answer keys for the six listed exam sections. The interactive experience was implemented in Phase 5; Phase 4.5 itself did not build quiz UI, progress tracking, scoring, timers, or answer-reveal behavior.

The bank is prepared for later use through `public/content/manifest.json`, the types in `src/content/phase45-types.ts`, and `loadPhase45QuestionBank` in `src/content/phase45-loader.ts`. Short-answer scoring is explicitly set to `none`.

## Content delivered

| Exam section | Questions | Coverage |
|---|---:|---|
| Novel comparison essay | 4 | Comparison of authority, refuge, family care, and utility/power using source-linked evidence. Current practice uses *1984*, *The Metamorphosis*, and *The Glass Castle*. |
| Argumentative paragraph | 4 | Practice thesis development, direct claims, quotation integration, and a complete paragraph. Original practice quotation and Works Cited entry are clearly marked fictional. |
| Four-part poem analysis | 2 | Complete original poems with model responses for form, stanza paraphrase, devices, and theme/purpose. |
| Passage annotation | 2 | Complete original prose passages and model analyses addressing diction, syntax, imagery, point of view, characterization, conflict, symbolism, and theme. |
| Literary terms multiple choice | 43 | One item for each printed entry; both point-of-view listings are retained as duplicate inventory entries, not represented as different concepts. |
| Poetry multiple choice | 13 | Complete original poems testing stanza form, rhyme, poetic devices, and interpretation, including supplemental practice on irony, simile, imagery, metaphor, assonance, theme, onomatopoeia, allusion, and symbol. |
| **Total** | **68** | **57 multiple-choice and 11 open-response items.** |

Every question includes source-record references, answer-key basis and source notes, and a validation record. Multiple-choice alternatives each have a rationale. Open responses include model answers, essential elements, and acceptable alternatives or common weaknesses where relevant.

## Quality-control findings

- The validator maps all six bank sections to the teacher's requirement records and their listed point values. It does not infer a combined exam total or weighting.
- All 43 printed term IDs are covered, including `term-point-of-view-1` and `term-point-of-view-2`. Teacher definitions, student/completed-work definitions, reference information, and supplemental Phase 4 definitions are distinguished in answer-key notes.
- Every cited source record, evidence ID, and source-document page resolves. Novel comparisons use the existing evidence repository and preserve student attribution, edition caveats, and limitations.
- Every passage or poem needed to answer a question is included in that question. All newly written poems, passages, and practice source excerpts are attributed as original practice, not as class texts.
- The two passage-analysis models explain how choices function instead of stopping at technique labels. They distinguish observable details from interpretations and keep unresolved endings unresolved.
- No inherited unreviewed answer key was reused as a confirmed answer.
- **Catcher remains intentionally source-limited.** No plot question or cross-novel claim was authored from the unverified local Catcher PDF. Limited terminology practice is linked only to the class notes that actually support it.
- The automated validator checks structure, answer-key completeness, source references, section coverage, and term coverage. It cannot prove the literary judgment in a model answer; educational claims remain subject to teacher review.
- Phase 6 added seven original AI-generated poetry MC questions and shuffled displayed answer choices per session. The correct-answer mapping remains tied to each question's source key for scoring, feedback, and attempt history; no supplemental item is represented as teacher-authored or teacher-approved.
- The practice entry point now explains that original practice is supplemental and that automated validation is not teacher review.

## Validation results

- `npm run check:content` — **passed**. Validated 112 source records, 24 existing teacher-practice questions, all 133 mapped packet pages, Phase 4 coverage, and 68 Phase 4.5 questions across six sections.
- `npm run build` — **passed**. TypeScript project check and Vite production build completed.
- The bank contains 68 questions with `validation.status: "validated"`; the validator fails if a question lacks a reasoned key, source basis, provenance, MC option rationales, open-response criteria, or required term coverage. This status is a structural/source-link check, not teacher approval.

## Limitations and unresolved questions

- Catcher plot, characterization, and comparison practice must wait for the user's promised class-material update. Its current unit is in progress.
- The packet does not define the exact three parts of the argumentative thesis. The bank's three-strand model is labeled as a study strategy, not an official formula.
- The packet does not identify which 20 of the 43 literary-term entries will appear on the exam. Coverage of all 43 is preparation, not a prediction.
- The packet does not reconcile the six components totaling 95 points with a separate 17-point close-reading notice, nor does it say whether the exam poem will be familiar or unfamiliar.
- The required citation style/punctuation for the supplied Works Cited is not specified. The practice example supplies a clearly fictional author/title and no page number; it does not claim to establish the teacher's citation format.
- Some terminology relies on student wording, reference information, or supplemental Phase 4 study definitions because the packet lacks a teacher definition. Such bases are explicitly labeled.
- The *1984*, *Glass Castle*, and *Metamorphosis* evidence retains previously documented edition or source caveats; student interpretations are not presented as teacher-approved answers.

## Phase 5 follow-up

The interactive practice work is now implemented and verified; details are in [PHASE5_COMPLETION_REPORT.md](PHASE5_COMPLETION_REPORT.md). Future work remains content-driven:

1. Incorporate the promised Catcher class-material update as provenance-linked records; then review and expand the guide, retrieval cards, and comparisons without overwriting existing student work.
2. Resolve the thesis formula, exam-point discrepancy, exam-poem familiarity, term selection, and citation style if teacher clarification becomes available.
3. Before high-stakes use, review answer keys against teacher feedback and assigned editions. Automated structure validation cannot establish teacher approval or guarantee every literary judgment.
