# Source Inventory

## Primary source and processing

[H-Eng 10_ MIDTERM.pdf](./H-Eng%2010_%20MIDTERM.pdf) is the authoritative class packet and remains unchanged. It contains 133 pages, including image-only Peter Kuper *Metamorphosis* pages 69–86. All pages were read in order; the image-only selection and other relevant embedded images were visually inspected.

The source-to-content map in [public/content/source-map.json](./public/content/source-map.json) partitions every page into reviewed ranges and links those ranges to structured record IDs. It explicitly does not claim that every sentence has been separately transcribed. Detailed method, coverage, uncertainties, and quality checks are in [EXTRACTION_REPORT.md](./EXTRACTION_REPORT.md).

## Authority classifications

The database distinguishes:

- Teacher instruction or exam requirement.
- Teacher-provided explanation or example.
- Teacher-provided practice question.
- Student assignment or completed response.
- Student interpretation or analytical argument.
- Literary evidence or quotation (stored as a nested, provenance-linked item).
- Reference information.
- Unverified or ambiguous information.

Teacher/class notes and student work are interleaved in the PDF. A page range alone does not imply a single author or authority. Student claims remain attributed to the student, even when completed in a class worksheet.

## Exam requirements and teacher practice

- **Pages 1–2:** Exam review: novel knowledge; comparison essay (20); argumentative paragraph (10); poem analysis (15); annotation of two passages (20); literary terms (20); poetry multiple choice (10). It also supplies a Two Minutes Hate passage, a list of literary/poetic terms, and the poems studied for practice.
- **Pages 3–4:** Diane Glancy's “Without Title,” ten multiple-choice questions, two short-answer questions.
- **Pages 5–10:** A separate close-reading exercise with a persuasive essay, poem, fiction passage, questions, and printed keys; labeled 17 points. The relationship of those points to the six review components is not given. Page 10 includes test-taking advice and S-C-E-E-N.
- **Pages 5–9:** Ronald J. Allen editorial, William J. Brennan opinion excerpt, comparative/argument questions, printed answer key.
- **Pages 132–133:** Four-part poem analysis, stanza paraphrase and meaning progression, poetic devices, form, stanza lengths, and rhyme scheme.

## Assignments, notes, and references by source range

