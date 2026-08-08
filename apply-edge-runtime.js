const fs = require('fs');
const path = require('path');

function findFiles(dir, matchFunc, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findFiles(fullPath, matchFunc, fileList);
    } else if (matchFunc(fullPath)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allTsFiles = findFiles('src', p => p.endsWith('.ts') || p.endsWith('.tsx'));
const nodeImports = [];

allTsFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  if (content.match(/from\s+['"](fs|path|crypto|os|stream|util)['"]/)) {
    nodeImports.push(file);
  } else if (content.match(/require\(['"](fs|path|crypto|os|stream|util)['"]\)/)) {
    nodeImports.push(file);
  }
});

console.log('Files with Node.js built-in imports:');
nodeImports.forEach(f => console.log(f));

// Now inject `export const runtime = 'edge';`
const apiRoutes = findFiles('src/app/api', p => p.endsWith('route.ts') || p.endsWith('route.js'));
const dynamicPages = findFiles('src/app', p => {
  return (p.includes('[') && p.includes(']') && (p.endsWith('page.tsx') || p.endsWith('page.jsx'))) ||
         (p.includes('onboarding') && p.endsWith('page.tsx'));
});

function injectEdgeRuntime(files) {
  let modified = 0;
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    if (!content.includes("export const runtime = 'edge'") && !content.includes('export const runtime = "edge"')) {
      fs.writeFileSync(file, "export const runtime = 'edge';\n" + content);
      modified++;
    }
  });
  console.log(`Injected runtime into ${modified} out of ${files.length} files.`);
}

console.log('Injecting API Routes...');
injectEdgeRuntime(apiRoutes);
console.log('Injecting Dynamic Pages...');
injectEdgeRuntime(dynamicPages);
