const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const openNextDir = path.join(__dirname, '.open-next');
const assetsDir = path.join(openNextDir, 'assets');
const workerDir = path.join(assetsDir, '_worker.js');

console.log("Preparing Cloudflare Pages _worker.js directory...");
fs.mkdirSync(workerDir, { recursive: true });

console.log("Creating dummy mock file...");
const mockFile = path.join(__dirname, 'empty-mock.js');
fs.writeFileSync(mockFile, 'export default {};');

const mockPlugin = {
  name: 'mock-heavy-libs',
  setup(build) {
    const heavyLibs = [
      'livekit-client',
      '@livekit/components-react',
      '@livekit/components-styles',
      '@tosspayments/payment-widget-sdk',
      'jspdf',
      'html2canvas',
      'recharts',
      'qrcode\\.react',
      'signature_pad',
      'lucide-react',
      'react-quill-new',
      'canvas-confetti',
      'html5-qrcode',
      'firebase',
      'firebase/.*'
    ];
    
    heavyLibs.forEach(lib => {
      build.onResolve({ filter: new RegExp('^' + lib + '$') }, args => ({
        path: mockFile
      }));
    });
  },
};

console.log("Bundling worker using esbuild API with mocks...");
esbuild.build({
  entryPoints: ['.open-next/worker.js'],
  bundle: true,
  minify: true,
  outfile: path.join(workerDir, 'index.js'),
  platform: 'node',
  target: 'es2022',
  format: 'esm',
  external: ['node:*', 'cloudflare:*', 'nodemailer', 'cheerio'],
  plugins: [mockPlugin],
  metafile: true
}).then(result => {
  fs.writeFileSync('bundle-meta.json', JSON.stringify(result.metafile));
  
  console.log("Creating _routes.json...");
  const routes = {
    version: 1,
    include: ["/*"],
    exclude: ["/_next/static/*", "/favicon.ico"]
  };
  fs.writeFileSync(
    path.join(assetsDir, '_routes.json'),
    JSON.stringify(routes, null, 2)
  );

  console.log("Done. Ready for Cloudflare Pages deployment.");
}).catch(() => process.exit(1));
