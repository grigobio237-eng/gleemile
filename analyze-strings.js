const fs = require('fs');
const content = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');
const strRegex = /"([^"\\]|\\.)*"/g;
let match;
const strs = [];
while ((match = strRegex.exec(content)) !== null) {
  if (match[0].length > 5000) {
    strs.push({
      len: match[0].length,
      prefix: match[0].substring(0, 100)
    });
  }
}
strs.sort((a,b)=>b.len - a.len);
console.log(strs);
