import { readFileSync, writeFileSync } from "node:fs";

const spec = readFileSync("SPEC.md", "utf8");
const start = spec.indexOf("\n## A. Appendix: Grammar Summary\n");
const end = spec.indexOf("\n## B. Appendix", start);
const body = spec.slice(spec.indexOf("**Lexical productions**", start), end).trimEnd() + "\n";
const header =
  "Oval grammar, extracted verbatim from Appendix A of SPEC.md; edit the spec, not this file.\n" +
  "Notation is described in SPEC.md section 1.1: `Name : Rule` matches tokens, `Name :: Rule`\n" +
  "matches characters, alternatives are listed one per line, and ? * + are the usual quantifiers.\n\n";
const expected = header + body;

if (process.argv.includes("--check")) {
  if (readFileSync("grammar.txt", "utf8") !== expected) {
    console.error("grammar.txt is out of date; run `npm run grammar`");
    process.exit(1);
  }
} else {
  writeFileSync("grammar.txt", expected);
}
