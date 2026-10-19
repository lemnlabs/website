# AGENTS.md

## Project overview

- This is a single Astro project for the lemnlabs website. Run commands from the repository root.
- The stack is Astro 7, TypeScript in strict mode, Node.js 24.21.0 and pnpm 12.8.1 managed by mise, React 19, shadcn/ui components/styles, and Tailwind CSS v4.
- The site deploys static HTML to GitHub Pages. Features that require a server runtime will not work in the current hosting environment.
- Before making changes, review `package.json`, `astro.config.mjs`, `components.json`, the relevant source files, and `.github/workflows/deploy.yml`. If this document differs from the actual configuration, verify the configuration and update the documentation accordingly.

## Development environment and commands

```sh
mise trust          # Trust this repository's mise.toml after reviewing it
mise install        # Install the pinned Node.js and pnpm versions
mise run install    # pnpm install --frozen-lockfile
mise run dev        # http://localhost:4321/
mise run check      # Run Astro and TypeScript checks
mise run build      # Run type checks and build the static site
mise run preview    # Preview the build output in dist/
```

- Formatting commands: `mise run format` and `mise run format:check`; lint commands: `mise run lint` and `mise run lint:fix`. Equivalent pnpm scripts are available.
- Dependency installation runs `prepare` to activate Husky. Pre-commit uses `mise exec --` and requires mise on the Git process PATH. lint-staged fixes and formats staged files, preserving unstaged changes in partially staged files, then `pnpm check` checks the entire working tree. Failures block commits; a later type-check failure leaves successful formatting staged. CI sets `HUSKY=0` and runs full formatting/lint checks before the existing build.
- Generated directories, `pnpm-lock.yaml`, and `.agents/` are excluded from formatting; ESLint excludes generated directories, Husky files, and `.agents/`. Do not format the generated lockfile manually.
- With mise activated in the shell, use `pnpm dev`, `pnpm check`, `pnpm build`, and `pnpm preview` directly. Otherwise use `mise exec -- pnpm <command>`.
- Use pnpm consistently. Commit `pnpm-lock.yaml`; do not add npm or Yarn lockfiles.
- When adding or changing dependencies, use `pnpm add` or `pnpm install` and commit the updated lockfile. Do not edit the lockfile manually.
- Keep the pnpm version in `mise.toml` and `package.json`'s `packageManager` synchronized. CI reads `mise.toml` using `jdx/mise-action` and installs with `--frozen-lockfile`.
- `pnpm-workspace.yaml` configures dependency build scripts for this single project. It allows esbuild's required install script and skips optional fsevents scripts. Review any newly required build scripts before changing this configuration.
- If the environment cannot access Astro's telemetry configuration directory, use `ASTRO_TELEMETRY_DISABLED=1 mise run build`.

## File structure and editing locations

