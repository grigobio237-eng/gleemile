const fs = require('fs');
const path = require('path');

const openNextDir = path.join(__dirname, '.open-next');
const assetsDir = path.join(openNextDir, 'assets');
const workerDir = path.join(assetsDir, '_worker.js');

console.log("Preparing Cloudflare Pages _worker.js directory...");

// We need to copy the ENTIRE `.open-next` contents (except assets itself) 
// into `.open-next/assets/_worker.js/` so that Wrangler can bundle it 
// and properly resolve relative paths like `./server-functions/default/handler.mjs`

fs.mkdirSync(workerDir, { recursive: true });

function copyDirSync(src, dest, ignoreList = []) {
  if (ignoreList.includes(path.basename(src))) return;
  
  if (fs.statSync(src).isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(item => {
      copyDirSync(path.join(src, item), path.join(dest, item), ignoreList);
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copy everything from .open-next to .open-next/assets/_worker.js EXCEPT 'assets'
fs.readdirSync(openNextDir).forEach(item => {
  if (item === 'assets') return;
  const srcPath = path.join(openNextDir, item);
  const destPath = path.join(workerDir, item);
  copyDirSync(srcPath, destPath);
});

// Rename worker.js to index.js so Wrangler recognizes it as the entrypoint
const copiedWorkerJs = path.join(workerDir, 'worker.js');
const indexJs = path.join(workerDir, 'index.js');
if (fs.existsSync(copiedWorkerJs)) {
  fs.renameSync(copiedWorkerJs, indexJs);
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
