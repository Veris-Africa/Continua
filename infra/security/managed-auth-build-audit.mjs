import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(process.argv[2]??'app/dist'),assets=path.join(root,'assets');
const issuer='https://ep-nameless-voice-b4ygobrp.neonauth.c-6.us-east-2.aws.neon.tech/neondb/auth';
const candidates=fs.readdirSync(assets).filter(name=>/^Auth-[\w-]+\.js$/.test(name));
const issuerUrl=new URL(issuer);
if(candidates.length!==1){throw Error('Production Auth artifact is missing the production managed issuer; deployment refused');}
const text=fs.readFileSync(path.join(assets,candidates[0]),'utf8');
const found=Array.from(text.matchAll(/https?:\/\/[^\s"'`]+\/neondb\/auth/g)).some((match)=>{
  try {
    const candidate=new URL(match[0]);
    return candidate.origin===issuerUrl.origin && candidate.pathname===issuerUrl.pathname && candidate.href===issuerUrl.href;
  } catch { return false; }
});
if(!found)throw Error('Production Auth artifact is missing the production managed issuer; deployment refused');
console.log(JSON.stringify({productionAuthArtifact:candidates[0],managedIssuerPinned:true}));
