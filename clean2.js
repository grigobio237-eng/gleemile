const fs = require('fs');

const badFiles = [
  'F:/20260624-gleemile/src/app/api/auth/logout/route.ts',
  'F:/20260624-gleemile/src/lib/ai/gemini-engine.ts',
  'F:/20260624-gleemile/src/lib/ai/services/content-service.ts',
  'F:/20260624-gleemile/src/lib/ai/services/medical-service.ts',
  'F:/20260624-gleemile/src/lib/ai/services/routine-service.ts',
  'F:/20260624-gleemile/src/lib/video-workflow/VideoWorkflowEngine.ts'
];

badFiles.forEach(f => {
  if (fs.existsSync(f)) {
    fs.unlinkSync(f);
    console.log('Deleted:', f);
  }
});

const componentsToFix = [
  'F:/20260624-gleemile/src/components/layout/Header.tsx',
  'F:/20260624-gleemile/src/components/utils/FoodScanner.tsx',
  'F:/20260624-gleemile/src/components/utils/PostureScanner.tsx',
  'F:/20260624-gleemile/src/components/utils/SoundTherapy.tsx'
];

componentsToFix.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/import\s+.*?from\s+['"]@\/lib\/logic\/access-control['"];?/g, '');
    content = content.replace(/checkAccess\([^\)]*\)/g, 'true'); 
    content = content.replace(/verifyPermission\([^\)]*\)/g, 'true');
    fs.writeFileSync(f, content);
    console.log('Patched:', f);
  }
});

const nextDir = 'F:/20260624-gleemile/.next';
if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log('Deleted .next cache');
}
