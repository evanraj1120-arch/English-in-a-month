# Honors English 10 Semester One Study Platform

A source-aware study aid for the Honors English 10 semester examination. It includes novel guides, exam-method reviews, terminology and poetry study, objective quizzes, passage annotation, optional timers, and browser-local progress.

The class packet is the primary authority. Original practice questions and models are AI-generated supplemental material, not teacher-authored or teacher-approved. Automated validation checks structure and source links, not every literary judgment. Catcher in the Rye remains intentionally incomplete until the promised class-material update.

## Run locally

Requirements: Node.js 20.19+ and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The app uses hash navigation and needs no backend, account, API key, or environment secret.

## Development and validation

```sh
npm run check:content
npm run build
npm run preview
```

`npm run check:content` validates source records, page mappings, references, study content, and question-bank structure. `npm run build` type-checks and creates the static site in `dist/`; `npm run preview` serves that production build locally.

## Deploy with GitHub Pages

This is a static Vite application. The repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml`; it validates content, builds the site, rejects PDF files in the deployment artifact, and deploys only `dist/` when changes are pushed to `main` or the workflow is manually run.

1. On GitHub, create a **new, empty** repository. Do not initialize it with a README, license, or `.gitignore`; this project already has those files. Before making it public, review the publication caution below.
2. Open the project folder in VS Code and open **Terminal → New Terminal**. From the project root, initialize the local repository and make the first commit (ignored PDFs, `node_modules/`, and `dist/` are not added):

   ```sh
   git init -b main
   git check-ignore -v "H-Eng 10_ MIDTERM.pdf"
   git status --short
   git add .
   git status --short
   git commit -m "Prepare study platform for sharing"
   git remote add origin https://github.com/YOUR-USERNAME/english-semester-one-exam-prep.git
   git push -u origin main
   ```

   Replace `YOUR-USERNAME` with the GitHub account name, and change the repository name in the URL if you chose a different name. Check the `git check-ignore` output and inspect both `git status` outputs before committing; source PDFs must not appear. Do not force-add them. Git may prompt you to authenticate with GitHub in a browser; never paste a token into project files or commit one.
3. In the new GitHub repository, open **Settings → Pages**. Under **Build and deployment → Source**, select **GitHub Actions**. Do not choose **Deploy from a branch**; this project's workflow builds Vite's output before publishing.
4. Open **Actions** and watch **Deploy to GitHub Pages**. On the first push, GitHub may ask you to allow the workflow. The build job validates the content, builds the site, and uploads `dist/`; the deployment job publishes it. No API key, personal access token, or extra secret is needed.
5. When the deployment job succeeds, open the URL shown in its `github-pages` environment. It will usually look like `https://<owner>.github.io/<repository>/`. Test the link in a private/incognito window, then share it with classmates. A push to `main` automatically builds and deploys future changes; the workflow can also be started manually from the Actions page.

The workflow assumes a **project site** at `https://<owner>.github.io/<repository>/` and sets Vite's `BASE_PATH` from the repository name. For a user/organization site named `<owner>.github.io` or a custom domain hosted at the root, change the workflow's `BASE_PATH` to `/` before deploying. Hash navigation and content fetches use Vite's configured base path. A separate `gh-pages` branch is not needed.

No deployment has been run from this workspace: it has no Git repository or remote configured, so there is no verified public address yet. The workflow does not need secrets or a backend, but GitHub Pages must be available for the chosen repository.

### Source-file and publication caution

GitHub Pages websites are publicly available on the internet even when their source repository is private. A private repository is not an access-control mechanism for the deployed site. On GitHub Free, the repository must be public to use Pages; a public repository exposes all tracked source files, not only the built site. The original `H-Eng 10_ MIDTERM.pdf` and any other source PDFs stay intact in the local workspace and are ignored by Git (`*.pdf`) to reduce accidental publication; the workflow also rejects PDFs in the deployment artifact. Before publishing, check permission to share the study content and other tracked files with classmates. Do not force-add the class packet.

## Updating educational content

- Keep educational records and questions in `public/content/`; keep their shared types and loading/validation logic in `src/content/`.
- Add provenance, authority, source-page locators, and uncertainty notes. Preserve teacher material, student work, textual evidence, and AI analysis as distinct sources.
- Extend or version records rather than silently replacing prior content. Keep the primary PDF unchanged and do not infer missing teacher requirements or answer keys.
- When adding files, update `public/content/manifest.json` and the relevant source inventory, source map, extraction/content report, and `OPEN_QUESTIONS.md` or `DECISIONS.md`.
- For later Catcher material, add the new class/teacher sources to the existing model, then review affected study claims, questions, comparisons, and tests. Do not use the unverified local Catcher PDF as a substitute for the promised class materials.
- Before sharing an update, run `npm run check:content` and `npm run build`, then check the affected app sections in desktop and mobile layouts.

See [CONTENT_STANDARDS.md](CONTENT_STANDARDS.md), [SOURCE_INVENTORY.md](SOURCE_INVENTORY.md), [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md), and [DECISIONS.md](DECISIONS.md) for the existing source and continuity records.

## Privacy and known limitations

- No account or personal information is required. Progress stays in local browser storage and does not sync across browsers or devices. Use a pseudonym if changing the default profile name.
- Named profiles are labels, not passwords. People sharing the same browser can switch to or view one another's profiles; do not use them to protect private information.
- Written short answers are not retained or algorithmically graded. Objective answers are checked against the supplied key; open responses use prepared models and self-check criteria.
- Catcher study coverage is incomplete by design. Some novel quotations and page locators are not independently verified against assigned editions.
- No in-app search, cross-tab progress synchronization, or automated UI regression suite is currently provided.
- No public deployment address is available until a repository is configured and the Pages workflow succeeds.

For the audit, scope, corrections, and release recommendation, see [PHASE6_AUDIT_REPORT.md](PHASE6_AUDIT_REPORT.md). For implemented practice behavior, see [PHASE5_COMPLETION_REPORT.md](PHASE5_COMPLETION_REPORT.md).
