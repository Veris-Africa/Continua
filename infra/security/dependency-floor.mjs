import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
// Prevent stale nested workspace lock entries from bypassing the root override.
for(const file of ['package-lock.json','backend/package-lock.json']){
 const lock=JSON.parse(readFileSync(file,'utf8'));
 for(const [name,pkg]of Object.entries(lock.packages??{})){
  if(/(?:^|\/)node_modules\/deepmerge$/.test(name))throw Error('Vulnerable deepmerge must not reenter '+file);
  if(/(?:^|\/)node_modules\/minimatch$/.test(name)){
   const parts=pkg.version.split('.').map(Number);if(parts[0]<11||(parts[0]===11&&parts[1]===0&&parts[2]<1))throw Error('Vulnerable minimatch lock entry in '+file);
   // A corrected version alone is insufficient if stale ancestor dependencies
   // shadow brace-expansion/balanced-match with their old incompatible APIs.
   if(file==='package-lock.json'){
    const installed=require(fileURLToPath(new URL('../../'+name+'/',import.meta.url)));
    if(!new installed.Minimatch('fixture/{a,b}/**').match('fixture/a/file'))throw Error('Incompatible minimatch dependency graph');
   }
  }
 }
}
console.log(JSON.stringify({dependencyFloors:'passed',minimatch:'>=11.0.1',deepmerge:'absent'}));
