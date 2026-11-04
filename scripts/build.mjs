import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import specMarkdown from "spec-md";

const html = await specMarkdown.html("SPEC.md", {
  githubSource: "https://github.com/oval-vote/oval-spec/blame/main/",
});

const defined = new Set([...html.matchAll(/<div class="spec-production[^"]*" id="([^"]+)"/g)].map((m) => m[1]));
const undefinedNames = [...new Set([...html.matchAll(/<span class="spec-nt"><span data-name="([^"]+)">/g)].map((m) => m[1]))]
  .filter((name) => !defined.has(name));
if (undefinedNames.length > 0) {
  console.error(`grammar names used but never defined: ${undefinedNames.join(", ")}`);
  process.exit(1);
}

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");
writeFileSync("dist/index.html", html);
cpSync("schema", "dist/schema", { recursive: true });
cpSync("examples", "dist/examples", { recursive: true });
cpSync("grammar.txt", "dist/grammar.txt");
