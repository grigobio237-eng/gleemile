const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const openNextDir = path.join(__dirname, '.open-next');
const assetsDir = path.join(openNextDir, 'assets');
const workerDir = path.join(assetsDir, '_worker.js');

console.log("Preparing Cloudflare Pages _worker.js directory...");

// Create _worker.js directory
fs.mkdirSync(workerDir, { recursive: true });

console.log("Bundling worker using esbuild...");
// Bundle worker.js into a single index.js file
execSync(
  `npx esbuild .open-next/worker.js --bundle --outfile=${path.join(workerDir, 'index.js')} --platform=node --target=es2022 --format=esm --external:node:* --external:cloudflare:*`,
  { stdio: 'inherit' }
);

console.log("Creating _routes.json...");
const routes = {
  version: 1,
  include: ["/*"],
  exclude: ["/_next/static/*", "/favicon.ico"]
};
fs.writeFileSync(
  path.join(assetsDir, '_routes.json'),
  JSON.stringify(routes, null, 2)
);

console.log("Done. Ready for Cloudflare Pages deployment.");
