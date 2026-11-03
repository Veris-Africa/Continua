import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
export const repositoryRoot=fileURLToPath(new URL('../../',import.meta.url));
export const components=JSON.parse(readFileSync(new URL('./components.json',import.meta.url),'utf8')).components;
export function componentPath(id,...parts){
 const component=components.find(item=>item.id===id);
 if(!component)throw Error('Unknown repository component');
 const base=path.resolve(repositoryRoot,component.path),resolved=path.resolve(base,...parts);
 if(resolved!==base&&!resolved.startsWith(base+path.sep))throw Error('Component path escapes its root');
 return resolved;
}
