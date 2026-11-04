import { build } from 'esbuild';
import { mkdir, copyFile, cp } from 'node:fs/promises';
import { join } from 'node:path';

await mkdir('site', {recursive:true});
for(const [source,name] of [
 ['src/clock.mjs','buddhist-clock.mjs'],
 ['src/calendar.mjs','buddhist-calendar.mjs']
]){
 await build({entryPoints:[source],bundle:true,platform:'browser',format:'esm',target:'es2022',minify:true,outfile:join('site',name)});
}
for(const filename of ['index.html','style.css','app.mjs','favicon.svg']){
 await copyFile(join('web',filename),join('site',filename));
}
await cp('web/demo', 'site/demo', {recursive:true});
console.log('Built static website, portable SDK and example at site/demo/');
