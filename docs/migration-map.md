# Canonical implementation and preservation map

| Tree | Evidence | Decision |
|---|---|---|
| `src/app.jsx`, `src/main.jsx`, root package/config | Root scripts launch Vite and full interactive app | Canonical; preserve UI and integrate backend |
| `server/index.js` | Root dev/server script | Canonical Express entry; expand through testable services |
| `Components/`, `Entities/`, `Pages/`, `layout.js` | Earlier Base44-style exports; root app does not import them | Preserve under `legacy/base44/` as historical reference |
| `src/pages/`, `src/layout.jsx` | Static sample data; not imported by active entry | Preserve under `legacy/ui-concepts/` |
| `lets-link-app/` | Default Vite counter/scaffold; not launched by root scripts | Preserve under `legacy/vite-starter/` |
| `backend/` | Capitalized Package.json and empty OpenAPI file; not executable backend | Preserve under `legacy/backend-scaffold/` |

The original frontend has useful polls, photo galleries, friend drafts and location
UI; retain these while identifying their browser-only persistence. No unique source
is deleted or treated as a proven server implementation. Git history remains intact.

Earlier login accepted an email without checking the password. New accounts are
created explicitly; existing localStorage records are not trusted as authenticated
accounts or imported automatically. Core users/parties/members now use server state.
