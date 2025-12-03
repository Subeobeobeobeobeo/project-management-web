<!-- .github/copilot-instructions.md: guidance for AI coding agents on this repo -->
# Project overview for AI coding assistants

This repository is a small two-tier web app:

- Backend: `backend/server.js` — an Express server that reads/writes a Google Sheet using a service account (`backend/credentials/service-account.json`). It exposes a simple REST surface:
  - `GET /api/projects` -> returns `{ values: [...] }` (each project is an array following the `headers` array in `server.js`).
  - `POST /api/projects` -> expects an object where keys are the header names (see `headers` in `server/server.js` or `AddProjectModal.js`) and appends a row.
  - `PUT /api/projects/:rowIndex` -> expects the same object; `rowIndex` is the 1-based sheet row (see frontend logic for how rowIndex is computed).

- Frontend: Create React App in `frontend/` — UI components treat a project as an array (not an object) and index into columns (e.g. `proj[5]` is Project Name). Important files: `frontend/src/App.js`, `frontend/src/components/AddProjectModal.js`, `ProjectList.js`, `ProjectForm.js`.

Key architectural decisions you must respect:

- The canonical data mapping is defined by the `headers` array in `backend/server.js`. The backend converts incoming objects into row arrays using this header order; the frontend renders rows as arrays. Do not change the order without updating both sides.
- The Google Sheets spreadsheet id is provided via `SHEET_ID` in the backend `.env`. The server expects a service account JSON at `backend/credentials/service-account.json` and will exit if missing.
- The sheet header row is treated as row 6 in `server.js`; the frontend computes sheet row numbers with `selectedIndex + 7`. Keep this offset in mind when adding features that reference sheet rows.

Developer workflows & commands

- Start backend (from repository root):
  - `node backend/server.js` (ensure `.env` has `SHEET_ID` and `backend/credentials/service-account.json` exists)
- Quick test POST: `node backend/test.js` (this posts to localhost; ensure server is running and port matches)
- Start frontend:
  - `cd frontend && npm start` (CRA dev server). The frontend `package.json` sets `proxy` to `http://127.0.0.1:5050`, but components currently call `http://localhost:5050` directly — either run backend on 5050 or update `frontend/src/config.js` (`API_BASE`) and component fetches.

Project-specific conventions & patterns

- Data shape: projects are arrays (not POJOs) when returned from the backend. The UI uses numeric indices (e.g. `proj[4]` for image link, `proj[5]` for name, `proj[20]` for winning rate). When creating/updating, components build objects keyed by header names; the server maps them to arrays.
- Field list for forms: `AddProjectModal.js` defines the full `fields` list — this must match `headers` in `server.js`.
- Error handling: backend returns text error messages; frontend components often `throw new Error(await res.text())` and show alerts. Keep API error bodies as plain text for current UI expectations.
- Styling: most components use inline styles; follow existing style approach when adding small UI changes.

Integration points & external dependencies

- Google Sheets via `googleapis` (the `sheets` API). Authorization uses a service account. Relevant: `backend/server.js`, `backend/credentials/service-account.json`.
- Dependencies: see `backend/package.json` and `frontend/package.json` for packages and scripts.

When editing code, pay attention to these concrete examples

- To add a new column: append name to `headers` in `backend/server.js`, add the same field name into the `fields` array in `frontend/src/components/AddProjectModal.js`, and ensure any frontend indexing (e.g. `proj[30]`) is updated.
- To debug row mapping issues: compare `server.js` `headers` array index vs frontend `proj[...]` uses in `ProjectList.js` and `App.js` filtering.

Where to look first (quick links)

- `backend/server.js` — core API + headers mapping
- `backend/credentials/service-account.json` — required for Google API (not checked in)
- `frontend/src/App.js` — data-fetch, create/update flows, rowIndex math
- `frontend/src/components/AddProjectModal.js` — canonical field list used for POST
- `frontend/src/components/ProjectList.js` — examples of rendering by array index

If anything here is unclear or you want more examples (sample requests, unit-test stubs, or a small script to validate header/array mapping), tell me which area to expand and I'll update this file.
