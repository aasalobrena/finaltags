# FinalTags

FinalTags is a browser-based tool for WCA competition organizers. It uses a WCA account to find competitions you manage, select final-round events, and create printable, foldable finalist cards.

**Live site:** [aasalobrena.github.io/finaltags](https://aasalobrena.github.io/finaltags/)

## Features

- Sign in with the World Cube Association (WCA).
- Browse competitions managed by your account and load their WCIF data.
- Select events and preview printable finalist cards.
- Print two cards per sheet on A4 or US Letter paper.
- Configure a competition logo and optionally prioritize competitors local to a country or continent.
- Save competition settings to the competition's WCIF as the `finaltags.competition` extension.

Finalist cards use WCA competition results, rankings, psych sheets, and competitor assignments when available. Cards are generated in the browser and printed using the browser's print dialog.

## Requirements

- Node.js 22
- pnpm 12.8.1
- A WCA account with access to the competitions you want to manage

## Run locally

```sh
pnpm install
pnpm dev
```

Open the local URL printed by Vite. Sign in with your WCA account to load competitions.

## Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the local Vite development server |
| `pnpm test` | Run the complete Vitest unit-test suite |
| `pnpm run build` | Type-check the project and create a production build in `dist/` |
| `pnpm preview` | Preview the production build locally |

## Authentication and data

Sign-in uses the WCA OAuth authorization flow with the `public` and `manage_competitions` scopes. The access token is stored in the browser's local storage so the session can persist across page reloads. Signing out removes it; an HTTP `401 Unauthorized` response also clears it and returns the app to the sign-in screen.

The app requests competition, WCIF, country, and psych-sheet data from the WCA API. Saving settings updates the competition WCIF and requires the account to have permission to manage that competition. The app does not have its own backend.

Competition settings are stored in the WCIF extension described by [`public/wcif-extensions.json`](public/wcif-extensions.json). They include an optional logo URL, paper size, and local-prioritization settings.

## Tests and continuous integration

Unit tests live in [`tests/`](tests/). GitHub Actions runs `pnpm test` and `pnpm run build` on pushes and pull requests using the workflow in [`.github/workflows/tests.yml`](.github/workflows/tests.yml).

## Deployment

The site is built and deployed to GitHub Pages when changes are pushed to `main`. The deployment workflow runs the test suite and production build, creates a `404.html` fallback for client-side routes, and publishes `dist/` to Pages. The Vite base path is `/finaltags/`, matching the repository's GitHub Pages URL.

See [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) and [`vite.config.ts`](vite.config.ts) for the deployment configuration.
