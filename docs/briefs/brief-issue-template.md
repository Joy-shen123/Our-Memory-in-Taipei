# Brief: GitHub issue and pull request templates for this repo

You are a small documentation agent in the main checkout of `Our-Memory-in-Taipei`. CJ asked, 2026-09-23: 「send a agent do a issue template」. The repo's issues already follow one shape; your job is to make GitHub offer that shape to anyone who opens a new issue or pull request. Write only under `.github/`. Do not commit; the lead commits.

## Goal

A new issue or pull request on `Joy-shen123/Our-Memory-in-Taipei` starts from the shape the existing ones use, so the team writes issues that an agent can be dispatched from without rewriting.

## Done when

- `.github/ISSUE_TEMPLATE/work.md` exists: the work-issue template with exactly these five headings in this order, each with one line of guidance in an HTML comment: `## Goal`, `## Why now`, `## Done when`, `## Rules`, `## Not in this issue`. Under Goal, a placeholder line for the requester's own words quoted with the date, in the form used in the repo: `CJ, YYYY-MM-DD: 「…」`. Under Done when, a numbered list placeholder ending with the standard proof line: screenshots at the named fractions, fps at the cap headed, console empty, a blind rubric score before merge.
- `.github/ISSUE_TEMPLATE/research.md` exists: the research-first template, same five headings, whose Done when is a `research/<topic>/README.md` with options, costs and a recommended order, then the requester's pick quoted with its date, then the split into work issues.
- `.github/ISSUE_TEMPLATE/config.yml` with `blank_issues_enabled: false` and no contact links.
- `.github/pull_request_template.md`: first line `Closes #`, then a numbered list of what changed one line per commit, then a `Measured` line (fps at the fractions, console, screenshots reviewed by whom and when), then the attribution line the repo's PRs already carry.
- Every template's front matter (`name`, `about`, `title` prefix) filled; `labels` left empty.
- Each template is checked against the real examples: issues #3, #5, #9 and #12 for work, #8 for research, pull requests #6 and #7 for the PR shape (`gh issue view N --repo Joy-shen123/Our-Memory-in-Taipei`, `gh pr view N`). Where the examples disagree with each other, follow #9 to #13, the newest.

## Rules

Plain English, short lines, no hard wrapping inside paragraphs. No emoji in headings. Do not touch any file outside `.github/`. Do not commit, push, or open anything on GitHub.

## Deliverable

Reply with only: the file paths, and one line on anything in the examples you chose not to carry into the template and why.
