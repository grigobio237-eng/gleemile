const fs = require('fs');
const h = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');

const regex = /require\(['"]([^'"]+)['"]\)/g;
let match;
const modules = new Set();
while ((match = regex.exec(h)) !== null) {
  modules.add(match[1]);
}
console.log('Unique requires count:', modules.size);
const arr = Array.from(modules);
if (arr.includes('jspdf')) console.log('Contains require(jspdf)');
if (arr.includes('html2canvas')) console.log('Contains require(html2canvas)');
if (arr.includes('recharts')) console.log('Contains require(recharts)');
if (arr.includes('firebase-admin')) console.log('Contains require(firebase-admin)');

console.log('Top level requires sample:', arr.slice(0, 20));
