import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
await mkdir('site', {recursive:true});
await build({entryPoints:['src/clock.mjs'],bundle:true,platform:'browser',format:'esm',target:'es2022',minify:true,outfile:join('site','buddhist-clock.mjs')});
for(const filename of ['index.html','style.css','app.mjs','favicon.svg'])await copyFile(join('web',filename),join('site',filename));
console.log('Built portable static site in site/');
