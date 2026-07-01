const fs = require('fs');
const path = require('path');
const dir = './src/components/blocks';
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (file.endsWith('Block.tsx')) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const titleMatch = content.match(/<p className="font-bold text-obsidian">([^<]+)<\/p>/);
    const descMatch = content.match(/<p className="text-xs text-slate(?:-\d+)?">([^<]+)<\/p>/);
    const title = titleMatch ? titleMatch[1].trim() : 'NOT_FOUND';
    const desc = descMatch ? descMatch[1].trim() : 'NOT_FOUND';
    console.log(file + ':', title, '|||', desc);
  }
});
