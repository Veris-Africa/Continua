import {readFileSync} from 'node:fs';
// Prevent stale nested workspace lock entries from bypassing the root override.
for(const file of ['package-lock.json','backend/package-lock.json']){
 const lock=JSON.parse(readFileSync(file,'utf8'));
 for(const [name,pkg]of Object.entries(lock.packages??{})){
  if(/(?:^|\/)node_modules\/deepmerge$/.test(name))throw Error('Vulnerable deepmerge must not reenter '+file);
  if(/(?:^|\/)node_modules\/minimatch$/.test(name)){
   const parts=pkg.version.split('.').map(Number);if(parts[0]<11||(parts[0]===11&&parts[1]===0&&parts[2]<1))throw Error('Vulnerable minimatch lock entry in '+file);
  }
 }
}
console.log(JSON.stringify({dependencyFloors:'passed',minimatch:'>=11.0.1',deepmerge:'absent'}));
