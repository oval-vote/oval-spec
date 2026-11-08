# Oval Specification

The specification for [Oval](https://oval.vote), a plain-text file format for voting guides.

- `SPEC.md` is the specification. It is published at [spec.oval.vote](https://spec.oval.vote) using
  [spec-md](https://spec-md.com)
- `grammar.txt` is Appendix A extracted verbatim, for tools that want only the grammar.
- `packages/oval-schema/oval.schema.json` is the JSON Schema for the compiled output of a voting
  guide, published to npm as `@oval-vote/oval-schema` with TypeScript types generated from it.
  Section 5.2 of the specification is generated from it by `npm run shape`.
- `examples/franklin.oval` is a full-scale fictional guide that exercises every construct in the
  specification.
- `examples/franklin.oval.json` is the compiled output of that guide, which validates against the
  schema.

The reference implementation is [oval-vote/oval](https://github.com/oval-vote/oval).

## Releasing

The Set Version, Release, and Unrelease workflows under Actions manage versions and editions, as
their descriptions say; `mise run set-version` and `mise run version:check` do the version part
locally. A release publishes `@oval-vote/oval-schema` to npm. Running Release with the draft option
instead publishes a prerelease of the package from `main` under the `draft` dist-tag, with no
edition and no release, for tools that build against the schema before the specification ships.

## License

The specification and everything published with it are licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); see `LICENSE`.
