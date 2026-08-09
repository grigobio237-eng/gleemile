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
  platform: 'browser',
  target: 'es2022',
  format: 'esm',
  mainFields: ['module', 'main'],
  conditions: ['workerd', 'worker', 'browser'],
  external: [
    'node:*', 'cloudflare:*', 'nodemailer', 'cheerio',
    'async_hooks', 'fs', 'path', 'url', 'vm', 'child_process', 'crypto', 'stream',
    'util', 'assert', 'os', 'querystring', 'https', 'http', 'zlib', 'events',
    'buffer', 'net', 'tls', 'perf_hooks', 'string_decoder', 'punycode', 'dns',
    'diagnostics_channel', 'inspector', 'readline', 'tty', 'dgram', 'v8',
    'worker_threads', 'cluster', 'module'
  ],
  plugins: [mockPlugin],
  banner: {
    js: `
import * as __node_crypto from 'node:crypto';
import * as __node_fs from 'node:fs';
import * as __node_path from 'node:path';
import * as __node_url from 'node:url';
import * as __node_vm from 'node:vm';
import * as __node_child_process from 'node:child_process';
import * as __node_stream from 'node:stream';
import * as __node_util from 'node:util';
import * as __node_assert from 'node:assert';
import * as __node_os from 'node:os';
import * as __node_querystring from 'node:querystring';
import * as __node_https from 'node:https';
import * as __node_http from 'node:http';
import * as __node_zlib from 'node:zlib';
import * as __node_events from 'node:events';
import * as __node_buffer from 'node:buffer';
import * as __node_async_hooks from 'node:async_hooks';

const _nodeBuiltins = {
  crypto: __node_crypto, fs: __node_fs, path: __node_path, url: __node_url, vm: __node_vm, child_process: __node_child_process, stream: __node_stream, util: __node_util, assert: __node_assert, os: __node_os, querystring: __node_querystring, https: __node_https, http: __node_http, zlib: __node_zlib, events: __node_events, buffer: __node_buffer, async_hooks: __node_async_hooks,
  'node:crypto': __node_crypto, 'node:fs': __node_fs, 'node:path': __node_path, 'node:url': __node_url, 'node:vm': __node_vm, 'node:child_process': __node_child_process, 'node:stream': __node_stream, 'node:util': __node_util, 'node:assert': __node_assert, 'node:os': __node_os, 'node:querystring': __node_querystring, 'node:https': __node_https, 'node:http': __node_http, 'node:zlib': __node_zlib, 'node:events': __node_events, 'node:buffer': __node_buffer, 'node:async_hooks': __node_async_hooks
};

globalThis.require = function(id) {
  if (_nodeBuiltins[id]) return _nodeBuiltins[id];
  throw new Error('Not supported require: ' + id);
};
`
  },
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  metafile: true
}).then(result => {
  fs.writeFileSync('bundle-meta.json', JSON.stringify(result.metafile));
  
  // Patch the esbuild __require stub to use our globalThis.require instead of throwing
  let indexJsContent = fs.readFileSync(path.join(workerDir, 'index.js'), 'utf8');
  indexJsContent = indexJsContent.replace(
    /throw Error\(['"`]Dynamic require of ['"`] \+ x \+ ['"`] is not supported['"`]\);?/g,
    'return globalThis.require(x);'
  );
  fs.writeFileSync(path.join(workerDir, 'index.js'), indexJsContent);
  
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
