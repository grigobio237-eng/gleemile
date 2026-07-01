const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'src/app/mile/announcements/page.tsx',
  'src/app/mile/child/page.tsx',
  'src/app/mile/community/page.tsx',
  'src/app/mile/dashboard/page.tsx',
  'src/app/mile/join/[teamCode]/page.tsx',
  'src/app/mile/my-condition/page.tsx',
  'src/app/mile/players/page.tsx',
  'src/app/mile/schedule/page.tsx',
  'src/app/mile/subscription/page.tsx',
  'src/app/mile/wellness/page.tsx'
];

filesToProcess.forEach(file => {
  const fullPath = path.join('F:/20260624-gleemile', file);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping missing file: ${file}`);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;

  // Replace background gradients to bg-[#FAF9F6]
  content = content.replace(/bg-gradient-to-b from-\w+-\d+ to-background/g, 'bg-[#FAF9F6]');
  content = content.replace(/bg-background/g, 'bg-[#FAF9F6]');
  content = content.replace(/bg-slate-50/g, 'bg-[#FAF9F6]');
  
  // Inject // TODO: [Firebase-Migration] 임시 Stub 처리 before typical useEffect/fetch functions
  // We'll look for `const fetch... = async () => {` and `const handle... = async (...) => {`
  // if they contain `fetch(`/api/mile` or `axios`
  
  // Actually, a safer regex replacement:
  // Find any line with `await fetch('/api/` or `await fetch(\`/api/` and comment it out
  const lines = content.split('\n');
  let inStubBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line has a fetch call to legacy endpoints
    if (line.includes("fetch('/api/mile/") || line.includes("fetch(`/api/mile/") || line.includes("axios.")) {
      // It's a dead fetch. Let's trace back to the function declaration or try/catch to add the comment
      // Just add the comment before the fetch if not already there
      if (i > 0 && !lines[i-1].includes('[Firebase-Migration]')) {
        lines.splice(i, 0, '      // TODO: [Firebase-Migration] 임시 Stub 처리');
        i++; // adjust index
      }
      
      // Comment out the fetch
      lines[i] = lines[i].replace(/(const .* = )?await (fetch|axios)(.*)/, '// $1await $2$3');
      
      // If it's a GET request expecting JSON, we should probably mock the response.
      // But it's hard to mock generic responses automatically.
      // Easiest is to add a dummy empty state if we see something like `await res.json()`
      if (i + 1 < lines.length && lines[i+1].includes('await res.json()')) {
        lines[i+1] = lines[i+1].replace(/await res.json\(\)/, '{} /* Mocked */');
      }
    }
  }
  
  content = lines.join('\n');
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated: ${file}`);
  }
});
