// Builds index.html: one self-contained page with the app, the nbinding design system (Stead look) and its
// fonts inlined, so Stead works offline and makes no requests to other hosts.
//   npm run build        (writes index.html; CI checks the committed copy is up to date)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import * as esbuild from 'esbuild';

// Stead never uses Calshare's display face, so its font file is left out of the page.
const skipCalshareFont = {
  name: 'skip-calshare-font',
  setup(b) {
    b.onResolve({ filter: /Bricolage-latin\.woff2$/ }, () => ({ path: 'bricolage', namespace: 'empty' }));
    b.onLoad({ filter: /.*/, namespace: 'empty' }, () => ({ contents: '', loader: 'dataurl' }));
  },
};

const common = { bundle: true, minify: true, write: false, legalComments: 'none', logLevel: 'warning' };
const [js, css] = await Promise.all([
  esbuild.build({ ...common, entryPoints: ['src/app.jsx'], format: 'iife', jsx: 'automatic', target: ['es2020'], define: { 'process.env.NODE_ENV': '"production"' } }),
  esbuild.build({ ...common, entryPoints: ['src/style.css'], loader: { '.woff2': 'dataurl' }, plugins: [skipCalshareFont] }),
]);
const script = js.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const style = css.outputFiles[0].text.replace(/<\/style/gi, '<\\/style');

// The sources travel inside the page too, so a saved copy can be read and rebuilt.
const files = ['app.jsx', 'journey.jsx', 'docs.jsx', 'd81.js', 'ui.jsx', 'share.js', 'style.css', 'notes'];
const source = Object.fromEntries(files.map(f => [f, readFileSync('src/' + f, 'utf8')]));
source['package.json'] = readFileSync('package.json', 'utf8');
source['ds/VERSION'] = readFileSync('src/ds/VERSION', 'utf8');
const json = JSON.stringify(source).replace(/</g, '\\u003c');
const licences = readdirSync('src/ds/fonts').filter(f => f.endsWith('OFL.txt')).map(f => `${f}\n\n${readFileSync('src/ds/fonts/' + f, 'utf8')}`).join('\n\n').replace(/</g, '&lt;');

const head = readFileSync('src/head.html', 'utf8');
const html = `<!doctype html>
<html lang="en-GB" data-nb-app="stead"><head>${head}<style>${style}</style></head><body><div id="root"></div><noscript>Please enable JavaScript to use Stead.</noscript><script>${script}</script><script type="application/json" id="stead-editable-source">${json}</script><script type="text/plain" id="font-licences">${licences}</script></body></html>
`;
writeFileSync('index.html', html);
console.log('built index.html', (html.length / 1024).toFixed(0) + ' KB');
