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
    /<pre data-language="tokens"[^>]*><code>([\s\S]*?)<\/code><\/pre>/g,
    (_, body) => {
      const tokens = decodeEntities(body)
        .trimEnd()
        .split("\n")
        .map((line) => {
          const match = /^(\w+)(?: «(.*)»)?$/.exec(line);
          if (!match) {
            throw new Error(`malformed token sequence line: ${line}`);
          }
          const [, kind, text] = match;
          const classes = ["token", kind === "Error" ? "token-error" : ""]
            .filter(Boolean)
            .join(" ");
          const textSpan =
            text === undefined ? "" : `<span class="token-text">${encodeEntities(text)}</span>`;
          return `<span class="${classes}"><span class="token-kind">${kind}</span>${textSpan}</span>`;
        });
      return `<div class="tokens">${tokens.join("")}</div>`;
    },
  );
  return rendered.replace("</head>", `<style>${TOKEN_STYLE}</style></head>`);
}

export async function writeEdition(directory, ref) {
  const html = await renderSpec(ref);
  mkdirSync(directory, { recursive: true });
  writeFileSync(`${directory}/index.html`, html);
  cpSync("schema", `${directory}/schema`, { recursive: true });
  cpSync("examples", `${directory}/examples`, { recursive: true });
  cpSync("grammar.txt", `${directory}/grammar.txt`);
}
