import { execFile } from "node:child_process";
import { createReadStream, existsSync, statSync, watch } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { promisify } from "node:util";

const ROOT = resolve("dist");
const PORT = Number(process.env.PORT ?? 8000);
const WATCHED_FILES = new Set(["SPEC.md", "grammar.txt"]);
const WATCHED_DIRECTORIES = ["schema", "examples", "scripts", "published"];
const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".oval": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const CLIENT = `
<script>
(() => {
  const source = new EventSource("/__dev");
  let overlay;
  source.addEventListener("reload", () => location.reload());
  source.addEventListener("failure", (event) => {
    overlay ??= document.body.appendChild(
      Object.assign(document.createElement("pre"), {
        style:
          "position:fixed;left:0;right:0;bottom:0;max-height:50vh;overflow:auto;margin:0;padding:1em;" +
          "background:#300;color:#fcc;font:13px/1.4 monospace;white-space:pre-wrap;z-index:9999",
      }),
    );
    overlay.textContent = event.data;
  });
})();
</script>
`;

const clients = new Set();

function broadcast(event, data) {
  const message = `event: ${event}\n${data
    .split("\n")
    .map((line) => `data: ${line}`)
    .join("\n")}\n\n`;
  for (const client of clients) {
    client.write(message);
  }
}

const run = promisify(execFile);
let building = false;
let queued = false;

async function build() {
  if (building) {
    queued = true;
    return;
  }
  building = true;
  const started = Date.now();
  try {
    await run("node", ["scripts/build.mjs"]);
    console.log(`${new Date().toLocaleTimeString()} built in ${Date.now() - started} ms`);
    broadcast("reload", "");
  } catch (error) {
    const output = (error.stderr || error.message).trim();
    console.error(output);
    broadcast("failure", output);
  } finally {
    building = false;
    if (queued) {
      queued = false;
      build();
    }
  }
}

let timer;
function schedule() {
  clearTimeout(timer);
  timer = setTimeout(build, 150);
}

watch(".", (_, filename) => {
  if (WATCHED_FILES.has(filename)) {
    schedule();
  }
});
for (const directory of WATCHED_DIRECTORIES) {
  if (existsSync(directory)) {
    watch(directory, { recursive: true }, schedule);
  }
}

function serve(request, response) {
  const url = new URL(request.url, "http://localhost");
  if (url.pathname === "/__dev") {
    response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    response.write(": connected\n\n");
    clients.add(response);
    request.on("close", () => clients.delete(response));
    return;
  }

  let file = join(ROOT, normalize(decodeURIComponent(url.pathname)));
  if (!file.startsWith(ROOT)) {
    response.writeHead(403).end();
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!url.pathname.endsWith("/")) {
      response.writeHead(302, { Location: `${url.pathname}/` }).end();
      return;
    }
    file = join(file, "index.html");
  }
  if (!existsSync(file)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("not found");
    return;
  }

  const type = CONTENT_TYPES[extname(file)] ?? "application/octet-stream";
  response.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
  if (type.startsWith("text/html")) {
    let html = "";
    createReadStream(file, "utf8")
      .on("data", (chunk) => (html += chunk))
      .on("end", () => response.end(html.replace(/<\/body>/i, `${CLIENT}</body>`)));
  } else {
    createReadStream(file).pipe(response);
  }
}

await build();
createServer(serve).listen(PORT, () => {
  console.log(`serving dist at http://localhost:${PORT}/draft/`);
});
