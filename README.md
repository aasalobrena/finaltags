# FinalTags

FinalTags is a browser-based tool for WCA competition organizers. It uses a WCA account to find competitions you manage, select final-round events, and create printable, foldable finalist tags.

**Live site:** [aasalobrena.github.io/finaltags](https://aasalobrena.github.io/finaltags/)

## Features

- Sign in with the World Cube Association (WCA).
- Browse competitions managed by your account and load their WCIF data.
- Select official events and named custom tag sets together in the Printing tab, previewing the combined printable tags.
- Create multiple named sets of custom tags per competition. Choose the event and name each set independently, then select competitors or use custom entries, flags, seeds, results, and logos.
- Print two tags per sheet on A4 or US Letter paper.
- Configure a competition logo and optionally prioritize competitors local to a country or continent.
- Save competition settings to the competition's WCIF as the `finaltags.competition` extension.

Official finalist tags use WCA competition results, rankings, psych sheets, and competitor assignments when available. Configure custom tag sets in the Custom tags tab, then select them alongside official events in Printing. When signed in as a competition manager, custom tag data can be saved to the competition's WCIF extension.

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

Competition settings and optionally saved custom tag data are stored in the WCIF extension described by [`public/wcif-extension.json`](public/wcif-extension.json). The `customTags` extension field is an array containing one configuration per event. Settings include an optional logo URL, paper size, and local-prioritization settings.

## Tests and continuous integration

Unit tests live in [`tests/`](tests/). GitHub Actions runs `pnpm test` and `pnpm run build` on pushes and pull requests using the workflow in [`.github/workflows/tests.yml`](.github/workflows/tests.yml).

## Deployment

The site is built and deployed to GitHub Pages when changes are pushed to `main`. The deployment workflow runs the test suite and production build, creates a `404.html` fallback for client-side routes, and publishes `dist/` to Pages. The Vite base path is `/finaltags/`, matching the repository's GitHub Pages URL.

See [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) and [`vite.config.ts`](vite.config.ts) for the deployment configuration.
