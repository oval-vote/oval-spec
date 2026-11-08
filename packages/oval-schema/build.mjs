import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { compile } from "json-schema-to-typescript";
import prettier from "prettier";

const { version } = JSON.parse(readFileSync("package.json", "utf8"));
const schema = JSON.parse(readFileSync("oval.schema.json", "utf8"));
schema.$id =
  process.env.OVAL_SCHEMA_ID ?? `https://spec.oval.vote/v${version}/schema/oval.schema.json`;

function withoutDescriptionsOnReferences(node) {
  if (Array.isArray(node)) {
    return node.map(withoutDescriptionsOnReferences);
  }
  if (node && typeof node === "object") {
    const copy = Object.fromEntries(
      Object.entries(node).map(([key, value]) => [key, withoutDescriptionsOnReferences(value)]),
    );
    if ("$ref" in copy) {
      delete copy.description;
    }
    return copy;
  }
  return node;
}

const typed = withoutDescriptionsOnReferences(structuredClone(schema));
typed.title = "Guide";
const generated = await compile(typed, "Guide", {
  bannerComment: "",
  additionalProperties: false,
  style: { printWidth: 100 },
});
const types = await prettier.format(generated, {
  ...(await prettier.resolveConfig("index.d.ts")),
  parser: "typescript",
});

mkdirSync("dist", { recursive: true });
writeFileSync("dist/oval.schema.json", `${JSON.stringify(schema, null, 2)}\n`);
writeFileSync("dist/index.d.ts", types);
