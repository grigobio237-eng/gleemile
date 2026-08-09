const fs = require('fs');
const code = fs.readFileSync('.open-next/server-functions/default/handler.mjs', 'utf8');
console.log('Size of handler.mjs:', (code.length/1024/1024).toFixed(2) + ' MB');
const imports = [...code.matchAll(/import\s.*?['"](.*?)['"]|require\(['"](.*?)['"]\)/g)].map(m => m[1] || m[2]);
const uniqueImports = [...new Set(imports)].filter(i => i && !i.startsWith('.') && !i.startsWith('/'));
console.log('External imports:', uniqueImports);
