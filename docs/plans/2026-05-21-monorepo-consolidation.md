# Monorepo Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate SoundKnotApp and SoundKnotAPI into a single npm workspaces monorepo, with SoundKnotApp as the base repo.

**Architecture:** Move all current SoundKnotApp files into an `app/` subdirectory using `git mv`, import SoundKnotAPI via `git subtree add` into `api/`, then wire up npm workspaces at the root. An empty `packages/shared` scaffold is created for future code sharing.

**Tech Stack:** npm workspaces, Expo SDK 54, Cloudflare Workers + Hono, TypeScript

---

## File Map

**Create (new files):**
- `package.json` (root workspace config)
- `.gitignore` (root-level ignore rules)
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- `packages/shared/src/index.ts`

**Move (via `git mv`):**
- Everything at repo root except `.git/`, `.claude/`, `node_modules/`, `.env`, `todo_20260521.md`, `docs/` → into `app/`

**Import (via `git subtree add`):**
- SoundKnotAPI repo → `api/`

---

### Task 1: Commit uncommitted changes

Before any `git mv` operations, the working tree must be clean. `specs/technical_docs.md` has staged changes and `todo_20260521.md` is untracked.

**Files:**
- Modified: `specs/technical_docs.md`
- Untracked: `todo_20260521.md`

- [ ] **Step 1: Stage and commit the pending changes**

```bash
cd /Users/khoanguyen/Documents/SoundKnotApp
git add specs/technical_docs.md todo_20260521.md
git commit -m "Update technical docs and add todo for 2026-05-21"
```

Expected: clean `git status` (no modified or untracked files except ignored ones).

- [ ] **Step 2: Verify clean working tree**

```bash
git status
```

Expected: `nothing to commit, working tree clean`

---

### Task 2: Move SoundKnotApp files into `app/` subdirectory

Use `git mv` to relocate all app files into `app/`. This preserves git history (accessible via `git log --follow`).

**Files:**
- Move: all tracked files at root → `app/`
- Keep at root: `.git/`, `.claude/`, `todo_20260521.md`, `docs/`

- [ ] **Step 1: Create `app/` directory**

```bash
cd /Users/khoanguyen/Documents/SoundKnotApp
mkdir -p app_temp
```

We use `app_temp` because there's already an `app/` directory (Expo Router routes). We'll move everything into `app_temp/` first, then rename.

- [ ] **Step 2: Move all app files into `app_temp/`**

The Expo Router `app/` directory (routes) must be moved first to avoid conflict with the workspace `app/` directory name. Move files in a specific order:

```bash
cd /Users/khoanguyen/Documents/SoundKnotApp

# Move Expo Router's app/ directory first (rename to avoid conflict)
git mv app app_temp/app

# Move all other app files and directories
git mv app.json app_temp/
git mv package.json app_temp/
git mv package-lock.json app_temp/
git mv tsconfig.json app_temp/
git mv expo-env.d.ts app_temp/
git mv src app_temp/
git mv assets app_temp/
git mv design app_temp/
git mv img app_temp/
git mv specs app_temp/
git mv .gitignore app_temp/
```

- [ ] **Step 3: Rename `app_temp/` to `app/`**

```bash
git mv app_temp app
```

After this, the directory structure is:
```
app/
  app/          (Expo Router routes)
  src/
  assets/
  package.json
  app.json
  tsconfig.json
  ...
```

- [ ] **Step 4: Move `.expo/` and `dist/` if they exist**

These are gitignored but should be cleaned up. They'll be regenerated when running `npm run dev:app`.

```bash
rm -rf .expo dist
```

- [ ] **Step 5: Move `.env` if it exists**

```bash
# .env is not tracked — just move the file
mv .env app/.env 2>/dev/null || true
```

- [ ] **Step 6: Commit the move**

```bash
git add -A
git commit -m "Move SoundKnotApp files into app/ subdirectory"
```

- [ ] **Step 7: Verify the move**

```bash
ls app/
# Expected: app/ app.json assets/ design/ expo-env.d.ts img/ package-lock.json package.json specs/ src/ tsconfig.json .gitignore

ls app/app/
# Expected: (tabs)/ _layout.tsx ai-settings.tsx ai-tutor.tsx dictation.tsx finished.tsx index.tsx listen.tsx login.tsx
```

---

### Task 3: Import SoundKnotAPI via git subtree

Import the API repo with full history into the `api/` prefix.

**Files:**
- Import: entire SoundKnotAPI repo → `api/`

- [ ] **Step 1: Add the API repo as a subtree**

```bash
cd /Users/khoanguyen/Documents/SoundKnotApp
git subtree add --prefix=api /Users/khoanguyen/Documents/SoundKnotAPI main
```

Expected: git creates a merge commit that brings in all API history under `api/`.

- [ ] **Step 2: Verify the import**

