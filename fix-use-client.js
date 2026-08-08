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

const allTsFiles = findFiles('src/app', p => p.endsWith('.ts') || p.endsWith('.tsx') || p.endsWith('.js') || p.endsWith('.jsx'));

let fixedCount = 0;
allTsFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  
  // Check if both exist but use client is not first
  const useClientRegex = /^(['"]use client['"];?)/m;
  const match = content.match(useClientRegex);
  
  if (match && match.index > 0) {
    // Remove the match from its current location
    content = content.slice(0, match.index) + content.slice(match.index + match[0].length);
    // Put it at the very top
    content = match[0] + '\n' + content.trimStart();
    fs.writeFileSync(file, content);
    fixedCount++;
  }
});

console.log(`Fixed 'use client' ordering in ${fixedCount} files.`);
