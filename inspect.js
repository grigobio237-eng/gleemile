const fs = require('fs');
const code = fs.readFileSync('.open-next/assets/_worker.js/index.js', 'utf8');

// Find all require(...) matches
const requireRegex = /require\("([^"]+)"\)/g;
let match;
const requires = new Set();
while ((match = requireRegex.exec(code)) !== null) {
  requires.add(match[1]);
}
console.log('Requires:', Array.from(requires).join(', '));

// Find long base64 strings or huge literal arrays that might indicate bundled ML models or binaries
const hugeStrings = [];
const stringRegex = /"([^"]{10000,})"/g;
while ((match = stringRegex.exec(code)) !== null) {
  hugeStrings.push(match[1].length);
}
console.log('Huge strings lengths:', hugeStrings);
