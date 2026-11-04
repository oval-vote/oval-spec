import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import specMarkdown from "spec-md";

export const REPOSITORY = "https://github.com/oval-vote/oval-spec";

export async function renderSpec(ref) {
  const html = await specMarkdown.html("SPEC.md", { githubSource: `${REPOSITORY}/blame/${ref}/` });
  const defined = new Set(
    [...html.matchAll(/<div class="spec-production[^"]*" id="([^"]+)"/g)].map((m) => m[1]),
  );
  const undefinedNames = [
    ...new Set(
      [...html.matchAll(/<span class="spec-nt"><span data-name="([^"]+)">/g)].map((m) => m[1]),
    ),
  ].filter((name) => !defined.has(name));
  if (undefinedNames.length > 0) {
    throw new Error(`grammar names used but never defined: ${undefinedNames.join(", ")}`);
  }
  return html;
}

export async function writeEdition(directory, ref) {
  const html = await renderSpec(ref);
  mkdirSync(directory, { recursive: true });
  writeFileSync(`${directory}/index.html`, html);
  cpSync("schema", `${directory}/schema`, { recursive: true });
  cpSync("examples", `${directory}/examples`, { recursive: true });
  cpSync("grammar.txt", `${directory}/grammar.txt`);
}