- **Pages 11–17 and 105–112:** 1984 character/theme assignment (Charrington, O'Brien, Katharine, Syme, Goldstein, Parsons, Julia); blank Winston stages response; several blank evidence slots. Similar character pages are repeated later.
- **Pages 17–24:** Student responses to an embedded Writer's Digest article on details in fiction.
- **Pages 24–26:** Antihero assignment directions and student analyses of Winston and Walter White.
- **Pages 27–36:** Archetype handout, example chart, and student applications/comparisons involving 1984 and The Glass Castle.
- **Pages 37–48:** Setting/description/atmosphere/tone/mood materials; student responses to novel excerpts, media prompts, and an illustrated landscape.
- **Pages 49–50:** Allegory definition/directions and student analysis of 1984 and The Glass Castle; assignment marked “Unknown Grade.”
- **Pages 51–55 and 121–125:** Kafka biography and style notes, existential framework/reference attributed to Encarta, literary-convention definitions/examples, and Metamorphosis symbol list.
- **Pages 56–58:** Existentialism chart directions and student comparison of The Metamorphosis, Sophie's World, “The Killers,” and the Sisyphus myth.
- **Pages 59–64:** Student Metamorphosis symbol, character-role, Gregor development, and stages charts.
- **Pages 65–68:** Teacher directions and completed student SOAPST/passage analysis of a Metamorphosis excerpt.
- **Pages 69–86:** Image-only Peter Kuper graphic adaptation, visually reviewed. It is summarized as reference information, not transcribed into the database.
- **Pages 87–91:** Prose/graphic comparison directions, completed student Venn diagram, critical vocabulary, and blank word-choice tasks.
- **Pages 92–93:** Absurdism assignment/chart and student responses.
- **Pages 94–98:** Catcher comedy-form directions and rubric with student/group examples; labeled ungraded.
- **Pages 99–105:** Orwell, Newspeak, and Oceania class notes adjacent to student-completed historical research. Student research links/claims are not independently verified.
- **Pages 112–120:** Cross-novel theme work and 1984/Glass Castle symbols/motifs; student definitions and interpretations remain student-attributed.
- **Pages 126–129:** Annotation notes and student Metamorphosis theme-presentation responses.
- **Pages 130–133:** Filled-in Salinger notes and poetry-analysis notes. Preserve student-entered text, including apparent errors, with review flags rather than silently correcting.

## Extraction status

- Structured database: 112 records in nine JSON files under [public/content/database/](./public/content/database/).
- Practice: 24 questions with printed answers/criteria and status retained; no unresolved answer is treated as verified for scoring.
- Literary-term inventory: 43 entries, including the repeated point-of-view entry. Missing definitions are explicitly identified; no outside definitions were added.
- Quotations: wording and book citations are preserved as supplied. A verification status describes whether the item was checked against packet text or an image; it does not mean the citation was verified against a particular novel edition.
- **1984 and The Glass Castle:** the packet does not provide complete, teacher-authored plot/character/evidence guides. Selected guide claims use identified local reference editions; their class-edition status is unknown, and remaining gaps are labeled.
- **The Metamorphosis:** a full 77-page Ian Johnston translation PDF is now available and was checked for the three-part plot and selected text details. The class translation is unconfirmed; its page numbers are reference locators only. The guide supplements selected student work with clearly labeled reference-based analysis.
- **Catcher:** a 115-page local PDF is inventoried, but its printing/edition and class status are unverified. Per the project owner's instruction, it is not used to complete the guide while the class unit is in progress. Existing packet notes remain partial; the promised later class update is required before expansion.
- Future Catcher materials remain outstanding.

See [OPEN_QUESTIONS.md](./OPEN_QUESTIONS.md) for unresolved teacher/source questions and [EXTRACTION_REPORT.md](./EXTRACTION_REPORT.md) for the separate QC review.

## Phase 4 supplemental-source audit

The Phase 3 packet remains the authority for exam requirements and class expectations. The following supplemental materials were located for Phase 4; they are not silently promoted to teacher-approved class content:

- A related *Metamorphosis* study-app folder, `Existentialism-Dans-Le-Metamorphosis`, contains an AI-generated app and a source map describing a 22-page `codex prompting.pdf` handout as teacher-provided. The source-map and app structure were inspected. The handout's attribution has not been independently confirmed, so derived app explanations remain supplemental AI analysis unless checked against an identified source record.
- A local 284-page *Nineteen Eighty-Four* PDF identifies itself as Project Gutenberg of Australia eBook No. 0100021. Its front matter and text-layer availability were checked. It is a supplementary reference copy, not an identified class edition; no PDF page is to be presented as a class book-page citation.
- A local 299-page *The Glass Castle* scan identifies itself as the Scribner hardcover edition of October 2009. Its title/copyright pages and text-layer availability were checked. It is a supplementary reference copy, not a confirmed class edition; packet-supplied book citations remain unchanged.
- A separate local *Catcher in the Rye* study-guide page covers only Chapters 1–15 and has no verified class provenance. It was not used as an authoritative source. The packet's Catcher coverage remains incomplete.
- The newly supplied 77-page *The Metamorphosis* PDF identifies Ian Johnston as translator and says the student text was released in 1999. It supports whole-text verification but is not confirmed as the assigned class translation.
- The newly supplied 115-page *The Catcher in the Rye* PDF has a title page naming J. D. Salinger; its metadata names Jeff Marsden, but the publication/edition details could not be established. It is recorded only as an unverified local reference and is intentionally not used for Catcher study content before the forthcoming class update.

Any Phase 4 claim drawn from these sources must identify its source and limitation. The local novel files are not copied into the project or served by the application.

## Phase 4 content status

Phase 4 now has separate, claim-attributed datasets under [public/content/phase4/](./public/content/phase4/): four novel guides, four evidence-linked comparisons, six exam-preparation modules, all 43 listed literary-term entries, and a 35-entry evidence repository. Static study views are integrated in the application.

Coverage remains deliberately incomplete where sources are insufficient or the owner has requested deferral. Catcher is source-limited until its later class-material update; the full-text local PDF is not used. Metamorphosis now has supported plot, character, setting, theme, symbol/motif, literary-element, and evidence coverage based on class records plus the clearly labeled Ian Johnston reference translation. 1984 and The Glass Castle retain partial coverage in some areas and use unconfirmed-as-class-edition references. The four comparisons exclude Catcher by design. See [PHASE4_CONTENT_REPORT.md](./PHASE4_CONTENT_REPORT.md) for per-guide status, validation results, and remaining work. `npm run check:content` validates Phase 4 cross-references as well as the Phase 3 page map and records.
