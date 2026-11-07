import { readFileSync, writeFileSync } from "node:fs";
import prettier from "prettier";

const SCHEMA = "schema/guide.schema.json";
const SPEC = "SPEC.md";
const HEADING = "### 5.2. Shape";

const ORDER = [
  ["root", "Root"],
  ["guide", "Guide"],
  ["party", "Party"],
  ["candidate", "Candidate"],
  ["ballot", "Ballot"],
  ["section", "Section"],
  ["contest", "Contest"],
  ["method", "Method"],
  ["campaign", "Campaign"],
  ["member", "Member"],
  ["stance", "Stance"],
  ["contest_recommendation", "Contest Recommendation"],
  ["measure", "Measure"],
  ["measure_recommendation", "Measure Recommendation"],
  ["question_entry", "Question Entry"],
  ["location", "Location"],
  ["counts", "Counts"],
];

const schema = JSON.parse(readFileSync(SCHEMA, "utf8"));
const definitions = { root: schema, ...schema.$defs };
const titles = new Map(ORDER);

function nameOf(reference) {
  return reference.replace("#/$defs/", "");
}

function typeOf(property) {
  if (property.$ref) {
    const name = nameOf(property.$ref);
    if (name === "identifier") return "identifier";
    if (name === "markdown") return "Markdown";
    return titles.get(name) ?? name;
  }
  if (property.const !== undefined) return `\`"${property.const}"\``;
  if (property.enum) return "one of " + property.enum.map((value) => `\`"${value}"\``).join(", ");
  if (property.oneOf) return listOf(property.oneOf.map(typeOf));
  switch (property.type) {
    case "array": {
      const items = typeOf(property.items);
      const plural = items.startsWith("array") ? items.replace(/^array/, "arrays") : items;
      return `array of ${plural}`;
    }
    case "integer":
      return property.minimum === undefined ? "integer" : `integer, at least ${property.minimum}`;
    case "string":
      if (property.format === "uri") return "string, a URL";
      if (property.format === "date") return "string, `YYYY-MM-DD`";
      return "string";
    default:
      return property.type;
  }
}

function listOf(items) {
  if (items.length <= 2) return items.join(" or ");
  return `${items.slice(0, -1).join(", ")}, or ${items.at(-1)}`;
}

function row(key, type, required, meaning) {
  return `| \`${key}\` | ${type} | ${required} | ${meaning} |`;
}

function objectRows(definition, requiredLabel = (required) => (required ? "yes" : "no")) {
  const required = new Set(definition.required ?? []);
  return Object.entries(definition.properties).map(([key, property]) =>
    row(key, typeOf(property), requiredLabel(required.has(key), key), property.description ?? ""),
  );
}

function unionRows(definition) {
  const variants = definition.oneOf;
  const discriminator = Object.keys(variants[0].properties).find(
    (key) => variants[0].properties[key].const !== undefined,
  );
  const values = variants.map((variant) => variant.properties[discriminator].const);
  const rows = [
    row(
      discriminator,
      "one of " + values.map((value) => `\`"${value}"\``).join(", "),
      "yes",
      variants[0].properties[discriminator].description ?? "",
    ),
  ];
  for (const variant of variants) {
    const value = variant.properties[discriminator].const;
    const required = new Set(variant.required ?? []);
    for (const [key, property] of Object.entries(variant.properties)) {
      if (key === discriminator) continue;
      rows.push(
        row(
          key,
          typeOf(property),
          required.has(key) ? `with \`"${value}"\`` : `optional with \`"${value}"\``,
          property.description ?? "",
        ),
      );
    }
  }
  return rows;
}

function section(name, title) {
  const definition = definitions[name];
  const lines = [`#### ${title}`, ""];
  if (definition.description) {
    lines.push(definition.description, "");
  }
  lines.push("| Key | Type | Required | Meaning |", "| --- | --- | --- | --- |");
  lines.push(...(definition.oneOf ? unionRows(definition) : objectRows(definition)));
  return lines.join("\n");
}

export async function render() {
  const intro = [
    "This section is generated from `schema/guide.schema.json` by `scripts/shape.mjs` and lists the",
    "objects and keys the schema defines. Every value is one of the objects below, an array of them,",
    "or a scalar. An _identifier_ is an entity's identifier without its leading `@`, and _Markdown_",
    "is a body with its common indentation removed, line terminators normalized to `\\n`, and no",
    'trailing terminator (Section 2.2). A key whose meaning begins with "Derived" is computed from',
    "the document; Section 5.3 defines it.",
  ].join("\n");
  const sections = ORDER.map(([name, title]) => section(name, title));
  const markdown = [intro, ...sections].join("\n\n") + "\n";
  const options = await prettier.resolveConfig(SPEC);
  return prettier.format(markdown, { ...options, parser: "markdown" });
}

export async function update(check) {
  const spec = readFileSync(SPEC, "utf8");
  const start = spec.indexOf(`\n${HEADING}\n`);
  if (start < 0) {
    throw new Error(`${SPEC} has no "${HEADING}" heading`);
  }
  const bodyStart = start + HEADING.length + 2;
  const next = spec.indexOf("\n### ", bodyStart);
  const end = next < 0 ? spec.length : next + 1;
  const current = spec.slice(bodyStart, end);
  const generated = "\n" + (await render()) + "\n";
  if (current === generated) {
    return true;
  }
  if (check) {
    console.error(`Section 5.2 is out of date; run \`npm run shape\``);
    return false;
  }
  writeFileSync(SPEC, spec.slice(0, bodyStart) + generated + spec.slice(end));
  return true;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").at(-1))) {
  const ok = await update(process.argv.includes("--check"));
  process.exit(ok ? 0 : 1);
}
