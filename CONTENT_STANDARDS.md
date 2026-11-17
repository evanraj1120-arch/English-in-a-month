# Content Standards

## Authority and attribution

Every top-level educational record must use one of the source classifications in the content schema:

- `teacher_instruction_or_exam_requirement`
- `teacher_provided_explanation_or_example`
- `teacher_provided_practice_question`
- `student_assignment_or_completed_response`
- `student_interpretation_or_analytical_argument`
- `reference_information`
- `unverified_or_ambiguous_information`

Teacher-provided practice questions use `teacher_provided_practice_question`; exact literary quotations are stored as nested items classified `literary_evidence_or_quotation`. Teacher class notes use `teacher_provided_explanation_or_example` and identify themselves as class notes in their record type. External research must be labeled in the record and kept distinct from class material. Record the source document/page range and any separate novel-page citation exactly as provided. A student interpretation must remain labeled as a student claim even when it appears in a completed assignment. Do not imply teacher endorsement unless the source explicitly supplies a teacher answer or rubric.

## Accuracy and uncertainty

- Never invent quotations, textual evidence, page references, exam expectations, questions, answer keys, or scoring criteria.
- Preserve original student interpretations. Add a review flag and explanation when a claim appears questionable or conflicts with another source record.
- Preserve source wording and citation as recorded; do not silently correct OCR, spelling, names, or page numbering.
- Track uncertainty explicitly, including edition mismatch, OCR uncertainty, missing context, unresolved answer keys, and incomplete uploads.
- Do not use external literary commentary to fill missing class content. Authorized external research must be labeled and cited separately.

## Educational usefulness

- Prefer concrete details and specific examples to broad claims.
- Explain how evidence supports the claim and how a literary choice functions in context.
- For short-response practice, prioritize direct answers that address every clause of the prompt.
- Preserve distinctions among similar terms; do not flatten nuances to make content shorter.
- Avoid duplicate explanations when one well-supported record can serve multiple study views.

## Practice and scoring

- Only teacher-provided keys or explicit criteria may drive automatic answer scoring.
- Flag unresolved or potentially mismatched keys and exclude them from automatic scoring until verified.
- Open-ended responses use a self-check rubric; do not claim the app has determined literary correctness.
- Include source-based feedback that points to the relevant record and evidence.

## Technical content requirements

Each study record should have a stable ID, content type, topic, relevant novel(s), source category, source locator, and review status. When relevant, include exact source text, evidence, recorded book citation, question/options/key, rubric, and uncertainty note. Store content outside React components and keep progress records separate from educational content.
