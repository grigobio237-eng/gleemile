const fs = require('fs');
const path = require('path');

function findFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findFiles(fullPath, fileList);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const files = findFiles('src');
let count = 0;
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf-8');
  if (content.includes("export const runtime = 'edge'") || content.includes('export const runtime = "edge"')) {
    content = content.replace(/export const runtime = ['"]edge['"];?\n?/, '');
    fs.writeFileSync(f, content);
    console.log('Cleaned up edge runtime from: ' + f);
    count++;
  }
});
console.log('Cleaned up in ' + count + ' files.');
