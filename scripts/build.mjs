import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import specMarkdown from "spec-md";

const html = await specMarkdown.html("SPEC.md", {
  githubSource: "https://github.com/oval-vote/oval-spec/blame/main/",
});

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");
writeFileSync("dist/index.html", html);
cpSync("schema", "dist/schema", { recursive: true });
cpSync("examples", "dist/examples", { recursive: true });
cpSync("grammar.txt", "dist/grammar.txt");
