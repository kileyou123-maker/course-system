import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
execFileSync(
  process.platform === "win32" ? "npm.cmd" : "npm",
  ["run", "build"],
  { stdio: "inherit", env: { ...process.env, VITE_BACKEND_MODE: "upstream" } },
);
const assets = {};
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};
function walk(dir) {
  for (const file of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, file.name);
    if (file.isDirectory()) walk(full);
    else {
      const ext = path.extname(full);
      if (!types[ext]) throw Error("Unexpected asset: " + full);
      assets["/" + path.relative("client/dist", full)] = {
        type: types[ext],
        content: fs.readFileSync(full, "utf8"),
      };
    }
  }
}
walk("client/dist");
fs.mkdirSync("dist/server", { recursive: true });
fs.mkdirSync("dist/.openai", { recursive: true });
fs.writeFileSync(
  "dist/server/index.js",
  fs.readFileSync("worker/runtime.mjs", "utf8") +
    "\nconst assets=" +
    JSON.stringify(assets) +
    ";\nexport default createHandler(assets);\n",
);
fs.copyFileSync(".openai/hosting.json", "dist/.openai/hosting.json");
console.log(`Packaged ${Object.keys(assets).length} assets into Worker ESM`);
