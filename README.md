# Oval Specification

The specification for [Oval](https://oval.vote), a plain-text file format for voting guides.

- `SPEC.md` is the specification. It is published at [spec.oval.vote](https://spec.oval.vote).
- `grammar.txt` is Appendix A extracted verbatim, for tools that want only the grammar.
- `schema/guide.schema.json` is the JSON Schema for compiled output (Section 6).
- `examples/franklin.oval` is a full-scale fictional guide that exercises every construct, and
  `examples/franklin.oval.json` is its compiled output.

The reference implementation is [oval-vote/oval](https://github.com/oval-vote/oval). The
specification and the implementation share one version number; see Section 2.5.

## The website

The site is `SPEC.md` rendered with [spec-md](https://spec-md.com), the tool behind the GraphQL
specification's site, and deployed to GitHub Pages on every push to `main`. Tooling is managed
with [mise](https://mise.jdx.dev), which reads `.node-version`.

```sh
npm ci
npm run build    # writes dist/
```

spec-md is stricter than GitHub's Markdown. The conventions that matter when editing `SPEC.md`:

- Section headings carry their own numbers with a trailing dot (`### 2.5. Document`) so the site
  and GitHub agree; appendices are `## A. Appendix: Title`. There is no hand-written table of
  contents.
- Grammar productions are fenced code for now. Oval examples are fenced as `oval example`.
- Words containing underscores go in backticks.

The `site` job in CI builds the site on every pull request, so a document that spec-md cannot
parse fails the check.
