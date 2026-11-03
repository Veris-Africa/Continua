# Phase 6 deletion ledger

Ledger established before removal. Git history retains removed files. No financial, account, migration, recovery, declaration-contract or candidate implementation is a deletion target.

| Candidate | Classification | Evidence / decision |
|---|---|---|
| `app/src/pages/Index.tsx` | Confirmed unused starter | Contains only the blank Lovable welcome screen. App routes explicitly import Home/Landing/NotFound, not Index. No tracked import, CLI, workflow, URL asset reference, `import.meta.glob` or `require.context` selects it. Remove and verify build/import closure. |
| `app/src/App.css` | Confirmed unused starter | Contains Vite logo/card/read-the-docs starter selectors. Neither main.tsx, CSS imports nor any tracked runtime/build entrypoint imports this stylesheet. App uses index.css and brand-system.css. Remove and verify build. |
| Root `@vercel/analytics` dependency | Confirmed unused declaration | Tracked-reference search finds the root manifest/lock only; no app, server, CLI or workflow import, analytics installation or runtime script. Remove only this direct declaration and its unreachable lock graph; preserve other deployment/reference interfaces. |
| `.d.ts` siblings | Testing/public type contract | Retain. No executable duplicate is inferred. |
| Go native API / Python packages | Future candidate or active collection dependency | Retain and rename by responsibility. Inactive candidate is not dead code. |
| `backend/python` vs financial-engine calculations | Production implementation and parity oracle | Retain both. Similar results are not proof of identical historical/null/precision contracts. |
| `scraper` vs financial-data-collector | Compatibility/reference and finite collection | Retain. Discovery/parity/Render paths remain consumers. |
| `supabase/migrations`, `backend/migration`, `infra/neon` SQL | Historical, recovery or separately pending migration | Retain exact filenames, content and ordering; do not execute. |
| Other assets, CSS selectors, flags, scripts and transitive packages | Unverified unless explicitly proven | Retain rather than infer deletion from zero static references. |

The conservative service audit and tracked import/entrypoint inventory accompany the final results. No claim that every unreferenced export is removable. Dynamic/operational ownership remains an explicit review requirement.