- `src/pages/`: file-based routes. `index.astro` is the homepage.
- `src/layouts/Layout.astro`: shared HTML, document language, title, description, canonical URL, favicon, and global styles.
- `src/components/ui/`: base shadcn/ui components (`button.tsx`, `card.tsx`, `separator.tsx`, `badge.tsx`). Base components own their styling, padding, and variants; do not restyle them from outside.
- `src/components/`: reusable Astro and React UI components, including `LinkCard.tsx`, `EmptyState.tsx`, `NavigationLink.tsx`, `FloatingNavigation.tsx`, and the homepage `Starfield.astro`.
- `src/scripts/starfield/`: the supplied star animation as Astro-bundled TypeScript modules for particle sampling, shared types/configuration, WGSL shaders, WebGPU/Canvas 2D engines, font readiness, and the lifecycle controller. Keep pointer and keyboard handlers scoped to the canvas, respect reduced motion with a static render, release resources on page exit, and reinitialize on BFCache restoration. WebGPU failures switch to a fresh Canvas 2D canvas; if both engines fail, preserve the text logo.
- Preserve lowercase `lemnlabs` in all brand labels, page titles, metadata, and documentation.
- `src/content/projects/`: top-level Markdown project files. Filename determines the slug; title and url are required, description and icon are optional, and order is an integer defaulting to 0. Projects link directly to their external websites; there are no project detail routes.
- `src/content/pages/about.md`: the single about page with required title and description. Other files do not automatically create routes; empty or whitespace-only bodies retain the existing EmptyState.
- `src/data/projects.ts`: shared project queries, order ascending then ID ordering, external project website URLs, and serializable ProjectSummary values with optional icon for ProjectList.
- `src/content.config.ts`: Markdown newsroom, project, and page collection loaders and metadata validation.
- `src/content/newsroom/`: Markdown posts as single files (`<slug>.md`) or Page Bundles (`<slug>/index.md` with colocated assets), with title, description, category ('공지사항' | '보도자료' | '미디어'), publishedAt (YYYY-MM-DD), with no draft field. Relative images (`./image.png`) in Page Bundles are optimized by Astro using Sharp. Every Markdown file in this folder is included in listings and detail routes on build/deploy; there is no draft feature. Keep work in progress outside content folders.
- `src/templates/newsroom.md`: newsroom authoring template outside all collection loaders; do not publish this template as a real post. Preserve existing user-authored posts.
- `src/data/newsroom.ts`: shared getNewsArticles queries for all articles, newest-first ordering, and base-aware article URLs.
- Newsroom lists use `NewsroomList.tsx` with `client:load` and `NewsroomRow.tsx` (plain article rows with standard links). Pass only serializable article summaries, not Markdown bodies, into the list island. Categories use `NewsroomCategoryBadge.tsx` (`buttonVariants({ variant: 'secondary', size: 'sm' })` with `rounded-full`); keep article-title links and category badge links separate to avoid nested anchors.
- `src/data/newsroom-categories.ts`: fixed categories ('공지사항', '보도자료', '미디어'), base-aware category query URLs, and the NewsArticleSummary interface. Category filters use shadcn `Button` (size sm, rounded-full, default variant when selected and secondary otherwise) in a labeled group with aria-pressed and aria-controls, preserve other query parameters, and synchronize `?category=` via pushState/popstate. Build category options from fixed categories; no category detail routes. Markdown detail pages remain in `src/pages/newsroom/[...slug].astro` at `/newsroom/{slug}/`.
- `src/styles/global.css`: Tailwind CSS v4 `@theme inline`, OKLCH design tokens, and shared site layout styles.
- `components.json`: shadcn/ui configuration and `@shadcn/lint` discovery metadata.
- `src/lib/utils.ts`: `cn` class merger helper combining `clsx` and `tailwind-merge`.
- `src/plugins/remark-callouts.mjs`: build-time callout transform configured through `@astrojs/markdown-remark`'s `unified()` Markdown processor in `astro.config.mjs`. Supports case-insensitive `info`, `note`, `tip`, `important`, `warning`, and `caution` markers with optional inline Markdown titles. Preserve ordinary blockquotes and unsupported markers; collapsible callouts are not supported. Shared callout styles apply to newsroom, project, and about content.
- `src/plugins/remark-mermaid.mjs` and `src/scripts/mermaid.ts`: transforms fenced `mermaid` code blocks into `.mermaid-diagram` containers with client-side dynamic loading of `mermaid`, dark/light theme synchronization, code copy, diagram/code toggle, and syntax error fallback.
- Routes: `/`, `/projects/`, `/newsroom/`, `/newsroom/{slug}/`, and `/about/`.
- Project descriptions are not yet provided. Keep truthful empty states where content is unavailable. `/newsroom/` lists all newsroom articles. Adding files to the newsroom or project content folder includes them on build/deploy; there is no draft feature.
- `public/`: static files, such as the favicon, copied unchanged during the build.
- `mise.toml`: pinned Node.js/pnpm versions and development tasks.
- `pnpm-workspace.yaml`: pnpm dependency build settings.
- `pnpm-lock.yaml`: generated dependency lockfile.
- `astro.config.mjs`: site URL, base path, static output, and trailing slash settings.
- `.github/workflows/deploy.yml`: PR checks and the GitHub Pages deployment workflow.
- `dist/`, `.astro/`, and `node_modules/` are generated directories. Do not edit or commit them.
- `.agents/skills/shadcn/`: official shadcn/ui AI skill for component authoring, composition rules, and CLI integration.
- `skills-lock.json`: lockfile for installed AI skills.

## Code and UI conventions

- Write page UI in React (`.tsx`). Keep Astro responsible for routes, build-time data loading, document metadata, Markdown rendering, and island composition. Keep the homepage Starfield markup and animation lifecycle in their existing Astro/TypeScript implementation.
- Render `PageTitle`, `DetailFrame`, `NewsroomArticleHeader`, and `MarkdownBody` statically without `client:*`. Their content slots use `ReactNode`; pass rendered Astro content through slots (`back-link` maps to the React `backLink` prop). Declare existing interactive components directly in Astro with `client:load`, including when passed into a static React frame. Do not import Astro components or `astro:content` in React, pass Markdown bodies into islands, or hydrate an entire page frame.
- Use shadcn/ui as the design system. Import Tailwind CSS in `src/styles/global.css`; use base shadcn components (`Button`, `Card`, `Separator`, `Badge`) and semantic tokens such as `--accent` (`#F7DA4A`), `--surface`, `--border`, `--muted`, and `--primary`.
- Enforce the design system with `@shadcn/lint`:
  - `shadcn/no-restyle`: prevents restyling design-system components with arbitrary classes. Use variants, or configure contracts in `eslint.config.mjs` for official patterns like `rounded-full` on `Button`.
  - `shadcn/no-arbitrary-values`: disallows arbitrary Tailwind values (such as `p-[13px]`); use the theme scale.
  - `shadcn/no-raw-colors`: disallows raw palette colors; use declared semantic theme tokens.
  - Base components in `src/components/ui/**` own their styles and are exempt from `no-restyle` and `no-arbitrary-values`.
