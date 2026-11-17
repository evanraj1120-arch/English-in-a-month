# Phase 4.5 — Initial Source and Coverage Audit

## Status

**Phase 4.5 complete for the available class sources.** This audit records the supported scope, source limitations, and authoring rules; final counts and validation outcomes are in [PHASE45_VALIDATION_REPORT.md](PHASE45_VALIDATION_REPORT.md).

## Project and data audit

- Read the project instructions, approved plan, source inventory, extraction report, Phase 4 report, decisions, open questions, manifest, Phase 3 records, Phase 4 datasets, and existing validator.
- Phase 3 contains 112 source records, 24 teacher-provided practice questions, and a source map covering all 133 packet pages. The original packet remains authoritative and unchanged.
- Phase 4 currently contains four novel guides, four evidence-linked comparisons, six exam-preparation modules, all 43 printed term entries (including repeated point of view), and 35 evidence entries. Its existing validation checks provenance and references, but it does not yet validate a new answer-key question bank.
- Existing practice includes the Diane Glancy “Without Title” set and Allen/Brennan close-reading practice. Printed keys are retained as unreviewed; the “Without Title” Q7/Q8 entries especially must not be copied as confirmed answers. The Phase 4 modules are study guidance, not a question bank.
- The class packet names five poems for practice but reproduces only “Without Title.” It does not contain the full texts of the other named poems. Any newly written poem must be explicitly labeled original practice material.

## Supported scope by exam section

| Section | Supported material | Limits and authoring decision |
|---|---|---|
| Novel comparison | Four guides; three defensible existing comparisons using *1984*, *The Metamorphosis*, and *The Glass Castle*; linked evidence | *Catcher* remains intentionally incomplete while the unit is in progress. Do not construct Catcher plot questions or comparisons from the unverified local PDF. |
| Argumentative writing | Teacher's three-part-thesis and quotation-integration requirements; S-C-E-E-N; sourced examples from class records | The teacher does not define the three thesis parts. Any model structure must be labeled a practice strategy, not an official formula. |
| Poem analysis | Teacher's four-step procedure and the packet's poem practice | Use original poems for new complete-passage practice unless a permissible, source-verified class excerpt is needed; clearly distinguish original practice from assigned poems. |
| Passage annotation | Teacher's specified focus on diction, syntax, color imagery, characterization, POV, conflict, symbolism, and theme; selected source examples | Existing packet passage records often point to pages without reproducing the entire passage. New passage questions therefore need self-contained, original passages, not references that require opening another file. |
| Literary terms | All 43 listed entries and Phase 4 study definitions/examples | Some packet definitions are student-only or missing. Clearly label supplemental terminology and test application using original examples; do not make a supplemental definition look teacher-provided. |
| Poetry multiple choice | Teacher-listed skills include form, rhyme scheme, and poetic terms | Only one class poem and its practice set are reproduced. Use complete original poems for new MC material; do not attribute generated lines to class poets. |

## Phase 4 issues to preserve while authoring

- *Catcher* is source-limited by design; the user's later class-material update is the point at which its question coverage should expand.
- The *Metamorphosis* guide uses the Ian Johnston reference translation, which is not confirmed as the assigned class translation. Any evidence-based question using it must retain this edition caveat.
- The *1984* and *Glass Castle* guides retain partial topic/evidence coverage and use reference copies not confirmed as the assigned class editions. Questions should use only specific, traceable existing evidence and keep reference pagination out of class citations.
- Student-generated interpretations, including the Metamorphosis “happy and free” death reading and the Glass Castle archetype/parental claims, remain student-attributed and should be treated as arguments to test—not authoritative answer keys.
- The listed term inventory contains 43 entries while the exam review says 20 definitions/examples will appear. Preserve the duplicate entry; do not imply that all listed terms will appear on the exam.
- The six listed components total 95 points, and the separate close-reading notice lists 17 points without reconciling the two. The bank must not infer exam weighting from practice counts.

## Bank design and validation decisions

- Create structured, static content under `public/content/phase45/`, separate from the teacher's original practice records and from UI components.
- Give each question a unique ID, exam section, format, difficulty, complete prompt/material, answer key or explicit open-response criteria, source references, and a validation record.
- Every answer key must explain its reasoning. Objective items will include explanations for all options; open-ended items will include a model answer, evidence, essential response elements, and defensible alternatives where appropriate.
- Mark original passages and poems as AI-generated practice. Include all passage material directly with every question that depends on it.
- Independently verify keys and evidence before marking a question validated. Exclude ambiguous inherited keys from new scored-style material.
- Phase 5 may reveal a model answer for a short response, as the user requests. No AI grading, algorithmic grading, or automated short-answer scoring is wanted; this phase will not implement any interactive reveal behavior.
- Quality and coverage take precedence over target counts. Cover all printed literary-term entries and all six exam sections without padding the bank with repeated variants.
- The Phase 4.5 schema and future-use loader are implemented in `src/content/phase45-types.ts` and `src/content/phase45-loader.ts`; the manifest points to `phase45/question-bank.json`. Every item has an exam section, format, difficulty, source/evidence references, answer-key basis and source note, original-material attribution where applicable, and a validation status. The validator checks exact teacher-section mapping, option-by-option MC rationales, open-response models and criteria, and coverage of all 43 distinct term-entry IDs (including both point-of-view entries).
- The schema explicitly sets `shortAnswerScoring` to `none`. It contains no answer reveal or other interactive behavior.

## Unresolved items

- The exact three parts of the teacher's “three-part thesis” are unspecified.
- It is unknown whether the exam poem will be familiar or unfamiliar, which 20 terms will appear, and how the separate 17-point close-reading exercise relates to the six listed components.
- Catcher plot/evidence practice is intentionally deferred until the promised class materials arrive.

## Final status

The authored bank contains 61 questions across the six listed exam sections. All 43 printed term entries are covered while preserving the duplicate point-of-view listing. All six sections map to the teacher's requirement records and point values. See the validation report for test results, quality-control findings, and Phase 5 priorities. Catcher plot and comparison practice remains intentionally deferred. No quiz UI, progress, scoring, timers, or reveal-answer interaction was built.
