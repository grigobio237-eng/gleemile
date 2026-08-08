const fs = require('fs');

const filesToRevert = [
  'src/app/api/auth/[...nextauth]/route.ts',
  'src/app/mile/[teamId]/labor-shield/page.tsx',
  'src/app/mile/[teamId]/labor-shield/new/page.tsx',
  'src/app/mile/[teamId]/labor-shield/[contractId]/page.tsx'
];

filesToRevert.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf-8');
    content = content.replace(/export const runtime = ['"]edge['"];?\n?/, '');
    fs.writeFileSync(f, content);
    console.log('Reverted ' + f);
  }
});