- `FloatingNavigation.tsx` uses standard anchor tags with `buttonVariants({ variant: 'ghost' })` inside a floating capsule-shaped `nav`. Do not use Tabs, tab roles, separators, or a selected background indicator. Highlight the current section with foreground text and a bold weight; other links use muted text. Use `aria-current="page"`, native href navigation, Tab focus and Enter activation. Keep the active parent section highlighted on detail pages and leave room above content on non-home pages.
- DetailBackLink.tsx uses standard anchor tags with `buttonVariants({ variant: 'tertiary' })` above the title within the article width.
- Standalone empty states use server-rendered centered text without hydration; filtered newsroom empty states update within the list island.
- Follow the existing style: two-space indentation, single quotes for JavaScript/TypeScript strings, semicolons, and double quotes for HTML attributes.
- Define component props with a TypeScript `Props` interface and keep strict checks passing.
- Manage shared metadata in `Layout.astro` and use that layout for new pages.
- The default document language is Korean (`lang="ko"`). Write UI copy and task reports in Korean unless the user requests another language.
- Use semantic HTML, appropriate heading levels, image alternative text, keyboard accessibility, and visible focus indicators.
- Apply responsive styles so content and links remain usable on mobile screens.

## GitHub Pages paths and deployment

- The current settings are `site: 'https://lemnlabs.com'`, `base: '/'`, `output: 'static'`, and `trailingSlash: 'always'`.
- `public/CNAME` contains `lemnlabs.com`. The domain still requires GitHub Pages and DNS configuration; the file alone does not confirm domain activation.
- Use `import.meta.env.BASE_URL` for internal links and URLs to files in `public/`. Avoid domain-root paths such as `/about/` or `/favicon.svg`.

```astro
---
const base = import.meta.env.BASE_URL;
---

<a href={`${base}about/`}>About</a>
<img src={`${base}images/example.svg`} alt="Example description" />
```

- Add the actual page and image files before linking to the examples above. Assets imported from `src/` should use Astro's asset handling.
- When adding features that need a runtime server, such as server rendering, server APIs, or server-processed forms, account for GitHub Pages limitations before choosing an implementation.
- PRs run checks, build the site, and upload an artifact. Pushes to `main` and manual workflow runs also deploy the site. A push to `main` can update the public website.
- GitHub Pages must have its Source set to **GitHub Actions** for deployment. Do not report a successful deployment based only on a successful local build.
- When switching to a custom domain, review `site`, `base`, `public/CNAME`, GitHub Pages settings, and DNS together, and update the README.

## Validation instructions

- Run `mise run build` after changing source code, configuration, or dependencies. This command includes type checks, so there is no need to repeat `pnpm check` after it succeeds.
- Run `mise run format:check` and `mise run lint` after code or tooling changes. Prettier handles formatting and ESLint handles JavaScript/TypeScript/Astro and React Hooks rules; warnings fail lint. There is no separate test runner; do not report `pnpm test`.
- After changing UI or routing, build the site and check `/` and the affected pages in preview. Check mobile layouts, internal links, static asset paths, and keyboard focus as appropriate for the change.
- For documentation-only changes, check consistency with the actual configuration and Markdown formatting. A build is not required.
- Before finishing, run `git diff --check` and review the changed files. Clearly distinguish checks that could not be performed from checks that ran successfully.

## Changes and review guidance

- Keep changes within the requested scope and preserve existing user work. Do not include unrelated refactoring or dependency upgrades.
- Do not put secrets in source files or `public/`. Visitors can see `PUBLIC_` environment variables and values included in build output.
- When changing development commands, project structure, or deployment procedures, update the relevant sections of `README.md` and this document.
- When creating commits, use an appropriate `feat:`, `fix:`, `docs:`, or `chore:` prefix, following the existing `chore: initial commit` style.
- In PR descriptions or completion reports, briefly explain the purpose of the change, the validation performed and its results, and any configuration changes that affect deployment.

- ProjectList.tsx renders serializable project summaries with left-aligned app icons and external website links. MarkdownBody.tsx and markdown-prose styles are shared by newsroom and about content. Shared page-title, content-* and detail-* styles keep newsroom, projects and about consistent; detail pages use DetailBackLink.tsx with a label prop. Keep about empty-state when its Markdown body is empty.
