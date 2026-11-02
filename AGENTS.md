# AGENTS.md

Quero Pagar Mais: a static page that sends a person to PagTesouro with a pre-filled form for a voluntary contribution to the Fundo de Combate e Erradicação da Pobreza.

## Read first

- `spec.md` is the specification and the source of truth. `idea-01.md` is the superseded first draft; do not implement from it.
- `CONTEXT.md` is the domain glossary. Use its terms (Contribuição, Contribuinte, Fundo, Referência) in code, copy and commits.
- `docs/adr/` holds decisions; `docs/pagtesouro-observations.md` holds what is known about PagTesouro's undocumented URL pre-fill.

## Constraints

- Zero npm dependencies, no build step. `site/` is deployed as-is. A `package.json` containing only `{"type":"module"}` is allowed if Node needs it.
- Tests use `node --test` with `node:assert` only.
- No `innerHTML`, no third-party requests, no storage, no analytics.

## Commits

- Conventional commits: `type(scope): subject`.
- Commit messages, code comments and docs describe the change on its merits: no tool or assistant attributions, no `Co-Authored-By` trailers.
- `.context/` and `.gstack/` are local scratch and are git-ignored; never commit them.

<!-- agent-discipline-v1 -->

## Working agreement

- Verify edits in the resulting diff, including intended additions and removals.
  For scripted replacements, assert the expected matches before writing and use
  literal replacement values.
- Stage only intended changes and inspect the staged diff, including any hunks
  that were already dirty. Check the commit command's exit status and inspect the
  committed content; a clean worktree alone does not prove the change landed.
- Run the complete gate without piping it through an output filter. If capturing
  output, redirect the whole gate to a fresh log, save its status before reading
  the log, and return that status. Use the repository's existing runner when
  timeout or process supervision is needed; keep that machinery out of this file.
- Report the command and observed exit status when claiming work passes, is clean,
  works, is verified or is done.
  Interrupted or incomplete execution is unverified. A clean review is independent
  judgment, not evidence that a build or test ran.
- Support claims about tool behavior with a reproducible command, relevant version
  and mode, and observed result; capture stdout and stderr separately when the
  distinction matters. Label unmeasured claims and distinguish an observed result
  from a cause established by a controlled comparison or documentation.
- For a bug regression test, demonstrate that it catches the bug on unfixed code
  and passes with the fix. Check the failure is the intended assertion, rather
  than setup or an unrelated error. Use a disposable environment for a deliberate
  break that could affect live systems or funds; otherwise report that the red
  run was not performed.

Gate for this repo: `node --test`
<!-- end-agent-discipline -->
