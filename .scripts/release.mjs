import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { DRAFT_LINE, sourceDigest, writeEdition } from "./edition.mjs";

const { version } = JSON.parse(readFileSync("package.json", "utf8"));
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error(`package.json version ${version} is not MAJOR.MINOR.PATCH`);
}
const tag = `v${version}`;
const directory = `published/${tag}`;

const spec = readFileSync("SPEC.md", "utf8");
if (!spec.includes(`\n${DRAFT_LINE}\n`)) {
  throw new Error(`SPEC.md has no "${DRAFT_LINE}" line under its title`);
}
if (existsSync(directory)) {
  throw new Error(`${directory} already exists; editions are never rewritten`);
}
if (
  execFileSync(
    "git",
    ["status", "--porcelain", "--", "SPEC.md", "schema", "examples", "grammar.txt"],
    { encoding: "utf8" },
  ).trim()
) {
  throw new Error("commit or stash changes to the specification before releasing it");
}
execFileSync("node", [".scripts/grammar.mjs", "--check"], { stdio: "inherit" });

const date = new Date().toLocaleDateString("en-CA");
const longDate = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});
const source = sourceDigest();
writeFileSync(
  "SPEC.md",
  spec.replace(`\n${DRAFT_LINE}\n`, `\n_Version ${version}, released ${longDate}_\n`),
);
try {
  await writeEdition(directory, tag);
} finally {
  writeFileSync("SPEC.md", spec);
}
writeFileSync(
  `${directory}/edition.json`,
  JSON.stringify({ version, date, source }, null, 2) + "\n",
);
console.log(`wrote ${directory}`);
