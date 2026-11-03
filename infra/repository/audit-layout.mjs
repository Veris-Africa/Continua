// Read-only source/layout guard. No service startup, SQL or provider calls.
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {components,repositoryRoot,componentPath} from './component-paths.mjs';
import {sourceHash} from './source-identity.mjs';
export function validateComponents(items,files){
 const known=new Set(files),issues=[],ids=new Set();
 for(const component of items){
  if(ids.has(component.id))issues.push('duplicate component: '+component.id);ids.add(component.id);
  for(const entry of component.entrypoints){const full=component.path+'/'+entry;if(!known.has(full)&&!files.some(f=>f.startsWith(full+'/')))issues.push('missing/case-mismatched entrypoint: '+full);}
  for(const consumer of component.consumers)if(!known.has(consumer))issues.push('missing consumer: '+consumer);
 }
 return issues;
}
export function auditLayout({verifyMoveIdentity=false}={}){
 const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:repositoryRoot,encoding:'utf8',maxBuffer:8*1024*1024}).split('\0').filter(Boolean).filter(f=>existsSync(path.join(repositoryRoot,f)));
 const issues=validateComponents(components,files);
 const mapping=JSON.parse(readFileSync(path.join(repositoryRoot,'docs/architecture/PHASE6_PATH_MAPPING.json'),'utf8'));
 const roots=Object.keys(mapping.roots);
 for(const old of roots)if(existsSync(path.join(repositoryRoot,old)))issues.push('retired root still exists: '+old);
 for(const row of verifyMoveIdentity?mapping.entries:[]){
  const file=path.join(repositoryRoot,row.to);
  if(!existsSync(file)||sourceHash(readFileSync(file))!==(row.sha256AfterReviewedFix??row.sha256AfterPathRewrite))issues.push('moved source differs beyond path rewrite: '+row.to);
 }
 for(const row of verifyMoveIdentity?(mapping.files??[]):[]){
  if(existsSync(path.join(repositoryRoot,row.from))||!existsSync(path.join(repositoryRoot,row.to)))issues.push('document move is incomplete: '+row.to);
 }
 // Historical/mapping prose is intentional; executable/config references are not.
 for(const file of files.filter(f=>!f.startsWith('docs/')&&!f.endsWith('.md')&&/\.(?:[cm]?js|[cm]?ts|tsx|jsx|py|go|ya?ml|json|jsonc|ps1|txt)$|(?:^|\/)Dockerfile(?:\.dockerignore)?$/.test(f))){
  const text=readFileSync(path.join(repositoryRoot,file),'utf8');
  if(roots.some(old=>text.includes(old)))issues.push('retired path in execution/config: '+file);
 }
 for(const id of ['api','collection-compatibility'])if(!readFileSync(path.join(repositoryRoot,'render.yaml'),'utf8').includes('rootDir: '+path.basename(componentPath(id))))issues.push('production Render root changed: '+id);
 return {ok:issues.length===0,components:components.length,mappedFiles:mapping.entries.length,documentMoves:(mapping.files??[]).length,moveIdentityVerified:verifyMoveIdentity,issues};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=auditLayout({verifyMoveIdentity:process.argv.includes('--verify-move-identity')});console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;
}
