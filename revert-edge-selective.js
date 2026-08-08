const fs = require('fs');
const path = require('path');

function findFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findFiles(fullPath, fileList);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
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
    if (
        content.includes('authOptions') || 
        content.includes('verifyAuth') || 
        content.includes('getServerSession') || 
        content.includes('labor-service') || 
        content.includes('storage') ||
        content.includes('sharp') ||
        content.includes('bcrypt') ||
        content.includes('jsonwebtoken') ||
        content.includes('firebase-admin')
    ) {
        content = content.replace(/export const runtime = ['"]edge['"];?\n?/, '');
        fs.writeFileSync(f, content);
        console.log('Reverted: ' + f);
        count++;
    }
  }
});
console.log('Reverted in ' + count + ' files.');
