const fs = require('fs');
const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');
console.log('Length:', content.length);

const moduleRegex = /__webpack_require__\(\d+\)/g;
const matches = content.match(moduleRegex) || [];
console.log('Webpack requires:', matches.length);

// Let's count occurrences of some common heavy packages
const check = (pkg) => {
    const r = new RegExp(pkg, 'g');
    const m = content.match(r);
    console.log(`Occurrences of ${pkg}:`, m ? m.length : 0);
};

check('lucide');
check('recharts');
check('firebase');
check('date-fns');
check('zod');
check('framer-motion');
check('react-dom');
check('livekit');
check('signature_pad');
check('react-quill');

// Get largest strings (could be inline SVGs or data)
const strRegex = /"([^"\\]|\\.)*"/g;
let strMatches = [];
let match;
while ((match = strRegex.exec(content)) !== null) {
    if (match[0].length > 5000) {
        strMatches.push(match[0].length);
    }
}
console.log('Strings > 5000 chars:', strMatches.length);
if (strMatches.length > 0) {
    console.log('Max string length:', Math.max(...strMatches));
}
