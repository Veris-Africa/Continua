// Conservative source reachability evidence; never deletes files or starts services.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(new URL('../backend/package.json',import.meta.url));
const ts=require('typescript');
const relative=file=>path.relative(root,file).replaceAll('\\','/');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const files=walk(path.join(root,'app/src')).filter(f=>/\.(?:[cm]?js|jsx|tsx?|css)$/.test(f)&&!f.endsWith('.d.ts'));
const known=new Set(files),edges=new Map(),packages=new Map(),background=[],dynamicRegistries=[];
function resolve(from,spec){
 const base=spec.startsWith('@/')?path.join(root,'app/src',spec.slice(2)):spec.startsWith('.')?path.resolve(path.dirname(from),spec):null;
 if(!base)return null;
 const variants=[base,...['.ts','.tsx','.js','.jsx','.css','/index.ts','/index.tsx','/index.js'].map(ext=>base+ext)];
 return variants.find(f=>known.has(f))??null;
}
for(const file of files){
 const text=fs.readFileSync(file,'utf8'),links=new Set();
 const add=spec=>{const target=resolve(file,spec);if(target)links.add(target);else if(!spec.startsWith('.')&&!spec.startsWith('@/')){const name=spec.startsWith('@')?spec.split('/').slice(0,2).join('/'):spec.split('/')[0];if(!packages.has(name))packages.set(name,new Set());packages.get(name).add(relative(file));}};
 if(file.endsWith('.css'))for(const match of text.matchAll(/@import\s+["']([^"']+)/g))add(match[1]);
 else{
  const ast=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,file.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  function visit(node){
   if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier)&&!node.importClause?.isTypeOnly&&!node.isTypeOnly)add(node.moduleSpecifier.text);
   if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword&&ts.isStringLiteral(node.arguments[0]))add(node.arguments[0].text);
   ts.forEachChild(node,visit);
  }visit(ast);
 }
 for(const match of text.matchAll(/\b(?:setInterval|refetchInterval|forceMount|import\.meta\.glob)\b/g)){
  const item={file:relative(file),line:text.slice(0,match.index).split('\n').length,kind:match[0]};background.push(item);if(match[0]==='import.meta.glob')dynamicRegistries.push(item);
 }
 edges.set(file,links);
}
const reachable=new Set();function visit(file){if(reachable.has(file))return;reachable.add(file);for(const next of edges.get(file)??[])visit(next);}visit(path.join(root,'app/src/bootstrap.js'));
const app=fs.readFileSync(path.join(root,'app/src/App.tsx'),'utf8');
const result={scope:'Every app/src runtime module and stylesheet; static/dynamic literal imports. Candidates are NOT deletion approval. Type contracts, assets, tests, runtime registration and external consumers require separate review.',
 sourceFiles:files.length,reachableFiles:reachable.size,routes:[...app.matchAll(/<Route\s+path="([^"]+)"/g)].map(m=>m[1]),
 modules:files.map(file=>({file:relative(file),reachable:reachable.has(file),bytes:fs.statSync(file).size,imports:[...(edges.get(file)??[])].map(relative)})),
 unreferencedCandidates:files.filter(f=>!reachable.has(f)).map(relative),packageConsumers:Object.fromEntries([...packages].map(([name,consumers])=>[name,[...consumers]])),background,dynamicRegistries};
console.log(JSON.stringify(result,null,2));
