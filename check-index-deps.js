const fs = require('fs');
const c = fs.readFileSync('.open-next/assets/_worker.js/index.js', 'utf8');

console.log('jspdf in index.js:', c.includes('jspdf'));
console.log('html2canvas in index.js:', c.includes('html2canvas'));
console.log('recharts in index.js:', c.includes('recharts'));
console.log('firebase-admin in index.js:', c.includes('firebase-admin'));
console.log('googleapis in index.js:', c.includes('googleapis'));
console.log('lucide in index.js:', c.includes('lucide'));
