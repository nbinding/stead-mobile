import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import * as esbuild from 'esbuild';

execSync('npx @tailwindcss/cli -i src/style.css -o build/style.css --minify', { stdio: 'inherit' });
await esbuild.build({
  entryPoints: ['src/app.jsx'], bundle: true, minify: true, format: 'iife',
  jsx: 'automatic', target: ['es2020'], outfile: 'build/app.js',
  define: { 'process.env.NODE_ENV': '"production"' }, legalComments: 'none', logLevel: 'warning',
});
const css = readFileSync('build/style.css', 'utf8');
const js = readFileSync('build/app.js', 'utf8').replace(/<\/script/gi, '<\\/script');
const files = ['app.jsx','journey.jsx','docs.jsx','share.js','ui.jsx','style.css','button.tsx','package.json','OpenDyslexic-OFL.txt','notes'];
const source = {}; for (const f of files) source[f] = readFileSync('src/' + f, 'utf8');
const json = JSON.stringify(source).replace(/</g, '\\u003c');
const head = readFileSync('src/head.html', 'utf8');
const html = `<!doctype html>\n<html lang="en-GB"><head>${head}<style>${css}</style></head><body><div id="root"></div><noscript>Please enable JavaScript to use Stead.</noscript><script>${js}</script><script type="application/json" id="stead-editable-source">${json}</script><script type="text/plain" id="opendyslexic-license">${source['OpenDyslexic-OFL.txt'].replace(/</g,'&lt;')}</script></body></html>\n`;
writeFileSync('dist/index.html', html);
console.log('built', (html.length/1024).toFixed(0)+' KB');
