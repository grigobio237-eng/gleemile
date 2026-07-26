const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const lockFile = path.join(__dirname, '..', '.next_build_done');

if (!fs.existsSync(lockFile)) {
  console.log("🚀 Starting OpenNext Cloudflare build process...");
  fs.writeFileSync(lockFile, '1');
  try {
    execSync("npx --no-install opennextjs-cloudflare build", { stdio: "inherit" });
    
    // Copy worker.js to assets/_worker.js for Cloudflare Pages deployment
    const workerPath = path.join(__dirname, '..', '.open-next', 'worker.js');
    const pagesWorkerPath = path.join(__dirname, '..', '.open-next', 'assets', '_worker.js');
    if (fs.existsSync(workerPath)) {
      if (!fs.existsSync(path.dirname(pagesWorkerPath))) {
        fs.mkdirSync(path.dirname(pagesWorkerPath), { recursive: true });
      }
      fs.copyFileSync(workerPath, pagesWorkerPath);
      console.log("✅ Copied worker.js to assets/_worker.js for Cloudflare Pages deployment");
    }
  } finally {
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
    }
  }
} else {
  console.log("🚀 Building Next.js app...");
  execSync("npx --no-install next build", { stdio: "inherit" });
}