```bash
ls api/
# Expected: package.json src/ specs/ tsconfig.json wrangler.toml .gitignore

ls api/src/
# Expected: index.ts lib/ middleware/ routes/
```

- [ ] **Step 3: Verify API history is present**

```bash
git log --oneline -- api/ | head -5
# Expected: see API commits like "Add /ai/chat endpoint backed by Gemini", "Initial commit: SoundKnot API..."
```

---

### Task 4: Create root workspace configuration

Set up the npm workspaces root `package.json` and `.gitignore`.

**Files:**
- Create: `package.json` (root)
- Create: `.gitignore` (root)

- [ ] **Step 1: Create root `package.json`**

Create `/Users/khoanguyen/Documents/SoundKnotApp/package.json`:

```json
{
  "name": "soundknot",
  "private": true,
  "workspaces": [
    "app",
    "api",
    "packages/*"
  ],
  "scripts": {
    "dev:app": "npm run start -w app",
    "dev:api": "npm run dev -w api",
    "deploy:api": "npm run deploy -w api",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present"
  }
}
```

- [ ] **Step 2: Create root `.gitignore`**

Create `/Users/khoanguyen/Documents/SoundKnotApp/.gitignore`:

```
node_modules/
.DS_Store
*.tsbuildinfo
```

Each workspace has its own `.gitignore` for package-specific ignores (`.expo/`, `dist/`, `.wrangler/`, etc.).

- [ ] **Step 3: Rename app's `package.json` name field**

The app's `package.json` at `app/package.json` currently has `"name": "soundknot"` — this conflicts with the root. Change it to `"name": "soundknot-app"` so npm workspaces can distinguish them.

Edit `app/package.json`: change `"name": "soundknot"` to `"name": "soundknot-app"`.

- [ ] **Step 4: Commit workspace configuration**

```bash
git add package.json .gitignore
git add app/package.json
git commit -m "Add npm workspaces configuration at root"
```

---

### Task 5: Scaffold `packages/shared`

Create the empty shared package for future code extraction.

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`

- [ ] **Step 1: Create directories**

```bash
mkdir -p packages/shared/src
```

- [ ] **Step 2: Create `packages/shared/package.json`**

Create `/Users/khoanguyen/Documents/SoundKnotApp/packages/shared/package.json`:

```json
{
  "name": "@soundknot/shared",
  "version": "0.0.1",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

- [ ] **Step 3: Create `packages/shared/tsconfig.json`**

Create `/Users/khoanguyen/Documents/SoundKnotApp/packages/shared/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "declaration": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create empty barrel export**

Create `/Users/khoanguyen/Documents/SoundKnotApp/packages/shared/src/index.ts`:

```typescript
export {};
```

- [ ] **Step 5: Commit shared package scaffold**

```bash
git add packages/
git commit -m "Add empty packages/shared scaffold for future code sharing"
```

---

### Task 6: Install dependencies and verify

Run npm install from root to wire up workspaces, then verify both packages work.

**Files:**
- Generated: `package-lock.json` (root)
- Generated: `node_modules/` (root, hoisted)

- [ ] **Step 1: Clean old node_modules**

```bash
cd /Users/khoanguyen/Documents/SoundKnotApp
rm -rf node_modules
rm -rf app/node_modules
rm -rf api/node_modules
```

- [ ] **Step 2: Install all dependencies from root**

```bash
npm install
```

Expected: npm resolves workspaces `soundknot-app`, `soundknot-api`, `@soundknot/shared`. Dependencies are hoisted to root `node_modules/`.

- [ ] **Step 3: Verify Expo app starts**

```bash
npm run dev:app
```

Expected: Expo dev server starts. Press `q` to quit after confirming it launches. If it fails, check that Expo can find its config — `app.json` references `./assets/images/icon.png` which is now at `app/assets/images/icon.png` (relative to `app/`, so the path is still correct since Expo runs from `app/`).

- [ ] **Step 4: Verify API starts**

```bash
npm run dev:api
```

Expected: Wrangler dev server starts on localhost. Press `q` to quit after confirming. If it prompts for login, that's expected — wrangler needs auth for the first run.

- [ ] **Step 5: Commit lockfile**

```bash
git add package-lock.json
# Also add app/package-lock.json removal if npm workspaces consolidated it
git add -A
git commit -m "Install dependencies via npm workspaces"
```

- [ ] **Step 6: Final verification — check repo structure**

```bash
ls -la
# Expected at root: .claude/ .git/ .gitignore app/ api/ docs/ node_modules/ package.json package-lock.json packages/ todo_20260521.md

ls app/
# Expected: app/ app.json assets/ design/ expo-env.d.ts img/ package.json specs/ src/ tsconfig.json .gitignore

ls api/
# Expected: .gitignore package.json specs/ src/ tsconfig.json wrangler.toml

ls packages/shared/
# Expected: package.json src/ tsconfig.json
```
