const fs = require('fs');
const path = require('path');

const openNextDir = path.join(__dirname, '.open-next');
const assetsDir = path.join(openNextDir, 'assets');
const workerDir = path.join(assetsDir, '_worker.js');

console.log("Preparing Cloudflare Pages _worker.js directory...");

// Create _worker.js directory
fs.mkdirSync(workerDir, { recursive: true });

// Move worker.js to index.js
fs.copyFileSync(path.join(openNextDir, 'worker.js'), path.join(workerDir, 'index.js'));

// Copy dependencies
const dirsToCopy = ['cloudflare', 'middleware', 'server-functions', '.build', 'dynamodb-provider', 'cache'];
for (const dir of dirsToCopy) {
  const src = path.join(openNextDir, dir);
  if (fs.existsSync(src)) {
    fs.cpSync(src, path.join(workerDir, dir), { recursive: true });
  }
}

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
