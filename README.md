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
specification's site, and deployed to GitHub Pages from `main` once the checks pass. The build
writes the working draft to `dist/draft/`, copies every released edition from `published/`, adds a
`MAJOR.MINOR` alias for the newest edition of each language version, and generates the versions
index at `dist/index.html`. Releases are described in `RELEASE.md`. Tooling is managed with
[mise](https://mise.jdx.dev), which reads `.node-version`.

```sh
npm ci
npm test         # builds the site and runs every check; CI runs this
npm run check    # formatting, grammar extract, and spelling
npm run build    # writes dist/
npm run dev      # builds, serves dist/ at http://localhost:8000, and reloads the browser on change
npm run grammar  # regenerates grammar.txt from Appendix A
npm run format   # wraps prose at 100 columns with Prettier
npm run spell    # spell-checks the Markdown files and LICENSE with cspell
```

spec-md is stricter than GitHub's Markdown. The conventions that matter when editing `SPEC.md`:

- Section headings carry their own numbers with a trailing dot (`### 2.5. Document`) so the site and
  GitHub agree; appendices are `## A. Appendix: Title`. There is no hand-written table of contents.
- Grammar productions are written in spec-md's paragraph form, one production per paragraph with
  alternatives as list items, so the site renders them with every name linked. Oval examples are
  fenced as `oval example`.
- Words containing underscores go in backticks.
- Prettier rewraps paragraphs at 100 columns, so a grammar production must fit on one line; the
  build fails on one that wraps.

CI runs `mise run ci` on every pull request and push to `main`, which validates the schema and runs
`npm test`, so a document that spec-md cannot parse fails the check. On `main`, the deploy job runs
only after that job passes.

## License

The specification and everything published with it are licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); see `LICENSE`.
