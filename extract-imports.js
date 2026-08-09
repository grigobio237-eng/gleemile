const fs = require('fs');
const path = require('path');
const traverse = (dir) => {
  let results = [];
  fs.readdirSync(dir).forEach(file => {
    file = path.join(dir, file);
    if (fs.statSync(file).isDirectory()) results = results.concat(traverse(file));
    else if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
  });
  return results;
};
const files = traverse('src');
const imports = {};
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const matches = content.match(/import\s+\{([^}]+)\}\s+from\s+['"](lucide-react|recharts|firebase[^'"]*)['"]/g);
  if (matches) {
    matches.forEach(m => {
      const pkgMatch = m.match(/from\s+['"]([^'"]+)['"]/);
      if (!pkgMatch) return;
      const pkg = pkgMatch[1];
      const keys = m.match(/\{([^}]+)\}/)[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0]);
      if (!imports[pkg]) imports[pkg] = new Set();
      keys.forEach(k => k && imports[pkg].add(k));
    });
  }
});
Object.keys(imports).forEach(k => {
  console.log(k + ':', Array.from(imports[k]).join(', '));
});
