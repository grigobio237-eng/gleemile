const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const lockFile = path.join(__dirname, '..', '.next_build_done');

if (!fs.existsSync(lockFile)) {
  console.log("🚀 Starting OpenNext Cloudflare build process...");
  fs.writeFileSync(lockFile, '1');
  try {
    execSync("npx --no-install opennextjs-cloudflare build", { stdio: "inherit" });
  } finally {
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
    }
  }
} else {
  console.log("🚀 Building Next.js app...");
  execSync("npx --no-install next build", { stdio: "inherit" });
}
