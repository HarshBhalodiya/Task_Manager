# Practical 12 — CI/CD Pipeline with GitHub Actions

**Course:** Advanced Web Development Frameworks (ITUE301)
**CO/PO:** CO5 / PO3, PO5

---

## Objective

Automate testing of the Task Management application using a CI/CD pipeline on
GitHub Actions, so every push (or pull request) to `main` automatically installs
dependencies and runs the test suite, reporting a clear pass/fail status.

---

## Architecture

```
git push origin main
        |
        v
GitHub Actions Trigger (on: push to main)
        |
        v
Job: lint  ───────────►  Job: build-and-test
  ├ Checkout code              ├ Checkout code
  ├ Setup Node.js 18           ├ Setup Node.js 18
  ├ npm install                ├ npm install
  └ npm run lint               └ npm test
        |                             |
        v                             v
   Lint clean                    Tests pass -> green ✓ / fail -> red ✗
```

Workflow files live at `Task_Manager/.github/workflows/`:

- `ci.yml` — runs on **push to `main`** (core requirement). Two jobs:
  - `lint` — runs ESLint **before** the test job (`needs: lint`).
  - `build-and-test` — installs dependencies and runs Jest.
- `ci-pr.yml` — **supplementary #2**: runs only on **pull requests targeting
  `main`**, not on every direct push.

---

## Files Added / Changed

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | Main workflow: push-to-main, lint job + test job |
| `.github/workflows/ci-pr.yml` | PR-only workflow (supplementary #2) |
| `backend/tests/tasks.test.js` | Jest + Supertest API tests (no MongoDB needed) |
| `backend/.eslintrc.json` | ESLint config (node/commonjs/jest env) |
| `backend/package.json` | Added `test` and `lint` scripts + dev dependencies |
| `README.md` | Added CI status badge (supplementary #3) |

### The tests

`backend/tests/tasks.test.js` uses Jest + Supertest against the Express app.
The Mongoose `Task` model and the JWT `auth` middleware are mocked, so the suite
runs **without a live MongoDB / credentials** — fully deterministic in CI:

- `GET /tasks` → `200` for an authenticated request
- `GET /tasks` → includes `X-Cache` header
- `GET /cache/stats` → `200` with cache counters (a second endpoint)
- `GET /does-not-exist` → `404`

Run locally:

```bash
cd Task_Manager/backend
npm install
npm test       # 4 tests pass
npm run lint   # passes (0 errors)
```

---

## Step-by-Step Demonstration

### 1. Green pipeline (pass)

1. Create a GitHub repository and push the project.
2. Commit the workflow + test files:
   ```bash
   git add .github/workflows/ci.yml backend/tests backend/package.json backend/.eslintrc.json
   git commit -m "ci: add GitHub Actions pipeline with lint + tests (Practical 12)"
   git push origin main
   ```
3. Open the **Actions** tab → the workflow runs → both jobs turn **green** ✓.

### 2. Red pipeline (deliberately broken test)

1. Edit `backend/tests/tasks.test.js` and make an assertion fail, e.g. change
   `expect(res.statusCode).toBe(200)` to `toBe(201)` for `GET /tasks`.
2. Commit and push:
   ```bash
   git add backend/tests/tasks.test.js
   git commit -m "ci: deliberately break a test to demonstrate failure"
   git push origin main
   ```
3. The **build-and-test** job fails → a **red X** ✗ appears. Open the run log
   and read the failure (`Expected 200, received 201`).
4. Fix the assertion back to `toBe(200)`, commit, push → pipeline goes **green** again.

---

## Key Questions / Analysis

### CI vs CD — which does this demonstrate?
- **Continuous Integration (CI)** — merging code into a shared repository and
  automatically building + testing each change. This practical is **CI only**.
- **Continuous Deployment/Delivery (CD)** — automatically deploying to staging/prod
  after tests pass. Not implemented here (would add a `deploy` job).

### Why do automatic tests on every push catch problems earlier?
Because validation happens at the moment of integration — minutes after a commit —
instead of waiting for a manual, pre-release test pass. A broken change is caught
immediately, often by the author, while the context is still fresh, and it never
reaches other developers' local copies.

### What if the test file path is wrong?
The `npm test` step would run, find **no test suites** (or fail to resolve the
file), and fail — but at a **different step** (the run step) than a genuine test
failure. The lint job (`npm run lint` on `src tests server.js`) would also error
if the path were bad. So a wrong path fails fast with a "cannot find module" /
"no test specified" error rather than an assertion failure — distinguishing
*infrastructure* problems from *logic* problems.

---

## Supplementary Problems

1. **Linter job before tests** — `ci.yml` adds a `lint` job
   (`npm run lint`) that must pass before `build-and-test` runs (`needs: lint`).
2. **Run only on PRs targeting main** — `ci-pr.yml` uses
   `on: pull_request: branches: [main]`, so direct pushes to `main` do not
   trigger it.
3. **Status badge** — added to `README.md`. Replace the placeholders:
   ```markdown
   ![CI](https://img.shields.io/github/actions/workflow/status/YOUR_USER/YOUR_REPO/ci.yml?label=CI)
   ```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Workflow not in Actions tab | File not at `.github/workflows/ci.yml` or not pushed | Confirm exact path; commit + push |
| YAML syntax error instantly | Bad indentation | Use consistent 2-space indent, no tabs |
| `npm test` → "no test specified" | `test` script missing | `"scripts": {"test": "jest"}` in package.json |
| Pipeline passes with broken test | Test doesn't assert intended behavior | Ensure assertion would fail on real break |
| `npm run lint` errors | ESLint rules too strict | Tune `.eslintrc.json` |

---

## Evidence for Lab Journal

- [ ] Screenshot of the **green** run (both jobs pass)
- [ ] Screenshot of the **red** run (deliberately broken assertion)
- [ ] Screenshot of the failure log showing the expected/actual values
- [ ] Link to the Actions tab in the repo
