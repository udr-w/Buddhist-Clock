import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
test('CLI emits a JSON result per request and keeps working after an error',()=>{
 const input=[
  JSON.stringify({action:'toLunar',utc:'2026-11-05T00:00:00.000Z',mode:'linear'}),
  JSON.stringify({action:'startOf',utc:'2026-11-05T00:00:00.000Z',unit:'day',mode:'linear'}),
  JSON.stringify({action:'unsupported'})
 ].join('\n')+'\n';
 const r=spawnSync(process.execPath,['scripts/clock-cli.mjs'],{input,encoding:'utf8',timeout:15000});
 assert.equal(r.status,0,r.stderr);
 const rows=r.stdout.trim().split('\n').map(JSON.parse);
 assert.equal(rows.length,3);
 assert.equal(rows[0].ok,true);
 assert.ok(rows[0].result.day>=1&&rows[0].result.day<=28);
 assert.equal(rows[1].ok,true);
 assert.ok(rows[1].result.endsWith('Z'));
 assert.equal(rows[2].ok,false);
});
