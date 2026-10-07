# Questions

1. **README import path.** The approved README says `import { x402Client } from "@x402/core"`. In `@x402/core` 2.28.0 the root entry does not export `x402Client`; it is exported from `@x402/core/client` (checked by importing both). I used the README text exactly as written. Decision needed: change the line to `@x402/core/client`?
2. **Branch name.** The brief says branch `task/x402-guard`; this session was assigned `claude/gracious-johnson-k6q24t`. I worked and will push on the assigned branch.
3. **No `main` on the remote.** The remote repo is empty (no branches), so a draft PR into `main` has no base. See REPORT.md for what was done.
4. **TASK.md not saved.** The brief's text contains the banned terms (as the banned list), which would fail the repo-wide grep, so `tasks/x402-guard/TASK.md` was not written.
5. **Type imports.** Types are imported from `@x402/core/client` (type-only, erased at build), since the root entry does not carry them.
