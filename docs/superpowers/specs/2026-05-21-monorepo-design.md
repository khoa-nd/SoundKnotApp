# Monorepo Consolidation — Design Spec

## Goal

Consolidate SoundKnotApp (Expo mobile) and SoundKnotAPI (Cloudflare Workers/Hono) into a single monorepo using npm workspaces. The existing SoundKnotApp repo is the base; API history is imported via git subtree.

## Motivation

- **Developer convenience:** single clone, single IDE window, unified tooling.
- **Code sharing:** shared types and utilities (e.g. `time.ts` exists in both) can live in a common package.
- **Coupled versioning:** app and API evolve together; cross-cutting changes land in one commit.

## Target Structure

```
SoundKnotApp/                  # root — workspace manager
├── package.json               # workspaces config, proxy scripts, no deps
├── .gitignore                 # merged ignore rules
├── app/                       # Expo mobile app (moved from repo root)
│   ├── package.json
│   ├── app.json
│   ├── tsconfig.json
│   ├── .gitignore             # app-specific ignores (node_modules, dist, .expo)
│   ├── expo-env.d.ts
│   ├── app/                   # Expo Router pages
│   ├── src/                   # stores, services, hooks, constants, types
│   ├── assets/
│   ├── design/
│   ├── img/
│   └── specs/
├── api/                       # Cloudflare Workers API (imported via subtree)
│   ├── package.json
│   ├── wrangler.toml
│   ├── tsconfig.json
│   ├── .gitignore
│   └── src/
└── packages/
    └── shared/                # empty scaffold — ready for future extraction
        ├── package.json
        └── tsconfig.json
```

## Root package.json

```json
{
  "name": "soundknot",
  "private": true,
  "workspaces": ["app", "api", "packages/*"],
  "scripts": {
    "dev:app": "npm run start -w app",
    "dev:api": "npm run dev -w api",
    "deploy:api": "npm run deploy -w api",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present"
  }
}
```

## Migration Steps

### 1. Move SoundKnotApp contents into `app/`

Use `git mv` for every file/directory at repo root (except `.git`, `node_modules`, `.env`). This preserves blame history with `git log --follow`.

Files to move:
- `app.json`, `package.json`, `tsconfig.json`, `expo-env.d.ts`
- `app/`, `src/`, `assets/`, `design/`, `img/`, `specs/`
- `.expo/`, `.gitignore`, `dist/`
- `todo_20260521.md` — stays at root (project-level)
- `.env` — recreate inside `app/` (not tracked)

### 2. Import SoundKnotAPI via git subtree

```bash
git subtree add --prefix=api \
  /Users/khoanguyen/Documents/SoundKnotAPI main
```

This brings in the full API commit history under the `api/` prefix.

### 3. Create root workspace config

- New root `package.json` with workspaces array and proxy scripts.
- New root `.gitignore` with `node_modules` at minimum.

### 4. Create `packages/shared` scaffold

Minimal `package.json` and `tsconfig.json`. No code yet — this is the future home for shared types and utilities.

```json
{
  "name": "@soundknot/shared",
  "version": "0.0.1",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

### 5. Reinstall dependencies

Run `npm install` from root. npm workspaces will hoist shared deps and symlink workspace packages.

### 6. Verify

- `npm run dev:app` starts the Expo dev server.
- `npm run dev:api` starts the Wrangler dev server.
- `npm run typecheck` passes for both workspaces.

## What Changes

- SoundKnotApp files move from root to `app/`. `git blame` requires `--follow` for moved files.
- SoundKnotAPI history is merged in as a subtree. Its commits appear in `git log` with original messages.
- A single `npm install` at root manages all dependencies.

## What Stays the Same

- Each package keeps its own `package.json`, `tsconfig.json`, and tooling config.
- Expo config (`app.json`) stays inside `app/`.
- Wrangler config stays inside `api/`.
- `.env` files remain per-package and untracked.
- No code changes to either app or API source files.

## Out of Scope

- Extracting shared code into `packages/shared` (future task).
- CI/CD pipeline changes.
- Turborepo or other build orchestration.
