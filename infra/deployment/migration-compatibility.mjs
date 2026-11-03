import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {pathToFileURL} from 'node:url';
export const pendingMigrations=Object.freeze([
 'phase2-application-privileges.sql','phase2-watchlist-integrity.sql','phase2-hosted-checkout-intents.sql','phase3-payment-operations.sql']);
export function migrationCompatibility({paymentDurability=false,hostedIntents=false,applied=[]}={}){
 const issues=[];if(paymentDurability&&!applied.includes('phase3-payment-operations.sql'))issues.push('payment_durability_requires_approved_migration');
 if(hostedIntents&&!applied.includes('phase2-hosted-checkout-intents.sql'))issues.push('hosted_intents_require_approved_migration');
 return {compatible:issues.length===0,issues,applicationContract:'existing-additive-20261102',paymentDurability,hostedIntents,
  pending:pendingMigrations.filter(x=>!applied.includes(x)),warning:'Applied list is operator evidence, not discovered database state. This tool never connects to a database or executes SQL.'};
}
export function migrationInventory(){return pendingMigrations.map(file=>({file:'infra/neon/security/'+file,sha256:createHash('sha256').update(readFileSync(new URL('../neon/security/'+file,import.meta.url),'utf8').replaceAll('\r\n','\n')).digest('hex'),execution:'separate explicit approval; no automatic runner'}));}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const r=migrationCompatibility({paymentDurability:process.argv.includes('--payment-durability'),hostedIntents:process.argv.includes('--hosted-intents')});console.log(JSON.stringify({...r,sourceFiles:migrationInventory()},null,2));if(!r.compatible)process.exitCode=1;}
