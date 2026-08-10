const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/import \{ authOptions \} from '([./]+lib\/auth)';/g, "import { getAuthOptions } from '$1';");
  content = content.replace(/getServerSession\(authOptions\)/g, "getServerSession(getAuthOptions())");
  content = content.replace(/NextAuth\(authOptions\)/g, "NextAuth(getAuthOptions())");
  fs.writeFileSync(filePath, content);
}

const files = [
  'src/app/api/auth/[...nextauth]/route.ts',
  'src/app/api/auth/signout/route.ts',
  'src/app/api/merchant/alimtalk/route.ts',
  'src/app/api/mile/[teamId]/voice-token/route.ts',
  'src/app/api/mile/coach/status/route.ts',
  'src/app/api/mile/nudges/route.ts',
  'src/app/api/mile/team/[teamId]/notify/route.ts',
  'src/app/api/mile/team/[teamId]/route.ts',
  'src/app/mile/join-public/[teamId]/page.tsx',
  'src/app/onboarding/page.tsx'
];

files.forEach(f => {
  const fullPath = path.join('F:/20260624-gleemile', f);
  if (fs.existsSync(fullPath)) {
    replaceInFile(fullPath);
    console.log('Updated ' + f);
  }
});
