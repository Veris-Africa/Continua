// Local-only manifest. Observed live state is evidence, never inferred from HEAD.
import {readFileSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true}).trim();
const observed=JSON.parse(readFileSync(path.join(root,'docs/engineering/phase1-observed-release.json'),'utf8'));
const hash=createHash('sha256');
for(const directory of ['supabase/migrations','scraper/migrations']) {
    for(const file of readdirSync(path.join(root,directory)).filter(file=>file.endsWith('.sql')).sort()) {
        hash.update(directory+'/'+file+'\n').update(readFileSync(path.join(root,directory,file),'utf8').replace(/\r\n/g,'\n'));
    }
}
const candidate={sha:git(['rev-parse','HEAD']),worktreeDirty:Boolean(git(['status','--porcelain'])),
    configurationVersion:'phase1-v1',sourceMigrationHash:hash.digest('hex'),sourceMigrationHashEncoding:'UTF-8/LF; supabase/migrations and scraper/migrations only',
    schemaChangeRequired:false,e01SeparateApproval:true};
console.log(JSON.stringify({generatedAt:new Date().toISOString(),candidate,observed,
    warning:'Source hash is not an applied database migration version. A push/build does not attest live Render revision.'},null,2));
