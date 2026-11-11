import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import specMarkdown from "spec-md";

export const REPOSITORY = "https://github.com/oval-vote/oval-spec";
export const SITE = "https://spec.oval.vote";
export const SCHEMA = "packages/oval-schema/oval.schema.json";
export const DRAFT_LINE = "_Working Draft_";
const SOURCES = ["SPEC.md", "grammar.txt", SCHEMA, "examples"];

export function sourceDigest() {
  const hash = createHash("sha256");
  const visit = (path) => {
    if (statSync(path).isDirectory()) {
      for (const entry of readdirSync(path).sort()) {
        visit(`${path}/${entry}`);
      }
    } else {
      hash.update(path);
      hash.update("\0");
      hash.update(readFileSync(path));
      hash.update("\0");
    }
  };
  for (const path of SOURCES) {
    visit(path);
  }
  return hash.digest("hex");
}

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
  return renderTokenSequences(html);
}

const TOKEN_STYLE = `
.tokens{display:flex;flex-wrap:wrap;gap:6px;margin:1rem 0;font-family:var(--font-family-monospace);font-size:var(--mono-font-size)}
.token{display:flex;flex-direction:column;border:1px solid var(--color-pre-border);border-radius:4px;background:var(--color-pre-background);min-width:2.5em}
.token-kind{font:italic 9pt/14pt var(--font-family);color:var(--color-grey);padding:1px 6px 0}
.token-text{padding:2px 6px 3px;border-top:1px solid var(--color-pre-border);white-space:pre}
.token-error{border-color:var(--color-spec-counter-border);background:var(--color-spec-counter-example)}
.token-error .token-kind{color:var(--color-spec-counter-example-link)}
.token-error .token-text{border-color:var(--color-spec-counter-border)}
`;

function decodeEntities(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function encodeEntities(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTokenSequences(html) {
  const rendered = html.replace(
    /<pre data-language="(tokens|errors)"[^>]*><code>([\s\S]*?)<\/code><\/pre>/g,
    (_, language, body) => {
      const tokens = decodeEntities(body)
        .trimEnd()
        .split("\n")
        .map((line) => {
          const match = /^([\w-]+)(?: «(.*)»)?$/.exec(line);
          if (!match) {
            throw new Error(`malformed token sequence line: ${line}`);
          }
          const [, kind, text] = match;
          const isError = language === "errors" || kind === "Error";
          const classes = ["token", isError ? "token-error" : ""].filter(Boolean).join(" ");
          const textSpan =
            text === undefined ? "" : `<span class="token-text">${encodeEntities(text)}</span>`;
          return `<span class="${classes}"><span class="token-kind">${kind}</span>${textSpan}</span>`;
        });
      return `<div class="tokens">${tokens.join("")}</div>`;
    },
  );
  return rendered.replace("</head>", `<style>${TOKEN_STYLE}</style></head>`);
}

export async function writeEdition(directory, ref, site) {
  const html = await renderSpec(ref);
  mkdirSync(`${directory}/schema`, { recursive: true });
  writeFileSync(`${directory}/index.html`, html);
  const schema = JSON.parse(readFileSync(SCHEMA, "utf8"));
  schema.$id = `${site}/schema/oval.schema.json`;
  writeFileSync(`${directory}/schema/oval.schema.json`, `${JSON.stringify(schema, null, 2)}\n`);
  cpSync("examples", `${directory}/examples`, { recursive: true });
  cpSync("grammar.txt", `${directory}/grammar.txt`);
}
