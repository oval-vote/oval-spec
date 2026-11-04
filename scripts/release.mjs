import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { writeEdition } from "./edition.mjs";

const { version } = JSON.parse(readFileSync("package.json", "utf8"));
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error(`package.json version ${version} is not MAJOR.MINOR.PATCH`);
}
const tag = `v${version}`;
const directory = `published/${tag}`;

const spec = readFileSync("SPEC.md", "utf8");
if (!spec.includes(`**Version ${version}`)) {
  throw new Error(`SPEC.md does not open with "Version ${version}"; update its header first`);
}
if (existsSync(directory)) {
  throw new Error(`${directory} already exists; editions are never rewritten`);
}
if (execFileSync("git", ["status", "--porcelain", "--", "SPEC.md", "schema", "examples", "grammar.txt"], { encoding: "utf8" }).trim()) {
  throw new Error("commit or stash changes to the specification before releasing it");
}
execFileSync("node", ["scripts/grammar.mjs", "--check"], { stdio: "inherit" });

await writeEdition(directory, tag);
writeFileSync(
  `${directory}/edition.json`,
  JSON.stringify({ version, date: new Date().toLocaleDateString("en-CA") }, null, 2) + "\n",
);
console.log(`wrote ${directory}; commit it, merge, then tag the merge commit ${tag}`);
