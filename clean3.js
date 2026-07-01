const fs = require('fs');

const badFiles = [
  'F:/20260624-gleemile/src/lib/ai/ai-insight.ts',
];

badFiles.forEach(f => {
  if (fs.existsSync(f)) {
    fs.unlinkSync(f);
    console.log('Deleted:', f);
  }
});

const componentsToFix = [
  'F:/20260624-gleemile/src/components/utils/PostureScanner.tsx',
  'F:/20260624-gleemile/src/components/utils/SoundTherapy.tsx'
];

componentsToFix.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    // Replace <AccessControl ...> ... </AccessControl> with just the children, or just remove AccessControl tags
    content = content.replace(/<AccessControl[^>]*>/g, '<>');
    content = content.replace(/<\/AccessControl>/g, '</>');
    
    // In case AccessControl is used as a type or component in a different way:
    content = content.replace(/AccessControl\./g, '({} as any).');
    
    fs.writeFileSync(f, content);
    console.log('Patched:', f);
  }
});
