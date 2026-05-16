# update-docs

Audit and update project documentation so it accurately reflects the current codebase.

## Scope

Files to audit and update:
- `readme.md`
- `CLAUDE.md`
- `AGENTS.md`
- Any other `.md` files under `docs/` that describe architecture, design decisions, or developer workflow

## Rules

1. **Codebase is the sole source of truth.** Every factual claim in the docs (technology used, architectural pattern, error handling behaviour, data flow, etc.) must be verifiable by reading the current source files. Do not infer from git history, comments, or prior knowledge.
2. **Remove or correct anything that is no longer true.** If a library, pattern, or module has been removed or replaced, update every place it is mentioned.
3. **Do not add aspirational or inflated content.** Only describe what is implemented. Do not use marketing language or describe planned features.
4. **Do not invent details.** If you cannot find the code that backs a claim, remove the claim rather than guessing.

## Process

1. Read each documentation file in scope.
2. For each factual claim, locate the source code that implements it. Use search tools as needed.
3. If the claim matches the code, leave it unchanged.
4. If the claim is wrong, stale, or unverifiable, correct or remove it.
5. If a significant implemented feature or component is missing from the docs, add a concise, accurate description of it.
6. Write changes using the same tone and style as the existing content.

## Out of scope

- Comments inside source files
- Test files
- Configuration files
- Package changelogs
