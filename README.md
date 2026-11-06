# Oval Specification

The specification for [Oval](https://oval.vote), a plain-text file format for voting guides.

- `SPEC.md` is the specification. It is published at [spec.oval.vote](https://spec.oval.vote) using
  [spec-md](https://spec-md.com)
- `grammar.txt` is Appendix A extracted verbatim, for tools that want only the grammar.
- `schema/guide.schema.json` is the JSON Schema for compiled output of a voting guide.
- `examples/franklin.oval` is a full-scale fictional guide that exercises every construct in the
  specification.
- `examples/franklin.oval.json` is the compiled output of that guide, which validates against the
  schema.

The reference implementation of oval can be found [here](https://github.com/oval-vote/oval).

The reference implementation is [oval-vote/oval](https://github.com/oval-vote/oval). The
specification and the implementation share one version number; see Section 2.5.

## License

The specification and everything published with it are licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); see `LICENSE`.
