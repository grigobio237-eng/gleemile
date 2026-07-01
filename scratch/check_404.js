const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src');
const appDir = path.join(srcDir, 'app');

// 1. Get all valid app routes
const validRoutes = [];
const dynamicRoutePattern = /\[.*?\]/g;

function scanRoutes(dir, currentRoute = '') {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanRoutes(fullPath, `${currentRoute}/${file}`);
    } else if (file === 'page.tsx' || file === 'page.js') {
      let route = currentRoute || '/';
      // Normalize dynamic routes to a regex or token
      validRoutes.push(route.replace(/\\/g, '/'));
    }
  }
}

scanRoutes(appDir);

// Convert routes to regex for matching
const routeRegexes = validRoutes.map(r => {
  if (r === '/') return /^\/$/;
  // Replace [param] with [^/]+
  const regexStr = '^' + r.replace(/\[.*?\]/g, '[^/]+') + '$';
  return new RegExp(regexStr);
});

// Helper to check if a route exists
function routeExists(link) {
  // Strip query params and hashes
  let cleanLink = link.split('?')[0].split('#')[0];
  if (cleanLink.endsWith('/') && cleanLink.length > 1) {
    cleanLink = cleanLink.slice(0, -1);
  }
  return routeRegexes.some(regex => regex.test(cleanLink));
}

// 2. Scan all files for links
const extractedLinks = new Set();
const fileLinkMap = new Map(); // link -> array of files

function scanLinks(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanLinks(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Matches href="/...", href={'/...'}, router.push('/...')
      // We will look for anything starting with / inside quotes or backticks.
      // But only in href= or router.push/replace
      const regexes = [
        /href=["'](\/[^"']*)["']/g,
        /href=\{["'](\/[^"']*)["']\}/g,
        /router\.(push|replace)\(["'](\/[^"']*)["']/g,
        /redirect\(["'](\/[^"']*)["']/g
      ];

      for (const regex of regexes) {
        let match;
        while ((match = regex.exec(content)) !== null) {
          // The capturing group depends on the regex. 
          // For the router one, the path is in the 2nd group.
          const link = match.length > 2 ? match[2] : match[1];
          // Filter out dynamic expressions inside templates like `/mile/team/${teamId}`
          if (!link.includes('${')) {
             extractedLinks.add(link);
             if (!fileLinkMap.has(link)) {
               fileLinkMap.set(link, []);
             }
             if (!fileLinkMap.get(link).includes(fullPath)) {
               fileLinkMap.get(link).push(fullPath);
             }
          } else {
             // Let's manually replace simple template literals to test if possible
             // Actually, if it has ${}, it's dynamic. We skip static check or simulate it.
             const simulated = link.replace(/\$\{.*?\}/g, 'test-param');
             extractedLinks.add(simulated);
             if (!fileLinkMap.has(simulated)) {
               fileLinkMap.set(simulated, []);
             }
             fileLinkMap.get(simulated).push(fullPath + " (dynamic)");
          }
        }
      }
      
      // Also catch template literals: href={`/mile/team/${id}`}
      const tplRegexes = [
        /href=\{`(\/[^`]*)`\}/g,
        /router\.(push|replace)\(`(\/[^`]*)`/g,
        /redirect\(`(\/[^`]*)`/g
      ];
      for (const regex of tplRegexes) {
        let match;
        while ((match = regex.exec(content)) !== null) {
          const link = match.length > 2 ? match[2] : match[1];
          const simulated = link.replace(/\$\{.*?\}/g, 'test-param');
          extractedLinks.add(simulated);
          if (!fileLinkMap.has(simulated)) {
             fileLinkMap.set(simulated, []);
          }
          fileLinkMap.get(simulated).push(fullPath + " (dynamic)");
        }
      }
    }
  }
}

scanLinks(srcDir);

console.log("=== Found Routes in App ===");
validRoutes.forEach(r => console.log(r));

console.log("\n=== Checking Extracted Links ===");
const deadLinks = [];
for (const link of extractedLinks) {
  // Ignore api routes for 404 UI check
  if (link.startsWith('/api')) continue;
  
  if (!routeExists(link)) {
    deadLinks.push({ link, files: fileLinkMap.get(link) });
  }
}

if (deadLinks.length === 0) {
  console.log("No 404 links found!");
} else {
  console.log("Found potentially DEAD LINKS (404):");
  deadLinks.forEach(d => {
    console.log(`- ${d.link} used in:`);
    d.files.forEach(f => console.log(`    ${f.replace(process.cwd(), '')}`));
  });
}
