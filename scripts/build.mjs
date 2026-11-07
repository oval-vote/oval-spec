import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { REPOSITORY, writeEdition } from "./edition.mjs";

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");

await writeEdition("dist/draft", "main");

const editions = existsSync("published")
  ? readdirSync("published", { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^v\d+\.\d+\.\d+$/.test(entry.name))
      .map((entry) => {
        const { version, date } = JSON.parse(
          readFileSync(`published/${entry.name}/edition.json`, "utf8"),
        );
        return { tag: entry.name, version, date, parts: version.split(".").map(Number) };
      })
      .sort((a, b) => b.parts[0] - a.parts[0] || b.parts[1] - a.parts[1] || b.parts[2] - a.parts[2])
  : [];

for (const edition of editions) {
  cpSync(`published/${edition.tag}`, `dist/${edition.tag}`, { recursive: true });
}

const aliases = new Map();
for (const edition of editions) {
  const line = `${edition.parts[0]}.${edition.parts[1]}`;
  if (!aliases.has(line)) {
    aliases.set(line, edition.tag);
    cpSync(`published/${edition.tag}`, `dist/${line}`, { recursive: true });
  }
}

let draftDate;
try {
  draftDate = execFileSync("git", ["show", "-s", "--format=%cs", "HEAD"], {
    encoding: "utf8",
  }).trim();
} catch {
  draftDate = new Date().toISOString().slice(0, 10);
}

const longDate = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

const rows = [
  `<tr><td><em>Working draft</em></td><td>${longDate(draftDate)}</td><td><a href="./draft/">Draft</a></td><td></td></tr>`,
  ...editions.map(
    (edition, index) =>
      `<tr><td>${index === 0 ? "<em>Latest release</em>" : ""}</td><td>${longDate(edition.date)}</td>` +
      `<td><a href="./${edition.tag}/">Version ${edition.version}</a></td>` +
      `<td><a href="${REPOSITORY}/releases/tag/${edition.tag}">Release notes</a></td></tr>`,
  ),
];

const aliasNote =
  aliases.size > 0
    ? `<p>Each language version resolves to its newest edition: ${[...aliases]
        .map(([line, tag]) => `<a href="./${line}/">${line}</a> is ${tag.slice(1)}`)
        .join(", ")}.</p>`
    : "";

writeFileSync(
  "dist/index.html",
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Oval Specification Versions</title>
<meta name="color-scheme" content="light dark">
<style>
  :root { --color-foreground: #333333; --color-background: #ffffff; --color-link: #3b5998; }
  @media (prefers-color-scheme: dark) {
    :root { --color-foreground: #b6b6b6; --color-background: #262626; --color-link: #89b7da; }
  }
  body { color: var(--color-foreground); background: var(--color-background); font: 13pt/18pt Cambria, "Palatino Linotype", Palatino, "Liberation Serif", serif; margin: 6rem auto 3rem; max-width: 780px; padding: 0 1rem; }
  a { color: var(--color-link); text-decoration: none; }
  a:hover { text-decoration: underline; }
  h1 { font-size: 1.5em; margin: 0 0 2em; }
  td { padding: 0 2ch 5px 0; vertical-align: top; }
  p { margin-top: 2em; }
</style>
</head>
<body>
<h1>Oval Specification Versions</h1>
<table>
${rows.join("\n")}
</table>
${aliasNote}
<p>The specification is developed at <a href="${REPOSITORY}">oval-vote/oval-spec</a>.</p>
</body>
</html>
`,
);
