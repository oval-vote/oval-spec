import { readFileSync, writeFileSync } from "node:fs";

const DRAFT_LINE = "_Working Draft_";
const spec = readFileSync("SPEC.md", "utf8");
if (spec.includes(`\n${DRAFT_LINE}\n`)) {
  throw new Error("SPEC.md is already the working draft");
}
const edition = /\n_Version \d+\.\d+\.\d+, released [^_\n]+_\n/;
if (!edition.test(spec)) {
  throw new Error("SPEC.md has neither a draft line nor an edition line under its title");
}
writeFileSync("SPEC.md", spec.replace(edition, `\n${DRAFT_LINE}\n`));
console.log(`SPEC.md is the working draft again; commit it as "Resume the working draft"`);
