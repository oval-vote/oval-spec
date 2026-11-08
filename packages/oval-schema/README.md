# @oval-vote/oval-schema

The JSON Schema of a compiled [Oval](https://oval.vote) voting guide, and TypeScript types generated
from it. The schema is Section 5 of the [specification](https://spec.oval.vote) in machine-readable
form, and this package's version is the specification's version.

```ts
import type { Guide, Contest, Measure } from "@oval-vote/oval-schema";
import schema from "@oval-vote/oval-schema/oval.schema.json" with { type: "json" };
```

`Guide` is the root type, the value `oval compile` prints and `compile()` in
[`@oval-vote/oval`](https://www.npmjs.com/package/@oval-vote/oval) returns. Every object the schema
defines has a type named after it, with the schema's descriptions as documentation comments.

The schema's `$id` names the edition it belongs to, such as
`https://spec.oval.vote/v1.0.0/schema/oval.schema.json`, which is where that edition serves it.

Between editions, drafts of the next version are published under the `draft` dist-tag as prereleases
such as `0.0.1-draft.2`, whose `$id` is the working draft's address. Install one with
`npm install @oval-vote/oval-schema@draft` and pin the exact version; `latest` only ever points at a
released edition.

The schema is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) with the rest
of the specification.
